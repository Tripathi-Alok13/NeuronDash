import sys
import os
import pandas as pd

# Add server directory to pythonpath
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.parser import DataParser
from app.services.cleaner import DataCleaner
from app.services.chart_generator import DashboardGenerator
from app.services.assistant import AIAssistant

def test_pipeline():
    sample_csv_path = os.path.join(os.path.dirname(__file__), "sample.csv")
    print("--- 1. Testing Parser ---")
    df, meta = DataParser.parse_file(sample_csv_path, "csv")
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns.")
    print("Columns:", df.columns.tolist())
    assert len(df) == 5
    assert len(df.columns) == 5

    print("\n--- 2. Testing Cleaner & Anomaly Detection ---")
    anomalies, stats, schema = DataCleaner.profile_and_detect_anomalies(df)
    print(f"Detected {len(anomalies)} anomalies:")
    for a in anomalies:
        print(f" - {a['anomaly_type']} on {a.get('column_name', 'dataset')}: {a['description']}")
    
    # Assertions
    anomaly_types = [a["anomaly_type"] for a in anomalies]
    assert "duplicate_records" in anomaly_types
    assert "missing_values" in anomaly_types
    assert "outliers" in anomaly_types
    
    print("\n--- 3. Testing Cleaning Action Application ---")
    # Take suggestions and apply them
    approved_ops = [a["suggested_fix"] for a in anomalies if a.get("suggested_fix")]
    df_cleaned = DataCleaner.apply_cleaning_actions(df, approved_ops)
    print(f"Cleaned DataFrame size: {len(df_cleaned)}")
    print("Cleaned values:")
    print(df_cleaned)
    
    # After cleaning, there should be no duplicates or missing GPA/Age
    assert len(df_cleaned) == 4 # duplicate Bob dropped
    assert not df_cleaned["Age"].isnull().any()
    assert df_cleaned["GPA"].max() <= 5.15 # 5.2 outlier clamped

    print("\n--- 4. Testing Dashboard Generator Templates ---")
    student_dashboard = DashboardGenerator.generate_template("student", df_cleaned.columns.tolist(), schema)
    print("Generated Dashboard Title:", student_dashboard["title"])
    assert len(student_dashboard["widgets"]) > 0
    print(f"Constructed {len(student_dashboard['widgets'])} widgets.")

    print("\n--- 5. Testing Conversational AI Assistant ---")
    query_result = AIAssistant.process_query(df_cleaned, "Show the average GPA of students.")
    print("AI Response:", query_result["content"])
    assert "gpa" in query_result["content"].lower() or "gpa" in str(query_result["recommended_widget"])

    print("\nPipeline tests PASSED successfully!")

if __name__ == "__main__":
    test_pipeline()
