/**
 * File:          ReportsPage.tsx
 * Purpose:       Cross-tenant usage and revenue reporting page.
 * Dependencies:  React, apiClient, salesApiClient
 * Last Modified: 2026-05-20
 *
 * Key Functions:
 * - ReportsPage(): Fetches usage/revenue reports and renders filters, charts, CSV/PDF exports.
 */

import { useEffect, useMemo, useState } from "react";
import { apiClient, unwrapResponse } from "../api/apiClient";
import { salesApiClient } from "../api/salesApiClient";
import type {
  RevenueReportPayload,
  RevenueReportRow,
  UsageReportPayload,
  UsageReportRow,
} from "../types/reports";
import type { OperatorTenantSummary } from "../types/tenant";

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });

const escapeCsv = (value: string | number | null | undefined) => {
  const raw = value == null ? "" : String(value);
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
};

const downloadText = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const MetricBars = ({
  title,
  rows,
  value,
  formatter = (n: number) => formatNumber(n),
}: {
  title: string;
  rows: Array<{ id: string; label: string; value: number }>;
  value?: string;
  formatter?: (value: number) => string;
}) => {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="operator-chart-card">
      <div className="operator-chart-card__header">
        <h3>{title}</h3>
        {value && <span>{value}</span>}
      </div>
      <div className="operator-bar-chart">
        {rows.length === 0 && <div className="operator-table__empty">No data loaded</div>}
        {rows.slice(0, 8).map((row) => (
          <div className="operator-bar-chart__row" key={row.id}>
            <span title={row.label}>{row.label}</span>
            <div className="operator-bar-chart__track">
              <div
                className="operator-bar-chart__bar"
                style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
              />
            </div>
            <strong>{formatter(row.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const [from, setFrom] = useState(() => toDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(() => toDateInput(new Date()));
  const [tenantFilter, setTenantFilter] = useState("");
  const [tenants, setTenants] = useState<OperatorTenantSummary[]>([]);
  const [usage, setUsage] = useState<UsageReportPayload | null>(null);
  const [revenue, setRevenue] = useState<RevenueReportPayload | null>(null);
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

    const params = {
      from: from || undefined,
      to: to || undefined,
      tenantId: tenantFilter || undefined,
    };

    Promise.all([
      apiClient.get("/v1/operator/reports/usage", { params }),
      salesApiClient.get("/api/v1/operator/reports/revenue", { params }),
    ])
      .then(([usageRes, revenueRes]) => {
        if (!mounted) return;
        setUsage(unwrapResponse<UsageReportPayload>(usageRes.data));
        setRevenue(unwrapResponse<RevenueReportPayload>(revenueRes.data));
      })
      .catch(() => {
        if (mounted) setError("Unable to load cross-tenant reports.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [from, to, tenantFilter, reloadToken]);

  const tenantName = useMemo(() => {
    const lookup: Record<string, string> = {};
    tenants.forEach((tenant) => {
      lookup[tenant.id] = tenant.name || tenant.code;
    });
    return (id: string) => lookup[id] || id;
  }, [tenants]);

  const reportRows = useMemo(() => {
    const usageByTenant: Record<string, UsageReportRow> = {};
    const revenueByTenant: Record<string, RevenueReportRow> = {};
    (usage?.items || []).forEach((row) => {
      usageByTenant[row.tenantId] = row;
    });
    (revenue?.items || []).forEach((row) => {
      revenueByTenant[row.tenantId] = row;
    });

    const tenantIds = Array.from(
      new Set([...Object.keys(usageByTenant), ...Object.keys(revenueByTenant)]),
    );

    return tenantIds.map((id) => {
      const usageRow = usageByTenant[id];
      const revenueRow = revenueByTenant[id];

      return {
        tenantId: id,
        tenantCode: usageRow?.tenantCode || id,
        tenantName: usageRow?.tenantName || tenantName(id),
        tenantKind: usageRow?.tenantKind || "client",
        fuelVolume: usageRow?.fuelVolume || 0,
        transactionCount: usageRow?.transactionCount || 0,
        activeDeviceCount: usageRow?.activeDeviceCount || 0,
        revenueTotal: revenueRow?.total || 0,
        amountPaid: revenueRow?.amountPaid || 0,
        invoiceCount: revenueRow?.invoiceCount || 0,
      };
    });
  }, [usage, revenue, tenantName]);

  const exportCsv = () => {
    const header = [
      "Tenant",
      "Tenant Code",
      "Fuel Volume",
      "Transactions",
      "Active Devices",
      "Invoices",
      "Revenue Total",
      "Amount Paid",
    ];
    const rows = reportRows.map((row) => [
      row.tenantName,
      row.tenantCode,
      row.fuelVolume,
      row.transactionCount,
      row.activeDeviceCount,
      row.invoiceCount,
      row.revenueTotal,
      row.amountPaid,
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    downloadText(csv, `cross-tenant-reports-${from}-to-${to}.csv`, "text/csv;charset=utf-8");
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <div className="operator-page operator-report-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-chart-line m365-page-header__icon" />
          <h2 className="m365-page-header__title">Cross-tenant reports</h2>
        </div>
        <div className="m365-page-header__actions">
          <button className="m365-btn m365-btn--ghost" type="button" onClick={exportCsv} disabled={!reportRows.length}>
            <i className="fa-light fa-file-csv" />
            CSV
          </button>
          <button className="m365-btn m365-btn--ghost" type="button" onClick={exportPdf} disabled={!reportRows.length}>
            <i className="fa-light fa-file-pdf" />
            PDF
          </button>
        </div>
      </div>

      <div className="operator-filters">
        <label className="m365-field">
          Tenant
          <select className="m365-select" value={tenantFilter} onChange={(event) => setTenantFilter(event.target.value)}>
            <option value="">All tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </label>
        <label className="m365-field">
          From
          <input className="m365-input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="m365-field">
          To
          <input className="m365-input" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <button className="m365-btn m365-btn--ghost operator-filters__refresh" type="button" onClick={() => setReloadToken((c) => c + 1)} disabled={loading}>
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

      <div className="operator-summary-grid">
        <div className="operator-summary-tile">
          <i className="fa-light fa-gas-pump" />
          <div>
            <div className="operator-summary-tile__value">{formatNumber(usage?.totals.fuelVolume || 0, 1)}</div>
            <div className="operator-summary-tile__label">Fuel volume</div>
          </div>
        </div>
        <div className="operator-summary-tile">
          <i className="fa-light fa-receipt" />
          <div>
            <div className="operator-summary-tile__value">{formatNumber(revenue?.totals.total || 0, 2)}</div>
            <div className="operator-summary-tile__label">Revenue total</div>
          </div>
        </div>
        <div className="operator-summary-tile">
          <i className="fa-light fa-microchip" />
          <div>
            <div className="operator-summary-tile__value">{formatNumber(usage?.totals.activeDeviceCount || 0)}</div>
            <div className="operator-summary-tile__label">Active devices</div>
          </div>
        </div>
      </div>

      <div className="operator-chart-grid">
        <MetricBars
          title="Consumption"
          rows={reportRows.map((row) => ({ id: row.tenantId, label: row.tenantName, value: row.fuelVolume }))}
          formatter={(value) => formatNumber(value, 1)}
        />
        <MetricBars
          title="Revenue"
          rows={reportRows.map((row) => ({ id: row.tenantId, label: tenantName(row.tenantId), value: row.revenueTotal }))}
          formatter={(value) => formatNumber(value, 2)}
        />
        <MetricBars
          title="Device activity"
          rows={reportRows.map((row) => ({ id: row.tenantId, label: row.tenantName, value: row.activeDeviceCount }))}
        />
      </div>

      <div className="operator-table-card">
        <div className="operator-table-card__header">
          <h3>Tenant metrics</h3>
          <span>{loading ? "Loading..." : `${reportRows.length} tenants`}</span>
        </div>
        <div className="operator-table-wrap">
          <table className="operator-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Fuel volume</th>
                <th>Transactions</th>
                <th>Devices</th>
                <th>Invoices</th>
                <th>Revenue</th>
                <th>Paid</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map((row) => (
                <tr key={row.tenantId}>
                  <td>
                    <strong>{row.tenantName}</strong>
                    <span>{row.tenantCode}</span>
                  </td>
                  <td>{formatNumber(row.fuelVolume, 1)}</td>
                  <td>{formatNumber(row.transactionCount)}</td>
                  <td>{formatNumber(row.activeDeviceCount)}</td>
                  <td>{formatNumber(row.invoiceCount)}</td>
                  <td>{formatNumber(row.revenueTotal, 2)}</td>
                  <td>{formatNumber(row.amountPaid, 2)}</td>
                </tr>
              ))}
              {!loading && reportRows.length === 0 && (
                <tr>
                  <td colSpan={7}>No report data loaded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
