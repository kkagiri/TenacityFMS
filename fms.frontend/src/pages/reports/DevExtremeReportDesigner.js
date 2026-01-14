import React, { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ko from "knockout";
import "devexpress-reporting/dx-reportdesigner";
import { getResolvedApiBaseUrlSync, resolveApiBaseUrl } from "../../api/axiosInstance";

// Import DevExtreme Report Designer styles
import "../../reportDesignerStyles.css";

const DevExtremeReportDesigner = () => {
  const { reportName } = useParams();
  const navigate = useNavigate();
  const designerRef = useRef(null);
  const koApplied = useRef(false);
  const [serverOrigin, setServerOrigin] = useState(null);

  // Resolve the server origin from axios instance (same as rest of app)
  useEffect(() => {
    const resolveOrigin = async () => {
      await resolveApiBaseUrl();
      const baseUrl = getResolvedApiBaseUrlSync();
      // Extract origin from baseUrl (e.g., "http://localhost:7009/api/" -> "http://localhost:7009")
      if (baseUrl) {
        const url = new URL(baseUrl);
        setServerOrigin(url.origin);
      } else {
        // Fallback to window.location.origin
        setServerOrigin(window.location.origin);
      }
    };
    resolveOrigin();
  }, []);

  // Get auth token for DevExpress requests
  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? `Bearer ${token}` : "";
  }, []);

  useEffect(() => {
    // Wait for serverOrigin to be resolved
    if (!serverOrigin) {
      return;
    }

    if (designerRef.current && !koApplied.current) {
      const designerOptions = {
        // Report URL - empty for new report, or existing report name
        reportUrl: ko.observable(reportName || ""),

        // Request options
        // NOTE: We provide invokeAction fallbacks here to avoid DevExpress building
        // URLs like `${host}${undefined}` during preview/data-source operations.
        // The server-side GetDesignerModel still returns the authoritative model.
        requestOptions: {
          host: serverOrigin,
          invokeAction: "/DXXRD/Invoke",
          getDesignerModelAction: "/DXXRD/GetDesignerModel",
        },

        // Fallbacks for preview and query builder
        reportPreviewOptions: {
          requestOptions: {
            host: serverOrigin,
            invokeAction: "/DXXRDV/Invoke",
          },
        },
        queryBuilderOptions: {
          requestOptions: {
            host: serverOrigin,
            invokeAction: "/DXXQB/Invoke",
          },
        },

        // Callbacks
        callbacks: {
          BeforeRender: (s, e) => {
            // Add authorization header to all requests + ensure RequestOptions are valid
            if (e?.args?.RequestOptions) {
              const ro = e.args.RequestOptions;

              // Defensive defaults (prevents `${host}${undefined}` URL construction)
              if (!ro.host) ro.host = serverOrigin;
              if (!ro.invokeAction) ro.invokeAction = "/DXXRD/Invoke";

              ro.headers = {
                ...(ro.headers || {}),
                Authorization: getAuthToken(),
              };
            }
          },
          ReportSaved: (s, e) => {
            // Handle report saved event
            console.log("Report saved:", e.Url);
          },
          ReportOpened: (s, e) => {
            // Handle report opened event
            console.log("Report opened:", e.Url);
          },
          OnServerError: (s, e) => {
            console.error("Report Designer Error:", e);
            // Handle unauthorized errors
            if (e.Error?.status === 401) {
              navigate("/login");
            }
          },
          CustomizeWizard: (s, e) => {
            // Customize the report wizard if needed
          },
        },
      };

      try {
        ko.applyBindings(designerOptions, designerRef.current);
        koApplied.current = true;
      } catch (error) {
        console.error("Error applying Knockout bindings:", error);
      }
    }

    // Cleanup function
    return () => {
      if (designerRef.current && koApplied.current) {
        try {
          ko.cleanNode(designerRef.current);
          koApplied.current = false;
        } catch (error) {
          console.error("Error cleaning Knockout bindings:", error);
        }
      }
    };
  }, [reportName, navigate, serverOrigin, getAuthToken]);

  // Handle back navigation
  const handleBackClick = () => {
    navigate("/reports/gallery");
  };

  // Handle create new report
  const handleNewReport = () => {
    navigate("/reports/designer");
    // Force page reload to reset the designer
    window.location.reload();
  };

  return (
    <div className="tw-flex tw-flex-col tw-h-full">
      {/* Header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-bg-white tw-border-b tw-border-gray-200">
        <div className="tw-flex tw-items-center">
          <button
            onClick={handleBackClick}
            className="tw-mr-4 tw-p-2 tw-rounded hover:tw-bg-gray-100"
            title="Back to Gallery"
          >
            <i className="fa-light fa-arrow-left tw-text-gray-600"></i>
          </button>
          <h1 className="tw-text-xl tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-pen-ruler tw-mr-2"></i>
            Report Designer
          </h1>
          {reportName && (
            <span className="tw-ml-4 tw-text-sm tw-text-gray-500">
              Editing: {decodeURIComponent(reportName)}
            </span>
          )}
          {!reportName && (
            <span className="tw-ml-4 tw-text-sm tw-text-green-600 tw-font-medium">
              <i className="fa-light fa-sparkles tw-mr-1"></i>
              New Report
            </span>
          )}
        </div>
        <div className="tw-flex tw-items-center tw-space-x-2">
          <button
            onClick={handleNewReport}
            className="tw-px-4 tw-py-2 tw-bg-green-500 tw-text-white tw-rounded hover:tw-bg-green-600 tw-flex tw-items-center"
            title="Create New Report"
          >
            <i className="fa-light fa-plus tw-mr-2"></i>
            New Report
          </button>
        </div>
      </div>

      {/* Report Designer Container */}
      <div className="tw-flex-1 tw-overflow-hidden report-designer-container">
        <div
          ref={designerRef}
          data-bind="dxReportDesigner: $data"
          style={{ width: "100%", height: "100%" }}
        ></div>
      </div>
    </div>
  );
};

export default DevExtremeReportDesigner;
