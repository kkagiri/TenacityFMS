/**
 * File:          DeviceProvidersPage.tsx
 * Purpose:       Operator device-provider support page for cross-tenant management.
 * Dependencies:  React, apiClient, tenant/device-provider DTO types
 * Last Modified: 2026-05-15
 *
 * Key Functions:
 * - DeviceProvidersPage(): Lists, filters, creates, and updates provider configs.
 * - loadProviders(): Loads cross-tenant provider rows from operator API.
 * - saveProvider(): Persists operator create/update actions.
 */

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiClient, unwrapResponse } from "../api/apiClient";
import type {
  OperatorDeviceProvider,
  OperatorDeviceProviderListPayload,
  OperatorDeviceProviderMapping,
  OperatorDeviceProviderMappingListPayload,
} from "../types/deviceProvider";
import type { OperatorTenantSummary, PaginationMetadata } from "../types/tenant";

type TenantListPayload = {
  items: OperatorTenantSummary[];
  pagination: PaginationMetadata;
};

type StatusFilter = "all" | "enabled" | "disabled";

const emptyForm = {
  tenantId: "",
  providerName: "",
  displayName: "",
  description: "",
  deviceCategory: "Tracking",
  configurationData: "{}",
  isEnabled: true,
  isDefault: false,
  priorityOrder: 999,
};

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Never";
  return parsed.toLocaleString();
};

const getErrorMessage = (caught: unknown, fallback: string) =>
  caught && typeof caught === "object" && "response" in caught
    ? (
        caught as {
          response?: { data?: { message?: string; Message?: string } };
        }
      ).response?.data?.message ||
      (caught as { response?: { data?: { Message?: string } } }).response
        ?.data?.Message ||
      fallback
    : fallback;

export default function DeviceProvidersPage() {
  const [providers, setProviders] = useState<OperatorDeviceProvider[]>([]);
  const [mappings, setMappings] = useState<OperatorDeviceProviderMapping[]>([]);
  const [tenants, setTenants] = useState<OperatorTenantSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [search, setSearch] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [deviceCategory, setDeviceCategory] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editingProviderId, setEditingProviderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.providerId === editingProviderId),
    [editingProviderId, providers],
  );

  useEffect(() => {
    let isMounted = true;

    const loadTenants = async () => {
      try {
        const response = await apiClient.get("/v1/operator/tenants", {
          params: { pageNumber: 1, pageSize: 100, tenantKind: "client" },
        });
        const payload = unwrapResponse<TenantListPayload>(response.data);
        if (isMounted) setTenants(payload.items || []);
      } catch {
        if (isMounted) setTenants([]);
      }
    };

    loadTenants();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProviders = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get("/v1/operator/device-providers", {
          params: {
            pageNumber,
            pageSize: 25,
            search: search.trim() || undefined,
            tenantId: tenantId || undefined,
            deviceCategory: deviceCategory === "all" ? undefined : deviceCategory,
            isEnabled: status === "all" ? undefined : status === "enabled",
          },
        });

        const payload = unwrapResponse<OperatorDeviceProviderListPayload>(
          response.data,
        );

        if (isMounted) {
          setProviders(payload.items || []);
          setPagination(payload.pagination || null);
        }
      } catch (caught) {
        if (isMounted) {
          setError(getErrorMessage(caught, "Unable to load device providers."));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProviders();

    return () => {
      isMounted = false;
    };
  }, [deviceCategory, pageNumber, reloadToken, search, status, tenantId]);

  useEffect(() => {
    let isMounted = true;

    const loadMappings = async () => {
      try {
        const response = await apiClient.get(
          "/v1/operator/device-providers/mappings",
          {
            params: {
              tenantId: tenantId || undefined,
              search: search.trim() || undefined,
            },
          },
        );
        const payload =
          unwrapResponse<OperatorDeviceProviderMappingListPayload>(response.data);
        if (isMounted) setMappings(payload.items || []);
      } catch {
        if (isMounted) setMappings([]);
      }
    };

    loadMappings();

    return () => {
      isMounted = false;
    };
  }, [search, tenantId]);

  const resetToFirstPage = () => setPageNumber(1);

  const editProvider = (provider: OperatorDeviceProvider) => {
    setEditingProviderId(provider.providerId);
    setForm({
      tenantId: provider.tenantId,
      providerName: provider.providerName,
      displayName: provider.displayName,
      description: provider.description || "",
      deviceCategory: provider.deviceCategory,
      configurationData: provider.configurationData || "{}",
      isEnabled: provider.isEnabled,
      isDefault: provider.isDefault,
      priorityOrder: provider.priorityOrder,
    });
    setMessage(null);
    setError(null);
  };

  const resetForm = () => {
    setEditingProviderId(null);
    setForm(emptyForm);
  };

  const saveProvider = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        tenantId: form.tenantId,
        providerName: form.providerName,
        displayName: form.displayName,
        description: form.description || null,
        deviceCategory: form.deviceCategory,
        configurationData: form.configurationData || "{}",
        isEnabled: form.isEnabled,
        isDefault: form.isDefault,
        priorityOrder: Number(form.priorityOrder) || 999,
      };

      if (editingProviderId) {
        await apiClient.put(
          `/v1/operator/device-providers/${editingProviderId}`,
          payload,
        );
        setMessage("Device provider updated.");
      } else {
        await apiClient.post("/v1/operator/device-providers", payload);
        setMessage("Device provider created.");
      }

      resetForm();
      setPageNumber(1);
      setReloadToken((current) => current + 1);
    } catch (caught) {
      setError(getErrorMessage(caught, "Unable to save device provider."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="operator-page device-provider-operator-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-plug-circle-bolt m365-page-header__icon" />
          <h2 className="m365-page-header__title">Device Providers</h2>
        </div>
      </div>

      <div className="operator-filter-bar">
        <input
          className="m365-input"
          placeholder="Search providers or tenants"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            resetToFirstPage();
          }}
        />
        <select
          className="m365-select"
          value={tenantId}
          onChange={(event) => {
            setTenantId(event.target.value);
            resetToFirstPage();
          }}
        >
          <option value="">All client tenants</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
        <select
          className="m365-select"
          value={deviceCategory}
          onChange={(event) => {
            setDeviceCategory(event.target.value);
            resetToFirstPage();
          }}
        >
          <option value="all">All categories</option>
          <option value="Tracking">Tracking</option>
          <option value="Fueling">Fueling</option>
          <option value="Atg">ATG</option>
        </select>
        <select
          className="m365-select"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as StatusFilter);
            resetToFirstPage();
          }}
        >
          <option value="all">All statuses</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {message && (
        <div className="m365-info-banner">
          <i className="fa-light fa-circle-check m365-info-banner__icon" />
          <span className="m365-info-banner__text">{message}</span>
        </div>
      )}

      {error && (
        <div className="m365-info-banner m365-info-banner--error">
          <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
          <span className="m365-info-banner__text">{error}</span>
        </div>
      )}

      <div className="operator-grid operator-grid--two">
        <section className="operator-table-card">
          <div className="operator-table-card__header">
            <h3>Provider configurations</h3>
            <span>{pagination?.totalCount || providers.length} total</span>
          </div>
          <div className="operator-table-wrap">
            <table className="operator-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Provider</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Loading providers...</td>
                  </tr>
                ) : providers.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No provider configurations found.</td>
                  </tr>
                ) : (
                  providers.map((provider) => (
                    <tr key={provider.providerId}>
                      <td>
                        <strong>{provider.tenantName}</strong>
                        <span>{provider.tenantCode}</span>
                      </td>
                      <td>
                        <strong>{provider.displayName}</strong>
                        <span>{provider.providerName}</span>
                      </td>
                      <td>{provider.deviceCategory}</td>
                      <td>
                        <span
                          className={`operator-pill ${
                            provider.isEnabled ? "operator-pill--success" : ""
                          }`}
                        >
                          {provider.isEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td>{formatDate(provider.updatedAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="m365-btn m365-btn--ghost"
                          onClick={() => editProvider(provider)}
                        >
                          <i className="fa-light fa-pen-to-square" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination && (
            <div className="operator-pagination">
              <button
                className="m365-btn m365-btn--ghost"
                disabled={!pagination.hasPrevious}
                onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span>
                Page {pagination.pageNumber} of {pagination.totalPages || 1}
              </span>
              <button
                className="m365-btn m365-btn--ghost"
                disabled={!pagination.hasNext}
                onClick={() => setPageNumber((current) => current + 1)}
              >
                Next
              </button>
            </div>
          )}
        </section>

        <form className="operator-form-panel" onSubmit={saveProvider}>
          <div className="operator-table-card__header">
            <h3>{selectedProvider ? "Edit provider" : "New provider"}</h3>
          </div>
          <div className="operator-form-panel__grid operator-form-panel__grid--single">
            <label className="m365-field">
              Tenant
              <select
                className="m365-select"
                value={form.tenantId}
                disabled={!!editingProviderId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, tenantId: event.target.value }))
                }
              >
                <option value="">Select tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="m365-field">
              Provider name
              <input
                className="m365-input"
                value={form.providerName}
                disabled={!!editingProviderId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, providerName: event.target.value }))
                }
              />
            </label>
            <label className="m365-field">
              Display name
              <input
                className="m365-input"
                value={form.displayName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, displayName: event.target.value }))
                }
              />
            </label>
            <label className="m365-field">
              Category
              <select
                className="m365-select"
                value={form.deviceCategory}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    deviceCategory: event.target.value,
                  }))
                }
              >
                <option value="Tracking">Tracking</option>
                <option value="Fueling">Fueling</option>
                <option value="Atg">ATG</option>
              </select>
            </label>
            <label className="m365-field">
              Priority
              <input
                className="m365-input"
                type="number"
                min="1"
                value={form.priorityOrder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priorityOrder: Number(event.target.value) || 999,
                  }))
                }
              />
            </label>
            <label className="m365-field">
              Description
              <input
                className="m365-input"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <label className="m365-field">
              Configuration JSON
              <textarea
                className="operator-textarea"
                value={form.configurationData}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    configurationData: event.target.value,
                  }))
                }
              />
            </label>
            <div className="operator-check-row">
              <label className="operator-checkbox">
                <input
                  type="checkbox"
                  checked={form.isEnabled}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isEnabled: event.target.checked,
                    }))
                  }
                />
                Enabled
              </label>
              <label className="operator-checkbox">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isDefault: event.target.checked,
                    }))
                  }
                />
                Default
              </label>
            </div>
            <div className="operator-form-panel__actions">
              <button className="m365-btn m365-btn--primary" disabled={saving}>
                <i className="fa-light fa-floppy-disk" />
                Save
              </button>
              <button type="button" className="m365-btn m365-btn--ghost" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      <section className="operator-table-card">
        <div className="operator-table-card__header">
          <h3>Recent mappings</h3>
          <span>{mappings.length} shown</span>
        </div>
        <div className="operator-table-wrap">
          <table className="operator-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Provider</th>
                <th>Device</th>
                <th>FMS target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((mapping) => (
                <tr key={mapping.mappingId}>
                  <td>{mapping.tenantName}</td>
                  <td>{mapping.providerName}</td>
                  <td>
                    <strong>{mapping.deviceName || mapping.externalDeviceId || "Not set"}</strong>
                    <span>{mapping.deviceIMEI || mapping.deviceType || mapping.deviceCategory}</span>
                  </td>
                  <td>
                    {mapping.vehicleId
                      ? `Vehicle ${mapping.vehicleId}`
                      : mapping.fuelingDeviceId
                        ? `Fueling device ${mapping.fuelingDeviceId}`
                        : "Unassigned"}
                  </td>
                  <td>
                    <span
                      className={`operator-pill ${
                        mapping.isActive ? "operator-pill--success" : ""
                      }`}
                    >
                      {mapping.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
