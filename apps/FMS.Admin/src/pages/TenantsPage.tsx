/**
 * File:          TenantsPage.tsx
 * Purpose:       Operator tenant list page for FMS.Admin.
 * Dependencies:  apiClient, tenant types
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - TenantsPage(): Loads cross-tenant tenant rows with filters and paging.
 */

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/apiClient";
import type {
  OperatorTenantSummary,
  PaginationMetadata,
  TenantKind,
} from "../types/tenant";

type FmsPagedEnvelope<T> = {
  data?: T;
  Data?: T;
  pagination?: PaginationMetadata;
  Pagination?: PaginationMetadata;
  message?: string;
  Message?: string;
};

type TenantKindFilter = TenantKind | "all";
type StatusFilter = "all" | "active" | "inactive";

const formatTenantKind = (kind: string) =>
  kind.charAt(0).toUpperCase() + kind.slice(1);

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
};

const readPagedEnvelope = <T,>(payload: FmsPagedEnvelope<T>) => ({
  data: payload.data ?? payload.Data,
  pagination: payload.pagination ?? payload.Pagination,
  message: payload.message ?? payload.Message,
});

export default function TenantsPage() {
  const [tenants, setTenants] = useState<OperatorTenantSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [search, setSearch] = useState("");
  const [tenantKind, setTenantKind] = useState<TenantKindFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: "",
    name: "",
    logoUrl: "",
    primaryColor: "",
    secondaryColor: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadTenants = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<
          FmsPagedEnvelope<OperatorTenantSummary[]>
        >("/v1/operator/tenants", {
          params: {
            pageNumber,
            pageSize: 25,
            search: search.trim() || undefined,
            tenantKind: tenantKind === "all" ? undefined : tenantKind,
            isActive: status === "all" ? undefined : status === "active",
          },
        });

        const payload = readPagedEnvelope(response.data);
        if (isMounted) {
          setTenants(payload.data || []);
          setPagination(payload.pagination || null);
        }
      } catch (caught) {
        const message =
          caught && typeof caught === "object" && "response" in caught
            ? (
                caught as {
                  response?: { data?: { message?: string; Message?: string } };
                }
              ).response?.data?.message ||
              (caught as { response?: { data?: { Message?: string } } })
                .response?.data?.Message
            : null;
        if (isMounted) setError(message || "Unable to load tenants.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTenants();

    return () => {
      isMounted = false;
    };
  }, [pageNumber, reloadToken, search, status, tenantKind]);

  const resetToFirstPage = () => setPageNumber(1);

  const handleCreateTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      await apiClient.post("/v1/operator/tenants", {
        code: createForm.code,
        name: createForm.name,
        logoUrl: createForm.logoUrl || null,
        primaryColor: createForm.primaryColor || null,
        secondaryColor: createForm.secondaryColor || null,
      });
      setCreateForm({
        code: "",
        name: "",
        logoUrl: "",
        primaryColor: "",
        secondaryColor: "",
      });
      setShowCreateForm(false);
      setPageNumber(1);
      setReloadToken((current) => current + 1);
    } catch (caught) {
      const message =
        caught && typeof caught === "object" && "response" in caught
          ? (
              caught as {
                response?: { data?: { message?: string; Message?: string } };
              }
            ).response?.data?.message ||
            (caught as { response?: { data?: { Message?: string } } }).response
              ?.data?.Message
          : null;
      setCreateError(message || "Unable to create tenant.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="operator-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-building m365-page-header__icon" />
          <h2 className="m365-page-header__title">Tenants</h2>
        </div>
        <div className="m365-page-header__actions">
          <button
            className="m365-btn m365-btn--primary"
            type="button"
            onClick={() => setShowCreateForm((visible) => !visible)}
          >
            <i className="fa-light fa-plus" />
            New tenant
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form className="operator-form-panel" onSubmit={handleCreateTenant}>
          <div className="operator-form-panel__grid">
            <label className="m365-field">
              Code
              <input
                className="m365-input"
                value={createForm.code}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="m365-field">
              Name
              <input
                className="m365-input"
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="m365-field">
              Logo URL
              <input
                className="m365-input"
                value={createForm.logoUrl}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    logoUrl: event.target.value,
                  }))
                }
              />
            </label>
            <label className="m365-field">
              Primary color
              <input
                className="m365-input"
                value={createForm.primaryColor}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    primaryColor: event.target.value,
                  }))
                }
                placeholder="#0078d4"
              />
            </label>
            <label className="m365-field">
              Secondary color
              <input
                className="m365-input"
                value={createForm.secondaryColor}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    secondaryColor: event.target.value,
                  }))
                }
                placeholder="#605e5c"
              />
            </label>
          </div>

          {createError && (
            <div className="m365-info-banner m365-info-banner--error">
              <i className="fa-light fa-circle-info m365-info-banner__icon" />
              <span className="m365-info-banner__text">{createError}</span>
            </div>
          )}

          <div className="operator-form-panel__actions">
            <button
              className="m365-btn m365-btn--ghost"
              type="button"
              onClick={() => setShowCreateForm(false)}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              className="m365-btn m365-btn--primary"
              type="submit"
              disabled={creating}
            >
              <i className="fa-light fa-floppy-disk" />
              {creating ? "Creating..." : "Create tenant"}
            </button>
          </div>
        </form>
      )}

      <div className="operator-filters">
        <label className="m365-field operator-filters__search">
          Search
          <input
            className="m365-input"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetToFirstPage();
            }}
          />
        </label>

        <label className="m365-field">
          Kind
          <select
            className="m365-select"
            value={tenantKind}
            onChange={(event) => {
              setTenantKind(event.target.value as TenantKindFilter);
              resetToFirstPage();
            }}
          >
            <option value="all">All</option>
            <option value="system">System</option>
            <option value="client">Client</option>
            <option value="customer">Customer</option>
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
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <button
          className="m365-btn m365-btn--ghost operator-filters__refresh"
          type="button"
          onClick={() => setPageNumber(1)}
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

      <div className="operator-table operator-table--tenants">
        <div className="operator-table__header">
          <span>Name</span>
          <span>Code</span>
          <span>Kind</span>
          <span>Status</span>
          <span>Children</span>
          <span>Created</span>
        </div>
        {loading && (
          <div className="operator-table__empty">Loading tenants...</div>
        )}
        {!loading && tenants.length === 0 && (
          <div className="operator-table__empty">No tenants loaded</div>
        )}
        {tenants.map((tenant) => (
          <div className="operator-table__row" key={tenant.id}>
            <span className="operator-table__primary">
              <Link to={`/tenants/${tenant.id}`}>{tenant.name}</Link>
            </span>
            <span>{tenant.code}</span>
            <span>{formatTenantKind(tenant.tenantKind)}</span>
            <span>
              <span
                className={`operator-status operator-status--${tenant.isActive ? "active" : "inactive"}`}
              >
                {tenant.isActive ? "Active" : "Inactive"}
              </span>
            </span>
            <span>{tenant.childrenCount}</span>
            <span>{formatDate(tenant.createdAt)}</span>
          </div>
        ))}
      </div>

      <div className="operator-pagination">
        <span>
          {pagination
            ? `${pagination.totalCount} tenants`
            : `${tenants.length} tenants`}
        </span>
        <div className="operator-pagination__buttons">
          <button
            className="m365-btn m365-btn--ghost"
            type="button"
            disabled={loading || !pagination?.hasPrevious}
            onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
          >
            <i className="fa-light fa-chevron-left" />
          </button>
          <span>
            {pagination
              ? `Page ${pagination.pageNumber} of ${pagination.totalPages || 1}`
              : `Page ${pageNumber}`}
          </span>
          <button
            className="m365-btn m365-btn--ghost"
            type="button"
            disabled={loading || !pagination?.hasNext}
            onClick={() => setPageNumber((current) => current + 1)}
          >
            <i className="fa-light fa-chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
