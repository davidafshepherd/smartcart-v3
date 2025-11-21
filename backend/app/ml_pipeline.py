def run_pipeline(image_path: str):
    items = [
        {
            "id": 1,
            "label": "mashed potatoes",
            "grams": 120,
            "kcal": 100,
            "protein": 3.5,
            "carbs": 20,
            "fat": 1.0,
            "confidence": 0.92,
        },
        {
            "id": 2,
            "label": "chicken breast",
            "grams": 80,
            "kcal": 130,
            "protein": 24,
            "carbs": 0,
            "fat": 3,
            "confidence": 0.88,
        },
    ]
    totals = {
        "kcal": sum(i["kcal"] for i in items),
        "protein": sum(i["protein"] for i in items),
        "carbs": sum(i["carbs"] for i in items),
        "fat": sum(i["fat"] for i in items),
    }
    return items, totals
