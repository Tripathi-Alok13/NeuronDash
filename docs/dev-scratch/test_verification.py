import sys
import os
import pandas as pd

# Add server directory to pythonpath
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "server"))

from server.app.api.dashboards import aggregate_widget_data

def run_test():
    parquet_path = "server/cleaned/ad50c8a3-0dae-4002-985e-655632613317.parquet"
    if not os.path.exists(parquet_path):
        print(f"Parquet file {parquet_path} not found.")
        return

    print("=== Testing Grade Distribution Histogram ===")
    query_bar = {"x": "grade_bin", "y": "student_count", "aggr": "sum"}
    res_bar = aggregate_widget_data(parquet_path, query_bar)
    print("Bar Chart Result:")
    for item in res_bar:
        print(f" - {item['name']}: {item['value']}")
    
    # Assert values are different and Grade was resolved correctly
    values = [item['value'] for item in res_bar]
    assert len(set(values)) > 1, f"Expected varied values, but got: {values}"
    names = [item['name'] for item in res_bar]
    assert "A" in names or "B" in names or "C" in names or "D" in names or "F" in names, f"Expected grades, but got: {names}"

    print("=== Testing Average GPA ===")
    query_gpa = {"metric": "gpa", "aggr": "avg"}
    res_gpa = aggregate_widget_data(parquet_path, query_gpa)
    print("GPA KPI Result:", res_gpa)
    assert res_gpa[0]["value"] > 0

    print("=== Testing Cohort Attendance Rate ===")
    query_att = {"metric": "attendance", "aggr": "avg"}
    res_att = aggregate_widget_data(parquet_path, query_att)
    print("Attendance KPI Result:", res_att)
    assert res_att[0]["value"] > 0

    print("=== Testing Subject Level Breakdown ===")
    query_radar = {"category": "subject", "value": "average_score"}
    res_radar = aggregate_widget_data(parquet_path, query_radar)
    print("Radar Result (First 3):")
    for item in res_radar[:3]:
         print(f" - {item['name']}: {item['value']}")
    assert len(res_radar) > 0

    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_test()
