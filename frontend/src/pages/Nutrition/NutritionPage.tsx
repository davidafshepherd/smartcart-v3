import { PatientNutrition, QueryParameters } from '@/features/nutrition/components';
import { useNutrition } from '@/features/nutrition/hooks/useNutrition';

import './NutritionPage.css';


export default function NutritionPage() {
  const {
    // Query state.
    patients,
    selectedPatientId,
    startDate,
    endDate,
    nutritionQuery,
    readOnly,

    // Fetch state.
    reportEntries,
    summedNutrition,
    averageNutrition,

    // UI state.
    patientsError,
    fetchMessage,
    fetchError,
    isDateRangeValid,
    isQueryUnchanged,
    isFetching,

    // Chart state.
    nutrientKeys,
    selectedNutrient,
    xLabels,
    yValues,

    // Query actions.
    handleSetSelectedPatientId,
    handleSetStartDate,
    handleSetEndDate,
    handleEditQuery,
    handleCancelEdit,

    // Fetch / Chart actions.
    handleFetch,
    handleSetSelectedNutrient,
  } = useNutrition();

  return (
    <div className="nutrition-page">
      <div className="nutrition-container">
        {/* Header */}
        <div className="nutrition-header">
          <h1>View Patient Nutrition</h1>
          <p>Visualise a patient's nutritional intake over time.</p>
        </div>

        {/* Query parameters */}
        <div className="nutrition-panel">
          <QueryParameters
            patients={patients}
            patientsError={patientsError}
            selectedPatientId={selectedPatientId}
            onSelectedPatientIdChange={handleSetSelectedPatientId}
            startDate={startDate}
            onStartDateChange={handleSetStartDate}
            endDate={endDate}
            onEndDateChange={handleSetEndDate}
            isDateRangeValid={isDateRangeValid}
            isQueryUnchanged={isQueryUnchanged}
            readOnly={readOnly}
            nutritionQuery={nutritionQuery}
            hasResults={!!reportEntries}
            isFetching={isFetching}
            onFetch={handleFetch}
            onEditQuery={handleEditQuery}
            onCancelEdit={handleCancelEdit}
          />

        {/* Patient nutrition results */}
          <PatientNutrition
            fetchMessage={fetchMessage}
            fetchError={fetchError}
            isFetching={isFetching}
            summedNutrition={summedNutrition}
            averageNutrition={averageNutrition}
            nutrientKeys={nutrientKeys}
            selectedNutrient={selectedNutrient}
            onSelectedNutrientChange={handleSetSelectedNutrient}
            xLabels={xLabels}
            yValues={yValues}
            nutritionQuery={nutritionQuery}
          />
        </div>
      </div>
    </div>
  );
}
