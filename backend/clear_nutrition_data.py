"""Script to clear nutrition report data and reset meal analysis status."""

from app.db import SessionLocal
from app.models.db_models import NutritionReport, Meal


def clear_nutrition_data():
    """Clear nutrition reports and reset meal analysis status."""
    db = SessionLocal()
    
    try:
        # Delete all nutrition reports (this will cascade delete nutrition_report_foods)
        deleted_count = db.query(NutritionReport).delete()
        print(f"Deleted {deleted_count} nutrition report(s)")
        
        # Set all meals' is_analysed to False
        updated_count = db.query(Meal).update({"is_analysed": False})
        print(f"Updated {updated_count} meal(s) to set is_analysed=False")
        
        # Commit the changes
        db.commit()
        print("Successfully cleared nutrition data and reset meal analysis status")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    clear_nutrition_data()
