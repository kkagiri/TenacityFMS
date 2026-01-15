import React, { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ko from "knockout";
import { DxReportDesigner } from "devexpress-reporting/dx-reportdesigner";
import { getResolvedApiBaseUrlSync, resolveApiBaseUrl } from "../../api/axiosInstance";

// Import DevExtreme Report Designer styles
import "../../reportDesignerStyles.css";

const DevExtremeReportDesigner = () => {
  const { reportName } = useParams();
  const navigate = useNavigate();
  const designerRef = useRef(null);
  const designerInstanceRef = useRef(null);
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

    if (designerRef.current && !designerInstanceRef.current) {
      console.log("Initializing Report Designer with host:", serverOrigin);

      const designerOptions = {
        // Report URL - empty for new report, or existing report name
        reportUrl: ko.observable(reportName || ""),

        // Request options - DevExpress will call getDesignerModelAction to fetch config
        requestOptions: {
          host: serverOrigin,
          invokeAction: "/DXXRD/Invoke",
          getDesignerModelAction: "/DXXRD/GetDesignerModel",
          headers: {
            Authorization: getAuthToken(),
          },
        },

        // Callbacks
        callbacks: {
          BeforeRender: (s, e) => {
            // Add authorization header to all requests
            if (e?.args?.RequestOptions) {
              const ro = e.args.RequestOptions;

              // Ensure host and invokeAction are set
              if (!ro.host) ro.host = serverOrigin;
              if (!ro.invokeAction) ro.invokeAction = "/DXXRD/Invoke";

              ro.headers = {
                ...(ro.headers || {}),
                Authorization: getAuthToken(),
              };
            }
          },
          ReportSaved: (s, e) => {
            console.log("Report saved:", e.Url);
          },
          ReportOpened: (s, e) => {
            console.log("Report opened:", e.Url);
          },
          OnServerError: (s, e) => {
            console.error("Report Designer Error:", e);
            if (e.Error?.status === 401) {
              navigate("/login");
            }
          },
        },
      };

      try {
        // Use DxReportDesigner class - this will call GetDesignerModel on the server
        const designer = new DxReportDesigner(designerRef.current, designerOptions);
        designer.render();
        designerInstanceRef.current = designer;
        console.log("Report Designer initialized successfully");
      } catch (error) {
        console.error("Error initializing Report Designer:", error);
      }
    }

    // Cleanup function
    return () => {
      if (designerInstanceRef.current) {
        try {
          designerInstanceRef.current.dispose();
          designerInstanceRef.current = null;
          console.log("Report Designer disposed");
        } catch (error) {
          console.error("Error disposing Report Designer:", error);
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
          style={{ width: "100%", height: "100%" }}
        ></div>
      </div>
    </div>
  );
};

export default DevExtremeReportDesigner;
