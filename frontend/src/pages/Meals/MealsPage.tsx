import { createPortal } from 'react-dom';

import { AnalysisPanel } from '@/features/analysis/components';
import {
  EmptySelection,
  MealContextMenu,
  MealDetails,
  MealsPanel,
  MenuPanel,
  PatientsPanel,
} from '@/features/meals/components';
import { NutritionReportPanel } from '@/features/nutrition/components';
import { useMeals } from '@/features/meals/hooks/useMeals';

import './MealsPage.css';


export default function MealsPage() {
  const {
    // Data state.
    meals,
    patients,
    menuItems,

    // Tree state.
    expandedPatients,
    expandedDates,

    // Selection state.
    contextMenu,
    selectedMeal,
    viewMode,
    viewNonce,

    // UI state.
    loading,
    isUpdating,
    isDeleting,
    mealsError,
    patientsError,
    menuItemsError,
    updateError,

    // Tree actions.
    togglePatient,
    toggleDate,

    // View actions.
    handleMealClick,
    handleContextMenu,
    handleViewMeal,
    handleAnalyseMeal,
    handleViewNutritionReport,
    closeMealView,

    // Meal actions.
    handleUpdateMeal,
    handleDeleteMeal,
    handleDataChange,
  } = useMeals();


  // Return a shimmer if loading data.
  if (loading) {
    return (
      <div className="meals-loading">
        <div className="meals-loading-shimmer shimmer" />
      </div>
    );
  }


  return (
    <div className="meals-page">
      <div className="meals-container">
        {/* Header */}
        <div className="meals-header">
          <h1>Analyse Meals</h1>
          <p>Analyse meals to generate detailed nutrition reports.</p>
        </div>

        {/* Panels */}
        <div className="meals-layout">
          {/* Left panel */}
          <div className="meals-left-panel">
            <MealsPanel
              meals={meals}
              selectedMealId={selectedMeal?.id ?? null}
              expandedPatients={expandedPatients}
              expandedDates={expandedDates}
              error={mealsError}
              onMealClick={handleMealClick}
              onTogglePatient={togglePatient}
              onToggleDate={toggleDate}
            />

            <PatientsPanel patients={patients} error={patientsError} onDataChange={handleDataChange} />
            <MenuPanel menuItems={menuItems} error={menuItemsError} onDataChange={handleDataChange} />
          </div>

          {/* Right panel */}
          <div className="meals-right-panel">
            {selectedMeal && viewMode === 'view' && (
              <MealDetails
                key={viewNonce}
                meal={selectedMeal}
                patients={patients}
                menuItems={menuItems}
                onDelete={() => handleDeleteMeal(selectedMeal.id)}
                onUpdate={(patientId, menuItemId) => handleUpdateMeal(selectedMeal.id, patientId, menuItemId)}
                onClose={closeMealView}
                isDeleting={isDeleting}
                isUpdating={isUpdating}
                updateError={updateError}
              />
            )}

            {selectedMeal && viewMode === 'analyse' && (
              <AnalysisPanel key={viewNonce} meal={selectedMeal} onClose={closeMealView} />
            )}

            {selectedMeal && viewMode === 'nutrition' && (
              <NutritionReportPanel
                key={viewNonce}
                meal={selectedMeal}
                readOnly
                onClose={closeMealView}
                onDeleted={closeMealView}
              />
            )}

            {(!selectedMeal || viewMode === null) && 
            <EmptySelection />
            }
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && createPortal(
        <MealContextMenu
          meal={contextMenu.meal}
          x={contextMenu.x}
          y={contextMenu.y}
          onViewMeal={handleViewMeal}
          onAnalyseMeal={handleAnalyseMeal}
          onViewNutritionReport={handleViewNutritionReport}
          onClose={() => handleContextMenu(null)}
        />,
        document.body
      )}
    </div>
  );
}
