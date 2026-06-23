import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple

class DataCleaner:
    @staticmethod
    def profile_and_detect_anomalies(df: pd.DataFrame) -> Tuple[List[Dict[str, Any]], Dict[str, Any], Dict[str, Any]]:
        """
        Scans DataFrame to profile schemas, calculate statistics, and detect anomalies.
        Returns:
            anomalies (list of dicts)
            summary_stats (dict)
            cleaned_schema (dict)
        """
        anomalies = []
        summary_stats = {}
        cleaned_schema = {}

        # 1. Row/Col counts
        row_count = len(df)
        
        # Check duplicate rows
        duplicates = df.duplicated()
        duplicate_count = int(duplicates.sum())
        if duplicate_count > 0:
            anomalies.append({
                "anomaly_type": "duplicate_records",
                "severity": "medium",
                "description": f"The dataset contains {duplicate_count} duplicate rows.",
                "suggested_fix": {
                    "operation": "drop_duplicates",
                    "params": {}
                }
            })

        # 2. Iterate columns
        for col in df.columns:
            series = df[col]
            null_count = int(series.isnull().sum())
            null_percentage = (null_count / row_count) * 100 if row_count > 0 else 0
            
            # Profile column data types
            inferred_type = DataCleaner._infer_column_type(series, col)
            cleaned_schema[col] = inferred_type
            
            col_stats = {
                "inferred_type": inferred_type,
                "null_count": null_count,
                "null_percentage": null_percentage,
            }

            # Outlier / null detection
            if null_count > 0:
                anomalies.append({
                    "column_name": col,
                    "anomaly_type": "missing_values",
                    "severity": "high" if null_percentage > 30 else "low",
                    "description": f"Column '{col}' has {null_count} ({null_percentage:.1f}%) missing values.",
                    "suggested_fix": {
                        "operation": "fill_nulls",
                        "params": {"column": col, "strategy": "mean" if inferred_type == "numeric" else "mode"}
                    }
                })

            if inferred_type == "numeric":
                # Convert to numeric for stats calculations
                numeric_series = pd.to_numeric(series, errors='coerce')
                col_stats.update({
                    "mean": float(numeric_series.mean()) if not pd.isna(numeric_series.mean()) else None,
                    "std": float(numeric_series.std()) if not pd.isna(numeric_series.std()) else None,
                    "min": float(numeric_series.min()) if not pd.isna(numeric_series.min()) else None,
                    "max": float(numeric_series.max()) if not pd.isna(numeric_series.max()) else None,
                    "median": float(numeric_series.median()) if not pd.isna(numeric_series.median()) else None,
                })
                
                # Check for outliers via IQR
                q25 = numeric_series.quantile(0.25)
                q75 = numeric_series.quantile(0.75)
                iqr = q75 - q25
                if iqr > 0:
                    lower_bound = q25 - 1.5 * iqr
                    upper_bound = q75 + 1.5 * iqr
                    outliers = numeric_series[(numeric_series < lower_bound) | (numeric_series > upper_bound)]
                    outlier_count = int(outliers.count())
                    if outlier_count > 0:
                        anomalies.append({
                            "column_name": col,
                            "anomaly_type": "outliers",
                            "severity": "medium",
                            "description": f"Column '{col}' contains {outlier_count} outliers (values below {lower_bound:.1f} or above {upper_bound:.1f}).",
                            "suggested_fix": {
                                "operation": "clamp_outliers",
                                "params": {"column": col, "lower_bound": float(lower_bound), "upper_bound": float(upper_bound)}
                            }
                        })
            elif inferred_type == "datetime":
                date_series = pd.to_datetime(series, errors='coerce')
                col_stats.update({
                    "min": str(date_series.min().strftime('%Y-%m-%d')) if not pd.isna(date_series.min()) else None,
                    "max": str(date_series.max().strftime('%Y-%m-%d')) if not pd.isna(date_series.max()) else None,
                    "unique_count": int(series.nunique()),
                })
            elif inferred_type == "identifier":
                val_counts = series.value_counts()
                col_stats.update({
                    "unique_count": int(series.nunique()),
                    "top_value": str(val_counts.index[0]) if len(val_counts) > 0 else None,
                })
            else:
                # Categorical stats
                val_counts = series.value_counts()
                col_stats.update({
                    "unique_count": int(series.nunique()),
                    "top_value": str(val_counts.index[0]) if len(val_counts) > 0 else None,
                    "top_frequency": int(val_counts.iloc[0]) if len(val_counts) > 0 else 0,
                })
                
            summary_stats[col] = col_stats

        return anomalies, summary_stats, cleaned_schema

    @staticmethod
    def _infer_column_type(series: pd.Series, col_name: str) -> str:
        # Check if empty
        non_null = series.dropna()
        if len(non_null) == 0:
            return "empty"
        
        col_name_lower = col_name.lower()
        is_date_name = "date" in col_name_lower or "time" in col_name_lower or col_name_lower.endswith("dt")
        
        # Try parsing as datetime if name indicates date/time or string matches date patterns
        if series.dtype == 'object' or is_date_name:
            try:
                if is_date_name:
                    pd.to_datetime(non_null, errors='raise')
                    return "datetime"
                else:
                    # check if the string format looks like a date/time (contains - or / or :)
                    has_date_chars = non_null.astype(str).str.contains(r'[-/:]').any()
                    if has_date_chars:
                        pd.to_datetime(non_null, errors='raise')
                        return "datetime"
            except (ValueError, TypeError):
                pass
        
        # Try numeric conversion
        numeric_conv = pd.to_numeric(non_null, errors='coerce')
        if not numeric_conv.isna().any():
            # Check for ID patterns in name or unique integer key
            is_id_name = (
                col_name_lower == "id" or 
                col_name_lower.endswith("id") or 
                col_name_lower.endswith("_id") or 
                col_name_lower.endswith("uuid") or
                col_name_lower.endswith("key") or
                col_name_lower.endswith("_key")
            )
            
            is_unique_int = False
            # Check if all values are integers
            is_int = (numeric_conv % 1 == 0).all()
            if is_int:
                # Check if unique per row
                is_unique_int = (non_null.nunique() == len(non_null))
                
            if is_id_name or is_unique_int:
                return "identifier"
                
            return "numeric"
            
        # Try date conversion as a fallback
        try:
            pd.to_datetime(non_null, errors='raise')
            return "datetime"
        except (ValueError, TypeError):
            pass
            
        return "categorical"

    @staticmethod
    def apply_cleaning_actions(df: pd.DataFrame, operations: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Applies requested cleaning operations sequentially on the DataFrame.
        """
        df_cleaned = df.copy()
        
        for op in operations:
            action = op.get("operation")
            params = op.get("params", {})
            
            if action == "drop_duplicates":
                df_cleaned = df_cleaned.drop_duplicates().reset_index(drop=True)
                
            elif action == "fill_nulls":
                col = params.get("column")
                strategy = params.get("strategy", "mode")
                if col in df_cleaned.columns:
                    if strategy == "mean":
                        fill_val = pd.to_numeric(df_cleaned[col], errors='coerce').mean()
                    elif strategy == "median":
                        fill_val = pd.to_numeric(df_cleaned[col], errors='coerce').median()
                    elif strategy == "mode":
                        modes = df_cleaned[col].mode()
                        fill_val = modes.iloc[0] if len(modes) > 0 else ""
                    else:
                        fill_val = params.get("value", "")
                    
                    df_cleaned[col] = df_cleaned[col].fillna(fill_val)
                    
            elif action == "clamp_outliers":
                col = params.get("column")
                l_bound = params.get("lower_bound")
                u_bound = params.get("upper_bound")
                if col in df_cleaned.columns and l_bound is not None and u_bound is not None:
                    # Cast column temporarily
                    numeric_series = pd.to_numeric(df_cleaned[col], errors='coerce')
                    clamped = np.clip(numeric_series, l_bound, u_bound)
                    df_cleaned[col] = clamped
                    
            elif action == "drop_column":
                col = params.get("column")
                if col in df_cleaned.columns:
                    df_cleaned = df_cleaned.drop(columns=[col])
                    
            elif action == "standardize_formats":
                # Casts string cases or datetime formats
                col = params.get("column")
                method = params.get("method") # 'lowercase', 'uppercase', 'strip'
                if col in df_cleaned.columns:
                    if method == 'lowercase':
                        df_cleaned[col] = df_cleaned[col].astype(str).str.lower()
                    elif method == 'uppercase':
                        df_cleaned[col] = df_cleaned[col].astype(str).str.upper()
                    elif method == 'strip':
                        df_cleaned[col] = df_cleaned[col].astype(str).str.strip()
                        
        return df_cleaned
