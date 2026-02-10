import React, { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "devexpress-reporting/dx-webdocumentviewer";
import { DxReportViewer } from "devexpress-reporting/dx-webdocumentviewer";
import { getResolvedApiBaseUrlSync, resolveApiBaseUrl } from "../../api/axiosInstance";

// Import DevExtreme Report Viewer styles
import "../../reportDesignerStyles.css";
import "devexpress-reporting/dist/css/dx-webdocumentviewer.css";

const DevExtremeReportViewer = () => {
  const { reportName } = useParams();
  const navigate = useNavigate();
  const viewerRef = useRef(null);
  const viewerInstanceRef = useRef(null);
  const [serverOrigin, setServerOrigin] = useState(null);

  // Resolve the server origin from axios instance (same as rest of app)
  useEffect(() => {
    const resolveOrigin = async () => {
      try {
        await resolveApiBaseUrl();
      } catch {
        // Ignore base URL resolution failures; fall back below.
      }

      const baseUrl = getResolvedApiBaseUrlSync();

      // Extract origin from baseUrl.
      // Handles both absolute ("http://localhost:7009/api/") and relative ("/api/") base URLs.
      try {
        if (baseUrl) {
          const url = new URL(baseUrl, window.location.origin);
          setServerOrigin(url.origin);
          return;
        }
      } catch {
        // Fall back below.
      }

      setServerOrigin(window.location.origin);
    };
    resolveOrigin();
  }, []);

  // Get auth token for DevExpress requests
  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? `Bearer ${token}` : "";
  }, []);

  const decodedReportName = useMemo(() => {
    if (!reportName) return null;
    try {
      return decodeURIComponent(reportName);
    } catch {
      return reportName;
    }
  }, [reportName]);

  useEffect(() => {
    if (!decodedReportName) {
      navigate("/reports/gallery");
      return;
    }

    // Wait for serverOrigin to be resolved
    if (!serverOrigin) {
      return;
    }

    if (!viewerRef.current) return;

    // Dispose any previous instance (e.g., navigating between reports).
    if (viewerInstanceRef.current) {
      try {
        viewerInstanceRef.current.dispose();
      } catch {
        // Ignore disposal errors.
      }
      viewerInstanceRef.current = null;
    }

    const requestOptions = {
      host: serverOrigin,
      invokeAction: "/DXXRDV/Invoke",
      headers: {
        Authorization: getAuthToken(),
      },
    };

    try {
      const viewer = new DxReportViewer(viewerRef.current, {
        reportUrl: decodedReportName,
        requestOptions,
        callbacks: {
          OnServerError: (s, e) => {
            console.error("Report Viewer Error:", e);
            // Handle 401 unauthorized - redirect to login
            if (e.Error?.status === 401 || e.error?.status === 401) {
              navigate("/login");
            }
          },
        },
      });

      viewer.render();
      viewerInstanceRef.current = viewer;
    } catch (error) {
      console.error("Error initializing report viewer:", error);
    }

    // Cleanup function
    return () => {
      if (viewerInstanceRef.current) {
        try {
          viewerInstanceRef.current.dispose();
        } catch {
          // Ignore disposal errors.
        }
        viewerInstanceRef.current = null;
      }
    };
  }, [decodedReportName, navigate, serverOrigin, getAuthToken]);

  // Handle back navigation
  const handleBackClick = () => {
    navigate("/reports/gallery");
  };

  if (!decodedReportName) {
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
    <div
      className="tw-flex tw-flex-col"
      style={{ height: "100vh", maxHeight: "100vh", overflow: "hidden" }}
    >
      {/* Header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-bg-white tw-border-b tw-border-gray-200 tw-flex-shrink-0">
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
            {decodedReportName}
          </span>
        </div>
      </div>

      {/* Report Viewer Container - Must have explicit height for DevExpress */}
      <div
        className="report-designer-container"
        style={{
          flex: 1,
          height: "calc(100vh - 73px)",  /* Subtract header height */
          overflow: "hidden",
          position: "relative"
        }}
      >
        <div
          ref={viewerRef}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        ></div>
      </div>
    </div>
  );
};

export default DevExtremeReportViewer;
