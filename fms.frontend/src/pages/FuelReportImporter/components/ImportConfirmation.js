import React from "react";
import { Form } from "react-bootstrap";
import Button from "devextreme-react/button"; //Cursor

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
    <div className="tw-p-4">
      <p className="tw-mb-4 tw-text-gray-700">
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

      <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-4">
        <Button
          stylingMode="outlined"
          type="normal"
          text="Cancel"
          icon="close"
          onClick={() => setShowImportConfirmation(false)}
        />
        <Button
          stylingMode="contained"
          type="default"
          text="Confirm Import"
          icon="check"
          onClick={handleSubmitData}
          disabled={fuelReportLoading}
          elementAttr={{
            class: "tw-bg-blue-600 hover:tw-bg-blue-700",
          }}
        />
      </div>
    </div>
  );
};

export default ImportConfirmation;
