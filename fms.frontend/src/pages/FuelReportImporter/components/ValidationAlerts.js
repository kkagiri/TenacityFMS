import React from "react";
import { Alert } from "react-bootstrap";

const ValidationAlerts = ({
  validationErrors,
  fuelReportLoading,
  showDuplicateErrors,
}) => {
  return (
    <>
      {validationErrors.length > 0 && !fuelReportLoading && (
        <Alert
          variant="warning"
          className="tw-mb-6 tw-bg-amber-50 tw-border-amber-200 tw-text-amber-800 tw-border-l-4 tw-border-l-amber-500"
        >
          <div className="tw-flex tw-items-start">
            <div className="tw-mr-3 tw-text-amber-600 tw-text-xl">
              <i className="fa-light fa-triangle-exclamation" />
            </div>
            <div>
              <div className="tw-font-bold tw-mb-1 tw-text-amber-800">
                Validation Issues Detected
              </div>
              <div className="tw-text-amber-700">
                {validationErrors.length}{" "}
                {validationErrors.length === 1
                  ? "issue requires"
                  : "issues require"}{" "}
                attention. Review the highlighted rows/cells.
              </div>
            </div>
          </div>
        </Alert>
      )}

      {showDuplicateErrors &&
        validationErrors.some((err) => err.isDuplicate) && (
          <Alert
            variant="danger"
            className="tw-mb-6 tw-bg-rose-50 tw-border-rose-200 tw-text-rose-800 tw-border-l-4 tw-border-l-rose-500"
          >
            <div className="tw-flex tw-items-start">
              <div className="tw-mr-3 tw-text-rose-600 tw-text-xl">
                <i className="fa-light fa-copy" />
              </div>
              <div>
                <div className="tw-font-bold tw-mb-1 tw-text-rose-800">
                  Duplicate Records Detected
                </div>
                <div className="tw-text-rose-700">
                  Some vehicle records already exist for the specified dates and
                  shifts. The highlighted rows cannot be imported as they would
                  create duplicates.
                </div>
              </div>
            </div>
          </Alert>
        )}
    </>
  );
};

export default ValidationAlerts;
