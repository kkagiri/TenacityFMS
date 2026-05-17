/**
 * File:          ForbiddenState.jsx
 * Purpose:       403/permission-denied presentation. PRD §7.2 — surfaces a
 *                friendly "request access" affordance instead of a raw error.
 * Dependencies:  React
 * Last Modified: 2026-05-16
 */

import React from "react";
import "./feedback.scss";

export default function ForbiddenState({
  title = "You don't have access to this page",
  message = "Your role doesn't include permission to view this resource. Ask an administrator to grant access, or head back to the dashboard.",
  requestAccessHref,
  onRequestAccess,
}) {
  const handleGoHome = () => {
    window.location.href = "/home";
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
          <a
            href={requestAccessHref}
            className="m365-btn m365-btn--primary"
          >
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
