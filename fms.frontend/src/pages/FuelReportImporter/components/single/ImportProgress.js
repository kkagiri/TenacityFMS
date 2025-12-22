import React from "react";
import { ProgressBar } from "react-bootstrap";
import Button from "devextreme-react/button";

const ImportProgress = ({
  importProgress,
  setHideProgressPanel,
  handleRetryWithoutDuplicates,
  handleRetryWithOverwrite,
  fuelReportLoading,
}) => {
  return (
    <div className="tw-mb-6 tw-mt-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-relative">
      <button
        className="tw-absolute tw-top-2 tw-right-2 tw-text-blue-500 hover:tw-text-blue-700 tw-bg-transparent tw-border-none tw-cursor-pointer"
        onClick={() => setHideProgressPanel(true)}
        title="Close panel"
      >
        <i className="fa-solid fa-times"></i>
      </button>
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
        <h6 className="tw-font-medium tw-text-blue-800 tw-flex tw-items-center">
          <i
            className={`fa-solid ${
              importProgress.status.includes("Failed")
                ? "fa-circle-exclamation"
                : importProgress.status === "Completed"
                ? "fa-check-circle"
                : "fa-spinner fa-spin"
            } tw-mr-2`}
          ></i>
          Import Progress: {importProgress.status}
        </h6>
        <span
          className={`import-status-badge ${
            importProgress.status.includes("Failed")
              ? "import-status-failed"
              : importProgress.status === "Completed"
              ? "import-status-completed"
              : importProgress.status === "Saving"
              ? "import-status-saving"
              : importProgress.status === "Validating"
              ? "import-status-validating"
              : "import-status-processing"
          }`}
        >
          {importProgress.percentage.toFixed(1)}%
        </span>
      </div>

      <div className="tw-progress-container">
        <ProgressBar
          now={importProgress.percentage}
          variant={
            importProgress.status.includes("Failed")
              ? "danger"
              : importProgress.status === "Completed"
              ? "success"
              : "primary"
          }
          className={
            importProgress.status.includes("Failed") ||
            importProgress.status === "Completed"
              ? ""
              : "progress-bar-animated"
          }
        />
      </div>

      <div className="tw-flex tw-justify-between tw-items-center tw-text-sm tw-mt-2">
        <div className="tw-flex tw-items-center tw-text-blue-600">
          <i className="fa-solid fa-file-import tw-text-blue-500 tw-mr-1"></i>
          {importProgress.status.includes("Failed") &&
          importProgress.status.includes("Duplicate")
            ? `${
                importProgress.processedRecords - importProgress.failureCount
              } of ${importProgress.totalRecords} records processed`
            : `${importProgress.processedRecords} of ${importProgress.totalRecords} records processed`}
          {importProgress.failureCount > 0 &&
            (importProgress.status.includes("Failed") ||
              importProgress.status === "Completed") && (
              <span
                className={`tw-ml-2 ${
                  importProgress.status.includes("Failed")
                    ? "tw-text-rose-600"
                    : "tw-text-amber-600"
                }`}
              >
                ({importProgress.failureCount}{" "}
                {importProgress.status.includes("Duplicate")
                  ? "duplicates"
                  : "failed"}
                )
              </span>
            )}
        </div>
        <div>
          {importProgress.status === "Validating" && (
            <span className="tw-text-blue-600">
              <i className="fa-solid fa-check-circle tw-mr-1"></i>
              Validating data...
            </span>
          )}
          {importProgress.status === "Checking Duplicates" && (
            <span className="tw-text-blue-600">
              <i className="fa-solid fa-search tw-mr-1"></i>
              Checking for duplicates...
            </span>
          )}
          {importProgress.status === "Processing" && (
            <span className="tw-text-blue-600">
              <i className="fa-solid fa-cogs tw-mr-1"></i>
              Processing records...
            </span>
          )}
          {importProgress.status === "Saving" && (
            <span className="tw-text-teal-600">
              <i className="fa-solid fa-database tw-mr-1"></i>
              Saving to database...
            </span>
          )}
          {importProgress.status === "Completed" && (
            <span className="tw-text-green-600">
              <i className="fa-solid fa-check-circle tw-mr-1"></i>
              Import completed successfully
            </span>
          )}
          {importProgress.status.includes("Failed") && (
            <span className="tw-text-red-600">
              <i className="fa-solid fa-exclamation-circle tw-mr-1"></i>
              {importProgress.status}
            </span>
          )}
        </div>
      </div>

      {importProgress.status.includes("Failed") &&
        importProgress.status.includes("Duplicate") && (
          <div className="tw-mt-3 tw-flex tw-justify-end tw-gap-2">
            <Button
              stylingMode="outlined"
              type="danger"
              text={
                fuelReportLoading &&
                importProgress.status.includes("without duplicates")
                  ? "Excluding duplicates..."
                  : "Retry excluding duplicates"
              }
              icon={
                fuelReportLoading &&
                importProgress.status.includes("without duplicates")
                  ? ""
                  : "filter"
              }
              onClick={handleRetryWithoutDuplicates}
              disabled={fuelReportLoading}
            />
            <Button
              stylingMode="outlined"
              type="default"
              text={
                fuelReportLoading &&
                importProgress.status.includes("with overwrite")
                  ? "Replacing records..."
                  : "Replace existing records"
              }
              icon={
                fuelReportLoading &&
                importProgress.status.includes("with overwrite")
                  ? ""
                  : "refresh"
              }
              onClick={handleRetryWithOverwrite}
              disabled={fuelReportLoading}
            />
          </div>
        )}
    </div>
  );
};

export default ImportProgress;
