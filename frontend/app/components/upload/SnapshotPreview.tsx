'use client';

import type { Snapshot } from '../../lib/types';
import { uploadApi } from '../../lib/api';

interface SnapshotPreviewProps {
  label: string;
  number: number;
  snapshot: Snapshot | null;
  color: string;
}

export function SnapshotPreview({ label, number, snapshot, color }: SnapshotPreviewProps) {
  return (
    <div
      className="p-4 rounded-xl border-2"
      style={{
        borderColor: snapshot ? color : 'var(--card-border)',
        background: 'var(--background)',
      }}
    >
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

      {snapshot ? (
        <div>
          <img
            src={uploadApi.getImageUrl(snapshot.rgb_path)}
            alt={`${label} RGB`}
            className="w-full h-32 object-cover rounded-lg mb-2"
          />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Patient: {snapshot.patient_id} | {snapshot.date} {snapshot.time}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Weight: {snapshot.weight}g
          </p>
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>Select snapshot {number}...</p>
      )}
    </div>
  );
}
