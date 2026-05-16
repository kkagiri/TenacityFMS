/**
 * File:          InvoicesPage.tsx
 * Purpose:       Operator invoice list page with per-row PDF download.
 *                Fetches from FMS.Sales.Api; uses blob download for PDFs.
 * Last Modified: 2026-05-14
 */

import { useEffect, useMemo, useState } from "react";
import { apiClient, unwrapResponse } from "../api/apiClient";
import { salesApiClient } from "../api/salesApiClient";
import type {
  InvoiceListPayload,
  InvoiceStatus,
  InvoiceSummary,
} from "../types/billing";
import type { OperatorTenantSummary } from "../types/tenant";

type StatusFilter = InvoiceStatus | "all";

const STATUS_OPTIONS: ReadonlyArray<StatusFilter> = [
  "all",
  "Draft",
  "Open",
  "Paid",
  "Void",
  "Uncollectible",
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

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export default function InvoicesPage() {
  const [items, setItems] = useState<InvoiceSummary[]>([]);
  const [pagination, setPagination] = useState<InvoiceListPayload["pagination"] | null>(null);
  const [tenants, setTenants] = useState<OperatorTenantSummary[]>([]);
  const [tenantFilter, setTenantFilter] = useState<string>("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get("/v1/operator/tenants", { params: { pageNumber: 1, pageSize: 100 } })
      .then((res) => {
        const payload = unwrapResponse<{ items: OperatorTenantSummary[] }>(res.data);
        if (mounted) setTenants(payload.items || []);
      })
      .catch(() => {
        /* best-effort */
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
      .get("/api/v1/operator/invoices", {
        params: {
          pageNumber,
          pageSize: 25,
          tenantId: tenantFilter || undefined,
          status: status === "all" ? undefined : status,
          from: from || undefined,
          to: to || undefined,
        },
      })
      .then((res) => {
        const payload = unwrapResponse<InvoiceListPayload>(res.data);
        if (!mounted) return;
        setItems(payload.items || []);
        setPagination(payload.pagination || null);
      })
      .catch((caught) => {
        if (mounted) setError(errorMessage(caught, "Unable to load invoices."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [pageNumber, reloadToken, tenantFilter, status, from, to]);

  const tenantLabel = useMemo(() => {
    const lookup: Record<string, OperatorTenantSummary> = {};
    for (const t of tenants) lookup[t.id] = t;
    return (id: string) => lookup[id]?.name || lookup[id]?.code || id;
  }, [tenants]);

  const handleDownload = async (invoice: InvoiceSummary) => {
    setDownloadingId(invoice.id);
    try {
      const res = await salesApiClient.get(`/api/v1/operator/invoices/${invoice.id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      triggerDownload(blob, `${invoice.invoiceNumber}.pdf`);
    } catch (caught) {
      setError(errorMessage(caught, "Unable to download invoice PDF."));
    } finally {
      setDownloadingId(null);
    }
  };

  const resetToFirstPage = () => setPageNumber(1);

  return (
    <div className="operator-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-file-invoice m365-page-header__icon" />
          <h2 className="m365-page-header__title">Invoices</h2>
        </div>
      </div>

      <div className="operator-filters">
        <label className="m365-field">
          Tenant
          <select
            className="m365-select"
            value={tenantFilter}
            onChange={(event) => {
              setTenantFilter(event.target.value);
              resetToFirstPage();
            }}
          >
            <option value="">All tenants</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
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

        <label className="m365-field">
          From
          <input
            className="m365-input"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              resetToFirstPage();
            }}
          />
        </label>

        <label className="m365-field">
          To
          <input
            className="m365-input"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              resetToFirstPage();
            }}
          />
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

      <div className="operator-table operator-table--invoices">
        <div className="operator-table__header">
          <span>Invoice #</span>
          <span>Tenant</span>
          <span>Issued</span>
          <span>Due</span>
          <span>Total</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {loading && <div className="operator-table__empty">Loading invoices...</div>}
        {!loading && items.length === 0 && (
          <div className="operator-table__empty">No invoices loaded</div>
        )}
        {items.map((invoice) => (
          <div className="operator-table__row" key={invoice.id}>
            <span className="operator-table__primary">{invoice.invoiceNumber}</span>
            <span>{tenantLabel(invoice.tenantId)}</span>
            <span>{formatDate(invoice.issuedAtUtc)}</span>
            <span>{formatDate(invoice.dueAtUtc)}</span>
            <span>
              {invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
              {invoice.currencyCode}
            </span>
            <span>
              <span className={`operator-status operator-status--${invoice.status === "Paid" ? "active" : "inactive"}`}>
                {invoice.status}
              </span>
            </span>
            <span>
              <button
                className="m365-btn m365-btn--ghost"
                type="button"
                disabled={downloadingId === invoice.id}
                onClick={() => handleDownload(invoice)}
              >
                <i className="fa-light fa-download" />
                {downloadingId === invoice.id ? "Preparing..." : "PDF"}
              </button>
            </span>
          </div>
        ))}
      </div>

      <div className="operator-pagination">
        <span>{pagination ? `${pagination.totalCount} invoices` : `${items.length} invoices`}</span>
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
