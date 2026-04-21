/**
 * File: ErrorReportsPage.js
 * Purpose: Admin page for viewing frontend error reports submitted by the global error boundary.
 * Dependencies: React, errorReportService, ErrorReportsPage.scss
 * Last Modified: 2026-04-21
 *
 * Key Components:
 * - ErrorReportsPage: Filters, table, and detail viewer for frontend error telemetry.
 */
import React, { useEffect, useState } from "react";
import { getErrorLogs } from "../../../api/errorReportService";
import "./ErrorReportsPage.scss";

const defaultFilters = {
    fromDate: "",
    toDate: "",
    pageSize: 25,
    pageNumber: 1,
};

const formatDateTime = (value) => {
    if (!value) {
        return "-";
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return value;
    }

    return parsedDate.toLocaleString();
};

const buildDetailsText = (log) => {
    if (!log) {
        return "No error report selected.";
    }

    return [
        `Date: ${formatDateTime(log.createdAt || log.timeStamp)}`,
        `User: ${log.userId || "Unknown"}`,
        `URL: ${log.url || "Unknown"}`,
        `User Agent: ${log.userAgent || "Unknown"}`,
        "",
        "Message:",
        log.message || "No message",
        "",
        "Stack:",
        log.stack || "No stack trace",
        "",
        "Component Stack:",
        log.componentStack || "No component stack",
    ].join("\n");
};

const ErrorReportsPage = () => {
    const [filters, setFilters] = useState(defaultFilters);
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const loadLogs = async (nextFilters = filters) => {
        try {
            setLoading(true);
            setErrorMessage("");

            const payload = {
                pageSize: nextFilters.pageSize,
                pageNumber: nextFilters.pageNumber,
            };

            if (nextFilters.fromDate) {
                payload.fromDate = nextFilters.fromDate;
            }

            if (nextFilters.toDate) {
                payload.toDate = nextFilters.toDate;
            }

            const result = await getErrorLogs(payload);
            const nextLogs = Array.isArray(result) ? result : [];

            setLogs(nextLogs);
            setSelectedLog((current) => {
                if (!nextLogs.length) {
                    return null;
                }

                if (current) {
                    const matchingLog = nextLogs.find((log) => log.id === current.id);
                    if (matchingLog) {
                        return matchingLog;
                    }
                }

                return nextLogs[0];
            });
        } catch (error) {
            console.error("Failed to load frontend error reports:", error);
            setLogs([]);
            setSelectedLog(null);
            setErrorMessage("Failed to load frontend error reports.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs(defaultFilters);
    }, []);

    const handleFilterChange = (field, value) => {
        setFilters((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleApplyFilters = () => {
        const nextFilters = {
            ...filters,
            pageNumber: 1,
        };

        setFilters(nextFilters);
        loadLogs(nextFilters);
    };

    const handleResetFilters = () => {
        setFilters(defaultFilters);
        loadLogs(defaultFilters);
    };

    const handleRefresh = () => {
        loadLogs(filters);
    };

    const handlePageChange = (direction) => {
        const nextPageNumber = direction === "next"
            ? filters.pageNumber + 1
            : Math.max(1, filters.pageNumber - 1);

        const nextFilters = {
            ...filters,
            pageNumber: nextPageNumber,
        };

        setFilters(nextFilters);
        loadLogs(nextFilters);
    };

    const handleCopyDetails = async () => {
        if (!selectedLog) {
            return;
        }

        try {
            await navigator.clipboard.writeText(buildDetailsText(selectedLog));
        } catch (error) {
            console.error("Failed to copy error report details:", error);
            setErrorMessage("Failed to copy error report details.");
        }
    };

    return (
        <div className="error-reports-page">
            <section className="error-reports-page__header">
                <div>
                    <h2 className="error-reports-page__title">
                        <i className="fa-light fa-bug"></i>
                        Frontend Error Reports
                    </h2>
                    <p className="error-reports-page__subtitle">
                        Review errors submitted from the application error page.
                    </p>
                </div>
                <div className="error-reports-page__actions">
                    <button
                        type="button"
                        className="m365-btn m365-btn--ghost"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <i className="fa-light fa-rotate-right"></i>
                        Refresh
                    </button>
                    <button
                        type="button"
                        className="m365-btn m365-btn--primary"
                        onClick={handleCopyDetails}
                        disabled={!selectedLog}
                    >
                        <i className="fa-light fa-copy"></i>
                        Copy Selected Details
                    </button>
                </div>
            </section>

            {errorMessage ? (
                <div className="error-reports-page__alert error-reports-page__alert--error">
                    <i className="fa-light fa-circle-exclamation"></i>
                    <span>{errorMessage}</span>
                </div>
            ) : null}

            <section className="error-reports-page__filters">
                <label className="error-reports-page__field">
                    <span>From</span>
                    <input
                        type="date"
                        className="m365-date"
                        value={filters.fromDate}
                        onChange={(event) => handleFilterChange("fromDate", event.target.value)}
                    />
                </label>
                <label className="error-reports-page__field">
                    <span>To</span>
                    <input
                        type="date"
                        className="m365-date"
                        value={filters.toDate}
                        onChange={(event) => handleFilterChange("toDate", event.target.value)}
                    />
                </label>
                <label className="error-reports-page__field">
                    <span>Page Size</span>
                    <select
                        className="m365-select"
                        value={filters.pageSize}
                        onChange={(event) => handleFilterChange("pageSize", Number(event.target.value))}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </label>
                <div className="error-reports-page__filter-actions">
                    <button
                        type="button"
                        className="m365-btn m365-btn--primary"
                        onClick={handleApplyFilters}
                        disabled={loading}
                    >
                        <i className="fa-light fa-filter"></i>
                        Apply Filters
                    </button>
                    <button
                        type="button"
                        className="m365-btn m365-btn--ghost"
                        onClick={handleResetFilters}
                        disabled={loading}
                    >
                        <i className="fa-light fa-arrow-rotate-left"></i>
                        Reset
                    </button>
                </div>
            </section>

            <section className="error-reports-page__content">
                <div className="error-reports-page__table-card">
                    <div className="error-reports-page__table-header">
                        <div>
                            <h3>Submitted Errors</h3>
                            <p>{loading ? "Loading reports..." : `${logs.length} report(s) on this page`}</p>
                        </div>
                        <div className="error-reports-page__pager">
                            <button
                                type="button"
                                className="m365-btn m365-btn--ghost"
                                onClick={() => handlePageChange("previous")}
                                disabled={loading || filters.pageNumber === 1}
                            >
                                <i className="fa-light fa-chevron-left"></i>
                                Previous
                            </button>
                            <span>Page {filters.pageNumber}</span>
                            <button
                                type="button"
                                className="m365-btn m365-btn--ghost"
                                onClick={() => handlePageChange("next")}
                                disabled={loading || logs.length < filters.pageSize}
                            >
                                Next
                                <i className="fa-light fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>

                    <div className="error-reports-page__table-wrap">
                        <table className="error-reports-page__table">
                            <thead>
                                <tr>
                                    <th>Submitted</th>
                                    <th>Message</th>
                                    <th>User</th>
                                    <th>URL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length ? (
                                    logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className={selectedLog?.id === log.id ? "is-selected" : ""}
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <td>{formatDateTime(log.createdAt || log.timeStamp)}</td>
                                            <td>
                                                <div className="error-reports-page__message-cell">
                                                    <strong>{log.message || "Unknown error"}</strong>
                                                    <span>{log.componentStack ? "Component stack attached" : "No component stack"}</span>
                                                </div>
                                            </td>
                                            <td>{log.userId || "Unknown"}</td>
                                            <td className="error-reports-page__url-cell" title={log.url || ""}>
                                                {log.url || "-"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="error-reports-page__empty">
                                            {loading ? "Loading error reports..." : "No frontend error reports found for the selected filters."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="error-reports-page__details-card">
                    <div className="error-reports-page__details-header">
                        <div>
                            <h3>Error Details</h3>
                            <p>{selectedLog ? "Inspect the selected frontend error payload." : "Select a row to inspect its full details."}</p>
                        </div>
                    </div>

                    {selectedLog ? (
                        <div className="error-reports-page__details-body">
                            <div className="error-reports-page__detail-grid">
                                <div>
                                    <span className="error-reports-page__detail-label">Submitted</span>
                                    <span>{formatDateTime(selectedLog.createdAt || selectedLog.timeStamp)}</span>
                                </div>
                                <div>
                                    <span className="error-reports-page__detail-label">User</span>
                                    <span>{selectedLog.userId || "Unknown"}</span>
                                </div>
                                <div>
                                    <span className="error-reports-page__detail-label">URL</span>
                                    <span className="error-reports-page__detail-value">{selectedLog.url || "-"}</span>
                                </div>
                                <div>
                                    <span className="error-reports-page__detail-label">User Agent</span>
                                    <span className="error-reports-page__detail-value">{selectedLog.userAgent || "-"}</span>
                                </div>
                            </div>

                            <div className="error-reports-page__detail-block">
                                <h4>Message</h4>
                                <pre>{selectedLog.message || "No message"}</pre>
                            </div>

                            <div className="error-reports-page__detail-block">
                                <h4>Stack Trace</h4>
                                <pre>{selectedLog.stack || "No stack trace"}</pre>
                            </div>

                            <div className="error-reports-page__detail-block">
                                <h4>Component Stack</h4>
                                <pre>{selectedLog.componentStack || "No component stack"}</pre>
                            </div>
                        </div>
                    ) : (
                        <div className="error-reports-page__details-empty">
                            <i className="fa-light fa-magnifying-glass"></i>
                            <span>Select an error report from the table to view it here.</span>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ErrorReportsPage;