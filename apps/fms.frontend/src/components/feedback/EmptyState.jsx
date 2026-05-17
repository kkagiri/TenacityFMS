/**
 * File:          EmptyState.jsx
 * Purpose:       Shared "no data" presentation for lists/tables/dashboards.
 *                PRD §7.1 L4.
 * Dependencies:  React
 * Last Modified: 2026-05-16
 *
 * Props:
 * - icon        FontAwesome class (default fa-inbox)
 * - title       Headline (default "Nothing here yet")
 * - message     Supporting copy
 * - actionLabel Optional CTA label
 * - onAction    Optional CTA handler
 */

import React from "react";
import "./feedback.scss";

export default function EmptyState({
  icon = "fa-light fa-inbox",
  title = "Nothing here yet",
  message,
  actionLabel,
  onAction,
  children,
}) {
  return (
    <div className="fms-feedback fms-feedback--empty">
      <i className={`${icon} fms-feedback__icon`} />
      <h2 className="fms-feedback__title">{title}</h2>
      {message ? <p className="fms-feedback__message">{message}</p> : null}
      {actionLabel && onAction ? (
        <div className="fms-feedback__actions">
          <button
            type="button"
            className="m365-btn m365-btn--primary"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
      {children}
    </div>
  );
}
