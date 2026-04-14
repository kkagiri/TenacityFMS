/**
 * File: roleDetails.js
 * Purpose: Role details workspace for editing metadata, permissions, and user assignments
 * Dependencies: react-redux, DevExtreme accordion, roleActions, role subcomponents
 * Last Modified: 2026-04-13
 *
 * Key Functions:
 * - RoleDetails(): Loads and saves the selected role workspace with inline loading feedback
 */
import React, { useEffect, useState, useCallback } from "react";
import Accordion, { Item as AccordionItem } from "devextreme-react/accordion";
import notify from "devextreme/ui/notify";

import { useDispatch, useSelector } from "react-redux";
import {
  fetchRoleDetails,
  assignPermissionsToRole,
  setRolePermissions,
  clearPermissions,
  clearUsers,
  updateRole,
  updateRoleForUsers,
} from "../../../redux/actions/roleActions";
import RoleForm from "./roleForm";
import PermissionTreeListNonEdit from "./../../PermissionTreeList/permissionTreeListNonEdit";
import UserDataList from "./../../user/userdatalist";

const RoleDetails = ({ roleId }) => {
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(true);
  const dispatch = useDispatch();
  const {
    roleDetails,
    rolePermissions,
  } = useSelector((state) => state.role);

  const selectedUsers = useSelector((state) => state.role.selectedUsers);

  useEffect(() => {
    let active = true;

    const loadRoleDetails = async () => {
      if (!roleId) {
        if (active) {
          setDetailLoading(false);
        }
        return;
      }

      if (active) {
        setDetailLoading(true);
      }

      try {
        await dispatch(fetchRoleDetails(roleId));
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    };

    loadRoleDetails();

    return () => {
      active = false;
      dispatch(clearPermissions());
      dispatch(clearUsers());
    };
  }, [dispatch, roleId]);

  const handlePermissionChange = useCallback(
    (updatedPermissions) => {
      dispatch(setRolePermissions(updatedPermissions));
    },
    [dispatch]
  );

  const onSaveData = async () => {
    if (roleId) {
      try {
        setSaving(true);
        const results = await Promise.all([
          dispatch(updateRole(roleId, roleDetails)),
          dispatch(assignPermissionsToRole(roleId, rolePermissions)),
          dispatch(updateRoleForUsers(roleId, selectedUsers)),
        ]);

        const failedResults = results.filter((result) => !result.success);
        if (failedResults.length > 0) {
          notify(failedResults[0].message, "error", 2000);
        } else {
          notify("Role updated successfully", "success", 2000);
        }
      } catch (error) {
        notify(error.message, "error", 2000);
      } finally {
        setSaving(false);
      }
    }
  };

  const isBusy = detailLoading || saving;

  return (
    <div className="role-details-panel">
      {isBusy && (
        <div className="role-details-panel__busy-overlay" role="status" aria-live="polite">
          <div className="role-details-panel__busy-card">
            <i className={`fa-light ${saving ? "fa-floppy-disk" : "fa-spinner-third fa-spin"}`} />
            <span>{saving ? "Saving role changes..." : "Loading role details..."}</span>
          </div>
        </div>
      )}

      <div className="role-details-panel__sections">
        <Accordion collapsible={true} animationDuration={200}>
          <AccordionItem title={`Role Details${roleDetails?.name ? `: ${roleDetails.name}` : ""}`}>
            <RoleForm
              editData={roleDetails}
              setRoleDetails={(e) => {
                dispatch({
                  type: "UPDATE_ROLE_DETAILS_LOCALLY",
                  payload: { ...roleDetails, [e.dataField]: e.value },
                });
              }}
            />
          </AccordionItem>
        </Accordion>

        <Accordion collapsible={true} animationDuration={200}>
          <AccordionItem title="Permissions">
            <PermissionTreeListNonEdit onPermissionChange={handlePermissionChange} />
          </AccordionItem>
        </Accordion>

        <Accordion collapsible={true} animationDuration={200}>
          <AccordionItem title="Users">
            <UserDataList />
          </AccordionItem>
        </Accordion>

        <div className="role-details-panel__actions">
          <button
            type="button"
            className="m365-btn m365-btn--primary"
            disabled={saving || detailLoading}
            onClick={onSaveData}
          >
            <i className={`fa-light ${saving ? "fa-spinner-third fa-spin" : "fa-floppy-disk"}`} />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleDetails;
