import { nutritionApi, patientsApi } from '@/app/lib/api';
import { MealNutrition, Patient } from '@/app/lib/types';
import React, { useState, useEffect, useRef } from 'react';
import { NutritionWheel } from './nutrition/NutritionWheel';
import { NutritionHeader } from './nutrition/NutritionHeader';
import { NutritionTable } from './nutrition/NutritionTable';
import { Spinner } from '../ui/Spinner';
import { sumMealNutrition } from '@/app/lib/utils';
import * as d3 from "d3";
import SingleVarTimePlot from './nutrition/SingleVarTimePlot';

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
    const [valueSeries, setValueSeries] = useState<number[]>();
    const [nutrientNames, setNutrientNames] = useState<string[]>([]);
    const [selectedNutrient, setSelectedNutrient] = useState<string>('');
    const [readOnly, setReadOnly] = useState(false);


    const currentReportStart = useRef<Date|null>(null);
    const currentReportEnd = useRef<Date|null>(null);
    const currentPatientId = useRef<number>(-1);

    const MAX_DAYS = 30;

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                setPatients(await patientsApi.getAll());
            } catch (error) {
                console.error('Failed to fetch patients:', error);
            }
        };

        fetchPatients();
    }, []);

    useEffect(() => {
        const values = originalNutritionData.map(x => (x as MealNutrition)[selectedNutrient as keyof MealNutrition]);
        setValueSeries(values.map(x => x ? x : 0));
    }, [selectedNutrient]);

    const handleFetchNutrition = async () => {
        if (!selectedPatientId || !startDate || !endDate) return;

        resetState();

        if(isInvalidDateRange(new Date(startDate), new Date(endDate), MAX_DAYS)) {
            setResult(`Invalid date range, end date cannot be before start date and range cannot be > ${MAX_DAYS} days.`);
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
            computeCompiledMeal(meals);
            setReadOnly(true);
            setNutrientNames(meals.length > 0 ? Object.keys(meals[0]) : []);
            setSelectedNutrient(meals.length > 0 ? 'kcal' : '');
            setDateSeries(dates);
            setValueSeries(meals.map(x => x.kcal ? x.kcal : 0));
            currentReportStart.current = new Date(startDate);
            currentReportEnd.current = new Date(endDate);
            currentPatientId.current = selectedPatientId;
        } catch (error) {
            console.error('Failed to fetch nutrition data:', error);
        } finally {
            setLoading(false);
        }
    };

    function isInvalidDateRange(
        start: Date,
        end: Date,
        maxDays: number
        ): boolean {
        if (!(start instanceof Date) || isNaN(start.getTime())) return true;
        if (!(end instanceof Date) || isNaN(end.getTime())) return true;
        if (maxDays < 0) return true;

        // End before start
        if (end.getTime() < start.getTime()) {
            return true;
        }

        const MS_PER_DAY = 1000 * 60 * 60 * 24;
        const diffDays = (end.getTime() - start.getTime()) / MS_PER_DAY;

        // Exceeds max allowed days
        if (diffDays > maxDays) {
            return true;
        }

        return false;
    }

    function computeCompiledMeal(meals: MealNutrition[]) {
        setNutritionData(sumMealNutrition(meals));
    }

    function resetState() {
        setResult('');
        setLoading(false);
        setNutritionData(null);
        setOriginalNutritionData([]);
        setSelectedNutrient('');
        setNutrientNames([]);
        setDateSeries([]);
        setValueSeries([]);
        setReadOnly(false);
    }

    function getDateRangeSubtitle(): string {
        if (!(currentReportStart.current) || !(currentReportEnd.current)) return '';
        return `Patient #${currentPatientId.current} ${currentReportStart.current?.getDate()}/${currentReportStart.current?.getMonth() + 1}/${currentReportStart.current?.getFullYear()} to ${currentReportEnd.current?.getDate()}/${currentReportEnd.current?.getMonth() + 1}/${currentReportEnd.current?.getFullYear()}`
    }

    function dateToString(obj: Date | null): string {
        if(!obj) {
            return "01-01-1972";
        } else {
            return `${obj.getDate()}/${obj.getMonth() + 1}/${obj.getFullYear()}`;
        }
    }

    return (
        <div className="p-6">
            {!readOnly && (<div className="flex flex-row justify-between mb-2">
                <div>
                    <label className="text-sm font-medium mb-2 mr-2">Select Patient</label>
                    <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                        className="flex-1 pl-3 pr-10 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 disabled:opacity-50 appearance-none cursor-pointer"
                        style={{
                            background: `var(--background) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E") no-repeat right 0.75rem center`,
                            backgroundSize: '1rem',
                            borderColor: 'var(--card-border)',
                            color: 'var(--foreground)',
                        }}>
                        <option value="">Choose a patient...</option>
                        {patients.map((patient) => (
                            <option key={patient.id} value={patient.id}>
                                {patient.id}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="w-1/2 flex flex-row justify-between">
                    <div>
                        <label className="text-sm font-medium mb-2 mr-2">Start Date</label>
                        <input
                            type="date"
                            value={startDate ? startDate : ''}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="flex-1 pl-3 px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 disabled:opacity-50 appearance-none cursor-pointer"
                            style={{
                                backgroundSize: '1rem',
                                borderColor: 'var(--card-border)',
                                color: 'var(--foreground)',
                            }}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 mr-2">End Date</label>
                        <input
                            type="date"
                            value={endDate ? endDate : ''}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="flex-1 pl-3 px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 disabled:opacity-50 appearance-none cursor-pointer"
                            style={{
                                backgroundSize: '1rem',
                                borderColor: 'var(--card-border)',
                                color: 'var(--foreground)',
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-row flex-start">
                    <button
                        onClick={handleFetchNutrition}
                        disabled={loading}
                        className="bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Fetch Data'}
                    </button>
                    {nutritionData && (
                        <button
                            onClick={() => setReadOnly(true)}
                            className="ml-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>)}
            {readOnly && (
                <div className="flex flex-row justify-between mb-2">
                    <div>
                        <label className="text-sm font-bold mb-2 mr-2">Patient</label>
                        <h4>#{selectedPatientId}</h4>
                    </div>

                    <div className="w-1/2 flex flex-row justify-between">
                        <div>
                            <label className="text-sm font-bold mb-2 mr-2">Start Date</label>
                            <h4>{dateToString(currentReportStart.current)}</h4>
                        </div>
                        <div>
                            <label className="text-sm font-bold mb-2 mr-2">End Date</label>
                            <h4>{dateToString(currentReportEnd.current)}</h4>
                        </div>
                    </div>
                    <button
                        onClick={() => setReadOnly(false)}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        style={{ color: 'var(--accent-primary)' }}
                        >
                        Edit
                    </button>
                </div>
            )}
            {result && !loading && (
                <h3>{result}</h3>
            )}

            {loading && (
                <Spinner />
            )}

            {nutritionData && (
                <div>
                    <NutritionHeader mass={nutritionData.mass}/>
                    {dateSeries && valueSeries && (<div className="flex-col justify-start content-between p-6">
                        <div>
                            <h5 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                                <span className="w-1 h-6 rounded-full mr-3" style={{ background: 'var(--accent-primary)' }}></span>
                                Time Series Intake for
                            </h5>
                            <select
                                value={selectedNutrient}
                                onChange={(e) => setSelectedNutrient(e.target.value)}
                                className="border-none rounded m-4 text-lg font-bold "
                            >
                                <option value="">Choose a nutrient...</option>
                                {nutrientNames.map((nutrient) => (
                                    <option key={nutrient} value={nutrient}>
                                        {nutrient}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-row justify-center content-center">
                            <SingleVarTimePlot xData={dateSeries} yData={valueSeries} width={1000} height={500} />
                        </div>
                    </div>)}
                    <div className="p-6">
        
                    {/* Nutrition Wheel and Table Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Nutrition Wheel - Takes 1/3 on large screens */}
                        <div className="lg:col-span-1">
                        <h5 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                            <span className="w-1 h-6 rounded-full mr-3" style={{ background: 'var(--accent-primary)' }}></span>
                            Macronutrient Breakdown
                                </h5>
                            <NutritionWheel protein={nutritionData.protein} carbs={nutritionData.carbohydrate} fat={nutritionData.fat} />
                            </div>
        
                        {/* Nutrition Table - Takes 2/3 on large screens */}
                        <div className="lg:col-span-2">
                        <h5 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                            <span className="w-1 h-6 rounded-full mr-3" style={{ background: 'var(--accent-primary)' }}></span>
                            Nutrition Table
                                </h5>
                        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
                            <NutritionTable data={nutritionData} />
                        </div>
                        </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
);
}