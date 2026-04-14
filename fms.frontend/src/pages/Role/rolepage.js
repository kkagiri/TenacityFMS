/**
 * File: rolepage.js
 * Purpose: Role management page with M365-style layout and loading feedback
 * Dependencies: react-redux, DevExtreme popup, roleActions, RoleList, RoleDetails
 * Last Modified: 2026-04-13
 *
 * Key Functions/Components:
 * - Rolepage(): Renders role list, details workspace, and role management dialogs
 */
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../../api/axiosInstance";
import RoleList from "../../components/Roles/roleList";
import RoleDetails from "../../components/Roles/RoleDetails/roleDetails";
import { Popup } from "devextreme-react/popup";
import notify from "devextreme/ui/notify";
import {
  fetchRoles,
  setSelectedRole,
  cloneRole,
  createRole,
  deleteRole,
} from "../../redux/actions/roleActions";
import "./rolepage.scss";

const Rolepage = () => {
  const dispatch = useDispatch();
  const roles = useSelector((state) => state.role.roles);
  const selectedRole = useSelector((state) => state.role.selectedRole);
  const roleError = useSelector((state) => state.role.error);

  // Clone role popup state
  const [clonePopupVisible, setClonePopupVisible] = useState(false);
  const [cloneRoleName, setCloneRoleName] = useState("");
  const [cloneDescription, setCloneDescription] = useState("");
  const [cloning, setCloning] = useState(false);

  // Add role popup state
  const [addPopupVisible, setAddPopupVisible] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [adding, setAdding] = useState(false);

  // Delete state
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Page loading state
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleUserCounts, setRoleUserCounts] = useState({});
  const [roleCountsLoading, setRoleCountsLoading] = useState(false);

  const loadRoles = useCallback(
    async ({ background = false } = {}) => {
      if (background) {
        setRefreshing(true);
      } else {
        setPageLoading(true);
      }

      try {
        await dispatch(fetchRoles());
      } finally {
        if (background) {
          setRefreshing(false);
        } else {
          setPageLoading(false);
        }
      }
    },
    [dispatch]
  );

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (
      selectedRole &&
      Array.isArray(roles) &&
      !roles.some((role) => role.id === selectedRole.id)
    ) {
      dispatch(setSelectedRole(null));
    }
  }, [dispatch, roles, selectedRole]);

  const handleRoleSelection = (role) => {
    dispatch(setSelectedRole(role));
  };

  const openAddRolePopup = useCallback(() => {
    setNewRoleName("");
    setNewRoleDescription("");
    setAddPopupVisible(true);
  }, []);

  const handleOpenClonePopup = useCallback(() => {
    if (!selectedRole) {
      notify("Please select a role to clone", "warning", 3000);
      return;
    }
    setCloneRoleName(selectedRole.name + " (Clone)");
    setCloneDescription(selectedRole.description || "");
    setClonePopupVisible(true);
  }, [selectedRole]);

  const handleCloneRole = useCallback(async () => {
    if (!cloneRoleName.trim()) {
      notify("Please enter a name for the new role", "warning", 3000);
      return;
    }
    setCloning(true);
    try {
      const result = await dispatch(
        cloneRole(selectedRole.id, cloneRoleName.trim(), cloneDescription.trim())
      );
      if (result?.isSuccess) {
        notify(result.message || "Role cloned successfully", "success", 3000);
        setClonePopupVisible(false);
        setCloneRoleName("");
        setCloneDescription("");
      } else {
        notify(result?.message || "Failed to clone role", "error", 4000);
      }
    } catch (err) {
      notify("Error cloning role: " + err.message, "error", 4000);
    } finally {
      setCloning(false);
    }
  }, [dispatch, selectedRole, cloneRoleName, cloneDescription]);

  const handleAddRole = useCallback(async () => {
    if (!newRoleName.trim()) {
      notify("Please enter a role name", "warning", 3000);
      return;
    }
    setAdding(true);
    try {
      const result = await dispatch(
        createRole(newRoleName.trim(), newRoleDescription.trim())
      );
      if (result?.isSuccess) {
        notify(result.message || "Role created successfully", "success", 3000);
        setAddPopupVisible(false);
        setNewRoleName("");
        setNewRoleDescription("");
      } else {
        notify(result?.message || "Failed to create role", "error", 4000);
      }
    } catch (err) {
      notify("Error creating role: " + err.message, "error", 4000);
    } finally {
      setAdding(false);
    }
  }, [dispatch, newRoleName, newRoleDescription]);

  const handleDeleteRole = useCallback(async () => {
    if (!selectedRole) return;
    setDeleting(true);
    try {
      const result = await dispatch(deleteRole(selectedRole.id));
      if (result?.isSuccess) {
        notify(`Role '${selectedRole.name}' deleted`, "success", 3000);
        setDeleteConfirmVisible(false);
      } else {
        notify(result?.message || "Failed to delete role", "error", 4000);
      }
    } catch (err) {
      notify("Error deleting role: " + err.message, "error", 4000);
    } finally {
      setDeleting(false);
    }
  }, [dispatch, selectedRole]);

  const isBusy = pageLoading || refreshing;

  useEffect(() => {
    let active = true;

    const loadRoleCounts = async () => {
      if (!Array.isArray(roles) || roles.length === 0) {
        if (active) {
          setRoleUserCounts({});
          setRoleCountsLoading(false);
        }
        return;
      }

      setRoleCountsLoading(true);

      const roleCountsFromPayload = roles.reduce((accumulator, role) => {
        const payloadCount =
          role?.userCount ??
          role?.users?.length ??
          role?.members?.length ??
          null;

        if (payloadCount !== null && payloadCount !== undefined) {
          accumulator[role.id] = payloadCount;
        }

        return accumulator;
      }, {});

      const rolesNeedingLookup = roles.filter((role) => roleCountsFromPayload[role.id] === undefined);

      if (!rolesNeedingLookup.length) {
        if (active) {
          setRoleUserCounts(roleCountsFromPayload);
          setRoleCountsLoading(false);
        }
        return;
      }

      try {
        const results = await Promise.allSettled(
          rolesNeedingLookup.map(async (role) => {
            const response = await axiosInstance.get(`/role/UsersInRole/${role.id}`);
            const users = Array.isArray(response.data) ? response.data : [];
            return { roleId: role.id, count: users.length };
          })
        );

        const nextCounts = { ...roleCountsFromPayload };
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            nextCounts[result.value.roleId] = result.value.count;
          }
        });

        if (active) {
          setRoleUserCounts(nextCounts);
        }
      } finally {
        if (active) {
          setRoleCountsLoading(false);
        }
      }
    };

    loadRoleCounts();

    return () => {
      active = false;
    };
  }, [roles]);

  const selectedRoleCount = useMemo(() => {
    if (!selectedRole) {
      return null;
    }

    return roleUserCounts[selectedRole.id];
  }, [roleUserCounts, selectedRole]);

  return (
    <div className="role-page">
      <div className="m365-page-header role-page__header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-user-shield m365-page-header__icon" />
          <h2 className="m365-page-header__title">Roles</h2>
          <span className="m365-page-header__count">{roles.length}</span>
        </div>
      </div>

      {roleError && (
        <div className="m365-info-banner m365-info-banner--error role-page__banner">
          <i className="fa-light fa-circle-exclamation m365-info-banner__icon" />
          <span className="m365-info-banner__text">{roleError}</span>
        </div>
      )}

      <div className="m365-info-banner role-page__banner">
        <i className="fa-light fa-circle-info m365-info-banner__icon" />
        <span className="m365-info-banner__text">
          Select a role to edit its profile, permission assignments, and linked users from a single workspace.
        </span>
      </div>

      <div className="role-page__workspace">
        <section className="role-page__panel role-page__panel--list" aria-label="Available roles">
          <div className="role-page__panel-header">
            <div className="role-page__panel-header-stack role-page__panel-header-stack--list">
              <div className="role-page__directory-actions">
                <button
                  type="button"
                  className="m365-btn m365-btn--ghost"
                  onClick={() => loadRoles({ background: true })}
                  disabled={refreshing}
                >
                  <i className={`fa-light ${refreshing ? "fa-spinner-third fa-spin" : "fa-rotate-right"}`} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
                <button
                  type="button"
                  className="m365-btn m365-btn--primary"
                  onClick={openAddRolePopup}
                  disabled={adding}
                >
                  <i className={`fa-light ${adding ? "fa-spinner-third fa-spin" : "fa-plus"}`} />
                  Add Role
                </button>
              </div>
              <div className="role-page__panel-copy role-page__panel-copy--list">
                <h3 className="role-page__panel-title">Directory</h3>
                <p className="role-page__panel-subtitle">
                  Browse existing roles and use the built-in search to narrow the list quickly.
                </p>
              </div>
            </div>
          </div>
          <div className="role-page__panel-body">
            <div className="role-page__directory-search-separator" />
            <RoleList
              roles={roles}
              onRoleSelect={handleRoleSelection}
              roleUserCounts={roleUserCounts}
              countsLoading={roleCountsLoading}
              selectedRoleId={selectedRole?.id}
            />
          </div>
        </section>

        <section className="role-page__panel role-page__panel--details" aria-label="Role details workspace">
          <div className="role-page__panel-header role-page__panel-header--details">
            <div className="role-page__panel-copy role-page__panel-copy--details">
              <div className="role-page__title-row">
                <h3 className="role-page__panel-title">
                  {selectedRole ? selectedRole.name : "Role Details"}
                </h3>
                {selectedRole && (
                  <span className="role-page__panel-chip role-page__panel-chip--active">
                    {selectedRoleCount === undefined ? "Loading users..." : `${selectedRoleCount} user${selectedRoleCount === 1 ? "" : "s"}`}
                  </span>
                )}
              </div>
              <p className="role-page__panel-subtitle">
                {selectedRole
                  ? "Review identity, permissions, and assigned users before saving changes."
                  : "Choose a role from the left to open its management workspace."}
              </p>
            </div>
            <div className="role-page__details-meta">
              <div className="role-page__details-header-actions">
                <button
                  type="button"
                  className="m365-btn m365-btn--ghost"
                  onClick={handleOpenClonePopup}
                  disabled={!selectedRole || cloning}
                >
                  <i className={`fa-light ${cloning ? "fa-spinner-third fa-spin" : "fa-clone"}`} />
                  Clone Role
                </button>
                <button
                  type="button"
                  className="m365-btn m365-btn--danger"
                  onClick={() => setDeleteConfirmVisible(true)}
                  disabled={!selectedRole || deleting}
                >
                  <i className={`fa-light ${deleting ? "fa-spinner-third fa-spin" : "fa-trash"}`} />
                  Delete Role
                </button>
              </div>
            </div>
          </div>
          <div className="role-page__panel-body role-page__panel-body--details">
            {selectedRole ? (
              <RoleDetails roleId={selectedRole.id} />
            ) : (
              <div className="role-page__empty-state">
                <div className="role-page__empty-illustration">
                  <i className="fa-light fa-user-lock" />
                </div>
                <h4>Select a role</h4>
                <p>
                  Start from the directory to load role settings, permissions, and linked users.
                </p>
              </div>
            )}
          </div>
        </section>

        {
          isBusy && (
            <div className="role-page__busy-overlay" role="status" aria-live="polite">
              <div className="role-page__busy-card">
                <i className="fa-light fa-spinner-third fa-spin role-page__busy-icon" />
                <strong>{pageLoading ? "Loading roles" : "Refreshing roles"}</strong>
                <span>
                  {pageLoading
                    ? "Preparing the role directory and management workspace."
                    : "Updating the latest role data."}
                </span>
              </div>
            </div>
          )
        }
      </div >

      {/* Clone Role Popup */}
      < Popup
        visible={clonePopupVisible}
        onHiding={() => setClonePopupVisible(false)}
        title={`Clone Role: ${selectedRole?.name || ""}`}
        width={440}
        height="auto"
        showCloseButton={true}
        dragEnabled={false}
      >
        <div className="role-page__dialog">
          <label className="role-page__field">
            <span>New Role Name *</span>
            <input
              type="text"
              className="m365-input"
              value={cloneRoleName}
              onChange={(event) => setCloneRoleName(event.target.value)}
              placeholder="Enter new role name"
              maxLength={100}
            />
          </label>
          <label className="role-page__field">
            <span>Description</span>
            <textarea
              className="role-page__textarea"
              value={cloneDescription}
              onChange={(event) => setCloneDescription(event.target.value)}
              placeholder="Optional description for the new role"
              rows={4}
            />
          </label>
          <div className="m365-info-banner role-page__dialog-banner">
            <i className="fa-light fa-circle-info m365-info-banner__icon" />
            <span className="m365-info-banner__text">
              Permissions and navigation items will be copied from the source role. Users are not copied.
            </span>
          </div>
          <div className="role-page__dialog-actions">
            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => setClonePopupVisible(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="m365-btn m365-btn--primary"
              disabled={cloning || !cloneRoleName.trim()}
              onClick={handleCloneRole}
            >
              <i className={`fa-light ${cloning ? "fa-spinner-third fa-spin" : "fa-clone"}`} />
              {cloning ? "Cloning..." : "Clone Role"}
            </button>
          </div>
        </div>
      </Popup >

      {/* Add Role Popup */}
      < Popup
        visible={addPopupVisible}
        onHiding={() => setAddPopupVisible(false)}
        title="Add New Role"
        width={440}
        height="auto"
        showCloseButton={true}
        dragEnabled={false}
      >
        <div className="role-page__dialog">
          <label className="role-page__field">
            <span>Role Name *</span>
            <input
              type="text"
              className="m365-input"
              value={newRoleName}
              onChange={(event) => setNewRoleName(event.target.value)}
              placeholder="Enter role name"
              maxLength={100}
            />
          </label>
          <label className="role-page__field">
            <span>Description</span>
            <textarea
              className="role-page__textarea"
              value={newRoleDescription}
              onChange={(event) => setNewRoleDescription(event.target.value)}
              placeholder="Optional description"
              rows={4}
            />
          </label>
          <div className="m365-info-banner role-page__dialog-banner">
            <i className="fa-light fa-circle-info m365-info-banner__icon" />
            <span className="m365-info-banner__text">
              New roles start without permissions or navigation assignments. Configure access after creation.
            </span>
          </div>
          <div className="role-page__dialog-actions">
            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => setAddPopupVisible(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="m365-btn m365-btn--primary"
              disabled={adding || !newRoleName.trim()}
              onClick={handleAddRole}
            >
              <i className={`fa-light ${adding ? "fa-spinner-third fa-spin" : "fa-plus"}`} />
              {adding ? "Creating..." : "Create Role"}
            </button>
          </div>
        </div>
      </Popup >

      {/* Delete Role Confirmation */}
      < Popup
        visible={deleteConfirmVisible}
        onHiding={() => setDeleteConfirmVisible(false)}
        title="Delete Role"
        width={400}
        height="auto"
        showCloseButton={true}
        dragEnabled={false}
      >
        <div className="role-page__dialog role-page__dialog--danger">
          <div className="role-page__danger-copy">
            <i className="fa-light fa-triangle-exclamation role-page__danger-icon"></i>
            <div>
              <p className="role-page__danger-title">
                Are you sure you want to delete the role "{selectedRole?.name}"?
              </p>
              <p className="role-page__danger-text">
                This will remove all permission and navigation assignments for this role. Users currently in this role will lose access.
              </p>
            </div>
          </div>
          <div className="role-page__dialog-actions">
            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => setDeleteConfirmVisible(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="m365-btn m365-btn--danger"
              disabled={deleting}
              onClick={handleDeleteRole}
            >
              <i className={`fa-light ${deleting ? "fa-spinner-third fa-spin" : "fa-trash"}`} />
              {deleting ? "Deleting..." : "Delete Role"}
            </button>
          </div>
        </div>
      </Popup >
    </div >
  );
};

export default Rolepage;
