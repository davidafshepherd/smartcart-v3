import { nutritionApi, patientsApi } from '@/app/lib/api';
import { MealNutrition, Patient } from '@/app/lib/types';
import React, { useState, useEffect, useRef } from 'react';
import { NutritionWheel } from './nutrition/NutritionWheel';
import { NutritionHeader } from './nutrition/NutritionHeader';
import { NutritionTable } from './nutrition/NutritionTable';
import { Spinner } from '../ui/Spinner';

export const PatientNutritionPanel: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number>();
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [nutritionData, setNutritionData] = useState<MealNutrition | null>();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');

    const currentReportStart = useRef<Date|null>(null);
    const currentReportEnd = useRef<Date|null>(null);

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

    const handleFetchNutrition = async () => {
        if (!selectedPatientId || !startDate || !endDate) return;

        setLoading(true);
        try {
            const data = await nutritionApi.getPatientReport(selectedPatientId, startDate, endDate);
            if(!data) {
                setResult('No nutrition data for requested patient or period!');
                setLoading(false);
                return;
            }
            console.log('Compiled report: ', data);
            setNutritionData(data);
            currentReportStart.current = startDate;
            currentReportEnd.current = endDate;
        } catch (error) {
            console.error('Failed to fetch nutrition data:', error);
        } finally {
            setLoading(false);
        }
    };

    function getDateRangeSubtitle(): string {
        if (!(currentReportStart.current) || !(currentReportEnd.current)) return '';
        return `${currentReportStart.current?.getDate()}/${currentReportStart.current?.getMonth() + 1}/${currentReportStart.current?.getFullYear()} to ${currentReportEnd.current?.getDate()}/${currentReportEnd.current?.getMonth() + 1}/${currentReportEnd.current?.getFullYear()}`
    }

    return (
        <div className="p-6">
            <div className="mb-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Select Patient</label>
                    <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                        className="border rounded px-3 py-2 w-full"
                    >
                        <option value="">Choose a patient...</option>
                        {patients.map((patient) => (
                            <option key={patient.id} value={patient.id}>
                                {patient.id}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Start Date</label>
                        <input
                            type="date"
                            value={startDate ? startDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setStartDate(new Date(e.target.value))}
                            className="border rounded px-3 py-2 w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">End Date</label>
                        <input
                            type="date"
                            value={endDate ? endDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setEndDate(new Date(e.target.value))}
                            className="border rounded px-3 py-2 w-full"
                        />
                    </div>
                </div>

                <button
                    onClick={handleFetchNutrition}
                    disabled={loading}
                    className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Fetch Data'}
                </button>
            </div>
            {result && !loading && (
                <h3>{result}</h3>
            )}

            {loading && (
                <Spinner />
            )}

            {nutritionData && (
                <>
                    <NutritionHeader mass={nutritionData.mass} subtitle={getDateRangeSubtitle()} />
                    <NutritionWheel protein={nutritionData.protein} carbs={nutritionData.carbohydrate} fat={nutritionData.fat} />
                    <NutritionTable data={nutritionData} />
                </>
            )}
        </div>
);
}