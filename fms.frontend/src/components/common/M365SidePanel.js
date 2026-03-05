/**
 * File: M365SidePanel.js
 * Purpose: Reusable M365 Admin Center side panel (slide-in from right) replacing DevExtreme Popup for forms.
 * Dependencies: React, ReactDOM (createPortal), _M365SidePanel.scss
 * Last Modified: 2026-02-10
 *
 * Key Components:
 * - M365SidePanel: Overlay + slide-in panel with header, scrollable body, and optional footer
 *
 * Props:
 * - visible (bool): Show/hide panel
 * - onClose (func): Called when panel should close (Cancel button or X)
 * - title (string): Panel header title
 * - width (number|string): Panel width, default 1000
 * - children: Form content
 */
import React, { useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import "./_M365SidePanel.scss";

const M365SidePanel = ({ visible, onClose, title, width = 1000, headerActions = null, children }) => {
    const panelRef = useRef(null);

    useEffect(() => {
        if (visible) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [visible]);

    // Focus trap: focus panel on open
    useEffect(() => {
        if (visible && panelRef.current) {
            panelRef.current.focus();
        }
    }, [visible]);

    if (!visible) return null;

    const panelWidth = typeof width === "number" ? `${width}px` : width;

    return ReactDOM.createPortal(
        <div className="m365-side-panel-overlay">
            <div
                ref={panelRef}
                className="m365-side-panel"
                style={{ width: panelWidth, maxWidth: "100vw" }}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                {/* Header */}
                <div className="m365-side-panel__header">
                    <h3 className="m365-side-panel__title">{title}</h3>
                    <div className="m365-side-panel__header-actions">
                        {headerActions}
                        <button
                            className="m365-side-panel__close"
                            onClick={onClose}
                            aria-label="Close panel"
                        >
                            <i className="fa-light fa-xmark" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="m365-side-panel__body">{children}</div>
            </div>
        </div>,
        document.body
    );
};

export default M365SidePanel;
