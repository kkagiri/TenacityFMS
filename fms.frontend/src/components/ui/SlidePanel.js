/**
 * File: SlidePanel.js
 * Purpose: Global reusable slide-in panel that renders via React Portal into document.body.
 *          Always positions below the main website header (.header-component / .layout-header).
 *          Follows M365 Admin Center Fluent design language.
 * Dependencies: react, react-dom
 * Last Modified: 2026-02-25
 *
 * Key Props:
 * - open (bool):        Whether the panel is visible
 * - onClose (func):     Called when backdrop or close button is clicked
 * - title (string):     Panel header title
 * - width (number|string): Panel width — default 720
 * - children (node):    Panel body content
 *
 * Usage:
 *   <SlidePanel open={open} onClose={() => setOpen(false)} title="Details" width={600}>
 *     <div>Panel content here</div>
 *   </SlidePanel>
 */
import React, { useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import "./SlidePanel.scss";

const SlidePanel = ({ open, onClose, title, width = 720, headerActions, children }) => {
  const [headerHeight, setHeaderHeight] = useState(0);

  // Measure header height on mount & resize
  const measureHeader = useCallback(() => {
    // Try layout-header first (side-nav-outer-toolbar), then header-component (app-drawer)
    const headerEl =
      document.querySelector(".layout-header") ||
      document.querySelector(".header-component");
    if (headerEl) {
      setHeaderHeight(headerEl.getBoundingClientRect().height);
    } else {
      setHeaderHeight(0); // fallback: full viewport
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    measureHeader();
    window.addEventListener("resize", measureHeader);
    return () => window.removeEventListener("resize", measureHeader);
  }, [open, measureHeader]);

  // Lock body scroll when panel is open + toggle class for DevExtreme popup z-index
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.classList.add('fms-slide-panel-open');
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove('fms-slide-panel-open');
    }
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove('fms-slide-panel-open');
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const panelStyle = {
    width: typeof width === "number" ? `${width}px` : width,
    maxWidth: "100vw",
  };

  const overlayStyle = {
    top: `${headerHeight}px`,
  };

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fms-slide-panel__overlay"
        style={overlayStyle}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside
        className="fms-slide-panel"
        style={{ ...panelStyle, top: `${headerHeight}px` }}
        role="dialog"
        aria-label={title || "Detail panel"}
      >
        {/* Header */}
        <div className="fms-slide-panel__header">
          <h3 className="fms-slide-panel__title">{title}</h3>
          <div className="fms-slide-panel__header-actions">
            {headerActions}
            <button
              className="fms-slide-panel__close"
              onClick={onClose}
              aria-label="Close panel"
            >
              <i className="fa-light fa-xmark"></i>
            </button>
          </div>
        </div>
        {/* Body */}
        <div className="fms-slide-panel__body">
          {children}
        </div>
      </aside>
    </>,
    document.body
  );
};

export default SlidePanel;
