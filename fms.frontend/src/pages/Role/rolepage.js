/**
 * File: rolepage.js
 * Purpose: Role management page - list roles, view details, clone roles
 * Dependencies: react-redux, DevExtreme, roleActions, RoleList, RoleDetails
 * Last Modified: 2026-02-24
 *
 * Key Functions/Components:
 * - Rolepage(): Renders role list, details panel, and clone role dialog
 */
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import RoleList from "../../components/Roles/roleList";
import RoleDetails from "../../components/Roles/RoleDetails/roleDetails";
import { getRoleList } from "../../redux/actions/roleActions";
import { Item, Toolbar } from "devextreme-react/toolbar";
import Button from "devextreme-react/button";
import { Popup } from "devextreme-react/popup";
import { TextBox } from "devextreme-react/text-box";
import { TextArea } from "devextreme-react/text-area";
import notify from "devextreme/ui/notify";
import {
  fetchRoles,
  setSelectedRole,
  assignPermissions,
  cloneRole,
  createRole,
  deleteRole,
} from "../../redux/actions/roleActions";
import "./rolepage.scss";

const Rolepage = () => {
  const dispatch = useDispatch();
  const roles = useSelector((state) => state.role.roles);
  const selectedRole = useSelector((state) => state.role.selectedRole);

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

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch]);

  const handleRoleSelection = (role) => {
    dispatch(setSelectedRole(role));
  };

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

  return (
    <div>
      <div className={" view-wrapper view-wrapper-role-page"}>
        <div className="view-container ">
          <Toolbar
            className="toolbar-details theme-dependent role-toolbar"
            style={{ padding: "10px" }}
          >
            <Item location="before">
              <h2 style={{ marginLeft: "20pm" }}>Roles</h2>
            </Item>
            <Item location="after" locateInMenu="auto">
              <Button
                text="Add Role"
                icon="fa fa-light fa-plus"
                type="default"
                stylingMode="contained"
                elementAttr={{ class: "role-filter-btn role-filter-btn--primary" }}
                onClick={() => {
                  setNewRoleName("");
                  setNewRoleDescription("");
                  setAddPopupVisible(true);
                }}
              />
            </Item>
            <Item location="after" locateInMenu="auto">
              <Button
                text="Clone Role"
                icon="fa fa-light fa-clone"
                type="normal"
                stylingMode="contained"
                elementAttr={{ class: "role-filter-btn" }}
                disabled={!selectedRole}
                onClick={handleOpenClonePopup}
              />
            </Item>
            <Item location="after" locateInMenu="auto">
              <Button
                text="Delete Role"
                icon="fa fa-light fa-trash"
                type="danger"
                stylingMode="contained"
                elementAttr={{ class: "role-filter-btn role-filter-btn--danger" }}
                disabled={!selectedRole}
                onClick={() => setDeleteConfirmVisible(true)}
              />
            </Item>

            <Item
              location="after"
              locateInMenu="auto"
              widget="dxButton"
              showText="inMenu"
            >
              <Button
                text="Refresh"
                icon="refresh"
                stylingMode="text"
                elementAttr={{ class: "role-filter-btn" }}
                onClick={() => dispatch(fetchRoles())}
              />
            </Item>
          </Toolbar>
        </div>
        <div className="content content-block">
          <div className="panels">
            <div className="left">
              <RoleList roles={roles} onRoleSelect={handleRoleSelection} />
            </div>
            <div className="right">
              {selectedRole && <RoleDetails roleId={selectedRole.id} />}
            </div>
          </div>
        </div>
      </div>

      {/* Clone Role Popup */}
      <Popup
        visible={clonePopupVisible}
        onHiding={() => setClonePopupVisible(false)}
        title={`Clone Role: ${selectedRole?.name || ""}`}
        width={440}
        height="auto"
        showCloseButton={true}
        dragEnabled={false}
      >
        <div className="tw-flex tw-flex-col tw-gap-4 tw-p-2">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              New Role Name *
            </label>
            <TextBox
              value={cloneRoleName}
              onValueChanged={(e) => setCloneRoleName(e.value)}
              placeholder="Enter new role name"
              maxLength={100}
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Description
            </label>
            <TextArea
              value={cloneDescription}
              onValueChanged={(e) => setCloneDescription(e.value)}
              placeholder="Optional description for the new role"
              height={80}
            />
          </div>
          <p className="tw-text-xs tw-text-gray-500">
            <i className="fa-light fa-circle-info tw-mr-1"></i>
            All permissions and navigation items will be copied from the source role. Users will not be copied.
          </p>
          <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-2">
            <Button
              text="Cancel"
              stylingMode="outlined"
              onClick={() => setClonePopupVisible(false)}
            />
            <Button
              text={cloning ? "Cloning..." : "Clone Role"}
              type="default"
              stylingMode="contained"
              disabled={cloning || !cloneRoleName.trim()}
              onClick={handleCloneRole}
            />
          </div>
        </div>
      </Popup>

      {/* Add Role Popup */}
      <Popup
        visible={addPopupVisible}
        onHiding={() => setAddPopupVisible(false)}
        title="Add New Role"
        width={440}
        height="auto"
        showCloseButton={true}
        dragEnabled={false}
      >
        <div className="tw-flex tw-flex-col tw-gap-4 tw-p-2">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Role Name *
            </label>
            <TextBox
              value={newRoleName}
              onValueChanged={(e) => setNewRoleName(e.value)}
              placeholder="Enter role name"
              maxLength={100}
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Description
            </label>
            <TextArea
              value={newRoleDescription}
              onValueChanged={(e) => setNewRoleDescription(e.value)}
              placeholder="Optional description"
              height={80}
            />
          </div>
          <p className="tw-text-xs tw-text-gray-500">
            <i className="fa-light fa-circle-info tw-mr-1"></i>
            The new role will have no permissions or navigation assigned. Configure them after creation.
          </p>
          <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-2">
            <Button
              text="Cancel"
              stylingMode="outlined"
              onClick={() => setAddPopupVisible(false)}
            />
            <Button
              text={adding ? "Creating..." : "Create Role"}
              type="default"
              stylingMode="contained"
              disabled={adding || !newRoleName.trim()}
              onClick={handleAddRole}
            />
          </div>
        </div>
      </Popup>

      {/* Delete Role Confirmation */}
      <Popup
        visible={deleteConfirmVisible}
        onHiding={() => setDeleteConfirmVisible(false)}
        title="Delete Role"
        width={400}
        height="auto"
        showCloseButton={true}
        dragEnabled={false}
      >
        <div className="tw-flex tw-flex-col tw-gap-4 tw-p-2">
          <div className="tw-flex tw-items-start tw-gap-3">
            <i className="fa-light fa-triangle-exclamation tw-text-2xl" style={{ color: "#d13438" }}></i>
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-900">
                Are you sure you want to delete the role "{selectedRole?.name}"?
              </p>
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                This will remove all permission and navigation assignments for this role. Users currently in this role will lose access.
              </p>
            </div>
          </div>
          <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-2">
            <Button
              text="Cancel"
              stylingMode="outlined"
              onClick={() => setDeleteConfirmVisible(false)}
            />
            <Button
              text={deleting ? "Deleting..." : "Delete"}
              type="danger"
              stylingMode="contained"
              disabled={deleting}
              onClick={handleDeleteRole}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default Rolepage;
