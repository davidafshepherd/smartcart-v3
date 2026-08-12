import { ClipboardIcon } from '@/components/common/icons';
import { formatDateObject } from '@/utils/date';

import type { NutritionQuery, Patient } from '@/types';

import './QueryParameters.css';


interface Props {
  patients: Patient[];
  patientsError: string | null;
  selectedPatientId: number | null;
  onSelectedPatientIdChange: (id: number | null) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  isDateRangeValid: boolean;
  isQueryUnchanged: boolean;
  readOnly: boolean;
  nutritionQuery: NutritionQuery | null;
  hasResults: boolean;
  isFetching: boolean;
  onFetch: () => void;
  onEditQuery: () => void;
 onCancelEdit: () => void;
}


export function QueryParameters({
  patients, 
  patientsError,
  selectedPatientId, 
  onSelectedPatientIdChange,
  startDate, 
  onStartDateChange,
  endDate, 
  onEndDateChange,
  isDateRangeValid,
  isQueryUnchanged,
  readOnly, 
  nutritionQuery,
  hasResults, 
  isFetching,
  onFetch, 
  onCancelEdit, 
  onEditQuery,
}: Props) {
  return (
    <div className="query-parameters-card">
      {/* Header */}
      <div className="query-parameters-card-header">
        <ClipboardIcon className="query-parameters-card-header-icon" />
        <span>Query Parameters</span>
      </div>

      {/* Content */}
      <div className="query-parameters-card-body">
        {!readOnly ? (
          /* Edit mode */
          <div className="query-parameters-form-row">
            {/* Patient input */}
            <div className="query-parameters-field">
              <label className="query-parameters-label">Patient</label>
              {patientsError ? (
                <p className="query-parameters-field-error">{patientsError}</p>
              ) : (
                <select
                  className="query-parameters-select"
                  value={selectedPatientId ?? ""}
                  onChange={e => onSelectedPatientIdChange(Number(e.target.value) || null)}
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(p => (<option key={p.id} value={p.id}>#{p.id}</option>))}
                </select>
              )}
            </div>

            {/* Start date input */}
            <div className="query-parameters-field">
              <label className="query-parameters-label">Start Date</label>
              <input
                type="date"
                className="query-parameters-date-input"
                value={startDate}
                onChange={e => onStartDateChange(e.target.value)}
              />
            </div>

            {/* End date input */}
            <div className="query-parameters-field">
              <label className="query-parameters-label">End Date</label>
              <input
                type="date"
                className="query-parameters-date-input"
                value={endDate}
                onChange={e => onEndDateChange(e.target.value)}
              />
            </div>

            {/* Fetch Data button */}
            <div className="query-parameters-button-field">
              <label className="query-parameters-label query-parameters-label-hidden" aria-hidden="true">Action</label>
              <div className="query-parameters-button-row">
                <button
                  className="query-parameters-fetch-button"
                  onClick={onFetch}
                  disabled={isFetching || !selectedPatientId || !startDate || !endDate || !isDateRangeValid || isQueryUnchanged}
                >
                  {isFetching ? "Loading..." : "Fetch Data"}
                </button>
                {hasResults && (
                  <button className="query-parameters-cancel-button" onClick={onCancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Read-only mode */
          <div className="query-parameters-form-row">
            {/* Selected patient */}
            <div className="query-parameters-field">
              <label className="query-parameters-label-muted">Patient</label>
              <div className="query-parameters-readonly-box">#{nutritionQuery?.patientId}</div>
            </div>

            {/* Selected start date */}
            <div className="query-parameters-field">
              <label className="query-parameters-label-muted">Start Date</label>
              <div className="query-parameters-readonly-box">
                {formatDateObject(nutritionQuery ? new Date(nutritionQuery.start) : new Date(0))}
              </div>
            </div>

            {/* selected end date */}
            <div className="query-parameters-field">
              <label className="query-parameters-label-muted">End Date</label>
              <div className="query-parameters-readonly-box">
                {formatDateObject(nutritionQuery ? new Date(nutritionQuery.end) : new Date(0))}
              </div>
            </div>

            {/* Edit Query button */}
            <div className="query-parameters-button-field">
              <label className="query-parameters-label-muted query-parameters-label-hidden" aria-hidden="true">Action</label>
              <div className="query-parameters-button-row">
                <button className="query-parameters-fetch-button" onClick={onEditQuery}>
                  Edit Query
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
