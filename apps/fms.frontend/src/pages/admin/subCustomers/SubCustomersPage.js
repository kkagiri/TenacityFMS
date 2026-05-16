/**
 * File:          SubCustomersPage.js
 * Purpose:       Client-side admin page for managing Customer sub-tenants
 *                under the calling Client tenant. List + create + activate +
 *                invite admin user.
 * Dependencies:  react-router-dom, devextreme-react, usePermissions, subTenantApi, SCSS
 * Last Modified: 2026-05-16
 */
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataGrid, {
    Column,
    FilterRow,
    Paging,
    SearchPanel,
    Toolbar,
    Item,
} from "devextreme-react/data-grid";
import { Popup } from "devextreme-react/popup";
import notify from "devextreme/ui/notify";
import { usePermissions } from "../../../hooks/usePermissions";
import subTenantApi from "../../../api/subTenantApi";
import {
    EMPTY_INVITE_FORM,
    SUB_CUSTOMER_PERMISSIONS,
    formatDate,
    getSubCustomerDetailPath,
    resolveError,
} from "./subCustomerUtils";
import "./SubCustomersPage.scss";

const EMPTY_CREATE = { code: "", name: "" };

const SubCustomersPage = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const canRead = hasPermission(SUB_CUSTOMER_PERMISSIONS.Manage) || hasPermission(SUB_CUSTOMER_PERMISSIONS.Read);
    const canManage = hasPermission(SUB_CUSTOMER_PERMISSIONS.Manage);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState(EMPTY_CREATE);
    const [creating, setCreating] = useState(false);

    const [inviteFor, setInviteFor] = useState(null);
    const [inviteForm, setInviteForm] = useState(EMPTY_INVITE_FORM);
    const [inviting, setInviting] = useState(false);

    const load = async () => {
        if (!canRead) return;
        setLoading(true);
        try {
            const response = await subTenantApi.list();
            if (response.isSuccess) {
                setRows(response.data?.items ?? []);
            } else {
                notify(response.message || "Failed to load sub-customers.", "error", 3000);
            }
        } catch (error) {
            notify(resolveError(error, "Failed to load sub-customers."), "error", 3000);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sortedRows = useMemo(
        () => [...rows].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
        [rows]
    );

    const handleCreate = async () => {
        if (!createForm.code.trim() || !createForm.name.trim()) {
            notify("Code and name are required.", "warning", 2500);
            return;
        }
        setCreating(true);
        try {
            const response = await subTenantApi.create({
                code: createForm.code.trim(),
                name: createForm.name.trim(),
            });
            if (!response.isSuccess) {
                notify(response.message || "Failed to create sub-customer.", "error", 3000);
                return;
            }
            notify("Sub-customer created.", "success", 2500);
            setCreateOpen(false);
            setCreateForm(EMPTY_CREATE);
            await load();
        } catch (error) {
            notify(resolveError(error, "Failed to create sub-customer."), "error", 3000);
        } finally {
            setCreating(false);
        }
    };

    const handleToggleActive = async (row) => {
        try {
            const response = await subTenantApi.patch(row.id, { isActive: !row.isActive });
            if (!response.isSuccess) {
                notify(response.message || "Failed to update sub-customer.", "error", 3000);
                return;
            }
            notify(row.isActive ? "Sub-customer deactivated." : "Sub-customer reactivated.", "success", 2000);
            await load();
        } catch (error) {
            notify(resolveError(error, "Failed to update sub-customer."), "error", 3000);
        }
    };

    const openInvite = (row) => {
        setInviteFor(row);
        setInviteForm({ ...EMPTY_INVITE_FORM, username: row.code });
    };

    const goToDetail = (row) => {
        navigate(getSubCustomerDetailPath(row.id));
    };

    const handleInvite = async () => {
        if (!inviteFor) return;
        if (!inviteForm.email.trim() || !inviteForm.username.trim()) {
            notify("Email and username are required.", "warning", 2500);
            return;
        }
        setInviting(true);
        try {
            const response = await subTenantApi.inviteAdmin(inviteFor.id, {
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
            setInviteFor(null);
            setInviteForm(EMPTY_INVITE_FORM);
        } catch (error) {
            notify(resolveError(error, "Failed to invite admin."), "error", 3500);
        } finally {
            setInviting(false);
        }
    };

    if (!canRead) {
        return (
            <div className="card mt-3">
                <div className="card-body">
                    You do not have permission to view sub-customers.
                </div>
            </div>
        );
    }

    return (
        <div className="sub-customers-page">
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <i className="fa-light fa-sitemap m365-page-header__icon" />
                    <h2 className="m365-page-header__title">
                        Sub-customers
                        <span className="m365-page-header__count">{rows.length}</span>
                    </h2>
                </div>
                <div className="m365-page-header__actions">
                    <button
                        className="m365-btn m365-btn--ghost"
                        type="button"
                        onClick={load}
                        disabled={loading}
                    >
                        <i className="fa-light fa-rotate-right" />
                        Refresh
                    </button>
                    {canManage && (
                        <button
                            className="m365-btn m365-btn--primary"
                            type="button"
                            onClick={() => {
                                setCreateForm(EMPTY_CREATE);
                                setCreateOpen(true);
                            }}
                        >
                            <i className="fa-light fa-plus" />
                            New sub-customer
                        </button>
                    )}
                </div>
            </div>

            <div className="sub-customers-page__grid-shell">
                <DataGrid
                    dataSource={sortedRows}
                    keyExpr="id"
                    showBorders={false}
                    rowAlternationEnabled
                    columnAutoWidth
                    noDataText={loading ? "Loading..." : "No sub-customers yet"}
                >
                    <FilterRow visible />
                    <SearchPanel visible width={240} />
                    <Paging defaultPageSize={25} />

                    <Toolbar>
                        <Item location="before" text="Customer tenants under this client" />
                    </Toolbar>

                    <Column
                        dataField="name"
                        caption="Name"
                        cellRender={(cell) => (
                            <button
                                className="sub-customers-page__name-button"
                                type="button"
                                onClick={() => goToDetail(cell.data)}
                            >
                                {cell.value}
                            </button>
                        )}
                    />
                    <Column dataField="code" caption="Code" width={140} />
                    <Column
                        dataField="isActive"
                        caption="Status"
                        width={120}
                        cellRender={(cell) => (
                            <span className={`m365-badge ${cell.value ? "m365-badge--success" : "m365-badge--neutral"}`}>
                                {cell.value ? "Active" : "Inactive"}
                            </span>
                        )}
                    />
                    <Column
                        dataField="createdAt"
                        caption="Created"
                        width={180}
                        calculateCellValue={(row) => formatDate(row.createdAt)}
                    />
                    <Column
                        caption="Actions"
                        width={330}
                        allowFiltering={false}
                        allowSorting={false}
                        cellRender={(cell) => {
                            const row = cell.data;
                            return (
                                <div className="sub-customers-page__actions">
                                    <button
                                        className="m365-btn m365-btn--ghost"
                                        type="button"
                                        onClick={() => goToDetail(row)}
                                    >
                                        <i className="fa-light fa-eye" />
                                        View
                                    </button>
                                    <button
                                        className="m365-btn m365-btn--ghost"
                                        type="button"
                                        disabled={!canManage}
                                        onClick={() => handleToggleActive(row)}
                                    >
                                        {row.isActive ? "Deactivate" : "Reactivate"}
                                    </button>
                                    <button
                                        className="m365-btn m365-btn--ghost"
                                        type="button"
                                        disabled={!canManage || !row.isActive}
                                        onClick={() => openInvite(row)}
                                    >
                                        <i className="fa-light fa-user-plus" />
                                        Invite
                                    </button>
                                </div>
                            );
                        }}
                    />
                </DataGrid>
            </div>

            {/* Create dialog */}
            <Popup
                visible={createOpen}
                onHiding={() => !creating && setCreateOpen(false)}
                hideOnOutsideClick={!creating}
                showCloseButton
                title="New sub-customer"
                width={520}
                height="auto"
            >
                <div className="p-2">
                    <div className="mb-3">
                        <label className="form-label">Code</label>
                        <input
                            className="form-control"
                            value={createForm.code}
                            onChange={(event) =>
                                setCreateForm((current) => ({ ...current, code: event.target.value }))
                            }
                            placeholder="e.g. acme-east"
                            disabled={creating}
                        />
                        <small className="text-muted">
                            Unique, URL-safe identifier. Cannot be changed later.
                        </small>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input
                            className="form-control"
                            value={createForm.name}
                            onChange={(event) =>
                                setCreateForm((current) => ({ ...current, name: event.target.value }))
                            }
                            placeholder="e.g. Acme East Region"
                            disabled={creating}
                        />
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setCreateOpen(false)}
                            disabled={creating}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCreate}
                            disabled={creating}
                        >
                            {creating ? "Creating..." : "Create"}
                        </button>
                    </div>
                </div>
            </Popup>

            {/* Invite admin dialog */}
            <Popup
                visible={!!inviteFor}
                onHiding={() => !inviting && setInviteFor(null)}
                hideOnOutsideClick={!inviting}
                showCloseButton
                title={inviteFor ? `Invite admin for ${inviteFor.name}` : "Invite admin"}
                width={560}
                height="auto"
            >
                <div className="p-2">
                    <div className="row g-3">
                        <div className="col-12">
                            <label className="form-label">Email</label>
                            <input
                                className="form-control"
                                type="email"
                                value={inviteForm.email}
                                onChange={(event) =>
                                    setInviteForm((current) => ({ ...current, email: event.target.value }))
                                }
                                disabled={inviting}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Username</label>
                            <input
                                className="form-control"
                                value={inviteForm.username}
                                onChange={(event) =>
                                    setInviteForm((current) => ({ ...current, username: event.target.value }))
                                }
                                disabled={inviting}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Role</label>
                            <input
                                className="form-control"
                                value={inviteForm.roleName}
                                onChange={(event) =>
                                    setInviteForm((current) => ({ ...current, roleName: event.target.value }))
                                }
                                placeholder="Admin"
                                disabled={inviting}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">First name</label>
                            <input
                                className="form-control"
                                value={inviteForm.firstName}
                                onChange={(event) =>
                                    setInviteForm((current) => ({ ...current, firstName: event.target.value }))
                                }
                                disabled={inviting}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Last name</label>
                            <input
                                className="form-control"
                                value={inviteForm.lastName}
                                onChange={(event) =>
                                    setInviteForm((current) => ({ ...current, lastName: event.target.value }))
                                }
                                disabled={inviting}
                            />
                        </div>
                    </div>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setInviteFor(null)}
                            disabled={inviting}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
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

export default SubCustomersPage;
