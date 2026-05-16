/**
 * File:          SubCustomerDetailPage.js
 * Purpose:       Dedicated detail route for a Customer sub-tenant under the
 *                calling Client tenant.
 * Dependencies:  react-router-dom, devextreme-react, usePermissions, subTenantApi
 * Last Modified: 2026-05-16
 *
 * Key Functions:
 * - SubCustomerDetailPage(): Loads a sub-customer, shows usage counts, and
 *   allows permitted Client admins to rename, activate, deactivate, or invite
 *   the sub-customer admin user.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Popup } from "devextreme-react/popup";
import notify from "devextreme/ui/notify";
import { usePermissions } from "../../../hooks/usePermissions";
import subTenantApi from "../../../api/subTenantApi";
import {
    EMPTY_INVITE_FORM,
    SUB_CUSTOMER_PERMISSIONS,
    formatDate,
    resolveError,
} from "./subCustomerUtils";
import "./SubCustomersPage.scss";

const read = (source, camelName, pascalName) => source?.[camelName] ?? source?.[pascalName];

const normalizeUsage = (usage = {}) => ({
    users: read(usage, "users", "Users") ?? 0,
    activeUsers: read(usage, "activeUsers", "ActiveUsers") ?? 0,
    sites: read(usage, "sites", "Sites") ?? 0,
    vehicles: read(usage, "vehicles", "Vehicles") ?? 0,
});

const normalizeDetail = (detail) => {
    if (!detail) return null;

    return {
        id: read(detail, "id", "Id"),
        code: read(detail, "code", "Code") ?? "",
        name: read(detail, "name", "Name") ?? "",
        isActive: read(detail, "isActive", "IsActive") ?? false,
        createdAt: read(detail, "createdAt", "CreatedAt"),
        updatedAt: read(detail, "updatedAt", "UpdatedAt"),
        usage: normalizeUsage(read(detail, "usage", "Usage")),
    };
};

const SubCustomerDetailPage = () => {
    const { subCustomerId } = useParams();
    const { hasPermission } = usePermissions();
    const canRead = hasPermission(SUB_CUSTOMER_PERMISSIONS.Manage) || hasPermission(SUB_CUSTOMER_PERMISSIONS.Read);
    const canManage = hasPermission(SUB_CUSTOMER_PERMISSIONS.Manage);

    const [detail, setDetail] = useState(null);
    const [nameDraft, setNameDraft] = useState("");
    const [loading, setLoading] = useState(false);
    const [savingName, setSavingName] = useState(false);
    const [savingStatus, setSavingStatus] = useState(false);
    const [error, setError] = useState(null);

    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState(EMPTY_INVITE_FORM);
    const [inviting, setInviting] = useState(false);

    const load = useCallback(async () => {
        if (!canRead || !subCustomerId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await subTenantApi.getById(subCustomerId);
            if (!response.isSuccess) {
                setError(response.message || "Failed to load sub-customer.");
                return;
            }

            const normalized = normalizeDetail(response.data);
            setDetail(normalized);
            setNameDraft(normalized?.name ?? "");
        } catch (caught) {
            setError(resolveError(caught, "Failed to load sub-customer."));
        } finally {
            setLoading(false);
        }
    }, [canRead, subCustomerId]);

    useEffect(() => {
        load();
    }, [load]);

    const metrics = useMemo(() => {
        const usage = detail?.usage ?? normalizeUsage();
        return [
            { key: "users", label: "Users", value: usage.users, icon: "fa-light fa-users" },
            { key: "activeUsers", label: "Active users", value: usage.activeUsers, icon: "fa-light fa-user-check" },
            { key: "sites", label: "Sites", value: usage.sites, icon: "fa-light fa-location-dot" },
            { key: "vehicles", label: "Vehicles", value: usage.vehicles, icon: "fa-light fa-car-side" },
        ];
    }, [detail]);

    const applySummaryUpdate = (summary, fallback) => {
        const base = fallback ?? detail;
        const normalized = {
            ...base,
            id: read(summary, "id", "Id") ?? base?.id,
            code: read(summary, "code", "Code") ?? base?.code ?? "",
            name: read(summary, "name", "Name") ?? base?.name ?? "",
            isActive: read(summary, "isActive", "IsActive") ?? base?.isActive ?? false,
            createdAt: read(summary, "createdAt", "CreatedAt") ?? base?.createdAt,
            updatedAt: read(summary, "updatedAt", "UpdatedAt") ?? base?.updatedAt,
            usage: base?.usage ?? normalizeUsage(),
        };

        setDetail(normalized);
        setNameDraft(normalized.name ?? "");
    };

    const handleSaveName = async (event) => {
        event.preventDefault();
        if (!detail || !canManage) return;

        const trimmedName = nameDraft.trim();
        if (!trimmedName) {
            notify("Sub-customer name is required.", "warning", 2500);
            return;
        }

        if (trimmedName === detail.name) {
            notify("No name changes to save.", "info", 2000);
            return;
        }

        setSavingName(true);
        try {
            const response = await subTenantApi.patch(detail.id, { name: trimmedName });
            if (!response.isSuccess) {
                notify(response.message || "Failed to update sub-customer.", "error", 3000);
                return;
            }

            applySummaryUpdate(response.data, { ...detail, name: trimmedName });
            notify("Sub-customer updated.", "success", 2500);
        } catch (caught) {
            notify(resolveError(caught, "Failed to update sub-customer."), "error", 3000);
        } finally {
            setSavingName(false);
        }
    };

    const handleToggleActive = async () => {
        if (!detail || !canManage) return;

        const nextActive = !detail.isActive;
        setSavingStatus(true);

        try {
            const response = await subTenantApi.patch(detail.id, { isActive: nextActive });
            if (!response.isSuccess) {
                notify(response.message || "Failed to update sub-customer.", "error", 3000);
                return;
            }

            applySummaryUpdate(response.data, { ...detail, isActive: nextActive });
            notify(nextActive ? "Sub-customer reactivated." : "Sub-customer deactivated.", "success", 2500);
        } catch (caught) {
            notify(resolveError(caught, "Failed to update sub-customer."), "error", 3000);
        } finally {
            setSavingStatus(false);
        }
    };

    const openInvite = () => {
        if (!detail) return;
        setInviteForm({ ...EMPTY_INVITE_FORM, username: detail.code });
        setInviteOpen(true);
    };

    const handleInvite = async () => {
        if (!detail) return;
        if (!inviteForm.email.trim() || !inviteForm.username.trim()) {
            notify("Email and username are required.", "warning", 2500);
            return;
        }

        setInviting(true);
        try {
            const response = await subTenantApi.inviteAdmin(detail.id, {
                email: inviteForm.email.trim(),
                username: inviteForm.username.trim(),
                firstName: inviteForm.firstName.trim() || null,
                lastName: inviteForm.lastName.trim() || null,
                roleName: inviteForm.roleName?.trim() || "Admin",
            });
            if (!response.isSuccess) {
                notify(response.message || "Failed to invite admin.", "error", 3500);
                return;
            }

            const tempPwd = response.data?.temporaryPassword;
            notify(
                tempPwd
                    ? `Admin created. Temporary password: ${tempPwd}`
                    : "Admin invited. Onboarding email sent.",
                "success",
                tempPwd ? 8000 : 3000
            );
            setInviteOpen(false);
            setInviteForm(EMPTY_INVITE_FORM);
            await load();
        } catch (caught) {
            notify(resolveError(caught, "Failed to invite admin."), "error", 3500);
        } finally {
            setInviting(false);
        }
    };

    if (!subCustomerId) {
        return <Navigate to="/admin/sub-customers" replace />;
    }

    if (!canRead) {
        return (
            <div className="sub-customer-detail">
                <div className="sub-customer-detail__empty">
                    You do not have permission to view this sub-customer.
                </div>
            </div>
        );
    }

    return (
        <div className="sub-customer-detail">
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <Link className="sub-customer-detail__back" to="/admin/sub-customers" title="Back to sub-customers">
                        <i className="fa-light fa-arrow-left" />
                    </Link>
                    <i className="fa-light fa-sitemap m365-page-header__icon" />
                    <h2 className="m365-page-header__title">
                        {detail?.name || "Sub-customer"}
                        {detail && (
                            <span className={`m365-badge ${detail.isActive ? "m365-badge--success" : "m365-badge--neutral"}`}>
                                {detail.isActive ? "Active" : "Inactive"}
                            </span>
                        )}
                    </h2>
                </div>
                <div className="m365-page-header__actions">
                    <button className="m365-btn m365-btn--ghost" type="button" onClick={load} disabled={loading}>
                        <i className="fa-light fa-rotate-right" />
                        Refresh
                    </button>
                    <button
                        className="m365-btn m365-btn--ghost"
                        type="button"
                        onClick={openInvite}
                        disabled={!canManage || !detail?.isActive}
                    >
                        <i className="fa-light fa-user-plus" />
                        Invite admin
                    </button>
                </div>
            </div>

            {loading && !detail ? (
                <div className="sub-customer-detail__empty">Loading sub-customer...</div>
            ) : error ? (
                <div className="sub-customer-detail__error">{error}</div>
            ) : detail ? (
                <>
                    <div className="sub-customer-detail__summary">
                        {metrics.map((metric) => (
                            <div className="sub-customer-detail__metric" key={metric.key}>
                                <span className="sub-customer-detail__metric-icon">
                                    <i className={metric.icon} />
                                </span>
                                <span>
                                    <span className="sub-customer-detail__metric-label">{metric.label}</span>
                                    <span className="sub-customer-detail__metric-value">{metric.value}</span>
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="sub-customer-detail__layout">
                        <section className="m365-section-group">
                            <div className="m365-section-group__header">
                                <i className="fa-light fa-circle-info m365-section-group__icon" />
                                <h3 className="m365-section-group__title">Tenant overview</h3>
                            </div>
                            <div className="m365-section-group__body">
                                <div className="sub-customer-detail__meta-grid">
                                    <div className="sub-customer-detail__meta-cell">
                                        <span className="sub-customer-detail__meta-label">Code</span>
                                        <span className="sub-customer-detail__meta-value">{detail.code}</span>
                                    </div>
                                    <div className="sub-customer-detail__meta-cell">
                                        <span className="sub-customer-detail__meta-label">Tenant ID</span>
                                        <span className="sub-customer-detail__meta-value">{detail.id}</span>
                                    </div>
                                    <div className="sub-customer-detail__meta-cell">
                                        <span className="sub-customer-detail__meta-label">Created</span>
                                        <span className="sub-customer-detail__meta-value">{formatDate(detail.createdAt)}</span>
                                    </div>
                                    <div className="sub-customer-detail__meta-cell">
                                        <span className="sub-customer-detail__meta-label">Updated</span>
                                        <span className="sub-customer-detail__meta-value">{formatDate(detail.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="m365-section-group">
                            <div className="m365-section-group__header">
                                <i className="fa-light fa-sliders m365-section-group__icon" />
                                <h3 className="m365-section-group__title">Settings</h3>
                            </div>
                            <form className="m365-section-group__body" onSubmit={handleSaveName}>
                                <label className="m365-field">
                                    Display name
                                    <input
                                        className="m365-input"
                                        value={nameDraft}
                                        disabled={!canManage || savingName}
                                        onChange={(event) => setNameDraft(event.target.value)}
                                    />
                                </label>
                                <div className="sub-customer-detail__edit-actions">
                                    <button className="m365-btn m365-btn--primary" type="submit" disabled={!canManage || savingName}>
                                        <i className="fa-light fa-floppy-disk" />
                                        {savingName ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                        className={detail.isActive ? "m365-btn m365-btn--danger" : "m365-btn m365-btn--ghost"}
                                        type="button"
                                        onClick={handleToggleActive}
                                        disabled={!canManage || savingStatus}
                                    >
                                        {detail.isActive ? "Deactivate" : "Reactivate"}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </>
            ) : (
                <div className="sub-customer-detail__empty">Sub-customer not found.</div>
            )}

            <Popup
                visible={inviteOpen}
                onHiding={() => !inviting && setInviteOpen(false)}
                hideOnOutsideClick={!inviting}
                showCloseButton
                title={detail ? `Invite admin for ${detail.name}` : "Invite admin"}
                width={560}
                height="auto"
            >
                <div className="sub-customers-popup">
                    <div className="sub-customers-popup__grid">
                        <label className="sub-customers-popup__field sub-customers-popup__field--full">
                            Email
                            <input
                                className="sub-customers-popup__input"
                                type="email"
                                value={inviteForm.email}
                                onChange={(event) =>
                                    setInviteForm((current) => ({ ...current, email: event.target.value }))
                                }
                                disabled={inviting}
                            />
                        </label>
                        <label className="sub-customers-popup__field">
                            Username
                            <input
                                className="sub-customers-popup__input"
                                value={inviteForm.username}
                                onChange={(event) =>
                                    setInviteForm((current) => ({ ...current, username: event.target.value }))
                                }
                                disabled={inviting}
                            />
                        </label>
                        <label className="sub-customers-popup__field">
                            Role
                            <input
                                className="sub-customers-popup__input"
                                value={inviteForm.roleName}
                                onChange={(event) =>
                                    setInviteForm((current) => ({ ...current, roleName: event.target.value }))
                                }
                                placeholder="Admin"
                                disabled={inviting}
                            />
                        </label>
                        <label className="sub-customers-popup__field">
                            First name
                            <input
                                className="sub-customers-popup__input"
                                value={inviteForm.firstName}
                                onChange={(event) =>
                                    setInviteForm((current) => ({ ...current, firstName: event.target.value }))
                                }
                                disabled={inviting}
                            />
                        </label>
                        <label className="sub-customers-popup__field">
                            Last name
                            <input
                                className="sub-customers-popup__input"
                                value={inviteForm.lastName}
                                onChange={(event) =>
                                    setInviteForm((current) => ({ ...current, lastName: event.target.value }))
                                }
                                disabled={inviting}
                            />
                        </label>
                    </div>
                    <div className="sub-customers-popup__actions">
                        <button
                            type="button"
                            className="m365-btn m365-btn--ghost"
                            onClick={() => setInviteOpen(false)}
                            disabled={inviting}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="m365-btn m365-btn--primary"
                            onClick={handleInvite}
                            disabled={inviting}
                        >
                            {inviting ? "Sending invite..." : "Send invite"}
                        </button>
                    </div>
                </div>
            </Popup>
        </div>
    );
};

export default SubCustomerDetailPage;
