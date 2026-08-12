import { useDispatch, useSelector } from "react-redux";

import type { RootState, AppDispatch } from "./index";


// Typed version of the Redux dispatch hook.
export const useAppDispatch = () => useDispatch<AppDispatch>();


// Typed version of the Redux selector hook.
export const useAppSelector = useSelector.withTypes<RootState>();
