/**
 * File:          ForbiddenState.tsx (FMS.Admin)
 * Purpose:       403/permission-denied presentation. TS twin of fms.frontend
 *                ForbiddenState.jsx. PRD §7.2.
 */

import React from "react";
import "./feedback.scss";

interface ForbiddenStateProps {
  title?: string;
  message?: string;
  requestAccessHref?: string;
  onRequestAccess?: () => void;
}

export default function ForbiddenState({
  title = "You don't have access to this page",
  message = "Your role doesn't include permission to view this resource. Ask an administrator to grant access, or head back to the dashboard.",
  requestAccessHref,
  onRequestAccess,
}: ForbiddenStateProps) {
  const handleGoHome = (): void => {
    window.location.href = "/";
  };

  return (
    <div className="fms-feedback fms-feedback--forbidden" role="alert">
      <span className="fms-feedback__status">
        <i className="fa-light fa-lock" /> 403 — Forbidden
      </span>
      <i className="fa-light fa-shield-halved fms-feedback__icon" />
      <h2 className="fms-feedback__title">{title}</h2>
      <p className="fms-feedback__message">{message}</p>
      <div className="fms-feedback__actions">
        {requestAccessHref ? (
          <a href={requestAccessHref} className="m365-btn m365-btn--primary">
            <i className="fa-light fa-paper-plane" /> Request access
          </a>
        ) : onRequestAccess ? (
          <button
            type="button"
            className="m365-btn m365-btn--primary"
            onClick={onRequestAccess}
          >
            <i className="fa-light fa-paper-plane" /> Request access
          </button>
        ) : null}
        <button
          type="button"
          className="m365-btn m365-btn--ghost"
          onClick={handleGoHome}
        >
          <i className="fa-light fa-house" /> Go home
        </button>
      </div>
    </div>
  );
}
