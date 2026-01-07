import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchUserById,
  fetchUserActivities,
  fetchAllSites,
  fetchUserSites,
  updateUserSites,
  updateUser,
  fetchAllRoles,
} from "../../redux/actions/userActions";
import { Button } from "devextreme-react/button";
import DataGrid, {
  Column,
  Paging,
  Pager,
  Sorting,
  FilterRow,
  HeaderFilter,
  SearchPanel,
  Selection,
  Scrolling,
} from "devextreme-react/data-grid";
import Toolbar, { Item as ToolbarItem } from "devextreme-react/toolbar";
import Popup from "devextreme-react/popup";
import TextBox from "devextreme-react/text-box";
import SelectBox from "devextreme-react/select-box";
import LoadPanel from "devextreme-react/load-panel";
import Form, {
  SimpleItem,
  GroupItem,
  ButtonItem,
  RequiredRule,
} from "devextreme-react/form";
import notify from "devextreme/ui/notify";
import "./userDetailsPage.scss";

const UserDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.selectedUserDetails);
  const activities = useSelector((state) => state.user.userActivities);
  const userSites = useSelector((state) => state.user.userSites);
  const allSites = useSelector((state) => state.user.allSites);
  const allRoles = useSelector((state) => state.user.allRoles);

  const [loading, setLoading] = useState(true);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showSitesPopup, setShowSitesPopup] = useState(false);
  const [showActivitiesPopup, setShowActivitiesPopup] = useState(false);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [sitesSearchText, setSitesSearchText] = useState("");
  const [activitiesSearchText, setActivitiesSearchText] = useState("");
  const [selectedSiteIds, setSelectedSiteIds] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [actionFilter, setActionFilter] = useState("all");
  const [controllerFilter, setControllerFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [editFormData, setEditFormData] = useState({
    userName: "",
    email: "",
    roleName: "",
    bypassLocationValidation: false,
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Always fetch user details fresh
        await dispatch(fetchUserById(id));
        // Load user sites after loading user data
        await dispatch(fetchUserSites(id));
      } catch (error) {
        notify(error.message, "error", 3000);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [dispatch, id]); // Removed 'user' from dependencies to prevent endless loop

  // Update edit form when user data changes
  useEffect(() => {
    if (user) {
      setEditFormData({
        userName: user.userName || "",
        email: user.email || "",
        roleName: user.roles && user.roles.length > 0 ? user.roles[0] : "",
        bypassLocationValidation: user.bypassLocationValidation || false,
      });
    }
  }, [user]);

  useEffect(() => {
    if (!allSites || allSites.length === 0) {
      setFilteredSites([]);
      return;
    }

    if (sitesSearchText) {
      setFilteredSites(
        allSites.filter(
          (site) =>
            site.name.toLowerCase().includes(sitesSearchText.toLowerCase()) ||
            (site.location &&
              site.location
                .toLowerCase()
                .includes(sitesSearchText.toLowerCase()))
        )
      );
    } else {
      setFilteredSites(allSites);
    }
  }, [allSites, sitesSearchText]);

  useEffect(() => {
    if (!activities || activities.length === 0) {
      setFilteredActivities([]);
      return;
    }

    let result = [...activities];

    result = result.filter((activity) => {
      const isMonitoringGet =
        activity.action === "GET" &&
        (activity.controller === "User" ||
          activity.controller === "UserActivities");
      return !isMonitoringGet;
    });

    if (actionFilter !== "all") {
      result = result.filter((activity) => activity.action === actionFilter);
    }

    if (controllerFilter !== "all") {
      result = result.filter(
        (activity) => activity.controller === controllerFilter
      );
    }

    const now = new Date();
    if (dateFilter === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter(
        (activity) => new Date(activity.timestamp) >= today
      );
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter(
        (activity) => new Date(activity.timestamp) >= weekAgo
      );
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      result = result.filter(
        (activity) => new Date(activity.timestamp) >= monthAgo
      );
    }

    setFilteredActivities(result);
  }, [activities, actionFilter, controllerFilter, dateFilter]);

  const goBack = () => {
    navigate("/admin/users");
  };

  const handleEditUser = async () => {
    // Reset form data to current user values
    if (user) {
      setEditFormData({
        userName: user.userName || "",
        email: user.email || "",
        roleName: user.roles && user.roles.length > 0 ? user.roles[0] : "",
        bypassLocationValidation: user.bypassLocationValidation || false,
      });
    }

    // Fetch roles if not already loaded
    if (!allRoles || allRoles.length === 0) {
      try {
        await dispatch(fetchAllRoles());
      } catch (error) {
        console.error("Error loading roles:", error);
      }
    }

    setShowEditPopup(true);
  };

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      await dispatch(updateUser(id, editFormData));
      notify("User updated successfully", "success", 3000);
      setShowEditPopup(false);
    } catch (error) {
      notify(error.message, "error", 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordFormData.newPassword || !passwordFormData.confirmPassword) {
      notify("Please fill in all password fields", "error", 3000);
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      notify("New password and confirmation do not match", "error", 3000);
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      notify("Password must be at least 6 characters long", "error", 3000);
      return;
    }

    setSaving(true);
    try {
      await dispatch(
        updateUser(id, {
          password: passwordFormData.newPassword,
        })
      );
      notify("Password changed successfully", "success", 3000);
      setShowPasswordPopup(false);
      setPasswordFormData({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      notify(error.message || "Error changing password", "error", 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleManageSites = async () => {
    setSitesLoading(true);
    setSitesSearchText(""); // Clear search text when opening popup
    try {
      // Fetch all sites first
      await dispatch(fetchAllSites());

      // Get current user sites to pre-select them
      const userSitesData = userSites || [];
      if (userSitesData && userSitesData.length > 0) {
        const siteIds = userSitesData.map((site) => site.id);
        setSelectedSiteIds(siteIds);
      } else {
        setSelectedSiteIds([]);
      }
      setShowSitesPopup(true);
    } catch (error) {
      notify(error.message, "error", 3000);
    } finally {
      setSitesLoading(false);
    }
  };

  const handleViewAllActivities = async () => {
    setActivitiesLoading(true);
    try {
      await dispatch(fetchUserActivities(id));
      setShowActivitiesPopup(true);
    } catch (error) {
      notify(error.message, "error", 3000);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      await dispatch(updateUserSites(id, selectedSiteIds));
      // Refresh user sites after successful update
      await dispatch(fetchUserSites(id));
      notify("Site assignments updated successfully", "success", 3000);
      setShowSitesPopup(false);
    } catch (error) {
      notify(error.message, "error", 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSiteSelectionChanged = (e) => {
    setSelectedSiteIds(e.selectedRowKeys);
  };

  const getUniqueActions = () => {
    if (!activities || activities.length === 0)
      return [{ value: "all", text: "All Actions" }];

    try {
      const uniqueValues = [
        ...new Set(
          activities
            .filter((activity) => activity.action)
            .map((activity) => activity.action)
        ),
      ];
      return [
        { value: "all", text: "All Actions" },
        ...uniqueValues.map((value) => ({ value, text: value })),
      ];
    } catch (error) {
      console.error("Error getting unique actions:", error);
      return [{ value: "all", text: "All Actions" }];
    }
  };

  const getUniqueControllers = () => {
    if (!activities || activities.length === 0)
      return [{ value: "all", text: "All Controllers" }];

    try {
      const uniqueValues = [
        ...new Set(
          activities
            .filter((activity) => activity.controller)
            .map((activity) => activity.controller)
        ),
      ];

      return [
        { value: "all", text: "All Controllers" },
        ...uniqueValues.map((value) => ({ value, text: value })),
      ];
    } catch (error) {
      console.error("Error getting unique controllers:", error);
      return [{ value: "all", text: "All Controllers" }];
    }
  };

  const dateFilterOptions = [
    { value: "all", text: "All Time" },
    { value: "today", text: "Today" },
    { value: "week", text: "Last 7 Days" },
    { value: "month", text: "Last 30 Days" },
  ];

  const renderStatusBadge = () => {
    if (!user) return null;

    const statusClass = user.isDeleted
      ? "status-badge inactive"
      : "status-badge active";
    return (
      <div className={statusClass}>
        {user.isDeleted ? "Inactive" : "Active"}
      </div>
    );
  };

  if (loading) {
    return <LoadPanel visible={true} />;
  }

  if (!user) {
    return (
      <div className="user-not-found">
        <h2>User Not Found</h2>
        <p>The requested user could not be found.</p>
        <Button text="Back to Users" onClick={goBack} />
      </div>
    );
  }

  return (
    <div className="user-details-container">
      <Toolbar className="user-details-toolbar">
        <ToolbarItem location="before">
          <Button icon="chevronleft" stylingMode="text" onClick={goBack} />
        </ToolbarItem>
        <ToolbarItem location="before" locateInMenu="never">
          <div className="toolbar-title-container">
            <h2 className="toolbar-title">User Details</h2>
          </div>
        </ToolbarItem>
        <ToolbarItem
          location="after"
          locateInMenu="auto"
          widget="dxButton"
          options={{
            text: "Edit User",
            icon: "edit",
            stylingMode: "contained",
            type: "default",
            onClick: handleEditUser,
          }}
        />
        <ToolbarItem
          location="after"
          locateInMenu="auto"
          widget="dxButton"
          options={{
            text: "Manage Sites",
            icon: "map",
            stylingMode: "contained",
            type: "default",
            onClick: handleManageSites,
          }}
        />
        <ToolbarItem
          location="after"
          locateInMenu="auto"
          widget="dxButton"
          options={{
            text: "View All Activities",
            icon: "clock",
            stylingMode: "contained",
            type: "default",
            onClick: handleViewAllActivities,
          }}
        />
      </Toolbar>

      <div className="user-details-content">
        <div className="user-info-card">
          <div className="info-header">
            <h3>User Information</h3>
          </div>
          <div className="info-content">
            <div className="info-item">
              <div className="label">Username</div>
              <div className="value">{user.userName}</div>
            </div>
            <div className="info-item">
              <div className="label">Email</div>
              <div className="value">{user.email}</div>
            </div>
            <div className="info-item">
              <div className="label">Phone Number</div>
              <div className="value">{user.phoneNumber || "N/A"}</div>
            </div>
            <div className="info-item">
              <div className="label">User Roles</div>
              <div className="value">
                {user.roles && user.roles.length > 0
                  ? user.roles.join(", ")
                  : "No roles assigned"}
              </div>
            </div>
            <div className="info-item">
              <div className="label">Status</div>
              <div className="value">{renderStatusBadge()}</div>
            </div>
            <div className="info-item">
              <div className="label">Assigned Sites</div>
              <div className="value">
                {userSites && Array.isArray(userSites) ? userSites.length : 0}
                {userSites &&
                  Array.isArray(userSites) &&
                  userSites.length > 0 && (
                    <span className="sites-preview">
                      {" - "}
                      {userSites
                        .slice(0, 2)
                        .map((site) => site.name)
                        .join(", ")}
                      {userSites.length > 2 &&
                        ` and ${userSites.length - 2} more`}
                    </span>
                  )}
              </div>
            </div>
          </div>
        </div>

        <div className="user-activity-card">
          <div className="activity-header">
            <h3>Recent Activities</h3>
          </div>
          <div className="activity-content">
            <DataGrid
              dataSource={activities ? activities.slice(0, 5) : []}
              showBorders={true}
              columnAutoWidth={true}
              wordWrapEnabled={true}
              height={300}
            >
              <Sorting mode="single" />
              <Column dataField="action" caption="Action" />
              <Column dataField="controller" caption="Controller" />
              <Column
                dataField="timestamp"
                caption="Timestamp"
                dataType="datetime"
                format="yyyy-MM-dd HH:mm:ss"
                sortOrder="desc"
                calculateCellValue={(data) => {
                  return data.timestamp ? new Date(data.timestamp) : null;
                }}
              />
              <Column dataField="ipAddress" caption="IP Address" />
            </DataGrid>
          </div>
        </div>
      </div>

      <Popup
        visible={showEditPopup}
        onHiding={() => setShowEditPopup(false)}
        title="Edit User"
        showCloseButton={true}
        width={600}
        height={500}
      >
        <div className="tw-p-4">
          <Form
            formData={editFormData}
            labelMode="floating"
            onFieldDataChanged={(e) => {
              setEditFormData((prev) => ({
                ...prev,
                [e.dataField]: e.value,
              }));
            }}
            colCount={1}
            width="100%"
          >
            <GroupItem>
              <SimpleItem
                dataField="userName"
                editorType="dxTextBox"
                editorOptions={{
                  stylingMode: "filled",
                }}
                label={{ text: "Username" }}
              >
                <RequiredRule message="Username is required" />
              </SimpleItem>

              <SimpleItem
                dataField="email"
                editorType="dxTextBox"
                editorOptions={{
                  stylingMode: "filled",
                }}
                label={{ text: "Email" }}
              >
                <RequiredRule message="Email is required" />
              </SimpleItem>

              <SimpleItem
                dataField="roleName"
                editorType="dxSelectBox"
                editorOptions={{
                  stylingMode: "filled",
                  dataSource: allRoles || [],
                  displayExpr: "name",
                  valueExpr: "name",
                  searchEnabled: true,
                  placeholder: "Select a role",
                }}
                label={{ text: "Role" }}
              />
            </GroupItem>

            {/* Mobile App Settings - Admin only */}
            <GroupItem caption="Mobile App Settings">
              <SimpleItem
                dataField="bypassLocationValidation"
                editorType="dxSwitch"
                editorOptions={{
                  switchedOnText: "YES",
                  switchedOffText: "NO",
                }}
                label={{ text: "Bypass GPS/Location Validation" }}
                helpText="Enable for users in low GPS/network coverage areas"
              />
            </GroupItem>

            <GroupItem cssClass="tw-flex tw-justify-between tw-gap-4">
              <ButtonItem
                horizontalAlignment="left"
                buttonOptions={{
                  text: "Change Password",
                  type: "normal",
                  icon: "key",
                  onClick: () => setShowPasswordPopup(true),
                }}
              />
              <ButtonItem
                horizontalAlignment="right"
                buttonOptions={{
                  text: "Save Changes",
                  type: "default",
                  onClick: handleSaveUser,
                  disabled: saving,
                }}
              />
            </GroupItem>
          </Form>
        </div>
      </Popup>

      <Popup
        visible={showSitesPopup}
        onHiding={() => setShowSitesPopup(false)}
        title={`Manage Sites for ${user.userName}`}
        showCloseButton={true}
        width={800}
        height={600}
      >
        <div className="tw-flex tw-flex-col tw-h-full">
          <div className="tw-p-4 tw-border-b">
            <p className="tw-mb-4">
              Select which sites this user can access and manage
            </p>
            <TextBox
              placeholder="Search sites..."
              mode="search"
              value={sitesSearchText}
              onValueChanged={(e) => setSitesSearchText(e.value)}
              stylingMode="filled"
              width="100%"
            />
          </div>

          <div
            className="tw-flex-1 tw-p-4"
            style={{ overflowY: "auto", maxHeight: "400px" }}
          >
            <DataGrid
              dataSource={filteredSites}
              showBorders={true}
              columnAutoWidth={true}
              wordWrapEnabled={true}
              hoverStateEnabled={true}
              noDataText="No sites found matching the search criteria"
              height="100%"
              keyExpr="id"
              selectedRowKeys={selectedSiteIds}
              onSelectionChanged={handleSiteSelectionChanged}
              loadPanel={{ enabled: sitesLoading }}
            >
              <Selection mode="multiple" selectAllMode="allPages" />
              <SearchPanel visible={false} />
              <FilterRow visible={true} />
              <HeaderFilter visible={true} />
              <Scrolling mode="virtual" />
              <Paging defaultPageSize={20} />
              <Pager
                showPageSizeSelector={true}
                allowedPageSizes={[10, 20, 50, 100]}
                showInfo={true}
              />

              <Column dataField="name" caption="Site Name" />
              <Column dataField="location" caption="Location" />
              <Column dataField="status" caption="Status" />
            </DataGrid>
          </div>

          <div className="tw-p-4 tw-border-t tw-flex tw-justify-between tw-items-center">
            <div className="tw-text-gray-600">
              {selectedSiteIds.length} sites selected
            </div>
            <div className="tw-flex tw-gap-2">
              <Button
                text="Cancel"
                onClick={() => setShowSitesPopup(false)}
                stylingMode="outlined"
              />
              <Button
                text="Save Changes"
                type="default"
                icon="save"
                onClick={handleSaveChanges}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </Popup>

      <Popup
        visible={showActivitiesPopup}
        onHiding={() => setShowActivitiesPopup(false)}
        title={`Activity Log for ${user.userName}`}
        showCloseButton={true}
        width={1000}
        height={700}
      >
        <div className="tw-flex tw-flex-col tw-h-full">
          <div className="tw-p-4 tw-border-b">
            <div className="tw-flex tw-flex-wrap tw-gap-4">
              <div className="tw-flex-1 tw-min-w-64">
                <TextBox
                  placeholder="Search activities..."
                  mode="search"
                  value={activitiesSearchText}
                  onValueChanged={(e) => setActivitiesSearchText(e.value)}
                  stylingMode="filled"
                  width="100%"
                />
              </div>

              <SelectBox
                items={getUniqueActions()}
                displayExpr="text"
                valueExpr="value"
                value={actionFilter}
                onValueChanged={(e) => setActionFilter(e.value)}
                placeholder="Filter by action"
                width={180}
              />

              <SelectBox
                items={getUniqueControllers()}
                displayExpr="text"
                valueExpr="value"
                value={controllerFilter}
                onValueChanged={(e) => setControllerFilter(e.value)}
                placeholder="Filter by controller"
                width={180}
              />

              <SelectBox
                items={dateFilterOptions}
                displayExpr="text"
                valueExpr="value"
                value={dateFilter}
                onValueChanged={(e) => setDateFilter(e.value)}
                placeholder="Filter by date"
                width={180}
              />
            </div>
          </div>

          <div className="tw-flex-1 tw-p-4">
            <DataGrid
              dataSource={filteredActivities}
              showBorders={true}
              columnAutoWidth={true}
              wordWrapEnabled={true}
              hoverStateEnabled={true}
              noDataText="No activities found matching the current filters"
              loadPanel={{ enabled: activitiesLoading }}
            >
              <Selection mode="single" />
              <SearchPanel visible={false} />
              <FilterRow visible={true} />
              <HeaderFilter visible={true} />
              <Sorting mode="multiple" />
              <Paging defaultPageSize={20} />
              <Pager
                showPageSizeSelector={true}
                allowedPageSizes={[10, 20, 50, 100]}
                showInfo={true}
              />

              <Column dataField="action" caption="Action" />
              <Column dataField="controller" caption="Controller" />
              <Column dataField="actionName" caption="Action Name" />
              <Column
                dataField="parameters"
                caption="Parameters"
                width={200}
                cellRender={(data) => (
                  <div className="parameters-cell">{data.value || "N/A"}</div>
                )}
              />
              <Column dataField="ipAddress" caption="IP Address" />
              <Column
                dataField="timestamp"
                caption="Timestamp"
                dataType="datetime"
                format="yyyy-MM-dd HH:mm:ss"
                sortOrder="desc"
                calculateCellValue={(data) => {
                  return data.timestamp ? new Date(data.timestamp) : null;
                }}
              />
            </DataGrid>
          </div>

          <div className="tw-p-4 tw-border-t tw-flex tw-justify-end">
            <Button
              text="Close"
              onClick={() => setShowActivitiesPopup(false)}
              stylingMode="contained"
            />
          </div>
        </div>
      </Popup>

      {/* Password Change Popup */}
      <Popup
        visible={showPasswordPopup}
        onHiding={() => {
          setShowPasswordPopup(false);
          setPasswordFormData({ newPassword: "", confirmPassword: "" });
        }}
        title="Change Password"
        showCloseButton={true}
        width={400}
        height="auto"
      >
        <div className="tw-p-4">
          <Form
            formData={passwordFormData}
            labelMode="floating"
            onFieldDataChanged={(e) => {
              setPasswordFormData((prev) => ({
                ...prev,
                [e.dataField]: e.value,
              }));
            }}
          >
            <GroupItem>
              <SimpleItem
                dataField="newPassword"
                editorType="dxTextBox"
                editorOptions={{
                  stylingMode: "filled",
                  mode: "password",
                }}
                label={{ text: "New Password" }}
              >
                <RequiredRule message="New password is required" />
              </SimpleItem>

              <SimpleItem
                dataField="confirmPassword"
                editorType="dxTextBox"
                editorOptions={{
                  stylingMode: "filled",
                  mode: "password",
                }}
                label={{ text: "Confirm New Password" }}
              >
                <RequiredRule message="Password confirmation is required" />
              </SimpleItem>
            </GroupItem>

            <ButtonItem
              horizontalAlignment="right"
              buttonOptions={{
                text: "Change Password",
                type: "default",
                onClick: handleChangePassword,
                disabled: saving,
              }}
            />
          </Form>
        </div>
      </Popup>
    </div>
  );
};

export default UserDetailsPage;
