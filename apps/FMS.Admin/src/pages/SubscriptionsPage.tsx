/**
 * File:          SubscriptionsPage.tsx
 * Purpose:       Operator subscriptions list page for FMS.Admin.
 *                Fetches from FMS.Sales.Api; hydrates tenant names from
 *                FMS.WebClient /operator/tenants for human-readable rows.
 * Last Modified: 2026-05-14
 */

import { useEffect, useMemo, useState } from "react";
import { apiClient, unwrapResponse } from "../api/apiClient";
import { salesApiClient } from "../api/salesApiClient";
import type {
  SubscriptionListPayload,
  SubscriptionStatus,
  SubscriptionSummary,
} from "../types/billing";
import type { OperatorTenantSummary } from "../types/tenant";

type StatusFilter = SubscriptionStatus | "all";

const STATUS_OPTIONS: ReadonlyArray<StatusFilter> = [
  "all",
  "Trialing",
  "Active",
  "PastDue",
  "Cancelled",
  "Suspended",
  "Expired",
];

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
};

const errorMessage = (caught: unknown, fallback: string) => {
  if (caught && typeof caught === "object" && "response" in caught) {
    const raw = (caught as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (raw) return raw;
  }
  return fallback;
};

export default function SubscriptionsPage() {
  const [items, setItems] = useState<SubscriptionSummary[]>([]);
  const [pagination, setPagination] = useState<SubscriptionListPayload["pagination"] | null>(null);
  const [tenantsById, setTenantsById] = useState<Record<string, OperatorTenantSummary>>({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
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
        if (!mounted) return;
        const map: Record<string, OperatorTenantSummary> = {};
        for (const t of payload.items || []) map[t.id] = t;
        setTenantsById(map);
      })
      .catch(() => {
        /* names are best-effort */
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    salesApiClient
      .get("/api/v1/operator/subscriptions", {
        params: {
          pageNumber,
          pageSize: 25,
          search: search.trim() || undefined,
          status: status === "all" ? undefined : status,
        },
      })
      .then((res) => {
        const payload = unwrapResponse<SubscriptionListPayload>(res.data);
        if (!mounted) return;
        setItems(payload.items || []);
        setPagination(payload.pagination || null);
      })
      .catch((caught) => {
        if (mounted) setError(errorMessage(caught, "Unable to load subscriptions."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [pageNumber, reloadToken, search, status]);

  const resetToFirstPage = () => setPageNumber(1);

  const tenantLabel = useMemo(
    () => (id: string) => tenantsById[id]?.name || tenantsById[id]?.code || id,
    [tenantsById]
  );

  return (
    <div className="operator-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-file-invoice-dollar m365-page-header__icon" />
          <h2 className="m365-page-header__title">Subscriptions</h2>
        </div>
      </div>

      <div className="operator-filters">
        <label className="m365-field operator-filters__search">
          Search
          <input
            className="m365-input"
            type="search"
            placeholder="Tenant id, plan, external subscription"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetToFirstPage();
            }}
          />
        </label>

        <label className="m365-field">
          Status
          <select
            className="m365-select"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter);
              resetToFirstPage();
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All" : option}
              </option>
            ))}
          </select>
        </label>

        <button
          className="m365-btn m365-btn--ghost operator-filters__refresh"
          type="button"
          onClick={() => setReloadToken((c) => c + 1)}
          disabled={loading}
        >
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

      <div className="operator-table operator-table--subscriptions">
        <div className="operator-table__header">
          <span>Tenant</span>
          <span>Plan</span>
          <span>Status</span>
          <span>Cycle</span>
          <span>Period ends</span>
          <span>External ref</span>
        </div>
        {loading && <div className="operator-table__empty">Loading subscriptions...</div>}
        {!loading && items.length === 0 && (
          <div className="operator-table__empty">No subscriptions loaded</div>
        )}
        {items.map((s) => (
          <div className="operator-table__row" key={s.id}>
            <span className="operator-table__primary">{tenantLabel(s.tenantId)}</span>
            <span>{s.planName}</span>
            <span>
              <span className={`operator-status operator-status--${s.status === "Active" ? "active" : "inactive"}`}>
                {s.status}
              </span>
            </span>
            <span>{s.billingCycle}</span>
            <span>{formatDate(s.currentPeriodEndUtc)}</span>
            <span>{s.externalSubscriptionId || "—"}</span>
          </div>
        ))}
      </div>

      <div className="operator-pagination">
        <span>
          {pagination ? `${pagination.totalCount} subscriptions` : `${items.length} subscriptions`}
        </span>
        <div className="operator-pagination__buttons">
          <button
            className="m365-btn m365-btn--ghost"
            type="button"
            disabled={loading || !pagination?.hasPrevious}
            onClick={() => setPageNumber((c) => Math.max(1, c - 1))}
          >
            <i className="fa-light fa-chevron-left" />
          </button>
          <span>
            {pagination ? `Page ${pagination.pageNumber} of ${pagination.totalPages || 1}` : `Page ${pageNumber}`}
          </span>
          <button
            className="m365-btn m365-btn--ghost"
            type="button"
            disabled={loading || !pagination?.hasNext}
            onClick={() => setPageNumber((c) => c + 1)}
          >
            <i className="fa-light fa-chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
