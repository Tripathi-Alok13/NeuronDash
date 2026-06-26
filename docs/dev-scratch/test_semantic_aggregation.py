import sys
import os
import pandas as pd

# Add server directory to pythonpath
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "server"))

from server.app.services.cleaner import DataCleaner
from server.app.api.dashboards import aggregate_widget_data

def test_semantic_aggregation():
    # 1. Prepare sample DataFrame with ID, Datetime, and Numeric columns
    data = {
        "OrderID": [1001, 1002, 1003, 1004, 1005],
        "OrderDate": ["2026-06-20", "2026-06-21", "2026-06-22", "2026-06-23", "2026-06-24"],
        "SalesValue": [100.5, 200.0, 150.75, 300.0, 250.25]
    }
    df = pd.DataFrame(data)
    
    # 2. Test type inference
    inferred_id = DataCleaner._infer_column_type(df["OrderID"], "OrderID")
    inferred_date = DataCleaner._infer_column_type(df["OrderDate"], "OrderDate")
    inferred_sales = DataCleaner._infer_column_type(df["SalesValue"], "SalesValue")
    
    print(f"Inferred OrderID type: {inferred_id} (Expected: identifier)")
    print(f"Inferred OrderDate type: {inferred_date} (Expected: datetime)")
    print(f"Inferred SalesValue type: {inferred_sales} (Expected: numeric)")
    
    assert inferred_id == "identifier"
    assert inferred_date == "datetime"
    assert inferred_sales == "numeric"
    
    # Test statistics dictionary
    anomalies, stats, schema = DataCleaner.profile_and_detect_anomalies(df)
    
    assert schema["OrderID"] == "identifier"
    assert schema["OrderDate"] == "datetime"
    assert schema["SalesValue"] == "numeric"
    
    print("Column Stats for OrderID:", stats["OrderID"])
    print("Column Stats for OrderDate:", stats["OrderDate"])
    print("Column Stats for SalesValue:", stats["SalesValue"])
    
    assert "unique_count" in stats["OrderID"]
    assert "mean" not in stats["OrderID"] # no mean for identifier!
    
    assert "min" in stats["OrderDate"] # min/max dates
    assert "max" in stats["OrderDate"]
    assert "mean" not in stats["OrderDate"] # no mean for datetime!
    
    # Save df to temporary parquet file to run widget query tests
    temp_parquet = "scratch/temp_test.parquet"
    df.to_parquet(temp_parquet, index=False)
    
    try:
        # Test widget average on identifier - should return count of unique IDs (5)
        res_id_avg = aggregate_widget_data(temp_parquet, {"metric": "OrderID", "aggr": "avg"})
        print("Aggregate OrderID (avg):", res_id_avg)
        assert res_id_avg[0]["value"] == 5
        
        # Test widget average on datetime - should return latest date string ("2026-06-24")
        res_date_avg = aggregate_widget_data(temp_parquet, {"metric": "OrderDate", "aggr": "avg"})
        print("Aggregate OrderDate (avg):", res_date_avg)
        assert res_date_avg[0]["value"] == "2026-06-24"
        
        # Test widget average on sales - should return average sales (200.3)
        res_sales_avg = aggregate_widget_data(temp_parquet, {"metric": "SalesValue", "aggr": "avg"})
        print("Aggregate SalesValue (avg):", res_sales_avg)
        assert res_sales_avg[0]["value"] == 200.3
        
        print("\nALL SEMANTIC AGGREGATION TESTS PASSED SUCCESSFULLY!")
    finally:
        if os.path.exists(temp_parquet):
            os.remove(temp_parquet)

if __name__ == "__main__":
    test_semantic_aggregation()
