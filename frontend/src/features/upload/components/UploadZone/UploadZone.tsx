import { Spinner } from '@/components/common';
import { CloudUploadIcon } from '@/components/common/icons';

import './UploadZone.css';


interface Props {
  isUploading: boolean;
  onUpload: (file: File) => void;
}


export function UploadZone({ isUploading, onUpload }: Props) {
  // Handles file selection from the upload input.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = "";
    }
  };

  return (
    <div className="upload-zone">
      {/* Snapshot drag-and-drop zone */}
      <label className={`upload-zone-drop ${isUploading ? "disabled" : "enabled"}`}>
        <input type="file" accept=".zip" onChange={handleFileChange} disabled={isUploading} />

        {/* Zone icon */}
        <div className="upload-zone-icon-container">
          {isUploading ? (<Spinner size="md" />) : (<CloudUploadIcon className="upload-zone-icon" />)}
        </div>

        {/* Zone instructions */}
        <p className="upload-zone-title">{isUploading ? "Uploading..." : "Drop your ZIP file here"}</p>
        <p className="upload-zone-subtitle">or click to browse</p>
      </label>
    </div>
  );
}
