/**
 * File:          SalesPipelinePage.tsx
 * Purpose:       Operator sales pipeline module for FMS.Admin.
 * Dependencies:  salesApiClient, plan and sales pipeline types
 * Last Modified: 2026-05-20
 *
 * Key Functions:
 * - SalesPipelinePage(): Lists opportunities/deals, creates deals, and records follow-ups.
 */
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { unwrapResponse } from "../api/apiClient";
import { salesApiClient } from "../api/salesApiClient";
import type { OperatorPlan, PlanListPayload } from "../types/plan";
import type { SalesPipelineItem, SalesPipelineListPayload } from "../types/salesPipeline";

const statuses = ["Pending", "Approved", "Rejected", "Provisioned", "Cancelled"];

const errorMessage = (caught: unknown, fallback: string) => {
  if (caught && typeof caught === "object" && "response" in caught) {
    const raw = (caught as { response?: { data?: { message?: string; errors?: string[] } } }).response?.data;
    return raw?.errors?.[0] || raw?.message || fallback;
  }
  return fallback;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
};

export default function SalesPipelinePage() {
  const [items, setItems] = useState<SalesPipelineItem[]>([]);
  const [plans, setPlans] = useState<OperatorPlan[]>([]);
  const [pagination, setPagination] = useState<SalesPipelineListPayload["pagination"] | null>(null);
  const [source, setSource] = useState("all");
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [followUps, setFollowUps] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ customerName: "", contactEmail: "", planId: "", currencyCode: "USD", billingCycle: "Monthly", priceOverride: "", salesRep: "" });

  useEffect(() => {
    let mounted = true;
    salesApiClient.get("/api/v1/operator/plans", { params: { pageNumber: 1, pageSize: 100, isActive: true } }).then((res) => {
      const payload = unwrapResponse<PlanListPayload>(res.data);
      if (!mounted) return;
      setPlans(payload.items || []);
      setForm((current) => ({ ...current, planId: current.planId || payload.items?.[0]?.id || "" }));
    }).catch(() => setPlans([]));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    salesApiClient
      .get("/api/v1/operator/sales-pipeline", { params: { pageNumber, pageSize: 25, source, search: search.trim() || undefined } })
      .then((res) => {
        const payload = unwrapResponse<SalesPipelineListPayload>(res.data);
        if (!mounted) return;
        setItems(payload.items || []);
        setPagination(payload.pagination || null);
      })
      .catch((caught) => {
        if (mounted) setError(errorMessage(caught, "Unable to load sales pipeline."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [pageNumber, reloadToken, search, source]);

  const createDeal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await salesApiClient.post("/api/v1/operator/sales-pipeline/deals", {
        ...form,
        priceOverride: form.priceOverride ? Number(form.priceOverride) : null,
      });
      setForm((current) => ({ ...current, customerName: "", contactEmail: "", priceOverride: "" }));
      setPageNumber(1);
      setReloadToken((current) => current + 1);
    } catch (caught) {
      setError(errorMessage(caught, "Unable to create deal."));
    } finally {
      setSaving(false);
    }
  };

  const updateDeal = async (item: SalesPipelineItem, status?: string) => {
    if (item.source !== "manual") return;
    setSaving(true);
    try {
      await salesApiClient.patch(`/api/v1/operator/sales-pipeline/deals/${item.id}`, {
        status,
        followUpNote: followUps[item.id] || null,
      });
      setFollowUps((current) => ({ ...current, [item.id]: "" }));
      setReloadToken((current) => current + 1);
    } catch (caught) {
      setError(errorMessage(caught, "Unable to update deal."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="operator-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-handshake m365-page-header__icon" />
          <h2 className="m365-page-header__title">Sales Pipeline</h2>
        </div>
      </div>

      <form className="operator-form-panel" onSubmit={createDeal}>
        <div className="operator-form-panel__grid operator-form-panel__grid--pipeline">
          <label className="m365-field">Customer<input className="m365-input" value={form.customerName} onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} required /></label>
          <label className="m365-field">Email<input className="m365-input" type="email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} required /></label>
          <label className="m365-field">Plan<select className="m365-select" value={form.planId} onChange={(event) => setForm((current) => ({ ...current, planId: event.target.value }))} required>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label>
          <label className="m365-field">Cycle<select className="m365-select" value={form.billingCycle} onChange={(event) => setForm((current) => ({ ...current, billingCycle: event.target.value }))}><option value="Monthly">Monthly</option><option value="Annual">Annual</option></select></label>
          <label className="m365-field">Currency<input className="m365-input" value={form.currencyCode} onChange={(event) => setForm((current) => ({ ...current, currencyCode: event.target.value.toUpperCase() }))} /></label>
          <label className="m365-field">Override<input className="m365-input" type="number" value={form.priceOverride} onChange={(event) => setForm((current) => ({ ...current, priceOverride: event.target.value }))} /></label>
          <label className="m365-field">Sales rep<input className="m365-input" value={form.salesRep} onChange={(event) => setForm((current) => ({ ...current, salesRep: event.target.value }))} /></label>
          <button className="m365-btn m365-btn--primary" type="submit" disabled={saving || !form.planId}><i className="fa-light fa-plus" />Add deal</button>
        </div>
      </form>

      <div className="operator-filters">
        <label className="m365-field operator-filters__search">Search<input className="m365-input" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPageNumber(1); }} /></label>
        <label className="m365-field">Source<select className="m365-select" value={source} onChange={(event) => { setSource(event.target.value); setPageNumber(1); }}><option value="all">All</option><option value="manual">Deals</option><option value="onboarding">Opportunities</option></select></label>
        <button className="m365-btn m365-btn--ghost operator-filters__refresh" type="button" onClick={() => setReloadToken((current) => current + 1)} disabled={loading}><i className="fa-light fa-rotate" />Refresh</button>
      </div>

      {error && <div className="m365-info-banner m365-info-banner--error"><i className="fa-light fa-circle-info m365-info-banner__icon" /><span className="m365-info-banner__text">{error}</span></div>}

      <div className="operator-table operator-table--pipeline">
        <div className="operator-table__header"><span>Customer</span><span>Plan</span><span>Status</span><span>Value</span><span>Created</span><span>Follow-up</span><span>Actions</span></div>
        {loading && <div className="operator-table__empty">Loading pipeline...</div>}
        {!loading && items.length === 0 && <div className="operator-table__empty">No pipeline records loaded</div>}
        {items.map((item) => (
          <div className="operator-table__row" key={`${item.source}-${item.id}`}>
            <span className="operator-table__primary">{item.customerName}<small>{item.contactEmail}</small></span>
            <span>{item.planName}</span>
            <span><span className={`operator-status operator-status--${item.status === "Approved" || item.status === "Completed" ? "active" : "inactive"}`}>{item.status}</span></span>
            <span>{item.priceOverride ? `${item.currencyCode} ${item.priceOverride}` : "—"}</span>
            <span>{formatDate(item.createdAtUtc)}</span>
            <span className="operator-follow-up-cell">
              {item.latestFollowUpNote && <small title={formatDate(item.latestFollowUpAtUtc)}>{item.latestFollowUpNote}</small>}
              {item.source === "manual" ? <input className="m365-input" value={followUps[item.id] || ""} onChange={(event) => setFollowUps((current) => ({ ...current, [item.id]: event.target.value }))} /> : "—"}
            </span>
            <span className="operator-inline-actions">
              {item.source === "manual" && <><button className="m365-btn m365-btn--ghost" type="button" disabled={saving} onClick={() => updateDeal(item)}>Note</button><select className="m365-select" value={item.status} onChange={(event) => updateDeal(item, event.target.value)} disabled={saving}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></>}
            </span>
          </div>
        ))}
      </div>

      <div className="operator-pagination">
        <span>{pagination ? `${pagination.totalCount} records` : `${items.length} records`}</span>
        <div className="operator-pagination__buttons">
          <button className="m365-btn m365-btn--ghost" type="button" disabled={loading || !pagination?.hasPrevious} onClick={() => setPageNumber((current) => Math.max(1, current - 1))}><i className="fa-light fa-chevron-left" /></button>
          <span>{pagination ? `Page ${pagination.pageNumber} of ${pagination.totalPages || 1}` : `Page ${pageNumber}`}</span>
          <button className="m365-btn m365-btn--ghost" type="button" disabled={loading || !pagination?.hasNext} onClick={() => setPageNumber((current) => current + 1)}><i className="fa-light fa-chevron-right" /></button>
        </div>
      </div>
    </div>
  );
}