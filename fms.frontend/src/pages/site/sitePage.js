import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import DataGrid, {
  Column,
  Selection,
  SearchPanel,
  HeaderFilter,
  Paging,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";
import { TextBox } from "devextreme-react/text-box";
import { SelectBox } from "devextreme-react/select-box";
import { LoadPanel } from "devextreme-react/load-panel";
import notify from "devextreme/ui/notify";
import {
  fetchSiteList,
  createSite,
  updateSite,
  deleteSite,
} from "../../redux/actions/siteActions";
import { fetchUsers } from "../../redux/actions/userActions";
import { getGpsGateTags, updateSiteTagConfiguration } from "../../api/siteTagApi";
import "./sitePage.scss";

// Move these OUTSIDE the component to prevent React reconciliation issues
const InfoRow = ({ label, value, icon }) => (
  <div className="tw-flex tw-items-center tw-justify-between tw-py-3 tw-border-b tw-border-slate-100 last:tw-border-0">
    <span className="tw-text-slate-500 tw-text-sm tw-flex tw-items-center">
      {icon && <i className={`${icon} tw-mr-2 tw-w-4 tw-text-center`}></i>}
      {label}
    </span>
    <span className="tw-font-medium tw-text-slate-800">{value}</span>
  </div>
);

const SectionCard = ({ title, icon, children, actions }) => (
  <div className="tw-bg-white tw-border tw-border-slate-200 tw-rounded-lg tw-shadow-sm hover:tw-shadow tw-transition-shadow">
    <div className="tw-px-4 tw-py-3 tw-border-b tw-border-slate-100 tw-bg-slate-50/50 tw-rounded-t-lg tw-flex tw-justify-between tw-items-center">
      <h3 className="tw-font-semibold tw-text-slate-700 tw-flex tw-items-center tw-text-sm tw-uppercase tw-tracking-wide">
        <i className={`${icon} tw-mr-2 tw-text-slate-500`}></i>
        {title}
      </h3>
      {actions && <div className="tw-flex tw-gap-2">{actions}</div>}
    </div>
    <div className="tw-px-4 tw-py-3">{children}</div>
  </div>
);

// Cell render function for status column - defined outside to prevent reconciliation issues
const StatusCellRender = (data) => (
  <span
    className={`tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium ${
      data.value
        ? "tw-bg-emerald-100 tw-text-emerald-700"
        : "tw-bg-red-100 tw-text-red-700"
    }`}
  >
    {data.value ? "Active" : "Inactive"}
  </span>
);

// Status badge component
const StatusBadge = ({ isActive }) => (
  <span
    className={`tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium ${
      isActive
        ? "tw-bg-emerald-100 tw-text-emerald-700"
        : "tw-bg-red-100 tw-text-red-700"
    }`}
  >
    {isActive ? "Active" : "Inactive"}
  </span>
);

// Cell render function for GPSGate tag column
const GpsGateTagCellRender = (data) => {
  if (!data.data.gpsGateTagName) {
    return <span className="tw-text-slate-400 tw-text-xs">-</span>;
  }
  return (
    <span className="tw-flex tw-items-center tw-gap-1">
      <span
        className="tw-w-2.5 tw-h-2.5 tw-rounded-full tw-inline-block tw-flex-shrink-0"
        style={{ backgroundColor: data.data.gpsGateTagColor || "#6366f1" }}
      ></span>
      <span className="tw-text-xs tw-truncate">{data.data.gpsGateTagName}</span>
    </span>
  );
};

const SitePage = () => {
  const dispatch = useDispatch();
  const { sites, loading, creating, updating, deleting } = useSelector(
    (state) => state.site
  );
  const { user } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.user);

  // Get user roles from auth state
  const userRoles = user ? user.roles : [];
  const canCreateSite =
    userRoles.includes("Admin") || userRoles.includes("SiteManager");
  const canEditSite =
    userRoles.includes("Admin") || userRoles.includes("SiteManager");
  const canDeleteSite = userRoles.includes("Admin");

  const [selectedSite, setSelectedSite] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [gpsGateTags, setGpsGateTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    isActive: true,
    siteAdministratorId: "",
    gpsGateTagId: null,
    gpsGateTagName: "",
    autoUpdateGpsGateTag: true,
  });
  const dataGridRef = useRef(null);

  // Memoize selectedRowKeys to prevent unnecessary re-renders
  const selectedRowKeys = useMemo(
    () => (selectedSite ? [selectedSite.id] : []),
    [selectedSite?.id]
  );

  useEffect(() => {
    dispatch(fetchSiteList());
    dispatch(fetchUsers());
    loadGpsGateTags();
  }, [dispatch]);

  // Load GPSGate tags
  const loadGpsGateTags = async () => {
    setLoadingTags(true);
    try {
      const response = await getGpsGateTags();
      // Response is already the FMSResponse object {data: [...], isSuccess: true}
      if (response?.isSuccess && response.data) {
        setGpsGateTags(response.data);
      } else if (Array.isArray(response?.data)) {
        // Fallback: direct array in data property
        setGpsGateTags(response.data);
      } else if (Array.isArray(response)) {
        // Fallback: response is directly an array
        setGpsGateTags(response);
      }
    } catch (error) {
      console.error("Failed to load GPSGate tags:", error);
    } finally {
      setLoadingTags(false);
    }
  };

  // Update form when site is selected
  useEffect(() => {
    if (selectedSite && !isCreating) {
      setFormData({
        name: selectedSite.name || "",
        isActive: selectedSite.isActive ?? true,
        siteAdministratorId: selectedSite.siteAdministratorId || "",
        gpsGateTagId: selectedSite.gpsGateTagId || null,
        gpsGateTagName: selectedSite.gpsGateTagName || "",
        autoUpdateGpsGateTag: selectedSite.autoUpdateGpsGateTag ?? true,
      });
    }
  }, [selectedSite, isCreating]);

  const handleSelectionChanged = useCallback((e) => {
    if (e.selectedRowsData.length > 0) {
      setSelectedSite(e.selectedRowsData[0]);
      setIsCreating(false);
      setIsEditing(false);
    }
  }, []);

  const handleRefresh = () => {
    dispatch(fetchSiteList());
  };

  const handleAddSite = () => {
    setSelectedSite(null);
    setIsCreating(true);
    setIsEditing(true);
    setFormData({
      name: "",
      isActive: true,
      siteAdministratorId: "",
      gpsGateTagId: null,
      gpsGateTagName: "",
      autoUpdateGpsGateTag: true,
    });
  };

  const handleEditSite = () => {
    if (selectedSite) {
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (isCreating) {
      setIsCreating(false);
      setIsEditing(false);
      setFormData({
        name: "",
        isActive: true,
        siteAdministratorId: "",
        gpsGateTagId: null,
        gpsGateTagName: "",
        autoUpdateGpsGateTag: true,
      });
    } else if (selectedSite) {
      setFormData({
        name: selectedSite.name || "",
        isActive: selectedSite.isActive ?? true,
        siteAdministratorId: selectedSite.siteAdministratorId || "",
        gpsGateTagId: selectedSite.gpsGateTagId || null,
        gpsGateTagName: selectedSite.gpsGateTagName || "",
        autoUpdateGpsGateTag: selectedSite.autoUpdateGpsGateTag ?? true,
      });
      setIsEditing(false);
    }
  };

  const handleSaveSite = async () => {
    if (!formData.name?.trim()) {
      notify("Site name is required", "error", 3000);
      return;
    }

    let result;
    if (isCreating) {
      result = await dispatch(createSite(formData));
    } else if (selectedSite) {
      result = await dispatch(updateSite(selectedSite.id, formData));
    }

    if (result?.success) {
      notify(
        `Site ${isCreating ? "created" : "updated"} successfully`,
        "success",
        3000
      );
      setIsEditing(false);
      setIsCreating(false);

      // Refresh site list and update selection with fresh data
      const refreshResult = await dispatch(fetchSiteList());

      // Update selectedSite with the refreshed data
      if (!isCreating && selectedSite && refreshResult?.data) {
        const updatedSite = refreshResult.data.find(
          (s) => s.id === selectedSite.id
        );
        if (updatedSite) {
          setSelectedSite(updatedSite);
        }
      } else if (isCreating && result?.data) {
        // For new sites, select the newly created site
        const newSite = refreshResult?.data?.find(
          (s) => s.id === result.data.id || s.name === formData.name
        );
        if (newSite) {
          setSelectedSite(newSite);
        }
      }
    } else {
      if (result?.validationErrors && result.validationErrors.length > 0) {
        notify(result.validationErrors.join(", "), "error", 5000);
      } else {
        notify(
          result?.message ||
            `Failed to ${isCreating ? "create" : "update"} site`,
          "error",
          5000
        );
      }
    }
  };

  const handleDeleteSite = async () => {
    if (selectedSite) {
      if (
        window.confirm(
          `Are you sure you want to delete the site "${selectedSite.name}"?`
        )
      ) {
        const result = await dispatch(deleteSite(selectedSite.id));
        if (result.success) {
          notify("Site deleted successfully", "success", 3000);
          setSelectedSite(null);
          setIsEditing(false);
        } else {
          notify(result.message || "Failed to delete site", "error", 5000);
        }
      }
    }
  };

  const renderSiteDetails = () => {
    if (isCreating) {
      return renderEditForm();
    }

    if (!selectedSite) {
      return (
        <div className="tw-h-full tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-slate-400 tw-py-20">
          <i className="fa-light fa-building tw-text-6xl tw-mb-4"></i>
          <p className="tw-text-lg">Select a site to view details</p>
          <p className="tw-text-sm tw-mt-2">
            Or click "Add Site" to create a new one
          </p>
        </div>
      );
    }

    if (isEditing) {
      return renderEditForm();
    }

    return (
      <div className="site-details tw-animate-fadeIn tw-space-y-6">
        {/* Header */}
        <div className="tw-bg-gradient-to-r tw-from-slate-800 tw-to-slate-700 tw-rounded-xl tw-p-6 tw-text-white tw-shadow-lg">
          <div className="tw-flex tw-items-center tw-gap-4">
            <div className="tw-w-16 tw-h-16 tw-rounded-full tw-bg-white/10 tw-flex tw-items-center tw-justify-center tw-backdrop-blur">
              <i className="fa-light fa-building tw-text-3xl"></i>
            </div>
            <div className="tw-flex-1">
              <h2 className="tw-text-2xl tw-font-bold">{selectedSite.name}</h2>
              <div className="tw-flex tw-items-center tw-gap-3 tw-mt-2">
                <span
                  className={`tw-px-3 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
                    selectedSite.isActive
                      ? "tw-bg-emerald-500/20 tw-text-emerald-300"
                      : "tw-bg-red-500/20 tw-text-red-300"
                  }`}
                >
                  {selectedSite.isActive ? "Active" : "Inactive"}
                </span>
                <span className="tw-text-slate-300 tw-text-sm">
                  ID: {selectedSite.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Site Details Section */}
        <SectionCard
          title="Site Information"
          icon="fa-light fa-info-circle"
          actions={
            canEditSite && (
              <Button
                icon="fa-light fa-edit"
                text="Edit"
                type="default"
                stylingMode="text"
                onClick={handleEditSite}
              />
            )
          }
        >
          <InfoRow
            label="Site Name"
            value={selectedSite.name}
            icon="fa-light fa-building"
          />
          <InfoRow
            label="Status"
            value={<StatusBadge isActive={selectedSite.isActive} />}
            icon="fa-light fa-toggle-on"
          />
          <InfoRow
            label="Site Administrator"
            value={selectedSite.siteAdministratorName || "Not Assigned"}
            icon="fa-light fa-user-tie"
          />
        </SectionCard>

        {/* GPSGate Tag Configuration */}
        <SectionCard title="GPSGate Tag Configuration" icon="fa-light fa-tags">
          <InfoRow
            label="GPSGate Tag"
            value={
              selectedSite.gpsGateTagName ? (
                <span className="tw-flex tw-items-center tw-gap-2">
                  <span
                    className="tw-w-3 tw-h-3 tw-rounded-full tw-inline-block"
                    style={{ backgroundColor: selectedSite.gpsGateTagColor || "#6366f1" }}
                  ></span>
                  {selectedSite.gpsGateTagName}
                </span>
              ) : (
                <span className="tw-text-slate-400">Not Configured</span>
              )
            }
            icon="fa-light fa-tag"
          />
          <InfoRow
            label="Auto-Update Vehicle Tags"
            value={
              <span
                className={`tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium ${
                  selectedSite.autoUpdateGpsGateTag
                    ? "tw-bg-emerald-100 tw-text-emerald-700"
                    : "tw-bg-slate-100 tw-text-slate-700"
                }`}
              >
                {selectedSite.autoUpdateGpsGateTag ? "Enabled" : "Disabled"}
              </span>
            }
            icon="fa-light fa-sync"
          />
        </SectionCard>

        {/* Quick Stats Section */}
        <SectionCard title="Quick Stats" icon="fa-light fa-chart-bar">
          <div className="tw-grid tw-grid-cols-2 tw-gap-4">
            <div className="tw-bg-blue-50 tw-rounded-lg tw-p-4 tw-text-center">
              <i className="fa-light fa-gas-pump tw-text-2xl tw-text-blue-600 tw-mb-2"></i>
              <p className="tw-text-sm tw-text-slate-600">Tanks</p>
              <p className="tw-text-xl tw-font-bold tw-text-slate-800">-</p>
            </div>
            <div className="tw-bg-green-50 tw-rounded-lg tw-p-4 tw-text-center">
              <i className="fa-light fa-truck tw-text-2xl tw-text-green-600 tw-mb-2"></i>
              <p className="tw-text-sm tw-text-slate-600">Vehicles</p>
              <p className="tw-text-xl tw-font-bold tw-text-slate-800">-</p>
            </div>
            <div className="tw-bg-purple-50 tw-rounded-lg tw-p-4 tw-text-center">
              <i className="fa-light fa-users tw-text-2xl tw-text-purple-600 tw-mb-2"></i>
              <p className="tw-text-sm tw-text-slate-600">Employees</p>
              <p className="tw-text-xl tw-font-bold tw-text-slate-800">-</p>
            </div>
            <div className="tw-bg-amber-50 tw-rounded-lg tw-p-4 tw-text-center">
              <i className="fa-light fa-microchip tw-text-2xl tw-text-amber-600 tw-mb-2"></i>
              <p className="tw-text-sm tw-text-slate-600">PTS Devices</p>
              <p className="tw-text-xl tw-font-bold tw-text-slate-800">-</p>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderEditForm = () => (
    <div className="site-edit-form tw-animate-fadeIn tw-space-y-6">
      {/* Header */}
      <div className="tw-bg-gradient-to-r tw-from-blue-600 tw-to-blue-700 tw-rounded-xl tw-p-6 tw-text-white tw-shadow-lg">
        <div className="tw-flex tw-items-center tw-gap-4">
          <div className="tw-w-16 tw-h-16 tw-rounded-full tw-bg-white/10 tw-flex tw-items-center tw-justify-center tw-backdrop-blur">
            <i
              className={`fa-light ${
                isCreating ? "fa-plus" : "fa-edit"
              } tw-text-3xl`}
            ></i>
          </div>
          <div>
            <h2 className="tw-text-2xl tw-font-bold">
              {isCreating ? "Create New Site" : `Edit: ${selectedSite?.name}`}
            </h2>
            <p className="tw-text-blue-200 tw-text-sm tw-mt-1">
              {isCreating
                ? "Fill in the details below to create a new site"
                : "Update the site information below"}
            </p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <SectionCard title="Site Information" icon="fa-light fa-info-circle">
        <div className="tw-space-y-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-700 tw-mb-1">
              Site Name <span className="tw-text-red-500">*</span>
            </label>
            <TextBox
              value={formData.name}
              onValueChanged={(e) =>
                setFormData({ ...formData, name: e.value })
              }
              placeholder="Enter site name"
              maxLength={255}
              className="tw-w-full"
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-700 tw-mb-1">
              Site Administrator
            </label>
            <SelectBox
              dataSource={users || []}
              value={formData.siteAdministratorId}
              valueExpr="id"
              displayExpr={(item) =>
                item
                  ? `${item.firstName || ""} ${item.lastName || ""} (${
                      item.userName || item.email || ""
                    })`.trim()
                  : ""
              }
              onValueChanged={(e) =>
                setFormData({ ...formData, siteAdministratorId: e.value })
              }
              placeholder="Select site administrator"
              searchEnabled={true}
              showClearButton={true}
              className="tw-w-full"
            />
          </div>

          <div className="tw-flex tw-items-center tw-justify-between tw-py-2">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-700">
                Active Status
              </label>
              <p className="tw-text-xs tw-text-slate-500">
                Inactive sites are hidden from fuel reporting
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="tw-w-5 tw-h-5 tw-text-blue-600 tw-border-gray-300 tw-rounded focus:tw-ring-blue-500"
            />
          </div>
        </div>
      </SectionCard>

      {/* GPSGate Tag Configuration */}
      <SectionCard title="GPSGate Tag Configuration" icon="fa-light fa-tags">
        <div className="tw-space-y-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-700 tw-mb-1">
              GPSGate Tag
            </label>
            <SelectBox
              dataSource={gpsGateTags || []}
              value={formData.gpsGateTagId}
              valueExpr="id"
              displayExpr="name"
              onValueChanged={(e) => {
                const selectedTag = gpsGateTags.find((t) => t.id === e.value);
                setFormData({
                  ...formData,
                  gpsGateTagId: e.value,
                  gpsGateTagName: selectedTag?.name || "",
                });
              }}
              placeholder={loadingTags ? "Loading tags..." : "Select GPSGate tag"}
              searchEnabled={true}
              showClearButton={true}
              disabled={loadingTags}
              className="tw-w-full"
              itemRender={(item) => (
                <div className="tw-flex tw-items-center tw-gap-2">
                  {item.color && (
                    <span
                      className="tw-w-3 tw-h-3 tw-rounded-full tw-inline-block"
                      style={{ backgroundColor: item.color }}
                    ></span>
                  )}
                  <span>{item.name}</span>
                </div>
              )}
            />
            <p className="tw-text-xs tw-text-slate-500 tw-mt-1">
              Vehicles transferred to this site will be assigned this GPSGate tag
            </p>
          </div>

          <div className="tw-flex tw-items-center tw-justify-between tw-py-2">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-700">
                Auto-Update Vehicle Tags
              </label>
              <p className="tw-text-xs tw-text-slate-500">
                Automatically update vehicle's GPSGate tag when transferred to this site
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.autoUpdateGpsGateTag}
              onChange={(e) =>
                setFormData({ ...formData, autoUpdateGpsGateTag: e.target.checked })
              }
              className="tw-w-5 tw-h-5 tw-text-blue-600 tw-border-gray-300 tw-rounded focus:tw-ring-blue-500"
            />
          </div>
        </div>
      </SectionCard>

      {/* Form Actions */}
      <div className="tw-flex tw-justify-end tw-gap-3">
        <Button
          text="Cancel"
          icon="fa-light fa-times"
          type="normal"
          stylingMode="outlined"
          onClick={handleCancelEdit}
        />
        <Button
          text={isCreating ? "Create Site" : "Save Changes"}
          icon={isCreating ? "fa-light fa-plus" : "fa-light fa-check"}
          type="default"
          stylingMode="contained"
          onClick={handleSaveSite}
          disabled={creating || updating}
        />
      </div>
    </div>
  );

  return (
    <div className="content-block site-page tw-h-full tw-flex tw-flex-col">
      {/* Header Section */}
      <div className="tw-bg-white tw-p-4 tw-border-b tw-border-gray-200 tw-rounded-t-lg tw-shadow-sm tw-mb-4">
        <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-justify-between lg:tw-items-center tw-gap-4">
          {/* Title */}
          <div className="tw-flex-shrink-0">
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
              <i className="fa-light fa-building tw-mr-2 tw-text-blue-600"></i>
              Site Management
            </h2>
            <p className="tw-text-gray-600 tw-text-sm tw-mt-1">
              Manage sites, assign administrators, and control site status
            </p>
          </div>

          {/* Actions section */}
          <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 tw-items-stretch sm:tw-items-center">
            <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-2 tw-w-full sm:tw-w-auto">
              {/* Segmented Button Group */}
              <div className="site-page__action-buttons">
                <Button
                  text="Refresh"
                  icon="fa-light fa-refresh"
                  type="default"
                  stylingMode="outlined"
                  onClick={handleRefresh}
                  hint="Refresh site data"
                  className="site-page__action-btn site-page__action-btn--first"
                />

                <Button
                  text="Add Site"
                  icon="fa-light fa-plus-circle"
                  type="default"
                  stylingMode="outlined"
                  onClick={handleAddSite}
                  disabled={!canCreateSite}
                  hint="Add a new site"
                  className="site-page__action-btn site-page__action-btn--add"
                />

                <Button
                  text="Edit"
                  icon="fa-light fa-edit"
                  type="default"
                  stylingMode="outlined"
                  onClick={handleEditSite}
                  disabled={!canEditSite || !selectedSite}
                  hint="Edit selected site"
                  className="site-page__action-btn"
                />

                <Button
                  text="Delete"
                  icon="fa-light fa-trash"
                  type="default"
                  stylingMode="outlined"
                  onClick={handleDeleteSite}
                  disabled={!canDeleteSite || !selectedSite}
                  hint="Delete selected site"
                  className="site-page__action-btn site-page__action-btn--delete site-page__action-btn--last"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="tw-flex-1 tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-min-h-0">
        {/* Left Panel - Sites List */}
        <div className="tw-w-full lg:tw-w-2/5 xl:tw-w-1/3 tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-flex tw-flex-col tw-min-h-[400px] lg:tw-min-h-0">
          <div className="tw-px-4 tw-py-3 tw-border-b tw-border-gray-200 tw-bg-slate-50 tw-rounded-t-lg">
            <h3 className="tw-font-semibold tw-text-slate-700 tw-flex tw-items-center">
              <i className="fa-light fa-list tw-mr-2"></i>
              Sites ({sites?.length || 0})
            </h3>
          </div>
          <div className="tw-flex-1 tw-overflow-hidden">
            <DataGrid
              ref={dataGridRef}
              dataSource={sites}
              keyExpr="id"
              showBorders={false}
              showRowLines={true}
              columnAutoWidth={true}
              wordWrapEnabled={true}
              height="100%"
              onSelectionChanged={handleSelectionChanged}
              selectedRowKeys={selectedRowKeys}
              hoverStateEnabled={true}
              loadPanel={{
                enabled: loading,
                text: "Loading sites...",
              }}
            >
              <Selection mode="single" />
              <SearchPanel
                visible={true}
                width="100%"
                placeholder="Search sites..."
              />
              <HeaderFilter visible={true} />
              <Paging enabled={false} />

              <Column dataField="id" caption="ID" width={60} />
              <Column dataField="name" caption="Site Name" />
              <Column
                dataField="gpsGateTagName"
                caption="GPSGate Tag"
                width={130}
                cellRender={GpsGateTagCellRender}
              />
              <Column
                dataField="isActive"
                caption="Status"
                width={80}
                cellRender={StatusCellRender}
              />
            </DataGrid>
          </div>
        </div>

        {/* Right Panel - Site Details */}
        <div
          key={
            selectedSite
              ? `site-${selectedSite.id}`
              : isCreating
              ? "creating"
              : "empty"
          }
          className="tw-flex-1 tw-bg-slate-50 tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-overflow-auto"
        >
          {renderSiteDetails()}
        </div>
      </div>

      {/* Loading Panel */}
      <LoadPanel
        visible={creating || updating || deleting}
        message={
          creating
            ? "Creating site..."
            : updating
            ? "Updating site..."
            : deleting
            ? "Deleting site..."
            : ""
        }
        position={{ my: "center", at: "center", of: window }}
      />
    </div>
  );
};

export default SitePage;
