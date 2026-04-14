/**
 * File:          BulkDocumentUpload.jsx
 * Purpose:       Bulk document upload dialog with OCR extraction, vehicle matching, and verified save.
 * Dependencies:  React, DevExtreme, vehicleDocumentOcrApi, VehicleSearchableSelector
 * Last Modified: 2025-07-14
 *
 * Key Functions:
 * - handleFilesSelected(): Stores selected files for upload
 * - handleExtract(): Sends files for bulk OCR extraction
 * - handleSave(): Saves user-verified documents
 */
import React, { useState, useCallback, useRef } from "react";
import notify from "devextreme/ui/notify";
import VehicleSearchableSelector from "../../../components/selectors/VehicleSearchableSelector";
import SlidePanel from "../../../components/ui/SlidePanel";
import { bulkExtractDocumentData, bulkSaveDocuments } from "../../../dataservice/vehicleDocumentOcrApi";

const STEP_UPLOAD = "upload";
const STEP_REVIEW = "review";
const STEP_RESULT = "result";

const BulkDocumentUpload = ({ visible, onHide, onSaved }) => {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(STEP_UPLOAD);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState(new Set());
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  const resetState = useCallback(() => {
    setStep(STEP_UPLOAD);
    setFiles([]);
    setDragging(false);
    setExtractedItems([]);
    setSelectedTokens(new Set());
    setExtracting(false);
    setSaving(false);
    setSaveResult(null);
  }, []);

  const handleClose = () => {
    resetState();
    onHide();
  };

  const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const addFiles = useCallback((newFiles) => {
    const validFiles = Array.from(newFiles).filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        notify(`Skipped "${f.name}" — unsupported file type.`, "warning", 3000);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        notify(`Skipped "${f.name}" — exceeds 10MB limit.`, "warning", 3000);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name + f.size));
      const deduped = validFiles.filter((f) => !existingNames.has(f.name + f.size));
      return [...prev, ...deduped];
    });
  }, []);

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    // Reset so same files can be re-selected
    e.target.value = "";
  };

  const handleExtract = async () => {
    if (files.length === 0) {
      notify("Please select files first.", "warning", 3000);
      return;
    }
    if (files.length > 20) {
      notify("Maximum 20 files allowed per batch.", "warning", 3000);
      return;
    }
    setExtracting(true);
    try {
      const result = await bulkExtractDocumentData(files);
      if (result.isSuccess && result.data) {
        const items = result.data.map((item) => ({
          ...item,
          vehicleId: item.ocrResult?.matchedVehicleId || null,
          documentNumber: item.ocrResult?.certificateNumber || "",
          issuingAuthority: item.ocrResult?.issuedBy || "",
          issueDate: item.ocrResult?.commencingDate || "",
          expiryDate: item.ocrResult?.expiryDate || "",
          alertLeadDays: 30,
          notes: "",
        }));
        setExtractedItems(items);
        setSelectedTokens(new Set(items.map((i) => i.fileToken)));
        setStep(STEP_REVIEW);
        notify(`Extracted data from ${items.length} file(s).`, "success", 3000);
      } else {
        notify(result.message || "Extraction failed.", "error", 4000);
      }
    } catch (err) {
      notify(err?.response?.data?.message || "Bulk extraction failed.", "error", 4000);
    } finally {
      setExtracting(false);
    }
  };

  const toggleSelect = (token) => {
    setSelectedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(token)) next.delete(token);
      else next.add(token);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTokens.size === extractedItems.length) {
      setSelectedTokens(new Set());
    } else {
      setSelectedTokens(new Set(extractedItems.map((i) => i.fileToken)));
    }
  };

  const updateItem = (token, field, value) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item.fileToken === token ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async () => {
    const selected = extractedItems.filter((i) => selectedTokens.has(i.fileToken));
    if (selected.length === 0) {
      notify("Please select at least one document to save.", "warning", 3000);
      return;
    }
    const invalid = selected.filter((i) => !i.vehicleId);
    if (invalid.length > 0) {
      notify(`${invalid.length} selected document(s) have no vehicle assigned.`, "warning", 4000);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        documents: selected.map((item) => ({
          fileToken: item.fileToken,
          vehicleId: item.vehicleId,
          documentNumber: item.documentNumber,
          issueDate: item.issueDate,
          expiryDate: item.expiryDate,
          issuingAuthority: item.issuingAuthority,
          alertLeadDays: item.alertLeadDays || 30,
          notes: item.notes || "",
        })),
      };
      const result = await bulkSaveDocuments(payload);
      if (result.isSuccess && result.data) {
        setSaveResult(result.data);
        setStep(STEP_RESULT);
        if (result.data.successCount > 0 && onSaved) onSaved();
      } else {
        notify(result.message || "Save failed.", "error", 4000);
      }
    } catch (err) {
      notify(err?.response?.data?.message || "Bulk save failed.", "error", 4000);
    } finally {
      setSaving(false);
    }
  };

  const getConfidenceClass = (score) => {
    if (score >= 0.7) return "tw-text-green-600";
    if (score >= 0.4) return "tw-text-yellow-600";
    return "tw-text-red-600";
  };

  const renderUploadStep = () => (
    <div className="tw-p-6">
      <div className="tw-mb-4">
        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
          <i className="fa-light fa-cloud-arrow-up tw-text-lg" style={{ color: "#0078d4" }} />
          <h3 className="tw-text-base tw-font-semibold tw-text-gray-800">Select Document Files</h3>
        </div>
        <p className="tw-text-sm tw-text-gray-500">Upload up to 20 PDF or image files. OCR will extract insurance data and match vehicles automatically.</p>
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf,image/*"
        onChange={handleFileInputChange}
        style={{ display: "none" }}
      />

      {/* Drag-and-drop zone */}
      <div
        className="tw-border-2 tw-border-dashed tw-rounded-lg tw-p-8 tw-text-center tw-cursor-pointer tw-transition-colors"
        style={{
          borderColor: dragging ? "#0078d4" : "#c8c6c4",
          background: dragging ? "#e8f4fd" : "#faf9f8",
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <i className="fa-light fa-cloud-arrow-up tw-text-3xl tw-mb-2" style={{ color: dragging ? "#0078d4" : "#a19f9d" }} />
        <p className="tw-text-sm tw-font-semibold" style={{ color: "#201f1e" }}>
          {dragging ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="tw-text-xs tw-mt-1" style={{ color: "#605e5c" }}>
          or click to browse — PDF and images, max 10MB each
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="tw-mt-4">
          <div className="tw-text-sm tw-font-semibold tw-mb-2" style={{ color: "#201f1e" }}>
            <i className="fa-light fa-files tw-mr-1" /> {files.length} file(s) selected
          </div>
          <div className="tw-max-h-48 tw-overflow-y-auto tw-border tw-rounded" style={{ borderColor: "#edebe9" }}>
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${file.size}-${idx}`}
                className="tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2"
                style={{ borderBottom: idx < files.length - 1 ? "1px solid #edebe9" : "none", background: idx % 2 === 0 ? "#fff" : "#faf9f8" }}
              >
                <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
                  <i className={`fa-light ${file.type === "application/pdf" ? "fa-file-pdf tw-text-red-500" : "fa-file-image tw-text-blue-500"}`} />
                  <span className="tw-text-sm tw-truncate" style={{ color: "#201f1e" }}>{file.name}</span>
                  <span className="tw-text-xs" style={{ color: "#a19f9d" }}>({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
                <button
                  type="button"
                  className="tw-text-gray-400 hover:tw-text-red-500 tw-transition-colors tw-border-none tw-bg-transparent tw-cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  title="Remove file"
                >
                  <i className="fa-light fa-xmark" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t" style={{ borderColor: "#edebe9" }}>
        <button type="button" className="m365-btn m365-btn--ghost" onClick={handleClose}>Cancel</button>
        <button type="button" className="m365-btn m365-btn--primary" onClick={handleExtract} disabled={files.length === 0 || extracting}>
          <i className="fa-light fa-wand-magic-sparkles tw-mr-1" />
          {extracting ? "Extracting..." : "Extract & Match"}
        </button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="tw-p-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-clipboard-check tw-text-lg" style={{ color: "#0078d4" }} />
          <h3 className="tw-text-base tw-font-semibold tw-text-gray-800">Review Extracted Data</h3>
        </div>
        <span className="tw-text-sm tw-text-gray-500">
          {selectedTokens.size} of {extractedItems.length} selected
        </span>
      </div>

      <div className="tw-overflow-x-auto">
        <table className="tw-w-full tw-text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #edebe9", background: "#faf9f8" }}>
              <th className="tw-p-2 tw-text-left" style={{ width: "30px" }}>
                <input type="checkbox" checked={selectedTokens.size === extractedItems.length} onChange={toggleSelectAll} />
              </th>
              <th className="tw-p-2 tw-text-left tw-font-semibold" style={{ color: "#201f1e" }}>File</th>
              <th className="tw-p-2 tw-text-left tw-font-semibold" style={{ color: "#201f1e" }}>Vehicle</th>
              <th className="tw-p-2 tw-text-left tw-font-semibold" style={{ color: "#201f1e" }}>Cert No</th>
              <th className="tw-p-2 tw-text-left tw-font-semibold" style={{ color: "#201f1e" }}>Issue Date</th>
              <th className="tw-p-2 tw-text-left tw-font-semibold" style={{ color: "#201f1e" }}>Expiry Date</th>
              <th className="tw-p-2 tw-text-left tw-font-semibold" style={{ color: "#201f1e" }}>Issuer</th>
              <th className="tw-p-2 tw-text-left tw-font-semibold" style={{ color: "#201f1e" }}>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {extractedItems.map((item) => {
              const score = item.ocrResult?.confidenceScore || 0;
              const noMatch = !item.vehicleId;
              return (
                <tr
                  key={item.fileToken}
                  style={{
                    borderBottom: "1px solid #edebe9",
                    background: noMatch ? "#fff4ce" : "#fff",
                  }}
                >
                  <td className="tw-p-2">
                    <input type="checkbox" checked={selectedTokens.has(item.fileToken)} onChange={() => toggleSelect(item.fileToken)} />
                  </td>
                  <td className="tw-p-2 tw-truncate" style={{ maxWidth: "150px" }} title={item.fileName}>
                    <i className="fa-light fa-file-pdf tw-mr-1 tw-text-red-500" />
                    {item.fileName}
                  </td>
                  <td className="tw-p-2" style={{ minWidth: "200px" }}>
                    <VehicleSearchableSelector
                      value={item.vehicleId}
                      onValueChanged={(e) => updateItem(item.fileToken, "vehicleId", e.value)}
                      placeholder="Select vehicle..."
                      width="100%"
                    />
                  </td>
                  <td className="tw-p-2">
                    <input
                      type="text"
                      className="m365-input"
                      value={item.documentNumber}
                      onChange={(e) => updateItem(item.fileToken, "documentNumber", e.target.value)}
                      style={{ width: "130px" }}
                    />
                  </td>
                  <td className="tw-p-2">
                    <input
                      type="date"
                      className="m365-input m365-date"
                      value={item.issueDate}
                      onChange={(e) => updateItem(item.fileToken, "issueDate", e.target.value)}
                    />
                  </td>
                  <td className="tw-p-2">
                    <input
                      type="date"
                      className="m365-input m365-date"
                      value={item.expiryDate}
                      onChange={(e) => updateItem(item.fileToken, "expiryDate", e.target.value)}
                    />
                  </td>
                  <td className="tw-p-2">
                    <input
                      type="text"
                      className="m365-input"
                      value={item.issuingAuthority}
                      onChange={(e) => updateItem(item.fileToken, "issuingAuthority", e.target.value)}
                      style={{ width: "150px" }}
                    />
                  </td>
                  <td className="tw-p-2 tw-text-center">
                    <span className={`tw-font-semibold ${getConfidenceClass(score)}`}>
                      {Math.round(score * 100)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {extractedItems.some((i) => !i.vehicleId) && (
        <div className="tw-mt-3 tw-p-3 tw-rounded" style={{ background: "#fff4ce", border: "1px solid #ca5010" }}>
          <i className="fa-light fa-triangle-exclamation tw-mr-1" style={{ color: "#ca5010" }} />
          <span className="tw-text-sm" style={{ color: "#201f1e" }}>
            Some documents could not be matched to a vehicle. Please assign vehicles manually before saving.
          </span>
        </div>
      )}

      <div className="tw-flex tw-justify-between tw-mt-6 tw-pt-4 tw-border-t" style={{ borderColor: "#edebe9" }}>
        <button type="button" className="m365-btn m365-btn--ghost" onClick={() => { setStep(STEP_UPLOAD); setExtractedItems([]); }}>
          <i className="fa-light fa-arrow-left tw-mr-1" /> Back
        </button>
        <div className="tw-flex tw-gap-3">
          <button type="button" className="m365-btn m365-btn--ghost" onClick={handleClose}>Cancel</button>
          <button type="button" className="m365-btn m365-btn--primary" onClick={handleSave} disabled={selectedTokens.size === 0 || saving}>
            <i className="fa-light fa-floppy-disk tw-mr-1" />
            {saving ? "Saving..." : `Save ${selectedTokens.size} Document(s)`}
          </button>
        </div>
      </div>
    </div>
  );

  const renderResultStep = () => (
    <div className="tw-p-6 tw-text-center">
      <div className="tw-mb-4">
        {saveResult?.failedCount === 0 ? (
          <i className="fa-light fa-circle-check tw-text-4xl" style={{ color: "#107c10" }} />
        ) : (
          <i className="fa-light fa-triangle-exclamation tw-text-4xl" style={{ color: "#ca5010" }} />
        )}
      </div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-2" style={{ color: "#201f1e" }}>
        Bulk Upload Complete
      </h3>
      <div className="tw-flex tw-justify-center tw-gap-6 tw-mb-4">
        <div>
          <span className="tw-text-2xl tw-font-bold" style={{ color: "#107c10" }}>{saveResult?.successCount || 0}</span>
          <p className="tw-text-sm" style={{ color: "#605e5c" }}>Saved</p>
        </div>
        <div>
          <span className="tw-text-2xl tw-font-bold" style={{ color: "#d13438" }}>{saveResult?.failedCount || 0}</span>
          <p className="tw-text-sm" style={{ color: "#605e5c" }}>Failed</p>
        </div>
        <div>
          <span className="tw-text-2xl tw-font-bold" style={{ color: "#201f1e" }}>{saveResult?.totalCount || 0}</span>
          <p className="tw-text-sm" style={{ color: "#605e5c" }}>Total</p>
        </div>
      </div>

      {saveResult?.errors?.length > 0 && (
        <div className="tw-text-left tw-mt-4 tw-p-3 tw-rounded" style={{ background: "#fde7e9", border: "1px solid #d13438" }}>
          <p className="tw-font-semibold tw-text-sm tw-mb-1" style={{ color: "#d13438" }}>Errors:</p>
          <ul className="tw-text-sm tw-list-disc tw-pl-5" style={{ color: "#201f1e" }}>
            {saveResult.errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="tw-flex tw-justify-center tw-mt-6 tw-pt-4 tw-border-t" style={{ borderColor: "#edebe9" }}>
        <button type="button" className="m365-btn m365-btn--primary" onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  );

  return (
    <SlidePanel
      open={visible}
      onClose={handleClose}
      title="Bulk Document Upload"
      width={1500}
      panelClassName="vehicle-documents-bulk-upload-panel"
    >
        <div style={{ display: step === STEP_UPLOAD ? "block" : "none" }}>
          {renderUploadStep()}
        </div>
        <div style={{ display: step === STEP_REVIEW ? "block" : "none" }}>
          {extractedItems.length > 0 && renderReviewStep()}
        </div>
        <div style={{ display: step === STEP_RESULT ? "block" : "none" }}>
          {saveResult && renderResultStep()}
        </div>
    </SlidePanel>
  );
};

export default BulkDocumentUpload;
