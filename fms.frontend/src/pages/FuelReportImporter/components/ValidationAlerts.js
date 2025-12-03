import React, { useEffect } from "react";
import { Alert } from "react-bootstrap";

const ValidationAlerts = ({
  validationErrors,
  fuelReportLoading,
  showDuplicateErrors,
  onDismissValidation,
  onDismissDuplicate,
  onFilterBackendErrors,
  onGoToRow,
}) => {
  // Separate backend errors from frontend validation errors
  const backendErrors = validationErrors.filter(err => err.isBackendError);
  const frontendErrors = validationErrors.filter(err => !err.isBackendError && !err.isDuplicate);

  // Auto-dismiss validation alert after 10 seconds (longer for backend errors)
  useEffect(() => {
    if (frontendErrors.length > 0 && !fuelReportLoading && onDismissValidation && backendErrors.length === 0) {
      const timer = setTimeout(() => {
        onDismissValidation();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [frontendErrors.length, backendErrors.length, fuelReportLoading, onDismissValidation]);

  return (
    <>
      {/* Backend Validation Errors - More prominent, don't auto-dismiss */}
      {backendErrors.length > 0 && !fuelReportLoading && (
        <Alert
          variant="danger"
          dismissible
          onClose={onDismissValidation}
          className="tw-mb-6 tw-bg-red-50 tw-border-red-200 tw-text-red-800 tw-border-l-4 tw-border-l-red-500"
        >
          <div className="tw-flex tw-items-start">
            <div className="tw-mr-3 tw-text-red-600 tw-text-xl">
              <i className="fa-light fa-server" />
            </div>
            <div className="tw-flex-1">
              <div className="tw-font-bold tw-mb-1 tw-text-red-800">
                <i className="fa-light fa-triangle-exclamation tw-mr-1"></i>
                Import Failed - Server Validation Errors
              </div>
              <div className="tw-text-red-700 tw-mb-2">
                {backendErrors.length} row(s) failed server-side validation. Please fix and try again.
              </div>

              {/* List of failed rows */}
              <div className="tw-bg-red-100 tw-rounded tw-p-2 tw-mb-2 tw-max-h-40 tw-overflow-y-auto">
                {backendErrors.slice(0, 10).map((err, idx) => (
                  <div
                    key={idx}
                    className="tw-text-sm tw-text-red-700 tw-py-1 tw-border-b tw-border-red-200 last:tw-border-0 tw-flex tw-justify-between tw-items-center"
                  >
                    <div className="tw-flex-1">
                      {err.rowIndex >= 0 ? (
                        <span className="tw-font-medium">Row {err.rowIndex + 1}</span>
                      ) : (
                        <span className="tw-font-medium tw-text-red-500">Row (unknown)</span>
                      )}
                      {err.vehicleName && <span className="tw-mx-1">•</span>}
                      {err.vehicleName && <span>{err.vehicleName}</span>}
                      {err.date && <span className="tw-mx-1">•</span>}
                      {err.date && <span>{new Date(err.date).toLocaleDateString()}</span>}
                      <div className="tw-text-xs tw-text-red-600 tw-mt-0.5">{err.message}</div>
                    </div>
                    {onGoToRow && err.rowIndex >= 0 && (
                      <button
                        onClick={() => onGoToRow(err.rowIndex)}
                        className="tw-ml-2 tw-px-2 tw-py-1 tw-bg-red-200 tw-text-red-800 tw-rounded tw-text-xs tw-font-medium hover:tw-bg-red-300 tw-border-0 tw-cursor-pointer"
                        title="Go to this row"
                      >
                        <i className="fa-light fa-arrow-right"></i> Go
                      </button>
                    )}
                  </div>
                ))}
                {backendErrors.length > 10 && (
                  <div className="tw-text-xs tw-text-red-600 tw-mt-1">
                    ...and {backendErrors.length - 10} more errors
                  </div>
                )}
              </div>

              {onFilterBackendErrors && (
                <button
                  onClick={onFilterBackendErrors}
                  className="tw-px-3 tw-py-1.5 tw-bg-red-600 tw-text-white tw-rounded tw-text-sm tw-font-medium hover:tw-bg-red-700 tw-border-0 tw-cursor-pointer tw-mr-2"
                >
                  <i className="fa-light fa-filter tw-mr-1"></i>
                  Filter to Error Rows Only
                </button>
              )}

              <div className="tw-text-xs tw-text-red-600 tw-mt-2">
                <i className="fa-light fa-info-circle tw-mr-1"></i>
                Click on any cell in the highlighted rows to edit. All rows are now editable.
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Frontend Validation Errors */}
      {frontendErrors.length > 0 && !fuelReportLoading && (
        <Alert
          variant="warning"
          dismissible
          onClose={onDismissValidation}
          className="tw-mb-6 tw-bg-amber-50 tw-border-amber-200 tw-text-amber-800 tw-border-l-4 tw-border-l-amber-500"
        >
          <div className="tw-flex tw-items-start">
            <div className="tw-mr-3 tw-text-amber-600 tw-text-xl">
              <i className="fa-light fa-triangle-exclamation" />
            </div>
            <div className="tw-flex-1">
              <div className="tw-font-bold tw-mb-1 tw-text-amber-800">
                Validation Issues Detected
              </div>
              <div className="tw-text-amber-700 tw-mb-2">
                {frontendErrors.length}{" "}
                {frontendErrors.length === 1
                  ? "issue requires"
                  : "issues require"}{" "}
                attention.
              </div>
              <div className="tw-text-sm tw-text-amber-700 tw-bg-amber-100 tw-rounded tw-p-2 tw-mb-2">
                <i className="fa-light fa-lightbulb tw-mr-1"></i>
                <strong>How to fix:</strong> Click directly on the highlighted cell to edit, or use the Status column buttons.
              </div>
              <div className="tw-text-xs tw-text-amber-600">
                <i className="fa-light fa-clock tw-mr-1"></i>
                This alert will auto-dismiss in 10 seconds
              </div>
            </div>
          </div>
        </Alert>
      )}

      {validationErrors.some((err) => err.isDuplicate) && (
          <Alert
            variant="danger"
            dismissible
            onClose={onDismissDuplicate}
            className="tw-mb-6 tw-bg-rose-50 tw-border-rose-200 tw-text-rose-800 tw-border-l-4 tw-border-l-rose-500"
          >
            <div className="tw-flex tw-items-start">
              <div className="tw-mr-3 tw-text-rose-600 tw-text-xl">
                <i className="fa-light fa-copy" />
              </div>
              <div className="tw-flex-1">
                <div className="tw-font-bold tw-mb-1 tw-text-rose-800">
                  Duplicate Records Detected
                </div>
                <div className="tw-text-rose-700 tw-mb-2">
                  {validationErrors.filter(err => err.isDuplicate).length} duplicate record(s) found -
                  same vehicle and date with same shift setting.
                </div>
                <div className="tw-text-sm tw-text-rose-700 tw-bg-rose-100 tw-rounded tw-p-2 tw-mb-2">
                  <i className="fa-light fa-lightbulb tw-mr-1"></i>
                  <strong>How to fix:</strong>
                  <ol className="tw-ml-4 tw-mt-1 tw-mb-0 tw-list-decimal">
                    <li>Look at the <strong>Status</strong> column - it shows which rows are duplicates of each other</li>
                    <li>In the <strong>Night Shift</strong> column, click the <span className="tw-bg-rose-200 tw-px-1 tw-rounded tw-font-medium">→ Night</span> or <span className="tw-bg-rose-200 tw-px-1 tw-rounded tw-font-medium">→ Day</span> button to toggle</li>
                    <li>Set one row as <strong>Day</strong> shift and the other as <strong>Night</strong> shift</li>
                  </ol>
                </div>
                <div className="tw-text-xs tw-text-rose-600">
                  <i className="fa-light fa-info-circle tw-mr-1"></i>
                  Changes are saved automatically when you toggle the shift
                </div>
              </div>
            </div>
          </Alert>
        )}
    </>
  );
};

export default ValidationAlerts;
