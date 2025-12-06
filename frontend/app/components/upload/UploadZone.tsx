'use client';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  hasExistingSnapshots?: boolean;
  className?: string;
}

export function UploadZone({ 
  onFileSelect, 
  isUploading, 
  hasExistingSnapshots = false,
  className = '' 
}: UploadZoneProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  // Compact version when there are existing snapshots
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
            <svg
              className="w-4 h-4 animate-spin"
              style={{ color: 'var(--accent-primary)' }}
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
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

  // Full upload zone when no snapshots exist
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
            <svg
              className="w-8 h-8 animate-spin"
              style={{ color: 'var(--accent-primary)' }}
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
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
