//To:do Add  delete Button..
//To:do Add Form for adding new Role
//To:do Add a Reset button to reset values to original state..

import React, { useEffect, useState, useCallback } from "react";
import Accordion, { Item as AccordionItem } from "devextreme-react/accordion";
import { Button } from "devextreme-react/button";
import notify from "devextreme/ui/notify";

import { useDispatch, useSelector } from "react-redux";
import {
  fetchRoleDetails,
  assignPermissionsToRole,
  setRolePermissions,
  setUsers,
  clearPermissions,
  clearUsers,
  updateRole,
  updateRoleForUsers,
} from "../../../redux/actions/roleActions";
import RoleForm from "./roleForm";
import PermissionTreeListNonEdit from "./../../PermissionTreeList/permissionTreeListNonEdit";
import UserDataList from "./../../user/userdatalist";
import LoadIndicator from "devextreme-react/load-indicator";

const RoleDetails = ({ roleId }) => {
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();
  const {
    roleDetails,
    allPermissions,
    rolePermissions,
    users,
    allUsers,
    loading,
    error,
  } = useSelector((state) => state.role);

  const selectedUsers = useSelector((state) => state.role.selectedUsers);

  useEffect(() => {
    if (roleId) {
      // console.log('Fetching role details for role ID:', roleId);
      dispatch(fetchRoleDetails(roleId));
    }
    return () => {
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
  };

  if (loading || saving) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <LoadIndicator width={"24px"} height={"24px"} visible={true} />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Accordion collapsible={true} animationDuration={200}>
        <AccordionItem title={`Role Details: ${roleDetails.name}`}>
          <RoleForm
            editData={roleDetails}
            setRoleDetails={(data) => {
              const updatedDetails = { ...data };
              dispatch({
                type: "UPDATE_ROLE_DETAILS_LOCALLY",
                payload: updatedDetails,
              });
            }}
          />
        </AccordionItem>
      </Accordion>

      <div className="tw-mt-4">
        <Accordion collapsible={true} animationDuration={200}>
          <AccordionItem title="Permissions">
            <PermissionTreeListNonEdit />
          </AccordionItem>
        </Accordion>
      </div>

      <div className="tw-mt-4">
        <Accordion collapsible={true} animationDuration={200}>
          <AccordionItem title="Users">
            <UserDataList />
          </AccordionItem>
        </Accordion>
      </div>

      <div className="tw-mt-5">
        <Button
          icon="save"
          width={120}
          type="success"
          text="Save"
          onClick={onSaveData}
        />
      </div>
    </div>
  );
};

export default RoleDetails;
