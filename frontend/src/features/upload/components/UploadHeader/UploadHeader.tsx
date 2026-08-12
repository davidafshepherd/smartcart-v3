import { Spinner } from '@/components/common';
import { PlusIcon } from '@/components/common/icons';

import './UploadHeader.css';


interface Props {
  hasExistingSnapshots: boolean;
  isUploading: boolean;
  onUpload: (file: File) => void;
}


export function UploadHeader({ hasExistingSnapshots, isUploading, onUpload }: Props) {
  // Handles file selection from the upload input.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = "";
    }
  };

  return (
    <div className="upload-header">
      {/* Header title and subtitle */}
      <div className="upload-header-content">
        <h1>Upload Meal Snapshots</h1>
        <p>Upload ZIP files containing meal snapshots, then match before and after snapshots to create meals.</p>
      </div>

      {/* Add More Snapshots button */}
      {hasExistingSnapshots && (
        <label className={`upload-header-button ${isUploading ? "disabled" : "enabled"}`}>
          <input type="file" accept=".zip" onChange={handleFileChange} disabled={isUploading} />

          {isUploading ? (<Spinner size="sm" />) : (<PlusIcon className="upload-header-button-icon" />)}

          <span className="upload-header-button-text">{isUploading ? "Uploading..." : "Add More Snapshots"}</span>
        </label>
      )}
    </div>
  );
}
