/**
 * File: GlobalErrorBoundary.jsx
 * Purpose: Production-ready error boundary with user-friendly UI and error reporting
 * Dependencies: React
 * Last Modified: 2025-10-20
 *
 * Key Features:
 * - Catches React errors in production
 * - Shows user-friendly error page
 * - Allows navigation back
 * - Displays error details for debugging
 * - Provides error reporting capability
 */

import React from "react";

const ERROR_REPORT_THROTTLE_WINDOW_MS = 5 * 60 * 1000;
const ERROR_REPORT_STORAGE_KEY = "fms:last-error-report";

const buildErrorFingerprint = (report) => {
  const message = (report.message || "").trim();
  const stack = (report.stack || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5)
    .join("|");
  const componentStack = (report.componentStack || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5)
    .join("|");
  const normalizedUrl = (() => {
    try {
      return new URL(report.url || window.location.href).pathname;
    } catch {
      return report.url || window.location.href;
    }
  })();

  return [message, stack, componentStack, normalizedUrl].join("::");
};

const wasRecentlyReported = (fingerprint) => {
  try {
    const rawValue = window.sessionStorage.getItem(ERROR_REPORT_STORAGE_KEY);
    if (!rawValue) {
      return false;
    }

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || parsedValue.fingerprint !== fingerprint) {
      return false;
    }

    return Date.now() - Number(parsedValue.timestamp || 0) < ERROR_REPORT_THROTTLE_WINDOW_MS;
  } catch {
    return false;
  }
};

const markReported = (fingerprint) => {
  try {
    window.sessionStorage.setItem(
      ERROR_REPORT_STORAGE_KEY,
      JSON.stringify({
        fingerprint,
        timestamp: Date.now(),
      })
    );
  } catch {
    // Ignore session storage failures and keep reporting functional.
  }
};

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      isReporting: false,
      reportSuccess: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🔴 Global Error Caught:", error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log to console for development
    if (process.env.NODE_ENV === "development") {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleGoBack = () => {
    // Clear error state and navigate back
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.history.back();
  };

  handleGoHome = () => {
    // Clear error state and go to home
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/home";
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  showTemporaryReportSuccess = () => {
    this.setState({ isReporting: false, reportSuccess: true });

    setTimeout(() => {
      this.setState({ reportSuccess: false });
    }, 3000);
  };

  handleReportError = async () => {
    this.setState({ isReporting: true });

    const errorReport = {
      message: this.state.error?.message || "Unknown error",
      stack: this.state.error?.stack || "",
      componentStack: this.state.errorInfo?.componentStack || "",
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };
    const fingerprint = buildErrorFingerprint(errorReport);

    try {
      if (wasRecentlyReported(fingerprint)) {
        this.showTemporaryReportSuccess();
        return;
      }

      // Import errorReportService dynamically to avoid circular dependencies
      const { reportError } = await import("./api/errorReportService");
      const result = await reportError(errorReport);

      if (!result) {
        throw new Error("Error report request did not complete successfully.");
      }

      console.log("Error report sent:", errorReport);
      markReported(fingerprint);
      this.showTemporaryReportSuccess();
    } catch (err) {
      console.error("Failed to report error:", err);
      this.setState({ isReporting: false });
      alert("Failed to send error report. Please try again.");
    }
  };

  copyErrorToClipboard = () => {
    const errorText = `
Error: ${this.state.error?.message || "Unknown error"}

Stack Trace:
${this.state.error?.stack || "No stack trace"}

Component Stack:
${this.state.errorInfo?.componentStack || "No component stack"}

URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
    `.trim();

    navigator.clipboard
      .writeText(errorText)
      .then(() => alert("Error details copied to clipboard!"))
      .catch(() => alert("Failed to copy to clipboard"));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f5",
            padding: "20px",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              width: "100%",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              padding: "40px",
              textAlign: "center",
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                fontSize: "64px",
                color: "#ff6b6b",
                marginBottom: "20px",
              }}
            >
              ⚠️
            </div>

            {/* Main Message */}
            <h1
              style={{
                fontSize: "28px",
                color: "#333",
                marginBottom: "10px",
                fontWeight: "600",
              }}
            >
              Oops! Something went wrong
            </h1>

            <p
              style={{
                fontSize: "16px",
                color: "#666",
                marginBottom: "30px",
                lineHeight: "1.5",
              }}
            >
              We're sorry for the inconvenience. The application encountered an
              unexpected error. You can send the error details to the system so
              the team can review and fix it.
            </p>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              <button
                onClick={this.handleGoBack}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#45a049")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#4CAF50")}
              >
                ← Go Back
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#2196F3",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#0b7dda")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#2196F3")}
              >
                Go to Home
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#ff9800",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#e68900")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#ff9800")}
              >
                Reload Page
              </button>
            </div>

            {/* Error Details Toggle */}
            <div
              style={{
                marginTop: "20px",
                borderTop: "1px solid #eee",
                paddingTop: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: "10px",
                }}
              >
                <button
                  onClick={this.toggleDetails}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "transparent",
                    color: "#666",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {this.state.showDetails
                    ? "▼ Hide Error Details"
                    : "▶ Show Error Details"}
                </button>

                <button
                  onClick={this.copyErrorToClipboard}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#607D8B",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  📋 Copy Details
                </button>

                <button
                  onClick={this.handleReportError}
                  disabled={this.state.isReporting || this.state.reportSuccess}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: this.state.reportSuccess
                      ? "#4CAF50"
                      : "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: this.state.isReporting ? "wait" : "pointer",
                    opacity: this.state.isReporting ? 0.6 : 1,
                  }}
                >
                  {this.state.isReporting
                    ? "Sending..."
                    : this.state.reportSuccess
                      ? "✓ Report Sent"
                      : "📧 Send Error to System"}
                </button>
              </div>

              {this.state.showDetails && (
                <div
                  style={{
                    marginTop: "15px",
                    textAlign: "left",
                    backgroundColor: "#f9f9f9",
                    padding: "15px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  <div style={{ marginBottom: "15px" }}>
                    <strong style={{ color: "#d32f2f" }}>Error Message:</strong>
                    <pre
                      style={{
                        margin: "5px 0",
                        padding: "10px",
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {this.state.error?.message || "No error message"}
                    </pre>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <strong style={{ color: "#d32f2f" }}>Stack Trace:</strong>
                    <pre
                      style={{
                        margin: "5px 0",
                        padding: "10px",
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: "11px",
                      }}
                    >
                      {this.state.error?.stack || "No stack trace"}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Help Text */}
            <p
              style={{
                fontSize: "13px",
                color: "#999",
                marginTop: "20px",
                lineHeight: "1.4",
              }}
            >
              If this problem persists, please contact support with the error
              details above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
