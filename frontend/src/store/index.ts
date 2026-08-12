import { configureStore } from "@reduxjs/toolkit";

import uploadReducer from "@/features/upload/uploadSlice";
import mealsReducer from "@/features/meals/mealsSlice";
import nutritionReducer from "@/features/nutrition/nutritionSlice";


// Central Redux store containing all application state slices.
export const store = configureStore({
  reducer: {
    upload: uploadReducer,
    meals: mealsReducer,
    nutrition: nutritionReducer,
  },
});


// Type representing the complete Redux state tree.
export type RootState = ReturnType<typeof store.getState>;

// Type representing the Redux dispatch function.
export type AppDispatch = typeof store.dispatch;
