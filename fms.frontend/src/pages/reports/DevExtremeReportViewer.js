import React, { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ko from "knockout";
import "devexpress-reporting/dx-webdocumentviewer";
import { getResolvedApiBaseUrlSync, resolveApiBaseUrl } from "../../api/axiosInstance";

// Import DevExtreme Report Viewer styles
import "../../reportDesignerStyles.css";

const DevExtremeReportViewer = () => {
  const { reportName } = useParams();
  const navigate = useNavigate();
  const viewerRef = useRef(null);
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
    if (!reportName) {
      navigate("/reports/gallery");
      return;
    }

    // Wait for serverOrigin to be resolved
    if (!serverOrigin) {
      return;
    }

    if (viewerRef.current && !koApplied.current) {
      const viewerOptions = {
        reportUrl: ko.observable(reportName),
        requestOptions: {
          // Host is the server origin only
          host: serverOrigin,
          // invokeAction uses DevExpress default route
          invokeAction: "/DXXRDV/Invoke",
        },
        callbacks: {
          BeforeRender: (s, e) => {
            // Add authorization header to all requests
            e.args.RequestOptions.headers = {
              Authorization: getAuthToken(),
            };
          },
          CustomizeExportOptions: (s, e) => {
            // Customize export options if needed
          },
          OnServerError: (s, e) => {
            console.error("Report Viewer Error:", e);
            // Handle unauthorized errors
            if (e.Error?.status === 401) {
              navigate("/login");
            }
          },
        },
        // Enable zoom and search
        zoom: 1,
        zoomStep: 0.1,
        rtl: false,
      };

      try {
        ko.applyBindings(viewerOptions, viewerRef.current);
        koApplied.current = true;
      } catch (error) {
        console.error("Error applying Knockout bindings:", error);
      }
    }

    // Cleanup function
    return () => {
      if (viewerRef.current && koApplied.current) {
        try {
          ko.cleanNode(viewerRef.current);
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

  if (!reportName) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
        <div className="tw-text-center">
          <i className="fa-light fa-file-chart-column tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
          <p className="tw-text-gray-600">No report selected</p>
          <button
            onClick={handleBackClick}
            className="tw-mt-4 tw-px-4 tw-py-2 tw-bg-blue-500 tw-text-white tw-rounded hover:tw-bg-blue-600"
          >
            <i className="fa-light fa-arrow-left tw-mr-2"></i>
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

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
            <i className="fa-light fa-file-chart-column tw-mr-2"></i>
            Report Viewer
          </h1>
          <span className="tw-ml-4 tw-text-sm tw-text-gray-500">
            {decodeURIComponent(reportName)}
          </span>
        </div>
      </div>

      {/* Report Viewer Container */}
      <div className="tw-flex-1 tw-overflow-hidden report-designer-container">
        <div
          ref={viewerRef}
          data-bind="dxReportViewer: $data"
          style={{ width: "100%", height: "100%" }}
        ></div>
      </div>
    </div>
  );
};

export default DevExtremeReportViewer;
