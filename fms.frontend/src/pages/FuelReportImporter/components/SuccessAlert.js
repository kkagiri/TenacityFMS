import React, { useEffect } from "react";
import { Alert } from "react-bootstrap";

const SuccessAlert = ({ importSuccessInfo, setImportSuccessInfo }) => {
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (importSuccessInfo) {
      const timer = setTimeout(() => {
        setImportSuccessInfo(null);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [importSuccessInfo, setImportSuccessInfo]);

  if (!importSuccessInfo) return null;

  return (
    <Alert
      variant="success"
      onClose={() => setImportSuccessInfo(null)}
      dismissible
      className="tw-mb-6 tw-mt-4 tw-bg-green-50 tw-border-green-200 tw-text-green-800 tw-border-l-4 tw-border-l-green-500"
    >
      <div className="tw-flex tw-items-start">
        <div className="tw-mr-3 tw-text-green-600 tw-text-xl">
          <i className="fa-solid fa-circle-check" />
        </div>
        <div className="tw-flex-1">
          <div className="tw-font-bold tw-mb-1 tw-text-green-800 tw-text-lg">
            Import Successful
          </div>
          <div className="tw-text-green-700">
            <div className="tw-mb-2">{importSuccessInfo.message}</div>

            <div className="tw-bg-white tw-rounded-md tw-p-3 tw-border tw-border-green-200 tw-mb-2">
              <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1">
                <i className="fa-solid fa-file-invoice tw-text-green-600"></i>
                <span className="tw-font-medium tw-text-sm">
                  Report ID: {importSuccessInfo.reportId}
                </span>
              </div>

              {importSuccessInfo.consumptions &&
                importSuccessInfo.consumptions.length > 0 && (
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <i className="fa-solid fa-database tw-text-green-600"></i>
                    <span className="tw-text-sm">
                      Imported {importSuccessInfo.consumptions.length} records
                    </span>
                  </div>
                )}
            </div>

            <div className="tw-text-xs tw-mt-3 tw-text-green-600 tw-flex tw-items-center tw-justify-between">
              <span>
                <i className="fa-light fa-arrow-rotate-right tw-mr-1"></i>
                You can now import another file or view reports.
              </span>
              <span className="tw-italic">
                <i className="fa-light fa-clock tw-mr-1"></i>
                Auto-dismissing in 8s
              </span>
            </div>
          </div>
        </div>
      </div>
    </Alert>
  );
};

export default SuccessAlert;
