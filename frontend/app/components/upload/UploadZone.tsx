/**
 * @fileoverview File upload zone component for ZIP file selection.
 *
 * Provides a drag-and-drop style interface for selecting ZIP files
 * containing meal snapshots. Adapts its appearance based on whether
 * snapshots already exist (compact mode) or not (full mode).
 */

'use client';

import { Spinner } from '../ui/Spinner';

// =============================================================================
// Type Definitions
// =============================================================================

/** Props for the UploadZone component. */
interface UploadZoneProps {
  /**
   * Callback invoked when a file is selected.
   *
   * @param file - The selected ZIP file.
   */
  onFileSelect: (file: File) => void;
  /** Whether a file upload is currently in progress. */
  isUploading: boolean;
  /** Whether snapshots already exist (triggers compact mode). */
  hasExistingSnapshots?: boolean;
  /** Optional additional CSS classes. */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a file upload zone for ZIP file selection.
 *
 * The component has two display modes:
 * - **Full mode**: Large dashed border area with upload icon, shown when
 *   no snapshots exist yet.
 * - **Compact mode**: Small inline button, shown when snapshots already
 *   exist to allow adding more without taking up much space.
 *
 * During upload, displays a spinner and disables further interaction.
 *
 * @param props - The component props.
 * @returns The upload zone element.
 *
 * @example
 * ```tsx
 * <UploadZone
 *   onFileSelect={handleUpload}
 *   isUploading={isUploading}
 *   hasExistingSnapshots={snapshots.length > 0}
 * />
 * ```
 */
export function UploadZone({ 
  onFileSelect, 
  isUploading, 
  hasExistingSnapshots = false,
  className = '' 
}: UploadZoneProps) {
  /**
   * Handles file input change events.
   *
   * Extracts the first file and passes it to the callback.
   * Resets the input value to allow re-selecting the same file.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = '';
    }
  };

  // Compact mode: small button when snapshots exist.
  if (hasExistingSnapshots) {
    return (
      <div className={className}>
        <label
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all duration-200 ${
            isUploading ? 'opacity-50 pointer-events-none' : 'hover:bg-blue-50 hover:border-blue-300'
          }`}
          style={{
            borderColor: 'var(--card-border)',
            background: 'var(--card-bg)',
          }}
        >
          <input
            type="file"
            accept=".zip"
            onChange={handleChange}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <Spinner size="sm" />
          ) : (
            <svg
              className="w-4 h-4"
              style={{ color: 'var(--accent-primary)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
          <span style={{ color: 'var(--accent-primary)' }} className="font-medium">
            {isUploading ? 'Uploading...' : 'Add More Snapshots'}
          </span>
        </label>
      </div>
    );
  }

  // Full mode: large drop zone when no snapshots exist.
  return (
    <div className={className}>
      <label
        className={`block border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
          isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-blue-500 hover:bg-blue-50/50'
        }`}
        style={{
          borderColor: 'var(--card-border)',
          background: 'var(--card-bg)',
        }}
      >
        <input
          type="file"
          accept=".zip"
          onChange={handleChange}
          className="hidden"
          disabled={isUploading}
        />
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--accent-light)' }}
        >
          {isUploading ? (
            <Spinner size="md" />
          ) : (
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          )}
        </div>
        <p className="text-lg font-medium mb-1" style={{ color: 'var(--foreground)' }}>
          {isUploading ? 'Uploading...' : 'Drop your ZIP file here'}
        </p>
        <p style={{ color: 'var(--text-muted)' }}>or click to browse</p>
      </label>
    </div>
  );
}
