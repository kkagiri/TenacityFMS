/**
 * File:          RouteErrorBoundary.tsx (FMS.Admin)
 * Purpose:       Per-route React error boundary for the operator portal.
 *                TS twin of apps/fms.frontend/src/components/feedback/
 *                RouteErrorBoundary.jsx. PRD §7.1 L2.
 * Last Modified: 2026-05-16
 */

import React, { type ReactNode } from "react";
import "./feedback.scss";

interface RouteErrorBoundaryProps {
  children: ReactNode;
  routeName?: string;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(
      `[RouteErrorBoundary:${this.props.routeName || "unknown"}]`,
      error,
      errorInfo,
    );
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = (): void => {
    window.location.href = "/";
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="fms-feedback fms-feedback--error" role="alert">
        <i className="fa-light fa-triangle-exclamation fms-feedback__icon" />
        <h2 className="fms-feedback__title">This page hit an error</h2>
        <p className="fms-feedback__message">
          {this.props.routeName
            ? `The "${this.props.routeName}" page couldn't load. The rest of the operator portal is still working — you can go home or try again.`
            : "This page couldn't load. The rest of the operator portal is still working — you can go home or try again."}
        </p>
        <div className="fms-feedback__actions">
          <button
            type="button"
            className="m365-btn m365-btn--primary"
            onClick={this.handleRetry}
          >
            <i className="fa-light fa-rotate-right" /> Try again
          </button>
          <button
            type="button"
            className="m365-btn m365-btn--ghost"
            onClick={this.handleGoHome}
          >
            <i className="fa-light fa-house" /> Go home
          </button>
        </div>
      </div>
    );
  }
}

export default RouteErrorBoundary;
