/**
 * File: useBatchImportState.js
 * Purpose: Centralized state management for BatchImportPage
 * Extracted from: BatchImportPage.js
 *
 * Contains all useState declarations organized by category:
 * - File management state
 * - UI state (loading, dialogs)
 * - Import progress state
 * - Preview state
 */

import { useState, useRef, useEffect } from "react";

const useBatchImportState = () => {
  // ============================================
  // FILE MANAGEMENT STATE
  // ============================================
  const [files, setFiles] = useState([]);
  const [duplicateHandling, setDuplicateHandling] = useState("fail");

  // ============================================
  // UI STATE
  // ============================================
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showResultDialog, setShowResultDialog] = useState(false);

  // ============================================
  // PREVIEW STATE
  // ============================================
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewFileData, setPreviewFileData] = useState(null);

  // ============================================
  // IMPORT PROGRESS STATE
  // ============================================
  // eslint-disable-next-line no-unused-vars
  const [processingIndex, setProcessingIndex] = useState(-1);
  // eslint-disable-next-line no-unused-vars
  const [importProgress, setImportProgress] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [activeJobId, setActiveJobId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [pendingJobsMap, setPendingJobsMap] = useState(new Map());

  // ============================================
  // RESULT STATE
  // ============================================
  const [batchResult, setBatchResult] = useState(null);
  const [selectedFileResult, setSelectedFileResult] = useState(null);

  // ============================================
  // REFS
  // ============================================
  const activeJobIdRef = useRef(null);
  const pendingJobsMapRef = useRef(new Map());
  const cancelRequestedRef = useRef(false);
  const fileInputRef = useRef(null);
  const gridRef = useRef(null);
  const importResolversRef = useRef(new Map());
  const filesRef = useRef([]);
  const lockedUrlRef = useRef(null);
  const revertingRouteRef = useRef(false);
  const nextFileIdRef = useRef(0);

  // Keep filesRef in sync with files state
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  return {
    // File management
    files,
    setFiles,
    duplicateHandling,
    setDuplicateHandling,

    // UI state
    loading,
    setLoading,
    cancelling,
    setCancelling,
    showInstructions,
    setShowInstructions,
    showResultDialog,
    setShowResultDialog,

    // Preview state
    previewVisible,
    setPreviewVisible,
    previewFileName,
    setPreviewFileName,
    previewFileData,
    setPreviewFileData,

    // Import progress
    processingIndex,
    setProcessingIndex,
    importProgress,
    setImportProgress,
    activeJobId,
    setActiveJobId,
    pendingJobsMap,
    setPendingJobsMap,

    // Results
    batchResult,
    setBatchResult,
    selectedFileResult,
    setSelectedFileResult,

    // Refs
    activeJobIdRef,
    pendingJobsMapRef,
    cancelRequestedRef,
    fileInputRef,
    gridRef,
    importResolversRef,
    filesRef,
    lockedUrlRef,
    revertingRouteRef,
    nextFileIdRef,
  };
};

export default useBatchImportState;
