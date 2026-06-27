import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import uuid
import pandas as pd
from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_user
from app.models.db_models import User, Project, UploadedFile, Dataset, Anomaly
from app.schemas.pydantic_schemas import UploadedFileResponse
from app.services.parser import DataParser
from app.services.cleaner import DataCleaner

router = APIRouter(prefix="/files", tags=["files"])

# Make sure folders exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CLEANED_DIR, exist_ok=True)

@router.post("/upload", response_model=UploadedFileResponse)
def upload_file(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if project exists and belongs to the user's organization
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.org_id == current_user.org_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    # Standardize file extension
    filename = file.filename
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    if ext not in ['csv', 'xlsx', 'pdf', 'docx']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '.{ext}' is not supported. Upload CSV, Excel, PDF, or DOCX."
        )

    # Save raw file
    file_uuid = uuid.uuid4()
    raw_filename = f"{file_uuid}_{filename}"
    raw_filepath = os.path.join(settings.UPLOAD_DIR, raw_filename)
    
    # Write to local disk
    try:
        content = file.file.read()
        size_bytes = len(content)
        with open(raw_filepath, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to disk: {str(e)}"
        )

    # Create file record
    db_file = UploadedFile(
        id=file_uuid,
        project_id=project_id,
        user_id=current_user.id,
        filename=filename,
        file_type=ext,
        file_path=raw_filepath,
        status="processing",
        size_bytes=size_bytes
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    try:
        # Ingestion step
        df, raw_meta = DataParser.parse_file(raw_filepath, ext)
        
        # Cleaning/anomaly detection profiling step
        anomalies, stats, inferred_schema = DataCleaner.profile_and_detect_anomalies(df)
        
        # Save parsed parquet file
        parquet_filename = f"{file_uuid}.parquet"
        parquet_filepath = os.path.join(settings.CLEANED_DIR, parquet_filename)
        df.to_parquet(parquet_filepath, index=False)
        
        # Create dataset record
        db_dataset = Dataset(
            file_id=db_file.id,
            name=filename,
            row_count=len(df),
            column_count=len(df.columns),
            raw_schema={c: "string" for c in df.columns}, # initial string schema representation
            cleaned_schema=inferred_schema,
            summary_statistics=stats,
            parquet_path=parquet_filepath
        )
        db.add(db_dataset)
        db.commit()
        db.refresh(db_dataset)
        
        # Create anomaly records
        for anom in anomalies:
            db_anomaly = Anomaly(
                dataset_id=db_dataset.id,
                row_index=anom.get("row_index"),
                column_name=anom.get("column_name"),
                anomaly_type=anom["anomaly_type"],
                severity=anom["severity"],
                description=anom["description"],
                suggested_fix=anom["suggested_fix"],
                is_resolved=False
            )
            db.add(db_anomaly)
            
        # Update file state to completed
        db_file.status = "completed"
        db_file.raw_metadata = raw_meta
        db.commit()
        db.refresh(db_file)

    except Exception as e:
        db_file.status = "failed"
        db_file.error_message = str(e)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing uploaded file: {str(e)}"
        )

    return db_file
