'use client';

import type { MealData } from '../../lib/types';
import { uploadApi } from '../../lib/api';

interface MealDetailProps {
  meal: MealData;
  onDelete: () => void;
}

export function MealDetail({ meal, onDelete }: MealDetailProps) {
  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-sm"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      {/* Header */}
      <div
        className="p-6 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--card-border)' }}
      >
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            Meal Details
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Patient #{meal.patient_id} • {meal.date} • {meal.start_time} - {meal.end_time}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-red-50"
          style={{ color: 'var(--danger)' }}
        >
          Delete Meal
        </button>
      </div>

      {/* Menu Item */}
      {meal.menu_item && (
        <div className="p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <h3 className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            Menu Item
          </h3>
          <span className="text-lg font-semibold" style={{ color: 'var(--accent-primary)' }}>
            {meal.menu_item.name}
          </span>
          {meal.menu_item.ingredients.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {meal.menu_item.ingredients.map((ing, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}
                >
                  {ing}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weight Info */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <h3 className="font-medium mb-4" style={{ color: 'var(--foreground)' }}>
          Weight Data
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <WeightCard label="Before" value={meal.before_weight} color="var(--accent-primary)" />
          <WeightCard label="After" value={meal.after_weight} color="var(--accent-secondary)" />
          <WeightCard
            label="Consumed"
            value={meal.before_weight - meal.after_weight}
            color="var(--success)"
          />
        </div>
      </div>

      {/* Images */}
      <div className="p-6">
        <h3 className="font-medium mb-4" style={{ color: 'var(--foreground)' }}>
          Meal Images
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <ImageColumn
            label="Before (Pre-meal)"
            number={1}
            color="var(--accent-primary)"
            rgbPath={meal.before_rgb_path}
            depthPath={meal.before_depth_path}
          />
          <ImageColumn
            label="After (Post-meal)"
            number={2}
            color="var(--accent-secondary)"
            rgbPath={meal.after_rgb_path}
            depthPath={meal.after_depth_path}
          />
        </div>
      </div>
    </div>
  );
}

function WeightCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--background)' }}>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value.toFixed(1)}g
      </p>
    </div>
  );
}

interface ImageColumnProps {
  label: string;
  number: number;
  color: string;
  rgbPath: string;
  depthPath: string;
}

function ImageColumn({ label, number, color, rgbPath, depthPath }: ImageColumnProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: color, color: 'white' }}
        >
          {number}
        </div>
        <span className="font-medium" style={{ color: 'var(--foreground)' }}>
          {label}
        </span>
      </div>
      <div className="space-y-3">
        <ImageCard label="RGB" path={rgbPath} />
        <ImageCard label="Depth" path={depthPath} />
      </div>
    </div>
  );
}

function ImageCard({ label, path }: { label: string; path: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: 'var(--card-border)' }}
    >
      <p
        className="px-3 py-1 text-xs font-medium"
        style={{ background: 'var(--background)', color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <img
        src={uploadApi.getImageUrl(path)}
        alt={`${label} image`}
        className="w-full h-48 object-cover"
      />
    </div>
  );
}
