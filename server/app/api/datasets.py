import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List, Dict, Any
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.db_models import User, Dataset, Anomaly, CleaningLog, UploadedFile, Project
from app.schemas.pydantic_schemas import DatasetResponse, AnomalyResponse, CleaningApply
from app.services.cleaner import DataCleaner

router = APIRouter(prefix="/datasets", tags=["datasets"])

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(
    dataset_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).join(UploadedFile).join(Project).filter(
        ((Dataset.id == dataset_id) | (Dataset.file_id == dataset_id)) &
        (Project.org_id == current_user.org_id)
    ).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    return dataset

@router.get("/{dataset_id}/preview")
def get_dataset_preview(
    dataset_id: uuid.UUID,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).join(UploadedFile).join(Project).filter(
        ((Dataset.id == dataset_id) | (Dataset.file_id == dataset_id)) &
        (Project.org_id == current_user.org_id)
    ).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
        
    try:
        # Load Parquet file preview
        df = pd.read_parquet(dataset.parquet_path)
        preview_data = df.head(limit).replace({pd.NA: None, float('nan'): None, float('inf'): None, float('-inf'): None})
        
        return {
            "columns": df.columns.tolist(),
            "rows": preview_data.to_dict(orient="records"),
            "total_rows": len(df)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read dataset content: {str(e)}"
        )

@router.get("/{dataset_id}/anomalies", response_model=List[AnomalyResponse])
def get_dataset_anomalies(
    dataset_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify dataset exists and belongs to the user's organization
    dataset = db.query(Dataset).join(UploadedFile).join(Project).filter(
        ((Dataset.id == dataset_id) | (Dataset.file_id == dataset_id)) &
        (Project.org_id == current_user.org_id)
    ).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    anomalies = db.query(Anomaly).filter(Anomaly.dataset_id == dataset.id).all()
    return anomalies

@router.post("/{dataset_id}/clean", response_model=DatasetResponse)
def clean_dataset(
    dataset_id: uuid.UUID,
    cleaning_in: CleaningApply,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).join(UploadedFile).join(Project).filter(
        ((Dataset.id == dataset_id) | (Dataset.file_id == dataset_id)) &
        (Project.org_id == current_user.org_id)
    ).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
        
    # Retrieve anomalies
    anomalies = db.query(Anomaly).filter(
        Anomaly.dataset_id == dataset.id,
        Anomaly.id.in_([uuid.UUID(op) for op in cleaning_in.approved_ops])
    ).all()
    
    if not anomalies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No matching approved cleaning operations found."
        )

    try:
        # Load active DataFrame
        df = pd.read_parquet(dataset.parquet_path)
        
        # Translate approved anomalies into operations list
        operations = []
        for anom in anomalies:
            if anom.suggested_fix:
                operations.append(anom.suggested_fix)
                anom.is_resolved = True
                
        # Handle rejected operations
        for reject_id in cleaning_in.reject_ops:
            anom = db.query(Anomaly).filter(
                Anomaly.id == uuid.UUID(reject_id),
                Anomaly.dataset_id == dataset.id
            ).first()
            if anom:
                db.delete(anom)
                
        # Clean dataframe
        df_cleaned = DataCleaner.apply_cleaning_actions(df, operations)
        
        # Profile cleaned dataframe
        new_anomalies, stats, inferred_schema = DataCleaner.profile_and_detect_anomalies(df_cleaned)
        
        # Overwrite Parquet file
        df_cleaned.to_parquet(dataset.parquet_path, index=False)
        
        # Log operations applied
        log = CleaningLog(
            dataset_id=dataset_id,
            operations_applied=operations,
            user_id=current_user.id
        )
        db.add(log)
        
        # Update dataset stats
        dataset.row_count = len(df_cleaned)
        dataset.column_count = len(df_cleaned.columns)
        dataset.cleaned_schema = inferred_schema
        dataset.summary_statistics = stats
        
        db.commit()
        db.refresh(dataset)
        
        return dataset
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cleaning operation failed: {str(e)}"
        )

@router.post("/{dataset_id}/visualize")
def visualize_dataset(
    dataset_id: uuid.UUID,
    params: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).join(UploadedFile).join(Project).filter(
        ((Dataset.id == dataset_id) | (Dataset.file_id == dataset_id)) &
        (Project.org_id == current_user.org_id)
    ).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
        
    try:
        df = pd.read_parquet(dataset.parquet_path)
        if df.empty:
            return {"data": [], "insights": "Dataset is empty."}
            
        df.columns = [str(c) for c in df.columns]
        
        # Profile dataset columns
        numeric_cols = []
        categorical_cols = []
        for col in df.columns:
            try:
                pd.to_numeric(df[col].dropna().head(10), errors='raise')
                numeric_cols.append(col)
            except Exception:
                categorical_cols.append(col)
                
        if not numeric_cols:
            numeric_cols = list(df.columns)
        if not categorical_cols:
            categorical_cols = list(df.columns)

        def resolve_column(col_name: str, col_type: str = "numeric") -> str:
            if not col_name:
                return numeric_cols[0] if col_type == "numeric" else categorical_cols[0]
            if col_name in df.columns:
                return col_name
            for col in df.columns:
                if col.lower() == col_name.lower():
                    return col
            normalized_col_name = col_name.lower().replace("_", "").replace(" ", "")
            matches = []
            for col in df.columns:
                normalized_col = col.lower().replace("_", "").replace(" ", "")
                if normalized_col in normalized_col_name or normalized_col_name in normalized_col:
                    matches.append((col, len(normalized_col)))
            if matches:
                matches.sort(key=lambda m: abs(len(m[0]) - len(col_name)))
                return matches[0][0]

            synonyms = {
                "gpa": ["gpa", "marks", "score", "grade", "points"],
                "attendance": ["attendance", "attendance_pct", "days_present"],
                "student_count": ["studentid", "studentname", "id", "name"],
                "grade_bin": ["grade", "class", "marks"],
                "average_score": ["marks", "score", "grade", "percentage"],
                "sales": ["sales", "revenue", "amount", "price"],
                "deal_value": ["sales", "revenue", "amount", "price", "marks"],
                "mrr": ["sales", "revenue", "amount", "price"],
                "cac": ["cost", "expense", "amount"],
                "ltv": ["revenue", "amount", "price"],
                "nrr": ["revenue", "amount"]
            }
            if col_name.lower() in synonyms:
                for syn in synonyms[col_name.lower()]:
                    for col in df.columns:
                        normalized_col = col.lower().replace("_", "").replace(" ", "")
                        if syn in normalized_col:
                            return col

            if col_type == "numeric":
                eligible_nums = [c for c in numeric_cols if "id" not in c.lower() and "code" not in c.lower()]
                if eligible_nums:
                    return eligible_nums[0]
                return numeric_cols[0] if numeric_cols else df.columns[0]
            else:
                eligible_cats = [c for c in categorical_cols if "id" not in c.lower() and "code" not in c.lower()]
                if eligible_cats:
                    return eligible_cats[0]
                return categorical_cols[0] if categorical_cols else df.columns[0]

        x_col = params.get("x")
        y_col = params.get("y")
        aggr = params.get("aggr", "sum")
        chart_type = params.get("chart_type", "bar")
        
        target_x = resolve_column(x_col, "categorical")
        target_y = resolve_column(y_col, "numeric")
        
        if target_x == target_y and len(df.columns) > 1:
            if target_x in categorical_cols:
                for col in numeric_cols:
                    if col != target_x:
                        target_y = col
                        break
            else:
                for col in categorical_cols:
                    if col != target_y:
                        target_x = col
                        break
                        
        is_numeric_target_y = True
        try:
            pd.to_numeric(df[target_y].dropna().head(1), errors="raise")
        except Exception:
            is_numeric_target_y = False

        if is_numeric_target_y:
            df[target_y] = pd.to_numeric(df[target_y], errors="coerce")
            df_clean = df[[target_x, target_y]].dropna()
        else:
            if aggr in ["sum", "avg"]:
                aggr = "count"
            df_clean = df[[target_x, target_y]].dropna()
            
        if aggr == "sum":
            grouped = df_clean.groupby(target_x)[target_y].sum()
        elif aggr == "avg":
            grouped = df_clean.groupby(target_x)[target_y].mean()
        elif aggr == "count":
            grouped = df_clean.groupby(target_x)[target_y].count()
        else:
            grouped = df_clean.groupby(target_x)[target_y].sum()
            
        grouped = grouped.sort_values(ascending=False)
        
        # Limit to top 12 items for visualization clarity
        raw_items = []
        for name, value in grouped.items():
            raw_items.append({
                "name": str(name),
                "value": round(float(value), 2) if not pd.isna(value) else 0
            })
            
        data_points = raw_items[:12]
        
        # Generate Insights Text
        insights_markdown = ""
        story_markdown = ""
        
        if params.get("generate_insights") or params.get("generate_story"):
            # Try to query LLM if configured
            from app.core.config import settings
            llm_text = None
            
            prompt = f"""Analyze the following aggregated visualization dataset:
X-Axis Column (Category): {target_x}
Y-Axis Column (Values): {target_y}
Aggregation: {aggr}
Chart Type: {chart_type}
Data points:
{data_points}

Provide:
1. A detailed statistical analysis of the findings (max/min categories, average value, total sum, variance).
2. Key business takeaways, trends, and actionable recommendations.
Output in clean, beautifully formatted GitHub Markdown using headers and bullet points. Use alerts or callouts if appropriate.
"""
            if settings.ANTHROPIC_API_KEY:
                try:
                    from anthropic import Anthropic
                    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                    message = client.messages.create(
                        model="claude-3-5-sonnet-20241022",
                        max_tokens=1000,
                        messages=[{"role": "user", "content": prompt}]
                    )
                    llm_text = "".join([b.text for b in message.content])
                except Exception as e:
                    print("LLM prompt error in visualizer:", e)
                    
            elif settings.OPENAI_API_KEY and not llm_text:
                try:
                    from openai import OpenAI
                    client = OpenAI(api_key=settings.OPENAI_API_KEY)
                    response = client.chat.completions.create(
                        model="gpt-4o",
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=1000
                    )
                    llm_text = response.choices[0].message.content
                except Exception as e:
                    print("OpenAI prompt error in visualizer:", e)
                    
            if llm_text:
                insights_markdown = llm_text
                story_markdown = llm_text
            else:
                # Local Stats Rule Engine Fallback
                total_val = sum(item["value"] for item in data_points)
                avg_val = total_val / len(data_points) if data_points else 0
                max_item = max(data_points, key=lambda x: x["value"]) if data_points else {"name": "None", "value": 0}
                min_item = min(data_points, key=lambda x: x["value"]) if data_points else {"name": "None", "value": 0}
                
                insights_markdown = f"""### 📊 Statistical Data Analysis Report
Analyzed metrics for **{target_y}** grouped by **{target_x}** (Aggregation: `{aggr}`).

> [!NOTE]
> This analysis is synthesized from the top {len(data_points)} aggregated categories.

#### Key Highlights & Observations:
- **Dominant Group**: **{max_item['name']}** holds the highest value at **{max_item['value']:.2f}** (representing **{(max_item['value']/total_val*100) if total_val > 0 else 0:.1f}%** of the sample).
- **Lowest Group**: **{min_item['name']}** holds the lowest value at **{min_item['value']:.2f}**.
- **Average Performance**: The average value across groups is **{avg_val:.2f}**, with a total sum of **{total_val:.2f}**.

#### Actionable Recommendations:
1. **Focus on high-performing groups**: Double down on resources or budgets allocated to **{max_item['name']}** to maximize positive outcomes.
2. **Review underperformers**: Investigate why **{min_item['name']}** yields low values. Check if this is due to lack of engagements, missing values, or operational bottlenecks.
3. **Data Variance**: There is a spread of **{(max_item['value'] - min_item['value']):.2f}** between the highest and lowest groups, suggesting significant variance that requires custom segmentation strategies.
"""

                story_markdown = f"""### 📖 Business Narrative & AI Story
Here is the narrative story of your data:

Once we aggregated the dataset by **{target_x}**, a clear story started to emerge around **{target_y}**. 

The hero of this data journey is **{max_item['name']}**, which leads all other groups with a strong measure of **{max_item['value']:.2f}**. On the other end of the spectrum, we find **{min_item['name']}** lagging behind at **{min_item['value']:.2f}**. 

This gap illustrates a critical business variance. In order to drive growth or enhance metrics:
- We must study what makes **{max_item['name']}** highly successful and replicate those patterns.
- We should bridge the gap for **{min_item['name']}** to balance the cohort's overall performance.
"""

        return {
            "target_x": target_x,
            "target_y": target_y,
            "aggr": aggr,
            "chart_type": chart_type,
            "data": data_points,
            "insights": insights_markdown,
            "story": story_markdown
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Aggregation visualization pipeline failed: {str(e)}"
        )

