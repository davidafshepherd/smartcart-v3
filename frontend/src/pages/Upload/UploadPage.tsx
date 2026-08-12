import { AlertMessage } from '@/components/common';
import {
  InvalidSnapshots,
  MatchingPanel,
  SnapshotGrid,
  UploadHeader,
  UploadZone,
} from '@/features/upload/components';
import { useUpload } from '@/features/upload/hooks/useUpload';

import './UploadPage.css';


export default function UploadPage() {
  const {
    // Snapshot state.
    snapshots,
    invalidSnapshots,
    selectedIds,
    discardingIds,

    // Menu state.
    menuItems,
    selectedMenuItemId,

    // UI state.
    isUploading,
    isSaving,
    successMessage,
    errorMessage,

    // Derived state.
    beforeSnapshot,
    afterSnapshot,
    hasExistingSnapshots,

    // Snapshot actions.
    handleFileUpload,
    handleDiscard,
    handleToggleSelection,
    handleClearSelection,
    handleClearInvalidSnapshots,

    // Menu/Meal actions.
    handleMenuItemCreated,
    handleSetSelectedMenuItemId,
    handleSaveMeal,

    // UI actions.
    handleSetErrorMessage,
    handleSetSuccessMessage,
  } = useUpload();

  return (
    <main className="upload-page">
      <div className="upload-container">
        {/* Header */}
        <UploadHeader
          hasExistingSnapshots={hasExistingSnapshots}
          isUploading={isUploading}
          onUpload={handleFileUpload}
        />

        {/* Feedback messages */}
        {errorMessage && (
          <AlertMessage
            type="error"
            message={errorMessage}
            onDismiss={() => handleSetErrorMessage(null)}
          />
        )}
        {successMessage && (
          <AlertMessage
            type="success"
            message={successMessage}
            onDismiss={() => handleSetSuccessMessage(null)}
          />
        )}

        {/* Invalid snapshots warning */}
        {invalidSnapshots.length > 0 && (
          <InvalidSnapshots
            snapshots={invalidSnapshots}
            onDismiss={handleClearInvalidSnapshots}
          />
        )}

        {/* Upload zone */}
        {!hasExistingSnapshots && (
          <UploadZone 
            isUploading={isUploading} 
            onUpload={handleFileUpload} 
          />
        )}

        {/* Matching Panel */}
        {selectedIds.length > 0 && (
          <MatchingPanel
            beforeSnapshot={beforeSnapshot}
            afterSnapshot={afterSnapshot}
            menuItems={menuItems}
            selectedMenuItemId={selectedMenuItemId}
            onMenuItemSelect={handleSetSelectedMenuItemId}
            onMenuItemCreated={handleMenuItemCreated}
            onSave={handleSaveMeal}
            onClearSelection={handleClearSelection}
            isSaving={isSaving}
            canSave={selectedIds.length === 2 && !!selectedMenuItemId}
          />
        )}

        {/* Snapshot Grid */}
        {snapshots.length > 0 && (
          <SnapshotGrid
            snapshots={snapshots}
            selectedIds={selectedIds}
            discardingIds={discardingIds}
            onSelect={handleToggleSelection}
            onDiscard={handleDiscard}
          />
        )}
      </div>
    </main>
  );
}
