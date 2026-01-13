"""Script to verify nutrition report data has been cleared and meals reset."""

from pprint import pprint

from app.db import SessionLocal
from app.models.db_models import NutritionReport, NutritionReportFood, Meal


def verify_nutrition_data():
    """Verify nutrition reports are cleared and meals are reset."""
    db = SessionLocal()
    
    try:
        # Get all nutrition reports
        nutrition_reports = db.query(NutritionReport).all()
        print(f"\n{'='*60}")
        print(f"NUTRITION REPORTS (count: {len(nutrition_reports)})")
        print(f"{'='*60}")
        if nutrition_reports:
            for report in nutrition_reports:
                print(f"\nNutrition Report:")
                pprint({c.name: getattr(report, c.name) for c in report.__table__.columns})
        else:
            print("No nutrition reports found.")
        
        # Get all nutrition report foods
        nutrition_report_foods = db.query(NutritionReportFood).all()
        print(f"\n{'='*60}")
        print(f"NUTRITION REPORT FOODS (count: {len(nutrition_report_foods)})")
        print(f"{'='*60}")
        if nutrition_report_foods:
            for food in nutrition_report_foods:
                print(f"\nNutrition Report Food:")
                pprint({c.name: getattr(food, c.name) for c in food.__table__.columns})
        else:
            print("No nutrition report foods found.")
        
        # Get all meals
        meals = db.query(Meal).all()
        print(f"\n{'='*60}")
        print(f"MEALS (count: {len(meals)})")
        print(f"{'='*60}")
        if meals:
            for meal in meals:
                print(f"\nMeal:")
                pprint({c.name: getattr(meal, c.name) for c in meal.__table__.columns})
        else:
            print("No meals found.")
        
        # Summary
        analysed_meals = db.query(Meal).filter(Meal.is_analysed == True).count()
        print(f"\n{'='*60}")
        print("SUMMARY")
        print(f"{'='*60}")
        print(f"Nutrition reports: {len(nutrition_reports)}")
        print(f"Nutrition report foods: {len(nutrition_report_foods)}")
        print(f"Total meals: {len(meals)}")
        print(f"Meals with is_analysed=True: {analysed_meals}")
        print(f"Meals with is_analysed=False: {len(meals) - analysed_meals}")
        
        if len(nutrition_reports) == 0 and len(nutrition_report_foods) == 0 and analysed_meals == 0:
            print("\nVERIFICATION PASSED: All nutrition data cleared and meals reset")
        else:
            print("\nVERIFICATION FAILED:")
            if len(nutrition_reports) > 0:
                print(f"  - {len(nutrition_reports)} nutrition report(s) still exist")
            if len(nutrition_report_foods) > 0:
                print(f"  - {len(nutrition_report_foods)} nutrition report food(s) still exist")
            if analysed_meals > 0:
                print(f"  - {analysed_meals} meal(s) still have is_analysed=True")
        
    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    verify_nutrition_data()
