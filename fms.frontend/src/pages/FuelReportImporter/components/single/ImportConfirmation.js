import React from "react";
import { Form } from "react-bootstrap";

const ImportConfirmation = ({
  duplicateHandling,
  setDuplicateHandling,
  clearAfterImport,
  setClearAfterImport,
  setShowImportConfirmation,
  handleSubmitData,
  fuelReportLoading,
}) => {
  return (
    <div className="tw-p-6" style={{ fontFamily: '"Segoe UI", -apple-system, system-ui, sans-serif' }}>
      <p className="tw-mb-4 tw-text-sm" style={{ color: "#323130" }}>
        Please confirm your import settings:
      </p>

      <div className="tw-mb-4">
        <h6 className="tw-font-medium tw-mb-2">Duplicate Record Handling:</h6>
        <div className="tw-flex tw-flex-col tw-gap-2">
          <Form.Check
            type="radio"
            id="duplicate-fail"
            name="duplicateHandling"
            label="Stop on duplicates (default)"
            checked={duplicateHandling === "fail"}
            onChange={() => setDuplicateHandling("fail")}
            className="tw-text-sm"
          />
          <Form.Check
            type="radio"
            id="duplicate-skip"
            name="duplicateHandling"
            label="Skip duplicate records (continue import for non-duplicates)"
            checked={duplicateHandling === "skip"}
            onChange={() => setDuplicateHandling("skip")}
            className="tw-text-sm"
          />
          <Form.Check
            type="radio"
            id="duplicate-overwrite"
            name="duplicateHandling"
            label="Overwrite existing records (replace duplicates)"
            checked={duplicateHandling === "overwrite"}
            onChange={() => setDuplicateHandling("overwrite")}
            className="tw-text-sm"
          />
        </div>
      </div>

      <div className="tw-mb-4">
        <Form.Check
          type="checkbox"
          id="clear-after-import"
          label="Clear data preview after successful import"
          checked={clearAfterImport}
          onChange={(e) => setClearAfterImport(e.target.checked)}
          className="tw-text-sm"
        />
      </div>

      <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6 tw-pt-4" style={{ borderTop: "1px solid #edebe9" }}>
        <button
          className="tw-rounded tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-cursor-pointer tw-border"
          style={{ background: "#fff", borderColor: "#8a8886", color: "#323130" }}
          onClick={() => setShowImportConfirmation(false)}
        >
          Cancel
        </button>
        <button
          className="tw-rounded tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-cursor-pointer tw-border-0 tw-flex tw-items-center tw-gap-1.5"
          style={{
            background: fuelReportLoading ? "#c8c6c4" : "#0078d4",
            color: "#fff",
            cursor: fuelReportLoading ? "not-allowed" : "pointer",
          }}
          onClick={handleSubmitData}
          disabled={fuelReportLoading}
        >
          <i className="fa-light fa-check"></i>
          Confirm Import
        </button>
      </div>
    </div>
  );
};

export default ImportConfirmation;
