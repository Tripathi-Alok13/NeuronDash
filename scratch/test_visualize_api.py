import sys
import os

def test_visualize():
    # 1. Login as guest or query DB directly to get a token and dataset
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "server"))
    
    from app.core.database import SessionLocal
    from app.models.db_models import Dataset, User
    
    db = SessionLocal()
    try:
        dataset = db.query(Dataset).first()
        user = db.query(User).first()
        if not dataset or not user:
            print("No dataset or user found in DB. Skip integration check.")
            return
            
        print("Dataset ID:", dataset.id)
        print("User email:", user.email)
        
        # We can construct the headers with token. But wait, we can just test the python route directly by calling the function!
        from app.api.datasets import visualize_dataset
        
        params = {
            "x": "grade_bin",
            "y": "student_count",
            "aggr": "sum",
            "chart_type": "bar",
            "generate_insights": True,
            "generate_story": True
        }
        
        res = visualize_dataset(dataset_id=dataset.id, params=params, db=db, current_user=user)
        print("=== Test Visualize Route ===")
        print("resolved x:", res["target_x"])
        print("resolved y:", res["target_y"])
        print("aggregation:", res["aggr"])
        print("data points count:", len(res["data"]))
        print("data preview:", res["data"][:3])
        print("insights preview (first 100 chars):", res["insights"][:100])
        print("story preview (first 100 chars):", res["story"][:100])
        
        assert len(res["data"]) > 0
        assert "insights" in res
        assert "story" in res
        print("TEST PASSED SUCCESSFULLY!")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_visualize()
