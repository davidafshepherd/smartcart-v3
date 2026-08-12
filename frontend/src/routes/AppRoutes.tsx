import { Routes, Route } from 'react-router-dom';

import MainLayout from '../components/layout/MainLayout';
import MealsPage from '../pages/Meals/MealsPage';
import NutritionPage from '../pages/Nutrition/NutritionPage';
import UploadPage from '../pages/Upload/UploadPage';


export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path='/' element={<UploadPage />} />
        <Route path='/meals' element={<MealsPage />} />
        <Route path='/nutrition' element={<NutritionPage />} />
      </Route>
    </Routes>
  );
}
