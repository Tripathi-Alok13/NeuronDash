import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List, Dict, Any
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.db_models import User, Dashboard, DashboardWidget, Dataset, Project
from app.schemas.pydantic_schemas import DashboardCreate, DashboardResponse, DashboardWidgetCreate, DashboardLayoutUpdate
from app.services.chart_generator import DashboardGenerator

router = APIRouter(prefix="/dashboards", tags=["dashboards"])

def aggregate_widget_data(parquet_path: str, query: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Reads the parquet dataset and executes the widget's aggregation parameters.
    If requested columns do not exist in the dataset, dynamically falls back to 
    matching case-insensitive columns or selecting available numeric/categorical 
    columns to guarantee that visualizations are always fully populated.
    """
    try:
        df = pd.read_parquet(parquet_path)
        if df.empty:
            return []
            
        # Clean all column names of df to string for easy matching
        df.columns = [str(c) for c in df.columns]
        
        # Profile dataset columns using DataCleaner
        from app.services.cleaner import DataCleaner
        numeric_cols = []
        categorical_cols = []
        identifier_cols = []
        datetime_cols = []
        for col in df.columns:
            inferred = DataCleaner._infer_column_type(df[col], col)
            if inferred == "numeric":
                numeric_cols.append(col)
            elif inferred == "identifier":
                identifier_cols.append(col)
            elif inferred == "datetime":
                datetime_cols.append(col)
            else:
                categorical_cols.append(col)
                
        if not numeric_cols:
            numeric_cols = list(df.columns)
        if not categorical_cols:
            categorical_cols = list(df.columns)

        # Helper to match column case-insensitively or fall back
        def resolve_column(col_name: str, col_type: str = "numeric") -> str:
            if not col_name:
                return numeric_cols[0] if col_type == "numeric" else categorical_cols[0]
                
            # 1. Direct match
            if col_name in df.columns:
                return col_name
                
            # 2. Case-insensitive match
            for col in df.columns:
                if col.lower() == col_name.lower():
                    return col
            
            # 3. Substring match / Semantic containment
            normalized_col_name = col_name.lower().replace("_", "").replace(" ", "")
            matches = []
            for col in df.columns:
                normalized_col = col.lower().replace("_", "").replace(" ", "")
                if normalized_col in normalized_col_name or normalized_col_name in normalized_col:
                    matches.append((col, len(normalized_col)))
            
            if matches:
                matches.sort(key=lambda m: abs(len(m[0]) - len(col_name)))
                return matches[0][0]

            # 4. Synonym match
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
                "nrr": ["revenue", "amount"],
                "deal_count": ["id", "deal", "name"],
                "employee_id": ["id", "employee", "name"],
                "enps": ["score", "rating", "satisfaction"],
                "attrition_rate": ["status", "resigned", "left"],
                "employee_count": ["id", "name"],
                "gross_margin": ["margin", "profit", "revenue"],
                "runway": ["amount", "balance"],
                "cash_flow": ["amount", "revenue"],
                "respondent_id": ["id", "name"],
                "nps_score": ["score", "rating", "satisfaction"],
                "nps_category": ["category", "sentiment", "result"],
                "response_count": ["id", "name"]
            }
            
            if col_name.lower() in synonyms:
                for syn in synonyms[col_name.lower()]:
                    for col in df.columns:
                        normalized_col = col.lower().replace("_", "").replace(" ", "")
                        if syn in normalized_col:
                            return col

            # 5. Fallback based on type
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

        metric = query.get("metric")
        aggr = query.get("aggr", "sum")
        
        # Smart aggregation override based on metric name semantics
        x_col = query.get("x") or query.get("category")
        y_col = query.get("y") or query.get("value")
        requested_y = str(y_col or metric or "").lower()
        if "count" in requested_y or "id" in requested_y:
            aggr = "count"
        elif any(keyword in requested_y for keyword in ["avg", "average", "mean", "rate", "gpa", "cac", "ltv", "enps", "attrition", "nps", "satisfaction"]):
            aggr = "avg"
        
        # 1. KPI aggregation (Single number)
        if metric or aggr == "formula":
            target_metric = resolve_column(metric, "numeric")
            inferred_type = DataCleaner._infer_column_type(df[target_metric], target_metric)
            
            if inferred_type == "identifier":
                # For identifiers, average/sum is meaningless. Show unique count instead
                if aggr in ["avg", "sum", "formula"]:
                    val = int(df[target_metric].nunique())
                else: # count
                    val = int(df[target_metric].count())
                return [{"value": val}]
            elif inferred_type == "datetime":
                # For datetimes, average/sum is meaningless. Show latest datetime string
                date_series = pd.to_datetime(df[target_metric], errors="coerce").dropna()
                if date_series.empty:
                    return [{"value": 0}]
                if aggr in ["avg", "sum", "formula"]:
                    val = str(date_series.max().strftime('%Y-%m-%d'))
                else: # count
                    val = int(date_series.count())
                return [{"value": val}]
            else:
                numeric_series = pd.to_numeric(df[target_metric], errors="coerce").dropna()
                if aggr == "sum":
                    val = float(numeric_series.sum())
                elif aggr == "avg" or aggr == "formula":
                    val = float(numeric_series.mean()) if len(numeric_series) > 0 else 0
                elif aggr == "count":
                    val = int(numeric_series.count())
                else:
                    val = 0
                return [{"value": round(val, 2)}]
            
        # 2. X and Y aggregation (Bar, Line, Pie, Radar charts)
        target_x = resolve_column(x_col, "categorical")
        target_y = resolve_column(y_col, "numeric")
        
        # If they resolved to the same column, try to pick different ones
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
                        
        inferred_y_type = DataCleaner._infer_column_type(df[target_y], target_y)
        if inferred_y_type in ["identifier", "datetime"]:
            if aggr in ["sum", "avg"]:
                aggr = "count"
            df_clean = df[[target_x, target_y]].dropna()
            is_numeric_target_y = False
        else:
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
            
        if query.get("sort") == "desc":
            grouped = grouped.sort_values(ascending=False)
            
        result = []
        for name, value in grouped.items():
            result.append({
                "name": str(name),
                "value": round(float(value), 2) if not pd.isna(value) else 0
            })
        return result
        
    except Exception as e:
        print("Error compiling aggregation data:", e)
        return []

@router.post("/", response_model=DashboardResponse)
def create_dashboard(
    dashboard_in: DashboardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dashboard_in.dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
        
    project = db.query(Project).filter(Project.id == dataset.file.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # 1. Fetch template configs
    template_config = DashboardGenerator.generate_template(
        dashboard_in.template_type,
        list(dataset.cleaned_schema.keys()),
        dataset.cleaned_schema
    )

    # 2. Save dashboard definition
    db_dashboard = Dashboard(
        project_id=project.id,
        dataset_id=dataset.id,
        title=f"{dashboard_in.title} - {template_config['title']}",
        template_type=dashboard_in.template_type
    )
    db.add(db_dashboard)
    db.commit()
    db.refresh(db_dashboard)

    # 3. Create widget definitions
    for w in template_config["widgets"]:
        db_widget = DashboardWidget(
            dashboard_id=db_dashboard.id,
            title=w["title"],
            chart_type=w["chart_type"],
            data_query=w["data_query"],
            positioning_config=w["positioning_config"]
        )
        db.add(db_widget)
        
    db.commit()
    db.refresh(db_dashboard)
    return db_dashboard

@router.get("/{dashboard_id}")
def get_dashboard(
    dashboard_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )
        
    # Compile widgets along with their data aggregates
    widgets_response = []
    for w in dashboard.widgets:
        widgets_response.append({
            "id": w.id,
            "title": w.title,
            "chart_type": w.chart_type,
            "data_query": w.data_query,
            "positioning_config": w.positioning_config,
            # Execute database file query dynamically to generate data points
            "data": aggregate_widget_data(dashboard.dataset.parquet_path, w.data_query)
        })
        
    return {
        "id": dashboard.id,
        "title": dashboard.title,
        "template_type": dashboard.template_type,
        "layout_config": dashboard.layout_config,
        "widgets": widgets_response
    }

@router.patch("/{dashboard_id}/layout", response_model=DashboardResponse)
def update_dashboard_layout(
    dashboard_id: uuid.UUID,
    layout_in: DashboardLayoutUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )
    dashboard.layout_config = layout_in.layout_config
    db.commit()
    db.refresh(dashboard)
    return dashboard

@router.get("/project/{project_id}", response_model=List[DashboardResponse])
def list_project_dashboards(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dashboards = db.query(Dashboard).filter(Dashboard.project_id == project_id).all()
    return dashboards
