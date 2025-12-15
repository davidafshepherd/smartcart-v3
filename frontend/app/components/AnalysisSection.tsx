/**
 * @fileoverview Analysis section component for meal analysis.
 *
 * This section provides tools for analyzing meal data using SAM2 and OWLv2 models.
 * Users can select meals and use either point-based or box-based segmentation.
 */

'use client';

import { useEffect, useState } from 'react';
import { mealsApi, menuApi, patientsApi, analysisApi, ApiError } from '../lib/api';
import type { MealsData, MealData, MenuItem, Patient, FoodPoints, FoodBox, Mask, Point, ComputeNutritionResponse } from '../lib/types';
import { MealsPanel } from './meals/MealsPanel';
import { AnalysisInterface } from './analysis/AnalysisInterface';

// =============================================================================
// Type Definitions
// =============================================================================

type InputMode = 'points' | 'boxes';
type DetectionModel = 'owlv2' | 'owlv2-sahi';

// =============================================================================
// Component
// =============================================================================

/**
 * Renders the analysis section of the application.
 *
 * @returns The analysis section element.
 */
export default function AnalysisSection() {
  // ===========================================================================
  // State
  // ===========================================================================
  const [mealsData, setMealsData] = useState<MealsData>({});
  const [patients, setPatients] = useState<Patient[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<MealData | null>(null);
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  
  // Points mode state
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [beforePoints, setBeforePoints] = useState<FoodPoints[]>([]);
  const [afterPoints, setAfterPoints] = useState<FoodPoints[]>([]);
  
  // Boxes mode state
  const [detectionModel, setDetectionModel] = useState<DetectionModel>('owlv2');
  const [threshold, setThreshold] = useState(0.5);
  const [iouThreshold, setIouThreshold] = useState(0.5);
  const [beforeBoxes, setBeforeBoxes] = useState<FoodBox[]>([]);
  const [afterBoxes, setAfterBoxes] = useState<FoodBox[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  
  // SAM2 state
  const [masks, setMasks] = useState<Mask[]>([]);
  const [selectedMasks, setSelectedMasks] = useState<Set<string>>(new Set());
  const [isRunningSam2, setIsRunningSam2] = useState(false);
  
  // Nutrition state
  const [nutritionData, setNutritionData] = useState<ComputeNutritionResponse | null>(null);
  
  // Tree view expansion state
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // ===========================================================================
  // Effects
  // ===========================================================================

  useEffect(() => {
    fetchAllData();
  }, []);

  // Reset state when meal changes
  useEffect(() => {
    if (selectedMeal) {
      setInputMode(null);
      setSelectedFoodId(null);
      setBeforePoints([]);
      setAfterPoints([]);
      setBeforeBoxes([]);
      setAfterBoxes([]);
      setMasks([]);
      setSelectedMasks(new Set());
    }
  }, [selectedMeal]);

  // ===========================================================================
  // Data Fetching
  // ===========================================================================

  const fetchAllData = async () => {
    try {
      const [mealsResult, patientsResult, menuItemsResult] = await Promise.all([
        mealsApi.getAll(),
        patientsApi.getAll(),
        menuApi.getAll(),
      ]);
      setMealsData(mealsResult);
      setPatients(patientsResult);
      setMenuItems(menuItemsResult);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================================
  // Tree View Handlers
  // ===========================================================================

  const togglePatient = (patientId: string) => {
    setExpandedPatients((prev) => {
      const next = new Set(prev);
      if (next.has(patientId)) {
        next.delete(patientId);
      } else {
        next.add(patientId);
      }
      return next;
    });
  };

  const toggleDate = (key: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleMealSelect = (meal: MealData) => {
    setSelectedMeal(meal);
  };

  // ===========================================================================
  // Points Mode Handlers
  // ===========================================================================

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>, imageType: 'before' | 'after') => {
    if (!selectedMeal || !selectedFoodId || inputMode !== 'points') return;
    
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    // Calculate click position in pixels relative to image natural size
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const point: Point = { x, y };
    
    if (imageType === 'before') {
      setBeforePoints((prev) => {
        const existing = prev.find((p) => p.food_id === selectedFoodId);
        if (existing) {
          return prev.map((p) =>
            p.food_id === selectedFoodId
              ? { ...p, points: [...p.points, point] }
              : p
          );
        }
        return [...prev, { food_id: selectedFoodId, points: [point] }];
      });
    } else {
      setAfterPoints((prev) => {
        const existing = prev.find((p) => p.food_id === selectedFoodId);
        if (existing) {
          return prev.map((p) =>
            p.food_id === selectedFoodId
              ? { ...p, points: [...p.points, point] }
              : p
          );
        }
        return [...prev, { food_id: selectedFoodId, points: [point] }];
      });
    }
  };

  const handleRunSam2Points = async () => {
    if (!selectedMeal) return;
    
    // Check that at least 1 point per food is selected for before image
    const foods = selectedMeal.menu_item.foods;
    const hasAllFoods = foods.every((food) => 
      beforePoints.some((pointGroup) => pointGroup.food_id === food.id && pointGroup.points.length > 0)
    );
    
    if (!hasAllFoods) {
      alert('Please select at least one point for each food in the before image');
      return;
    }
    
    setIsRunningSam2(true);
    try {
      const result = await analysisApi.sam2Points(
        selectedMeal.before_rgb_path,
        selectedMeal.after_rgb_path,
        beforePoints,
        afterPoints
      );
      setMasks(result);
      // Clear previous mask selections when new masks are generated
      setSelectedMasks(new Set());
    } catch (err) {
      console.error('SAM2 inference failed:', err);
      alert(err instanceof ApiError ? err.message : 'Failed to run SAM2 inference');
    } finally {
      setIsRunningSam2(false);
    }
  };

  const handleDeletePoint = (foodId: number, pointIndex: number, imageType: 'before' | 'after') => {
    if (imageType === 'before') {
      setBeforePoints((prev) =>
        prev.map((pointGroup) =>
          pointGroup.food_id === foodId
            ? { ...pointGroup, points: pointGroup.points.filter((_, idx) => idx !== pointIndex) }
            : pointGroup
        ).filter((pointGroup) => pointGroup.points.length > 0 || pointGroup.food_id !== foodId)
      );
    } else {
      setAfterPoints((prev) =>
        prev.map((pointGroup) =>
          pointGroup.food_id === foodId
            ? { ...pointGroup, points: pointGroup.points.filter((_, idx) => idx !== pointIndex) }
            : pointGroup
        ).filter((pointGroup) => pointGroup.points.length > 0 || pointGroup.food_id !== foodId)
      );
    }
  };

  // ===========================================================================
  // Boxes Mode Handlers
  // ===========================================================================

  const handleRunDetection = async () => {
    if (!selectedMeal) return;
    
    setIsDetecting(true);
    try {
      // Extract food IDs for OWLv2 detection
      const foodIds = selectedMeal.menu_item.foods.map((food) => food.id);
      
      let result;
      if (detectionModel === 'owlv2') {
        result = await analysisApi.owlv2Detect(
          selectedMeal.before_rgb_path,
          selectedMeal.after_rgb_path,
          threshold,
          foodIds
        );
      } else {
        // For SAHI, use food IDs (integers)
        const foodIds = selectedMeal.menu_item.foods.map((food) => food.id);
        result = await analysisApi.owlv2SahiDetect(
          selectedMeal.before_rgb_path,
          selectedMeal.after_rgb_path,
          threshold,
          iouThreshold,
          foodIds
        );
        
        // Convert BoxGroup[] to FoodBox[] format (flattening multiple boxes per food)
        const beforeBoxes: FoodBox[] = [];
        result.before_boxes.forEach((boxGroup) => {
          boxGroup.boxes.forEach((box) => {
            beforeBoxes.push({
              food_id: boxGroup.food_id,
              box: {
                x1: box.x1,
                y1: box.y1,
                x2: box.x2,
                y2: box.y2,
              },
            });
          });
        });
        
        const afterBoxes: FoodBox[] = [];
        result.after_boxes.forEach((boxGroup) => {
          boxGroup.boxes.forEach((box) => {
            afterBoxes.push({
              food_id: boxGroup.food_id,
              box: {
                x1: box.x1,
                y1: box.y1,
                x2: box.x2,
                y2: box.y2,
              },
            });
          });
        });
        
        setBeforeBoxes(beforeBoxes);
        setAfterBoxes(afterBoxes);
        return;
      }
      
      // Convert BoxGroup[] to FoodBox[] format (flattening multiple boxes per food)
      const beforeBoxes: FoodBox[] = [];
      result.before_boxes.forEach((boxGroup) => {
        boxGroup.boxes.forEach((box) => {
          beforeBoxes.push({
            food_id: boxGroup.food_id,
            box: {
              x1: box.x1,
              y1: box.y1,
              x2: box.x2,
              y2: box.y2,
            },
          });
        });
      });
      
      const afterBoxes: FoodBox[] = [];
      result.after_boxes.forEach((boxGroup) => {
        boxGroup.boxes.forEach((box) => {
          afterBoxes.push({
            food_id: boxGroup.food_id,
            box: {
              x1: box.x1,
              y1: box.y1,
              x2: box.x2,
              y2: box.y2,
            },
          });
        });
      });
      
      setBeforeBoxes(beforeBoxes);
      setAfterBoxes(afterBoxes);
    } catch (err) {
      console.error('Detection failed:', err);
      alert(err instanceof ApiError ? err.message : 'Failed to run detection');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleRunSam2Boxes = async () => {
    if (!selectedMeal || beforeBoxes.length === 0) return;
    
    setIsRunningSam2(true);
    try {
      const result = await analysisApi.sam2Boxes(
        selectedMeal.before_rgb_path,
        selectedMeal.after_rgb_path,
        beforeBoxes,
        afterBoxes
      );
      setMasks(result);
    } catch (err) {
      console.error('SAM2 inference failed:', err);
      alert(err instanceof ApiError ? err.message : 'Failed to run SAM2 inference');
    } finally {
      setIsRunningSam2(false);
    }
  };

  const handleToggleMask = (maskId: string) => {
    setSelectedMasks((prev) => {
      const next = new Set(prev);
      if (next.has(maskId)) {
        next.delete(maskId);
      } else {
        next.add(maskId);
      }
      return next;
    });
  };

  // ===========================================================================
  // Render
  // ===========================================================================

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-xl shimmer"></div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Analyse Meals
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Select a meal to analyse and generate a detailed nutritional report.
          </p>
        </div>

        {/* Two-Panel Layout */}
        <div className="flex gap-8">
          {/* Left Panel: Meal Selection */}
          <div className="w-80 shrink-0">
            <MealsPanel
              mealsData={mealsData}
              selectedMealId={selectedMeal?.id ?? null}
              onMealSelect={handleMealSelect}
              expandedPatients={expandedPatients}
              expandedDates={expandedDates}
              onTogglePatient={togglePatient}
              onToggleDate={toggleDate}
            />
          </div>

          {/* Right Panel: Analysis Interface */}
          <div className="flex-1">
            {!selectedMeal ? (
              <div
                className="rounded-2xl border p-16 text-center shadow-sm"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                  Select a meal to analyse
                </p>
                <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
                  Click on a time range in the tree view
                </p>
              </div>
            ) : (
              <AnalysisInterface
                meal={selectedMeal}
                inputMode={inputMode}
                onInputModeChange={setInputMode}
                selectedFoodId={selectedFoodId}
                onFoodSelect={setSelectedFoodId}
                beforePoints={beforePoints}
                afterPoints={afterPoints}
                onImageClick={handleImageClick}
                onDeletePoint={handleDeletePoint}
                onRunSam2Points={handleRunSam2Points}
                detectionModel={detectionModel}
                onDetectionModelChange={setDetectionModel}
                threshold={threshold}
                onThresholdChange={setThreshold}
                iouThreshold={iouThreshold}
                onIouThresholdChange={setIouThreshold}
                beforeBoxes={beforeBoxes}
                afterBoxes={afterBoxes}
                onRunDetection={handleRunDetection}
                onRunSam2Boxes={handleRunSam2Boxes}
                isDetecting={isDetecting}
                masks={masks}
                selectedMasks={selectedMasks}
                onToggleMask={handleToggleMask}
                isRunningSam2={isRunningSam2}
                setSelectedMasks={setSelectedMasks}
                setMasks={setMasks}
                setBeforePoints={setBeforePoints}
                setAfterPoints={setAfterPoints}
                onBackToInputSelection={() => setInputMode(null)}
                nutritionData={nutritionData}
                setNutritionData={setNutritionData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
