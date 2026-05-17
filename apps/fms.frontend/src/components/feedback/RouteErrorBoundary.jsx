/**
 * File:          RouteErrorBoundary.jsx
 * Purpose:       Per-route React error boundary. Isolates a crashing route
 *                from the rest of the shell so the sidebar/header stay usable
 *                and the user can navigate away. PRD §7.1 L2.
 * Dependencies:  React
 * Last Modified: 2026-05-16
 */

import React from "react";
import "./feedback.scss";

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      `[RouteErrorBoundary:${this.props.routeName || "unknown"}]`,
      error,
      errorInfo,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = "/home";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="fms-feedback fms-feedback--error" role="alert">
        <i className="fa-light fa-triangle-exclamation fms-feedback__icon" />
        <h2 className="fms-feedback__title">This page hit an error</h2>
        <p className="fms-feedback__message">
          {this.props.routeName
            ? `The "${this.props.routeName}" page couldn't load. The rest of the app is still working — you can go home or try again.`
            : "This page couldn't load. The rest of the app is still working — you can go home or try again."}
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
