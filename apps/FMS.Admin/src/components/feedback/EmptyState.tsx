/**
 * File:          EmptyState.tsx (FMS.Admin)
 * Purpose:       Shared "no data" presentation. TS twin of fms.frontend
 *                EmptyState.jsx. PRD §7.1 L4.
 */

import React, { type ReactNode } from "react";
import "./feedback.scss";

interface EmptyStateProps {
  icon?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export default function EmptyState({
  icon = "fa-light fa-inbox",
  title = "Nothing here yet",
  message,
  actionLabel,
  onAction,
  children,
}: EmptyStateProps) {
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
