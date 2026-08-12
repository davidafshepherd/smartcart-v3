import type { Food } from "@/types";


interface Props {
  searchResults: Food[];
  onSelectFood: (food: Food) => void;
}


export default function FoodSearchDropdown({ searchResults, onSelectFood }: Props) {
  return (
    <div className="food-search-dropdown">
      {searchResults.map(food => (
        <button className="food-search-result" key={food.id} onClick={() => onSelectFood(food)}>
          <div className="food-search-name">{food.food_name}</div>
          <div className="food-search-details">
            {food.kcal != null ? `${food.kcal} kcal` : "N/A"}
            {food.protein != null && ` • ${food.protein}g protein`}
            {food.carbohydrate != null && ` • ${food.carbohydrate}g carbs`}
            {food.fat != null && ` • ${food.fat}g fat`}
          </div>
        </button>
      ))}
    </div>
  );
}
