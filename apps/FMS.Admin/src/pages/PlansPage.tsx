/**
 * File:          PlansPage.tsx
 * Purpose:       Operator plans and pricing CRUD module for FMS.Admin.
 * Dependencies:  salesApiClient, plan types
 * Last Modified: 2026-05-20
 *
 * Key Functions:
 * - PlansPage(): Lists, creates, edits, and saves plan pricing/quotas/features.
 */
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { unwrapResponse } from "../api/apiClient";
import { salesApiClient } from "../api/salesApiClient";
import type { OperatorPlan, PlanListPayload } from "../types/plan";

const emptyForm = {
  id: "",
  code: "",
  name: "",
  description: "",
  sortOrder: 0,
  isActive: true,
  isPublic: true,
  pricesText: "USD,Monthly,0\nUSD,Annual,0",
  quotasText: "Sites,1\nUsers,5\nVehicles,10",
  featuresText: "hasRealtime=true\nhasAdvancedReports=false",
};

const errorMessage = (caught: unknown, fallback: string) => {
  if (caught && typeof caught === "object" && "response" in caught) {
    const raw = (caught as { response?: { data?: { message?: string; errors?: string[] } } }).response?.data;
    return raw?.errors?.[0] || raw?.message || fallback;
  }
  return fallback;
};

const toPriceLines = (plan: OperatorPlan) => plan.prices.map((p) => `${p.currencyCode},${p.billingCycle},${p.amount}`).join("\n");
const toQuotaLines = (plan: OperatorPlan) => plan.quotas.map((q) => `${q.metric},${q.includedUnits}`).join("\n");
const toFeatureLines = (plan: OperatorPlan) => plan.features.map((f) => `${f.featureKey}=${f.featureValue}`).join("\n");

const parseCsvLines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const buildPayload = (form: typeof emptyForm) => ({
  code: form.code,
  name: form.name,
  description: form.description || null,
  sortOrder: Number(form.sortOrder) || 0,
  isActive: form.isActive,
  isPublic: form.isPublic,
  prices: parseCsvLines(form.pricesText).map((line) => {
    const [currencyCode, billingCycle, amount] = line.split(",").map((part) => part.trim());
    return { currencyCode, billingCycle, amount: Number(amount) || 0, isActive: true };
  }),
  quotas: parseCsvLines(form.quotasText).map((line) => {
    const [metric, includedUnits] = line.split(",").map((part) => part.trim());
    return { metric, includedUnits: Number(includedUnits) || 0 };
  }),
  features: parseCsvLines(form.featuresText).map((line) => {
    const [featureKey, ...rest] = line.split("=");
    return { featureKey: featureKey.trim(), featureValue: rest.join("=").trim() || "true" };
  }),
});

export default function PlansPage() {
  const [items, setItems] = useState<OperatorPlan[]>([]);
  const [pagination, setPagination] = useState<PlanListPayload["pagination"] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    salesApiClient
      .get("/api/v1/operator/plans", { params: { pageNumber, pageSize: 25, search: search.trim() || undefined } })
      .then((res) => {
        const payload = unwrapResponse<PlanListPayload>(res.data);
        if (!mounted) return;
        setItems(payload.items || []);
        setPagination(payload.pagination || null);
      })
      .catch((caught) => {
        if (mounted) setError(errorMessage(caught, "Unable to load plans."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [pageNumber, reloadToken, search]);

  const editPlan = (plan: OperatorPlan) => {
    setForm({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description || "",
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      pricesText: toPriceLines(plan),
      quotasText: toQuotaLines(plan),
      featuresText: toFeatureLines(plan),
    });
  };

  const savePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload(form);
      if (form.id) {
        await salesApiClient.put(`/api/v1/operator/plans/${form.id}`, payload);
      } else {
        await salesApiClient.post("/api/v1/operator/plans", payload);
      }
      setForm(emptyForm);
      setReloadToken((current) => current + 1);
    } catch (caught) {
      setError(errorMessage(caught, "Unable to save plan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="operator-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-tags m365-page-header__icon" />
          <h2 className="m365-page-header__title">Plans & Pricing</h2>
        </div>
        <div className="m365-page-header__actions">
          <button className="m365-btn m365-btn--ghost" type="button" onClick={() => setForm(emptyForm)}>
            <i className="fa-light fa-plus" />
            New plan
          </button>
        </div>
      </div>

      <form className="operator-form-panel" onSubmit={savePlan}>
        <div className="operator-form-panel__grid operator-form-panel__grid--plans">
          <label className="m365-field">Code<input className="m365-input" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} required /></label>
          <label className="m365-field">Name<input className="m365-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
          <label className="m365-field">Sort<input className="m365-input" type="number" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} /></label>
          <label className="operator-checkbox operator-checkbox--field"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />Active</label>
          <label className="operator-checkbox operator-checkbox--field"><input type="checkbox" checked={form.isPublic} onChange={(event) => setForm((current) => ({ ...current, isPublic: event.target.checked }))} />Public</label>
        </div>
        <label className="m365-field">Description<input className="m365-input" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
        <div className="operator-form-panel__grid operator-form-panel__grid--triple-textarea">
          <label className="m365-field">Prices<textarea className="operator-textarea" value={form.pricesText} onChange={(event) => setForm((current) => ({ ...current, pricesText: event.target.value }))} /></label>
          <label className="m365-field">Quotas<textarea className="operator-textarea" value={form.quotasText} onChange={(event) => setForm((current) => ({ ...current, quotasText: event.target.value }))} /></label>
          <label className="m365-field">Feature flags<textarea className="operator-textarea" value={form.featuresText} onChange={(event) => setForm((current) => ({ ...current, featuresText: event.target.value }))} /></label>
        </div>
        <div className="operator-form-panel__actions">
          <button className="m365-btn m365-btn--primary" type="submit" disabled={saving}><i className="fa-light fa-floppy-disk" />{form.id ? "Save plan" : "Create plan"}</button>
        </div>
      </form>

      <div className="operator-filters">
        <label className="m365-field operator-filters__search">Search<input className="m365-input" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPageNumber(1); }} /></label>
        <button className="m365-btn m365-btn--ghost operator-filters__refresh" type="button" onClick={() => setReloadToken((current) => current + 1)} disabled={loading}><i className="fa-light fa-rotate" />Refresh</button>
      </div>

      {error && <div className="m365-info-banner m365-info-banner--error"><i className="fa-light fa-circle-info m365-info-banner__icon" /><span className="m365-info-banner__text">{error}</span></div>}

      <div className="operator-table operator-table--plans">
        <div className="operator-table__header"><span>Plan</span><span>Status</span><span>Prices</span><span>Quotas</span><span>Features</span><span>Actions</span></div>
        {loading && <div className="operator-table__empty">Loading plans...</div>}
        {!loading && items.length === 0 && <div className="operator-table__empty">No plans loaded</div>}
        {items.map((plan) => (
          <div className="operator-table__row" key={plan.id}>
            <span className="operator-table__primary">{plan.name}<small>{plan.code}</small></span>
            <span><span className={`operator-status operator-status--${plan.isActive ? "active" : "inactive"}`}>{plan.isActive ? "Active" : "Inactive"}</span></span>
            <span>{plan.prices.map((price) => `${price.currencyCode} ${price.billingCycle}: ${price.amount}`).join(", ") || "—"}</span>
            <span>{plan.quotas.map((quota) => `${quota.metric}: ${quota.includedUnits}`).join(", ") || "—"}</span>
            <span>{plan.features.length}</span>
            <span><button className="m365-btn m365-btn--ghost" type="button" onClick={() => editPlan(plan)}>Edit</button></span>
          </div>
        ))}
      </div>

      <div className="operator-pagination">
        <span>{pagination ? `${pagination.totalCount} plans` : `${items.length} plans`}</span>
        <div className="operator-pagination__buttons">
          <button className="m365-btn m365-btn--ghost" type="button" disabled={loading || !pagination?.hasPrevious} onClick={() => setPageNumber((current) => Math.max(1, current - 1))}><i className="fa-light fa-chevron-left" /></button>
          <span>{pagination ? `Page ${pagination.pageNumber} of ${pagination.totalPages || 1}` : `Page ${pageNumber}`}</span>
          <button className="m365-btn m365-btn--ghost" type="button" disabled={loading || !pagination?.hasNext} onClick={() => setPageNumber((current) => current + 1)}><i className="fa-light fa-chevron-right" /></button>
        </div>
      </div>
    </div>
  );
}