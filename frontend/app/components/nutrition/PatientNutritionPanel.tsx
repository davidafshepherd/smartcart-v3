import { nutritionApi, patientsApi, ApiError } from '@/app/lib/api';
import { MealNutrition, Patient } from '@/app/lib/types';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NutritionTable } from '../meals/nutrition/NutritionTable';
import { Spinner } from '../ui/Spinner';
import { sumMealNutrition } from '@/app/lib/utils';
import SingleVarTimePlot from './SingleVarTimePlot';

export const PatientNutritionPanel: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number>();
    const [startDate, setStartDate] = useState<string>();
    const [endDate, setEndDate] = useState<string>();
    const [nutritionData, setNutritionData] = useState<MealNutrition | null>();
    const [originalNutritionData, setOriginalNutritionData] = useState<MealNutrition[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [dateSeries, setDateSeries] = useState<string[]>();
    const [nutrientNames, setNutrientNames] = useState<string[]>([]);
    const [selectedNutrient, setSelectedNutrient] = useState<string>('');
    const [readOnly, setReadOnly] = useState(false);

    const currentReportStart = useRef<Date|null>(null);
    const currentReportEnd = useRef<Date|null>(null);
    const currentPatientId = useRef<number>(-1);
    
    // Store original query parameters to restore on cancel
    const originalQueryParams = useRef<{
        patientId: number;
        startDate: string;
        endDate: string;
    } | null>(null);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                setPatients(await patientsApi.getAll());
            } catch (error) {
                console.error('Failed to fetch patients:', error);
                if (error instanceof ApiError && error.status === 0) {
                    setPatients([]);
                }
            }
        };

        fetchPatients();
    }, []);

    // Compute value series when nutrient or data changes
    const valueSeries = useMemo(() => {
        if (!selectedNutrient || originalNutritionData.length === 0) {
            return [];
        }
        const values = originalNutritionData.map(x => (x as MealNutrition)[selectedNutrient as keyof MealNutrition]);
        return values.map(x => x ? x : 0);
    }, [selectedNutrient, originalNutritionData]);

    // Compute average nutrition per day
    // Sum ALL meals and divide by number of unique days
    const averageNutritionData = useMemo(() => {
        if (originalNutritionData.length === 0 || !dateSeries || dateSeries.length === 0) {
            return null;
        }
        
        // Sum all meals from originalNutritionData
        const totalNutrition = sumMealNutrition(originalNutritionData);
        
        // Extract just the date portion (YYYY-MM-DD) and count unique days
        const uniqueDays = new Set(dateSeries.map(d => d.substring(0, 10))).size;
        
        // Divide each nutrient by number of days
        const avg: Partial<MealNutrition> = {};
        for (const key of Object.keys(totalNutrition) as (keyof MealNutrition)[]) {
            const value = totalNutrition[key];
            if (typeof value === 'number') {
                avg[key] = value / uniqueDays;
            }
        }
        return avg as MealNutrition;
    }, [originalNutritionData, dateSeries]);

    // Check if dates are valid for the fetch button
    const isDateRangeValid = useMemo(() => {
        if (!startDate || !endDate) return true; // Allow if dates not yet selected
        return new Date(startDate) <= new Date(endDate);
    }, [startDate, endDate]);

    const handleFetchNutrition = async () => {
        if (!selectedPatientId || !startDate || !endDate) return;

        resetState();
        setLoading(true);

        if(isInvalidDateRange(new Date(startDate), new Date(endDate))) {
            setResult('Invalid date range, end date cannot be before start date.');
            setLoading(false);
            return;
        }

        try {
            const data = await nutritionApi.getPatientReport(selectedPatientId, new Date(startDate), new Date(endDate));
            if(!data) {
                setResult('No nutrition data for requested patient or period!');
                setLoading(false);
                return;
            }
            const dates = Object.keys(data);
            if(dates.length == 0) {
                setResult('No nutrition data for requested patient or period!');
                setLoading(false);
                return;
            }
            const meals = Object.values(data).map(x => x.meal_nutrition);
            setOriginalNutritionData(meals);
            setNutritionData(sumMealNutrition(meals));
            setReadOnly(true);
            setNutrientNames(meals.length > 0 ? Object.keys(meals[0]) : []);
            setSelectedNutrient(meals.length > 0 ? 'kcal' : '');
            setDateSeries(dates);
            currentReportStart.current = new Date(startDate);
            currentReportEnd.current = new Date(endDate);
            currentPatientId.current = selectedPatientId;
            
            // Store original query parameters
            originalQueryParams.current = {
                patientId: selectedPatientId,
                startDate: startDate,
                endDate: endDate,
            };
        } catch (error) {
            console.error('Failed to fetch nutrition data:', error);
            setResult('Failed to fetch nutrition data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    function isInvalidDateRange(start: Date, end: Date): boolean {
        if (!(start instanceof Date) || isNaN(start.getTime())) return true;
        if (!(end instanceof Date) || isNaN(end.getTime())) return true;
        if (end.getTime() < start.getTime()) return true;

        return false;
    }

    function resetState() {
        setResult('');
        setLoading(false);
        setNutritionData(null);
        setOriginalNutritionData([]);
        setSelectedNutrient('');
        setNutrientNames([]);
        setDateSeries([]);
        setReadOnly(false);
    }

    function generateNutrientDisplayName(rawName: string): string {
        if(rawName.length == 0) return '';
        const no_under = rawName.split("_");
        const no_under_upper = [];
        for(const i of no_under) {
            no_under_upper.push(i.charAt(0).toUpperCase() + i.slice(1));
        }
        return no_under_upper.join(" ");
    }

    function dateToString(obj: Date | null): string {
        if(!obj) {
            return "01/01/1972";
        } else {
            const day = obj.getDate().toString().padStart(2, '0');
            const month = (obj.getMonth() + 1).toString().padStart(2, '0');
            const year = obj.getFullYear();
            return `${day}/${month}/${year}`;
        }
    }

    return (
        <div className="space-y-3">
            {/* Query Controls Card */}
            <div
                className="rounded-2xl border shadow-sm overflow-hidden"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
                {/* Card Header */}
                <div
                    className="px-4 py-3 border-b flex items-center gap-2"
                    style={{ borderColor: 'var(--card-border)' }}
                >
                    <svg
                        className="w-4 h-4"
                        style={{ color: 'var(--accent-primary)' }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                    </svg>
                    <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                        Query Parameters
                    </span>
                </div>

                {/* Card Content */}
                <div className="p-4">
                    {!readOnly ? (
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            {/* Patient Selector */}
                            <div className="flex-1 min-w-0">
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                                    Patient
                                </label>
                                <select
                                    value={selectedPatientId ?? ''}
                                    onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                                    className="w-full pl-3 pr-10 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer"
                                    style={{
                                        background: `var(--background) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E") no-repeat right 0.75rem center`,
                                        backgroundSize: '1rem',
                                        borderColor: 'var(--card-border)',
                                        color: 'var(--foreground)',
                                    }}
                                >
                                    <option value="">Choose a patient...</option>
                                    {patients.map((patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            #{patient.id}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Start Date */}
                            <div className="flex-1 min-w-0">
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate ?? ''}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 cursor-pointer"
                                    style={{
                                        background: 'var(--background)',
                                        borderColor: 'var(--card-border)',
                                        color: 'var(--foreground)',
                                    }}
                                />
                            </div>

                            {/* End Date */}
                            <div className="flex-1 min-w-0">
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate ?? ''}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 cursor-pointer"
                                    style={{
                                        background: 'var(--background)',
                                        borderColor: 'var(--card-border)',
                                        color: 'var(--foreground)',
                                    }}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleFetchNutrition}
                                    disabled={loading || !selectedPatientId || !startDate || !endDate || !isDateRangeValid}
                                    className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    style={{
                                        background: 'var(--accent-primary)',
                                        color: 'white',
                                    }}
                                >
                                    {loading ? 'Loading...' : 'Fetch Data'}
                                </button>
                                {nutritionData && (
                                    <button
                                        onClick={() => {
                                            // Restore original query parameters
                                            if (originalQueryParams.current) {
                                                setSelectedPatientId(originalQueryParams.current.patientId);
                                                setStartDate(originalQueryParams.current.startDate);
                                                setEndDate(originalQueryParams.current.endDate);
                                            }
                                            setReadOnly(true);
                                        }}
                                        className="px-4 py-2 rounded-xl text-sm font-medium transition-colors border cursor-pointer"
                                        style={{
                                            background: 'var(--card-bg)',
                                            color: 'var(--foreground)',
                                            borderColor: 'var(--card-border)',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            {/* Read-only display - matches edit mode layout */}
                            <div className="flex-1 min-w-0">
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                    Patient
                                </label>
                                <div
                                    className="w-full px-3 py-2 rounded-xl border text-sm"
                                    style={{
                                        background: 'var(--background)',
                                        borderColor: 'var(--card-border)',
                                        color: 'var(--foreground)',
                                    }}
                                >
                                    #{currentPatientId.current}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                    Start Date
                                </label>
                                <div
                                    className="w-full px-3 py-2 rounded-xl border text-sm"
                                    style={{
                                        background: 'var(--background)',
                                        borderColor: 'var(--card-border)',
                                        color: 'var(--foreground)',
                                    }}
                                >
                                    {dateToString(currentReportStart.current)}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                    End Date
                                </label>
                                <div
                                    className="w-full px-3 py-2 rounded-xl border text-sm"
                                    style={{
                                        background: 'var(--background)',
                                        borderColor: 'var(--card-border)',
                                        color: 'var(--foreground)',
                                    }}
                                >
                                    {dateToString(currentReportEnd.current)}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setReadOnly(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                                    style={{
                                        background: 'var(--accent-primary)',
                                        color: 'white',
                                    }}
                                >
                                    Edit Query
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error/Info Message */}
            {result && !loading && (
                <div
                    className="rounded-2xl border p-4"
                    style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                    }}
                >
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{result}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-8">
                    <Spinner />
                </div>
            )}

            {/* Results */}
            {nutritionData && !loading && (
                <div>
                    {/* Time Series + Table Side by Side */}
                    {dateSeries && dateSeries.length > 0 && valueSeries.length > 0 && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-stretch">
                            {/* Time Series Chart Card */}
                            <div
                                className="rounded-2xl border shadow-sm overflow-hidden flex flex-col"
                                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                            >
                                <div
                                    className="px-4 py-3 border-b flex items-center justify-between"
                                    style={{ borderColor: 'var(--card-border)' }}
                                >
                                    <div className="flex items-center gap-2">
                                        <svg
                                            className="w-4 h-4"
                                            style={{ color: 'var(--accent-primary)' }}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                                            />
                                        </svg>
                                        <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                                            Time Series
                                        </span>
                                    </div>
                                    <select
                                        value={selectedNutrient}
                                        onChange={(e) => setSelectedNutrient(e.target.value)}
                                        className="pl-3 pr-8 py-1.5 rounded-lg text-sm border cursor-pointer appearance-none"
                                        style={{
                                            background: `var(--background) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E") no-repeat right 0.5rem center`,
                                            backgroundSize: '0.875rem',
                                            borderColor: 'var(--card-border)',
                                            color: 'var(--foreground)',
                                        }}
                                    >
                                        {nutrientNames.map((nutrient) => (
                                            <option key={nutrient} value={nutrient}>
                                                {generateNutrientDisplayName(nutrient)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1 flex items-center justify-center p-2">
                                    <SingleVarTimePlot
                                        xData={dateSeries}
                                        yData={valueSeries}
                                        width={560}
                                        height={360}
                                    />
                                </div>
                            </div>

                            {/* Nutrition Table Card */}
                            <div
                                className="rounded-2xl border shadow-sm overflow-hidden"
                                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                            >
                                <div
                                    className="px-4 py-3 border-b flex items-center gap-2"
                                    style={{ borderColor: 'var(--card-border)' }}
                                >
                                    <svg
                                        className="w-4 h-4"
                                        style={{ color: 'var(--accent-primary)' }}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                                        Average Nutrition Per Day
                                    </span>
                                </div>
                                <div>
                                    {averageNutritionData && <NutritionTable data={averageNutritionData} perDay />}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!nutritionData && !loading && !result && (
                <div
                    className="rounded-2xl border p-8 text-center shadow-sm"
                    style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                    <div
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                        style={{ background: 'var(--accent-light)' }}
                    >
                        <svg
                            className="w-8 h-8"
                            style={{ color: 'var(--accent-primary)' }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                    </div>
                    <p className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                        No data to display
                    </p>
                    <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
                        Select a patient and date range to visualise their nutritional intake over time
                    </p>
                </div>
            )}
        </div>
    );
};
