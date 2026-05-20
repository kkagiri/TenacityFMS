/**
 * File:          AuditLogPage.tsx
 * Purpose:       Platform operator audit log with tenant, user, action, and date filters.
 * Dependencies:  React, apiClient
 * Last Modified: 2026-05-20
 *
 * Key Functions:
 * - AuditLogPage(): Lists operator audit activity from /api/v1/operator/audit.
 */

import { useEffect, useMemo, useState } from "react";
import { apiClient, unwrapResponse } from "../api/apiClient";
import type { AuditLogPayload, AuditLogRow } from "../types/reports";
import type { OperatorTenantSummary } from "../types/tenant";

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

export default function AuditLogPage() {
  const [items, setItems] = useState<AuditLogRow[]>([]);
  const [pagination, setPagination] = useState<AuditLogPayload["pagination"] | null>(null);
  const [tenants, setTenants] = useState<OperatorTenantSummary[]>([]);
  const [tenantFilter, setTenantFilter] = useState("");
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get("/v1/operator/tenants", { params: { pageNumber: 1, pageSize: 100 } })
      .then((res) => {
        const payload = unwrapResponse<{ items: OperatorTenantSummary[] }>(res.data);
        if (mounted) setTenants(payload.items || []);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    apiClient
      .get("/v1/operator/audit", {
        params: {
          pageNumber,
          pageSize: 25,
          tenantId: tenantFilter || undefined,
          userId: userId || undefined,
          action: action || undefined,
          from: from || undefined,
          to: to || undefined,
        },
      })
      .then((res) => {
        const payload = unwrapResponse<AuditLogPayload>(res.data);
        if (!mounted) return;
        setItems(payload.items || []);
        setPagination(payload.pagination || null);
      })
      .catch(() => {
        if (mounted) setError("Unable to load operator audit log.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [action, from, pageNumber, reloadToken, tenantFilter, to, userId]);

  const tenantName = useMemo(() => {
    const lookup: Record<string, string> = {};
    tenants.forEach((tenant) => {
      lookup[tenant.id] = tenant.name || tenant.code;
    });
    return (id?: string | null) => (id ? lookup[id] || id : "—");
  }, [tenants]);

  const resetPage = () => setPageNumber(1);

  return (
    <div className="operator-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-shield-check m365-page-header__icon" />
          <h2 className="m365-page-header__title">Audit log</h2>
        </div>
      </div>

      <div className="operator-filter-bar operator-filter-bar--audit">
        <label className="m365-field">
          Tenant
          <select
            className="m365-select"
            value={tenantFilter}
            onChange={(event) => {
              setTenantFilter(event.target.value);
              resetPage();
            }}
          >
            <option value="">All tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </label>
        <label className="m365-field">
          User ID
          <input className="m365-input" value={userId} onChange={(event) => { setUserId(event.target.value); resetPage(); }} />
        </label>
        <label className="m365-field">
          Action
          <input className="m365-input" value={action} onChange={(event) => { setAction(event.target.value); resetPage(); }} />
        </label>
        <label className="m365-field">
          From
          <input className="m365-input" type="date" value={from} onChange={(event) => { setFrom(event.target.value); resetPage(); }} />
        </label>
        <label className="m365-field">
          To
          <input className="m365-input" type="date" value={to} onChange={(event) => { setTo(event.target.value); resetPage(); }} />
        </label>
        <button className="m365-btn m365-btn--ghost" type="button" onClick={() => setReloadToken((c) => c + 1)} disabled={loading}>
          <i className="fa-light fa-rotate" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="m365-info-banner m365-info-banner--error">
          <i className="fa-light fa-circle-info m365-info-banner__icon" />
          <span className="m365-info-banner__text">{error}</span>
        </div>
      )}

      <div className="operator-table-card">
        <div className="operator-table-card__header">
          <h3>Operator activity</h3>
          <span>{loading ? "Loading..." : `${pagination?.totalCount ?? items.length} events`}</span>
        </div>
        <div className="operator-table-wrap">
          <table className="operator-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Operator</th>
                <th>Target tenant</th>
                <th>Action</th>
                <th>Route</th>
                <th>IP</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTime(row.timestamp)}</td>
                  <td>
                    <strong>{row.email || row.userName || row.userId}</strong>
                    <span>{row.userId}</span>
                  </td>
                  <td>{tenantName(row.targetTenantId || row.operatorTenantId)}</td>
                  <td>{row.action}</td>
                  <td>
                    <strong>{row.controller || "—"}</strong>
                    <span>{row.actionName || "—"}</span>
                  </td>
                  <td>{row.ipAddress || "—"}</td>
                  <td>
                    <span className={`operator-pill${row.isCrossTenantAction ? " operator-pill--success" : ""}`}>
                      {row.isCrossTenantAction ? "Cross-tenant" : "Operator"}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7}>No audit entries loaded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="operator-pagination">
        <span>{pagination ? `${pagination.totalCount} events` : `${items.length} events`}</span>
        <div className="operator-pagination__buttons">
          <button className="m365-btn m365-btn--ghost" type="button" disabled={loading || !pagination?.hasPrevious} onClick={() => setPageNumber((c) => Math.max(1, c - 1))}>
            <i className="fa-light fa-chevron-left" />
          </button>
          <span>{pagination ? `Page ${pagination.pageNumber} of ${pagination.totalPages || 1}` : `Page ${pageNumber}`}</span>
          <button className="m365-btn m365-btn--ghost" type="button" disabled={loading || !pagination?.hasNext} onClick={() => setPageNumber((c) => c + 1)}>
            <i className="fa-light fa-chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
