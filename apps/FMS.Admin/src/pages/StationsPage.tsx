/**
 * File:          StationsPage.tsx
 * Purpose:       Operator station provisioning module for FMS.Admin.
 * Dependencies:  apiClient, tenant/station types
 * Last Modified: 2026-05-20
 *
 * Key Functions:
 * - StationsPage(): Lists, filters, creates, and toggles tenant stations.
 */
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiClient, unwrapResponse } from "../api/apiClient";
import type { OperatorStation, StationListPayload } from "../types/station";
import type { OperatorTenantSummary } from "../types/tenant";

const errorMessage = (caught: unknown, fallback: string) => {
  if (caught && typeof caught === "object" && "response" in caught) {
    const raw = (caught as { response?: { data?: { message?: string; Message?: string } } }).response?.data;
    return raw?.message || raw?.Message || fallback;
  }
  return fallback;
};

export default function StationsPage() {
  const [items, setItems] = useState<OperatorStation[]>([]);
  const [tenants, setTenants] = useState<OperatorTenantSummary[]>([]);
  const [pagination, setPagination] = useState<StationListPayload["pagination"] | null>(null);
  const [tenantId, setTenantId] = useState("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [form, setForm] = useState({ tenantId: "", name: "", isActive: true, gpsGateTagName: "" });

  useEffect(() => {
    let mounted = true;
    apiClient
      .get("/v1/operator/tenants", { params: { pageNumber: 1, pageSize: 100, tenantKind: "client", isActive: true } })
      .then((res) => {
        const payload = unwrapResponse<{ items: OperatorTenantSummary[] }>(res.data);
        if (!mounted) return;
        setTenants(payload.items || []);
        setForm((current) => ({ ...current, tenantId: current.tenantId || payload.items?.[0]?.id || "" }));
      })
      .catch(() => setTenants([]));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    apiClient
      .get("/v1/operator/stations", {
        params: {
          pageNumber,
          pageSize: 25,
          tenantId: tenantId === "all" ? undefined : tenantId,
          search: search.trim() || undefined,
          isActive: status === "all" ? undefined : status === "active",
        },
      })
      .then((res) => {
        const payload = unwrapResponse<StationListPayload>(res.data);
        if (!mounted) return;
        setItems(payload.items || []);
        setPagination(payload.pagination || null);
      })
      .catch((caught) => {
        if (mounted) setError(errorMessage(caught, "Unable to load stations."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [pageNumber, reloadToken, search, status, tenantId]);

  const tenantsById = useMemo(() => {
    const map: Record<string, OperatorTenantSummary> = {};
    for (const tenant of tenants) map[tenant.id] = tenant;
    return map;
  }, [tenants]);

  const tenantLabel = (id: string, fallback?: string | null) => fallback || tenantsById[id]?.name || id;

  const createStation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post("/v1/operator/stations", {
        tenantId: form.tenantId,
        name: form.name,
        isActive: form.isActive,
        gpsGateTagName: form.gpsGateTagName || null,
      });
      setForm((current) => ({ ...current, name: "", gpsGateTagName: "" }));
      setPageNumber(1);
      setReloadToken((current) => current + 1);
    } catch (caught) {
      setError(errorMessage(caught, "Unable to create station."));
    } finally {
      setSaving(false);
    }
  };

  const toggleStation = async (station: OperatorStation) => {
    setSaving(true);
    try {
      await apiClient.patch(`/v1/operator/stations/${station.id}`, { isActive: !station.isActive });
      setReloadToken((current) => current + 1);
    } catch (caught) {
      setError(errorMessage(caught, "Unable to update station."));
    } finally {
      setSaving(false);
    }
  };

  const resetToFirstPage = () => setPageNumber(1);

  return (
    <div className="operator-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-location-dot m365-page-header__icon" />
          <h2 className="m365-page-header__title">Stations</h2>
        </div>
      </div>

      <form className="operator-form-panel" onSubmit={createStation}>
        <div className="operator-form-panel__grid operator-form-panel__grid--station">
          <label className="m365-field">
            Tenant
            <select className="m365-select" value={form.tenantId} onChange={(event) => setForm((current) => ({ ...current, tenantId: event.target.value }))} required>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </label>
          <label className="m365-field">
            Station name
            <input className="m365-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </label>
          <label className="m365-field">
            GPSGate tag
            <input className="m365-input" value={form.gpsGateTagName} onChange={(event) => setForm((current) => ({ ...current, gpsGateTagName: event.target.value }))} />
          </label>
          <label className="operator-checkbox operator-checkbox--field">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
            Active
          </label>
          <button className="m365-btn m365-btn--primary" type="submit" disabled={saving || !form.tenantId}>
            <i className="fa-light fa-plus" />
            Add station
          </button>
        </div>
      </form>

      <div className="operator-filters">
        <label className="m365-field operator-filters__search">
          Search
          <input className="m365-input" type="search" value={search} onChange={(event) => { setSearch(event.target.value); resetToFirstPage(); }} />
        </label>
        <label className="m365-field">
          Tenant
          <select className="m365-select" value={tenantId} onChange={(event) => { setTenantId(event.target.value); resetToFirstPage(); }}>
            <option value="all">All</option>
            {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
          </select>
        </label>
        <label className="m365-field">
          Status
          <select className="m365-select" value={status} onChange={(event) => { setStatus(event.target.value as "all" | "active" | "inactive"); resetToFirstPage(); }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button className="m365-btn m365-btn--ghost operator-filters__refresh" type="button" onClick={() => setReloadToken((current) => current + 1)} disabled={loading}>
          <i className="fa-light fa-rotate" />
          Refresh
        </button>
      </div>

      {error && <div className="m365-info-banner m365-info-banner--error"><i className="fa-light fa-circle-info m365-info-banner__icon" /><span className="m365-info-banner__text">{error}</span></div>}

      <div className="operator-table operator-table--stations">
        <div className="operator-table__header"><span>Station</span><span>Tenant</span><span>Status</span><span>Tanks</span><span>Vehicles</span><span>GPS tag</span><span>Actions</span></div>
        {loading && <div className="operator-table__empty">Loading stations...</div>}
        {!loading && items.length === 0 && <div className="operator-table__empty">No stations loaded</div>}
        {items.map((station) => (
          <div className="operator-table__row" key={station.id}>
            <span className="operator-table__primary">{station.name}</span>
            <span>{tenantLabel(station.tenantId, station.tenantName)}</span>
            <span><span className={`operator-status operator-status--${station.isActive ? "active" : "inactive"}`}>{station.isActive ? "Active" : "Inactive"}</span></span>
            <span>{station.tankCount}</span>
            <span>{station.vehicleCount}</span>
            <span>{station.gpsGateTagName || "—"}</span>
            <span><button className="m365-btn m365-btn--ghost" type="button" onClick={() => toggleStation(station)} disabled={saving}>{station.isActive ? "Disable" : "Enable"}</button></span>
          </div>
        ))}
      </div>

      <div className="operator-pagination">
        <span>{pagination ? `${pagination.totalCount} stations` : `${items.length} stations`}</span>
        <div className="operator-pagination__buttons">
          <button className="m365-btn m365-btn--ghost" type="button" disabled={loading || !pagination?.hasPrevious} onClick={() => setPageNumber((current) => Math.max(1, current - 1))}><i className="fa-light fa-chevron-left" /></button>
          <span>{pagination ? `Page ${pagination.pageNumber} of ${pagination.totalPages || 1}` : `Page ${pageNumber}`}</span>
          <button className="m365-btn m365-btn--ghost" type="button" disabled={loading || !pagination?.hasNext} onClick={() => setPageNumber((current) => current + 1)}><i className="fa-light fa-chevron-right" /></button>
        </div>
      </div>
    </div>
  );
}