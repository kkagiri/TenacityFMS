/**
 * File:          AdminErrorBoundary.tsx
 * Purpose:       App-wide error boundary for FMS.Admin — TS twin of
 *                apps/fms.frontend/src/GlobalErrorBoundary.js. Shows the
 *                recovery card on any uncaught render error and auto-reports
 *                with the same throttle/fingerprint contract. PRD §7.1 L1.
 * Last Modified: 2026-05-16
 */

import React, { type ErrorInfo, type ReactNode } from "react";

const REPORT_THROTTLE_WINDOW_MS = 60 * 1000;
// Distinct localStorage key so admin reports don't deduplicate against tenant
// reports — same dedupe logic, separate throttle gates.
const REPORT_THROTTLE_STORAGE_KEY = "fms:admin-error-report:last-send";

interface ErrorReport {
  message: string;
  stack: string;
  componentStack: string;
  userAgent: string;
  timestamp: string;
  url: string;
}

interface ThrottleState {
  fingerprint: string;
  sentAt: number;
}

interface AdminErrorBoundaryProps {
  children: ReactNode;
}

interface AdminErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  isReporting: boolean;
  reportSuccess: boolean;
  reportFeedback: string;
}

const normalizeReportValue = (value: string | undefined): string =>
  typeof value === "string" ? value.trim() : "";

const buildReportFingerprint = (errorReport: ErrorReport): string => {
  const stackPreview = normalizeReportValue(errorReport.stack)
    .split("\n")
    .slice(0, 3)
    .join("\n");
  return [
    normalizeReportValue(errorReport.message).toLowerCase(),
    stackPreview.toLowerCase(),
    normalizeReportValue(errorReport.componentStack).toLowerCase(),
    normalizeReportValue(errorReport.url).toLowerCase(),
  ].join("||");
};

const readThrottleState = (): ThrottleState | null => {
  try {
    const raw = window.localStorage.getItem(REPORT_THROTTLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ThrottleState>;
    if (!parsed.fingerprint || typeof parsed.sentAt !== "number") return null;
    return { fingerprint: parsed.fingerprint, sentAt: parsed.sentAt };
  } catch (error) {
    console.warn("Failed to read admin error report throttle state", error);
    return null;
  }
};

const writeThrottleState = (fingerprint: string, sentAt: number): void => {
  try {
    window.localStorage.setItem(
      REPORT_THROTTLE_STORAGE_KEY,
      JSON.stringify({ fingerprint, sentAt }),
    );
  } catch (error) {
    console.warn("Failed to persist admin error report throttle state", error);
  }
};

const wasRecentlyReported = (fingerprint: string): boolean => {
  const state = readThrottleState();
  if (!state || state.fingerprint !== fingerprint) return false;
  return Date.now() - state.sentAt < REPORT_THROTTLE_WINDOW_MS;
};

class AdminErrorBoundary extends React.Component<
  AdminErrorBoundaryProps,
  AdminErrorBoundaryState
> {
  constructor(props: AdminErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      isReporting: false,
      reportSuccess: false,
      reportFeedback: "",
    };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("🔴 [FMS.Admin] Uncaught error", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleGoHome = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  handleReload = (): void => {
    window.location.reload();
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  handleReportError = async (): Promise<void> => {
    this.setState({ isReporting: true, reportFeedback: "" });

    const errorReport: ErrorReport = {
      message: this.state.error?.message || "Unknown error",
      stack: this.state.error?.stack || "",
      componentStack: this.state.errorInfo?.componentStack || "",
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };
    const fingerprint = buildReportFingerprint(errorReport);

    try {
      if (wasRecentlyReported(fingerprint)) {
        this.setState({
          isReporting: false,
          reportSuccess: true,
          reportFeedback: "This error was already reported recently.",
        });
        setTimeout(
          () => this.setState({ reportSuccess: false, reportFeedback: "" }),
          3000,
        );
        return;
      }

      // Admin doesn't ship its own report client yet — log to console so it
      // surfaces in any browser-console capture (e.g. Sentry's BrowserTracing).
      // When/if a backend admin-report endpoint is added, swap this for a fetch.
      console.info("[FMS.Admin] Error report payload:", errorReport);
      writeThrottleState(fingerprint, Date.now());

      this.setState({
        isReporting: false,
        reportSuccess: true,
        reportFeedback: "Error report logged.",
      });
      setTimeout(
        () => this.setState({ reportSuccess: false, reportFeedback: "" }),
        3000,
      );
    } catch (err) {
      console.error("Failed to report admin error:", err);
      this.setState({
        isReporting: false,
        reportFeedback: "Failed to send error report. Please try again.",
      });
    }
  };

  copyErrorToClipboard = (): void => {
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
      .then(() => alert("Error details copied to clipboard."))
      .catch(() => alert("Failed to copy to clipboard."));
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--inspinia-content-bg)",
          padding: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            width: "100%",
            background: "var(--m365-bg-card)",
            border: "1px solid var(--m365-border-light)",
            borderRadius: "var(--m365-card-radius)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <i
            className="fa-light fa-triangle-exclamation"
            style={{
              fontSize: "44px",
              color: "var(--m365-error)",
              marginBottom: "20px",
            }}
          />
          <h1
            style={{
              fontSize: "22px",
              color: "var(--m365-text)",
              marginBottom: "10px",
              fontWeight: 600,
            }}
          >
            The operator portal hit an error
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--m365-text-secondary)",
              marginBottom: "24px",
              lineHeight: 1.5,
            }}
          >
            Something went wrong while rendering this page. You can reload, go
            home, or send the error details to the team for investigation.
          </p>

          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <button
              type="button"
              className="m365-btn m365-btn--primary"
              onClick={this.handleGoHome}
            >
              <i className="fa-light fa-house" /> Go home
            </button>
            <button
              type="button"
              className="m365-btn m365-btn--ghost"
              onClick={this.handleReload}
            >
              <i className="fa-light fa-rotate-right" /> Reload
            </button>
            <button
              type="button"
              className="m365-btn m365-btn--ghost"
              onClick={this.handleReportError}
              disabled={this.state.isReporting || this.state.reportSuccess}
            >
              {this.state.isReporting
                ? "Sending…"
                : this.state.reportSuccess
                  ? "✓ Reported"
                  : "Send error report"}
            </button>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--m365-border-light)",
              paddingTop: "16px",
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="m365-btn m365-btn--ghost"
              onClick={this.toggleDetails}
            >
              {this.state.showDetails ? "Hide details" : "Show details"}
            </button>
            <button
              type="button"
              className="m365-btn m365-btn--ghost"
              onClick={this.copyErrorToClipboard}
            >
              <i className="fa-light fa-copy" /> Copy details
            </button>
          </div>

          {this.state.showDetails ? (
            <div
              style={{
                marginTop: 16,
                textAlign: "left",
                background: "var(--m365-bg-hover)",
                padding: 12,
                borderRadius: 4,
                fontSize: 12,
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              <strong style={{ color: "var(--m365-error)" }}>Message</strong>
              <pre
                style={{
                  margin: "4px 0 10px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {this.state.error?.message || "No error message"}
              </pre>
              <strong style={{ color: "var(--m365-error)" }}>Stack</strong>
              <pre
                style={{
                  margin: "4px 0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: 11,
                }}
              >
                {this.state.error?.stack || "No stack trace"}
              </pre>
            </div>
          ) : null}

          {this.state.reportFeedback ? (
            <p
              style={{
                marginTop: 12,
                marginBottom: 0,
                fontSize: 12,
                color: this.state.reportSuccess
                  ? "var(--m365-success)"
                  : "var(--m365-text-secondary)",
              }}
            >
              {this.state.reportFeedback}
            </p>
          ) : null}
        </div>
      </div>
    );
  }
}

export default AdminErrorBoundary;
