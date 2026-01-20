/**
 * File: DevExtremeReportDesigner.js
 * Purpose: Hosts the DevExpress Report Designer and initializes its client-side model/bindings.
 * Dependencies: react, react-router-dom, knockout, devexpress-reporting, axiosInstance
 * Last Modified: 2026-01-19
 *
 * Key Functions/Components:
 * - DevExtremeReportDesigner: Initializes and renders the report designer UI.
 */
import React, { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ko from "knockout";

// MUST be imported first - exposes DevExtreme globally for reporting bundle
import "./devextreme-global-setup";

// Import analytics core (depends on DevExpress global)
import "./analytics-core-setup";

// DevExpress reporting designer bundle (registers templates/bindings)
import "devexpress-reporting/dist/js/dx-reportdesigner";

// Import DevExpress Report Designer class from the bundled module
import { DxReportDesigner } from "devexpress-reporting/dist/js/dx-reportdesigner";

import { getResolvedApiBaseUrlSync, resolveApiBaseUrl } from "../../api/axiosInstance";

// Import DevExtreme Report Designer styles
import "../../reportDesignerStyles.css";

const DevExtremeReportDesigner = () => {
  const { reportName } = useParams();
  const navigate = useNavigate();
  const designerRef = useRef(null);
  const designerInstanceRef = useRef(null);
  const bindingPatchedRef = useRef(false);
  const [serverOrigin, setServerOrigin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resolve the server origin from axios instance (same as rest of app)
  useEffect(() => {
    let mounted = true;
    const resolveOrigin = async () => {
      try {
        await resolveApiBaseUrl();
      } catch (e) {
        console.warn("Could not resolve API base URL:", e);
      }
      if (!mounted) return;

      const baseUrl = getResolvedApiBaseUrlSync();
      if (baseUrl) {
        try {
          const url = new URL(baseUrl, window.location.origin);
          setServerOrigin(url.origin);
        } catch (e) {
          console.warn("Could not parse URL:", e);
          setServerOrigin(window.location.origin);
        }
      } else {
        setServerOrigin(window.location.origin);
      }
    };
    resolveOrigin();

    return () => { mounted = false; };
  }, []);

  // Get auth token for DevExpress requests
  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? `Bearer ${token}` : "";
  }, []);

  // Initialize the designer when serverOrigin is ready
  useEffect(() => {
    if (!serverOrigin || !designerRef.current) {
      return;
    }

    // Prevent double initialization
    if (designerInstanceRef.current) {
      return;
    }

    const initDesigner = async () => {
      console.log("Initializing Report Designer...");
      setLoading(true);

      try {
        const authHeaders = { Authorization: getAuthToken() };

        // Fetch the designer model from the server first
        const formData = new FormData();
        formData.append("reportUrl", reportName || "");

        const response = await fetch(`${serverOrigin}/DXXRD/GetDesignerModel`, {
          method: "POST",
          headers: authHeaders,
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to load designer model: ${response.status}`);
        }

        const designerModel = await response.json();
        console.log("Designer model fetched:", designerModel);

        // Add request options with auth headers to the model
        designerModel.requestOptions = {
          host: serverOrigin,
          invokeAction: "/DXXRD/Invoke",
          getDesignerModelAction: "/DXXRD/GetDesignerModel",
          headers: authHeaders
        };

        // Ensure reportUrl is a ko.observable
        designerModel.reportUrl = ko.observable(designerModel.reportUrl || reportName || "");

        // Add preview and query builder options
        designerModel.reportPreviewOptions = designerModel.reportPreviewOptions || {};
        designerModel.reportPreviewOptions.requestOptions = {
          host: serverOrigin,
          invokeAction: "/DXXRDV/Invoke",
          headers: authHeaders
        };

        designerModel.queryBuilderOptions = designerModel.queryBuilderOptions || {};
        designerModel.queryBuilderOptions.requestOptions = {
          host: serverOrigin,
          invokeAction: "/DXXQB/Invoke",
          headers: authHeaders
        };

        // Clear any existing knockout bindings and reset element
        ko.cleanNode(designerRef.current);
        designerRef.current.removeAttribute("data-bind");
        designerRef.current.innerHTML = "";

        console.log("Creating DxReportDesigner with model:", designerModel);
        console.log("dxReportDesigner handler exists:", !!ko.bindingHandlers.dxReportDesigner);

        if (!bindingPatchedRef.current && ko.bindingHandlers.dxReportDesigner?.init) {
          const originalInit = ko.bindingHandlers.dxReportDesigner.init;
          ko.bindingHandlers.dxReportDesigner.init = function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            try {
              const value = valueAccessor?.();
              console.log("dxReportDesigner init called", {
                element,
                value,
                allBindings,
                viewModel,
                bindingContext
              });
              const result = originalInit.apply(this, arguments);
              console.log("dxReportDesigner init result", result);
              return result;
            } catch (initError) {
              console.error("dxReportDesigner init error", initError);
              throw initError;
            }
          };
          bindingPatchedRef.current = true;
          console.log("dxReportDesigner init patched for diagnostics");
        }

        // Check if there's a nested designerModel property
        if (designerModel.designerModel) {
          console.log("designerModel.designerModel exists, type:", typeof designerModel.designerModel);
          if (typeof designerModel.designerModel === 'function') {
            console.log("designerModel.designerModel() result:", designerModel.designerModel());
          }
        }

        // Create the designer - this sets up the binding infrastructure
        const designer = new DxReportDesigner(designerRef.current, designerModel);
        designerInstanceRef.current = designer;

        console.log("DxReportDesigner instance created, calling render()...");
        console.log("Designer object:", designer);
        console.log("Designer methods:", Object.keys(Object.getPrototypeOf(designer) || {}));

        // render() may or may not apply bindings - we need to check
        try {
          designer.render();
          console.log("Designer render() completed");

          // Check what's bound to the element
          const boundData = ko.dataFor(designerRef.current);
          const bindingContext = ko.contextFor(designerRef.current);
          console.log("Bound data (ko.dataFor):", boundData);
          console.log("Binding context (ko.contextFor):", bindingContext);
          console.log("Binding context $data:", bindingContext?.$data);

          // Check if bindings were applied by render()
          const bindingsApplied = !!boundData;
          console.log("Bindings already applied by render():", bindingsApplied);

          // If render() didn't apply bindings, we need to do it
          if (!bindingsApplied) {
            console.log("Applying knockout bindings manually...");
            ko.applyBindings(designerModel, designerRef.current);
            console.log("Knockout bindings applied successfully");
          }
        } catch (renderError) {
          console.error("Error during render/applyBindings:", renderError);
          throw renderError;
        }

        // Check element state immediately after render
        console.log("After render - element innerHTML length:", designerRef.current?.innerHTML?.length);
        console.log("After render - element children:", designerRef.current?.children?.length);
        console.log("After render - element outerHTML:", designerRef.current?.outerHTML?.substring(0, 500));

        // Hide loading after designer renders
        setTimeout(() => {
          setLoading(false);
          console.log("Report Designer initialized successfully");
          // Check if the designer has content
          const hasContent = designerRef.current && designerRef.current.innerHTML.length > 100;
          console.log("Designer has content:", hasContent, "innerHTML length:", designerRef.current?.innerHTML?.length);

          // Log the actual HTML for debugging
          if (!hasContent) {
            console.log("Designer innerHTML:", designerRef.current?.innerHTML);
            console.log("Designer element:", designerRef.current);
            console.log("Designer element classes:", designerRef.current?.className);
            console.log("Designer element attributes:", Array.from(designerRef.current?.attributes || []).map(a => `${a.name}=${a.value}`));
          }
        }, 2000);
      } catch (err) {
        console.error("Error initializing Report Designer:", err);
        setError(err.message || "Failed to initialize Report Designer");
        setLoading(false);
      }
    };

    initDesigner();

    // Cleanup function
    return () => {
      if (designerInstanceRef.current) {
        try {
          designerInstanceRef.current.dispose();
          console.log("Report Designer disposed");
        } catch (disposeErr) {
          console.error("Error disposing Report Designer:", disposeErr);
        }
        designerInstanceRef.current = null;
      }
      // Clean knockout bindings and reset the element
      if (designerRef.current) {
        try {
          ko.cleanNode(designerRef.current);
          // Remove data-bind attribute to ensure clean state for re-initialization
          designerRef.current.removeAttribute("data-bind");
          // Clear innerHTML to reset any rendered content
          designerRef.current.innerHTML = "";
          // Remove any classes added by DevExpress
          designerRef.current.className = "";
          console.log("Knockout bindings cleaned and element reset");
        } catch (e) {
          console.warn("Error cleaning up knockout bindings:", e);
        }
      }
    };
  }, [serverOrigin, reportName, getAuthToken]);

  // Handle back navigation
  const handleBackClick = () => {
    navigate("/reports/gallery");
  };

  // Handle create new report
  const handleNewReport = () => {
    navigate("/reports/designer");
    window.location.reload();
  };

  // Error state - show error page
  if (error) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-screen tw-bg-gray-50">
        <div className="tw-text-center tw-max-w-md">
          <i className="fa-light fa-exclamation-triangle tw-text-4xl tw-text-red-500 tw-mb-4"></i>
          <p className="tw-text-gray-800 tw-font-semibold tw-mb-2">Error Loading Designer</p>
          <p className="tw-text-gray-600 tw-text-sm tw-mb-4">{error}</p>
          <button
            onClick={handleBackClick}
            className="tw-px-4 tw-py-2 tw-bg-blue-500 tw-text-white tw-rounded hover:tw-bg-blue-600"
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

      {/* Report Designer Container - Must have explicit height for DevExpress */}
      <div
        className="report-designer-container"
        style={{
          flex: 1,
          height: "calc(100vh - 73px)",
          minHeight: "600px",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* Loading overlay */}
        {loading && (
          <div
            className="tw-absolute tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-white"
            style={{ zIndex: 9999 }}
          >
            <div className="tw-text-center">
              <i className="fa-light fa-spinner fa-spin tw-text-4xl tw-text-purple-500 tw-mb-4"></i>
              <p className="tw-text-gray-600">Loading Report Designer...</p>
            </div>
          </div>
        )}

        {/* Designer element - always rendered so ref is available */}
        <div
          id="reportDesigner"
          ref={designerRef}
          style={{
            width: "100%",
            height: "100%",
            minHeight: "600px"
          }}
        ></div>
      </div>
    </div>
  );
};

export default DevExtremeReportDesigner;
