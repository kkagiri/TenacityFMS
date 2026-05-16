/**
 * File:          OperatorUsersPage.tsx
 * Purpose:       Operator-portal page for managing platform operator users.
 *                Lists users in the _platform tenant; supports create + activate/deactivate.
 *                Mirrors the TenantsPage structure (local state, axios, m365 css grid table).
 * Last Modified: 2026-05-16
 */

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiClient, unwrapResponse } from "../api/apiClient";
import type {
  CreateOperatorUserPayload,
  OperatorUserListPayload,
  OperatorUserSummary,
} from "../types/operatorUser";

type StatusFilter = "all" | "active" | "inactive";

const EMPTY_CREATE: CreateOperatorUserPayload = {
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  roleName: "PlatformOperator",
  sendOnboardingEmail: true,
};

const errorMessage = (caught: unknown, fallback: string) => {
  if (caught && typeof caught === "object" && "response" in caught) {
    const raw = (caught as { response?: { data?: { message?: string; Message?: string } } })
      .response?.data?.message ?? (caught as { response?: { data?: { Message?: string } } }).response?.data?.Message;
    if (raw) return raw;
  }
  return fallback;
};

export default function OperatorUsersPage() {
  const [items, setItems] = useState<OperatorUserSummary[]>([]);
  const [pagination, setPagination] = useState<OperatorUserListPayload["pagination"] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateOperatorUserPayload>(EMPTY_CREATE);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [tempPasswordReveal, setTempPasswordReveal] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    apiClient
      .get("/v1/operator/users", {
        params: {
          pageNumber,
          pageSize: 25,
          search: search.trim() || undefined,
          isActive: status === "all" ? undefined : status === "active",
        },
      })
      .then((res) => {
        const payload = unwrapResponse<OperatorUserListPayload>(res.data);
        if (!mounted) return;
        setItems(payload.items || []);
        setPagination(payload.pagination || null);
      })
      .catch((caught) => {
        if (mounted) setError(errorMessage(caught, "Unable to load operator users."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [pageNumber, reloadToken, search, status]);

  const resetToFirstPage = () => setPageNumber(1);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    setTempPasswordReveal(null);

    try {
      const res = await apiClient.post("/v1/operator/users", {
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        firstName: createForm.firstName?.trim() || null,
        lastName: createForm.lastName?.trim() || null,
        roleName: createForm.roleName?.trim() || "PlatformOperator",
        sendOnboardingEmail: createForm.sendOnboardingEmail ?? true,
      });
      const payload = res.data ?? {};
      const temp = payload?.data?.temporaryPassword ?? payload?.Data?.TemporaryPassword;
      if (temp) {
        setTempPasswordReveal(String(temp));
      }
      setCreateForm(EMPTY_CREATE);
      setShowCreateForm(false);
      setReloadToken((c) => c + 1);
    } catch (caught) {
      setCreateError(errorMessage(caught, "Unable to create operator user."));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (row: OperatorUserSummary) => {
    try {
      await apiClient.patch(`/v1/operator/users/${row.id}`, { isActive: !row.isActive });
      setReloadToken((c) => c + 1);
    } catch (caught) {
      setError(errorMessage(caught, "Unable to update operator user."));
    }
  };

  return (
    <div className="operator-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-user-shield m365-page-header__icon" />
          <h2 className="m365-page-header__title">Operator Users</h2>
        </div>
        <div className="m365-page-header__actions">
          <button
            className="m365-btn m365-btn--primary"
            type="button"
            onClick={() => {
              setCreateForm(EMPTY_CREATE);
              setCreateError(null);
              setTempPasswordReveal(null);
              setShowCreateForm((visible) => !visible);
            }}
          >
            <i className="fa-light fa-plus" />
            New operator
          </button>
        </div>
      </div>

      {tempPasswordReveal && (
        <div className="m365-info-banner">
          <i className="fa-light fa-key m365-info-banner__icon" />
          <span className="m365-info-banner__text">
            Onboarding email could not be sent. Share this temporary password with the user manually:{" "}
            <code>{tempPasswordReveal}</code>
          </span>
        </div>
      )}

      {showCreateForm && (
        <form className="operator-form-panel" onSubmit={handleCreate}>
          <div className="operator-form-panel__grid">
            <label className="m365-field">
              Username
              <input
                className="m365-input"
                value={createForm.username}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, username: event.target.value }))
                }
                required
              />
            </label>
            <label className="m365-field">
              Email
              <input
                className="m365-input"
                type="email"
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
            </label>
            <label className="m365-field">
              First name
              <input
                className="m365-input"
                value={createForm.firstName ?? ""}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, firstName: event.target.value }))
                }
              />
            </label>
            <label className="m365-field">
              Last name
              <input
                className="m365-input"
                value={createForm.lastName ?? ""}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, lastName: event.target.value }))
                }
              />
            </label>
            <label className="m365-field">
              Role
              <input
                className="m365-input"
                value={createForm.roleName ?? "PlatformOperator"}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, roleName: event.target.value }))
                }
                placeholder="PlatformOperator"
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
              {creating ? "Creating..." : "Create operator"}
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
            placeholder="username, email, name"
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
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Disabled</option>
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

      <div className="operator-table operator-table--operator-users">
        <div className="operator-table__header">
          <span>Username</span>
          <span>Email</span>
          <span>Name</span>
          <span>Roles</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {loading && <div className="operator-table__empty">Loading operators...</div>}
        {!loading && items.length === 0 && (
          <div className="operator-table__empty">No operator users yet</div>
        )}
        {items.map((user) => {
          const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
          return (
            <div className="operator-table__row" key={user.id}>
              <span className="operator-table__primary">{user.userName}</span>
              <span>{user.email || "—"}</span>
              <span>{displayName}</span>
              <span>{user.roles?.length ? user.roles.join(", ") : "—"}</span>
              <span>
                <span
                  className={`operator-status operator-status--${user.isActive ? "active" : "inactive"}`}
                >
                  {user.isActive ? "Active" : "Disabled"}
                </span>
              </span>
              <span>
                <button
                  className="m365-btn m365-btn--ghost"
                  type="button"
                  onClick={() => handleToggleActive(user)}
                >
                  {user.isActive ? "Disable" : "Enable"}
                </button>
              </span>
            </div>
          );
        })}
      </div>

      <div className="operator-pagination">
        <span>
          {pagination ? `${pagination.totalCount} operators` : `${items.length} operators`}
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
            {pagination
              ? `Page ${pagination.pageNumber} of ${pagination.totalPages || 1}`
              : `Page ${pageNumber}`}
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
