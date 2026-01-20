/**
 * File: ReportDesignerRedirect.js
 * Purpose: Redirects to the standalone ASP.NET Core Report Designer application
 * Dependencies: react
 * Last Modified: 2026-01-19
 *
 * The DevExpress Report Designer runs in a separate ASP.NET Core application (FMS.Reports)
 * at https://localhost:7020 for proper Knockout.js integration.
 */
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const REPORT_DESIGNER_URL = "http://localhost:5207/designer";

const ReportDesignerRedirect = () => {
  const { reportName } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if report designer server is available
    const checkServer = async () => {
      try {
        const response = await fetch(REPORT_DESIGNER_URL, { mode: "no-cors" });
        setIsLoading(false);
      } catch (error) {
        console.warn("Report Designer server may not be running:", error);
        setIsLoading(false);
      }
    };
    checkServer();
  }, []);

  const designerUrl = reportName
    ? `${REPORT_DESIGNER_URL}/${reportName}`
    : REPORT_DESIGNER_URL;

  const handleOpenInNewTab = () => {
    window.open(designerUrl, "_blank");
  };

  return (
    <div className="tw-flex tw-flex-col tw-h-full tw-bg-gray-100">
      {/* Header with action buttons */}
      <div className="tw-bg-white tw-border-b tw-border-gray-200 tw-px-6 tw-py-4 tw-flex tw-items-center tw-justify-between">
        <div>
          <h1 className="tw-text-xl tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-file-chart-column tw-mr-2"></i>
            Report Designer
          </h1>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
            {reportName ? `Editing: ${reportName}` : "Create a new report"}
          </p>
        </div>
        <button
          onClick={handleOpenInNewTab}
          className="tw-bg-blue-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-flex tw-items-center tw-gap-2 hover:tw-bg-blue-600 tw-transition-colors"
        >
          <i className="fa-light fa-external-link"></i>
          Open in New Tab
        </button>
      </div>

      {/* Iframe container */}
      <div className="tw-flex-1 tw-relative">
        {isLoading && (
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-white tw-z-10">
            <div className="tw-text-center">
              <i className="fa-light fa-spinner-third tw-animate-spin tw-text-4xl tw-text-blue-500 tw-mb-4"></i>
              <p className="tw-text-gray-600">Loading Report Designer...</p>
            </div>
          </div>
        )}
        <iframe
          src={designerUrl}
          title="Report Designer"
          className="tw-w-full tw-h-full tw-border-0"
          onLoad={() => setIsLoading(false)}
          allow="clipboard-read; clipboard-write"
        />
      </div>

      {/* Fallback message */}
      <div className="tw-bg-yellow-50 tw-border-t tw-border-yellow-200 tw-px-6 tw-py-3">
        <p className="tw-text-sm tw-text-yellow-800">
          <i className="fa-light fa-info-circle tw-mr-2"></i>
          If the designer doesn't load, ensure the FMS.Reports application is running at{" "}
          <a
            href={REPORT_DESIGNER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-underline tw-font-medium"
          >
            {REPORT_DESIGNER_URL}
          </a>
        </p>
      </div>
    </div>
  );
};

export default ReportDesignerRedirect;
