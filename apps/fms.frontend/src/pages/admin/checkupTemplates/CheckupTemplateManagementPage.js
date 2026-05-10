/**
 * File: CheckupTemplateManagementPage.js
 * Purpose: Admin UI for CRUD management of vehicle transfer inspection checkup template rows.
 *          Follows M365 Admin Center Fluent Design with SlidePanel for view/edit.
 * Dependencies: DevExtreme DataGrid, SlidePanel, native HTML controls, axiosInstance
 * Last Modified: 2026-02-27
 *
 * Key Components:
 * - CheckupTemplateManagementPage: M365-styled list page with filters, DataGrid, and side panel.
 *   Row click opens detail view; Edit button switches to edit mode inside panel.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataGrid, {
  Column,
  FilterRow,
  HeaderFilter,
  Paging,
  SearchPanel,
} from "devextreme-react/data-grid";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../api/axiosInstance";
import SlidePanel from "../../../components/ui/SlidePanel";
import CheckupTemplateFormPanel from "./components/CheckupTemplateFormPanel";

import "./CheckupTemplateManagementPage.scss";

const EMPTY_FORM_DATA = {
  serialNo: null,
  description: "",
  checkType: "",
  vehicleTypeId: null,
  vehicleModelId: null,
  sortOrder: null,
  isActive: true,
};

const CHECK_TYPES = [
  "CHECK",
  "CHECK & TEST",
  "CHECK & LUBRICATE",
  "CHECK & CLEAN",
  "CHECK %",
  "TEST & CHECK",
  "DRAIN",
  "REFILL",
  "INSPECT",
];

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const getApiData = (response) => {
  const data = response?.data?.data || response?.data?.Data || response?.data || [];
  return Array.isArray(data) ? data : [];
};



const CheckupTemplateManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);

  const [filters, setFilters] = useState({
    vehicleTypeId: null,
    vehicleModelId: null,
    includeInactive: true,
  });

  // Panel state: "closed" | "view" | "edit" | "create"
  const [panelMode, setPanelMode] = useState("closed");
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);

  const panelOpen = panelMode !== "closed";

  const filteredModels = useMemo(() => {
    if (!filters.vehicleTypeId) return vehicleModels;

    return vehicleModels.filter((model) => {
      const typeId =
        model.vehicleTypeId ?? model.VehicleTypeId ?? model.vehicletypeId ?? model.VehicletypeId ?? null;
      return toNullableNumber(typeId) === toNullableNumber(filters.vehicleTypeId);
    });
  }, [filters.vehicleTypeId, vehicleModels]);

  /* ── Data Loading ── */

  const loadReferenceData = useCallback(async () => {
    const [vtRes, vmRes] = await Promise.all([
      axiosInstance.get("/vehicleType"),
      axiosInstance.get("/VehicleModel"),
    ]);
    setVehicleTypes(getApiData(vtRes));
    setVehicleModels(getApiData(vmRes));
  }, []);

  const loadTemplates = useCallback(async () => {
    const params = { includeInactive: filters.includeInactive };
    if (filters.vehicleTypeId) params.vehicleTypeId = filters.vehicleTypeId;
    if (filters.vehicleModelId) params.vehicleModelId = filters.vehicleModelId;

    setLoading(true);
    try {
      const response = await axiosInstance.get("/vehicletransfers/checkup-template/admin", { params });
      setTemplates(getApiData(response));
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || "Failed to load checkup templates", "error", 3000);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        await loadReferenceData();
      } catch (error) {
        notify(error?.response?.data?.message || error?.message || "Failed to load reference data", "error", 3000);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, [loadReferenceData]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  /* ── Panel Handlers ── */

  const openCreatePanel = () => {
    setSelectedItem(null);
    setFormData(EMPTY_FORM_DATA);
    setPanelMode("create");
  };

  const openDetailPanel = (item) => {
    setSelectedItem(item);
    setPanelMode("view");
  };

  const switchToEdit = () => {
    if (!selectedItem) return;
    setFormData({
      serialNo: selectedItem.serialNo ?? null,
      description: selectedItem.description ?? "",
      checkType: selectedItem.checkType ?? "",
      vehicleTypeId: selectedItem.vehicleTypeId ?? null,
      vehicleModelId: selectedItem.vehicleModelId ?? null,
      sortOrder: selectedItem.sortOrder ?? null,
      isActive: selectedItem.isActive ?? true,
    });
    setPanelMode("edit");
  };

  const closePanel = () => {
    setPanelMode("closed");
    setSelectedItem(null);
    setFormData(EMPTY_FORM_DATA);
  };

  const cancelEdit = () => {
    if (panelMode === "edit" && selectedItem) {
      setPanelMode("view");
      setFormData(EMPTY_FORM_DATA);
    } else {
      closePanel();
    }
  };

  const handleFormFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* ── CRUD ── */

  const handleSave = async () => {
    if (!formData.description?.trim()) {
      notify("Description is required", "warning", 2500);
      return;
    }

    const payload = {
      serialNo: formData.serialNo,
      description: formData.description.trim(),
      checkType: formData.checkType?.trim() || null,
      vehicleTypeId: formData.vehicleTypeId || null,
      vehicleModelId: formData.vehicleModelId || null,
      hasGps: null,
      sortOrder: formData.sortOrder,
      isActive: formData.isActive,
    };

    setLoading(true);
    try {
      if (panelMode === "edit" && selectedItem?.id) {
        await axiosInstance.put(`/vehicletransfers/checkup-template/${selectedItem.id}`, payload);
        notify("Template item updated", "success", 2000);
      } else {
        await axiosInstance.post("/vehicletransfers/checkup-template", payload);
        notify("Template item created", "success", 2000);
      }
      closePanel();
      await loadTemplates();
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || "Failed to save template item", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedItem) return;
    if (!window.confirm(`Remove "${selectedItem.description}" from active list?`)) return;

    setLoading(true);
    try {
      await axiosInstance.delete(`/vehicletransfers/checkup-template/${selectedItem.id}`);
      notify("Template item removed", "success", 2000);
      closePanel();
      await loadTemplates();
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || "Failed to remove template item", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      await axiosInstance.put(`/vehicletransfers/checkup-template/${selectedItem.id}`, {
        serialNo: selectedItem.serialNo,
        description: selectedItem.description,
        checkType: selectedItem.checkType,
        vehicleTypeId: selectedItem.vehicleTypeId,
        vehicleModelId: selectedItem.vehicleModelId,
        hasGps: selectedItem.hasGps,
        sortOrder: selectedItem.sortOrder,
        isActive: true,
      });
      notify("Template item reactivated", "success", 2000);
      closePanel();
      await loadTemplates();
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || "Failed to reactivate template item", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  /* ── DataGrid Row Click ── */

  const onRowClick = useCallback((e) => {
    if (e.rowType === "data" && e.data) {
      openDetailPanel(e.data);
    }
  }, []);

  /* ── Cell Renderers ── */

  const renderStatus = (cell) => {
    const active = cell.data.isActive;
    return (
      <span className={`m365-badge ${active ? "m365-badge--success" : "m365-badge--neutral"}`}>
        {active ? "Active" : "Inactive"}
      </span>
    );
  };

  /* ── Panel Title ── */

  const panelTitle = useMemo(() => {
    if (panelMode === "create") return "New Template Item";
    if (panelMode === "edit") return "Edit Template Item";
    return selectedItem?.description || "Template Item";
  }, [panelMode, selectedItem]);

  /* ── Panel Header Actions (view mode) ── */

  const panelHeaderActions = useMemo(() => {
    if (panelMode !== "view" || !selectedItem) return null;

    return (
      <div className="checkup-template__panel-actions">
        <button className="m365-cmd-btn" onClick={switchToEdit}>
          <i className="fa-light fa-pen-to-square" />
          Edit
        </button>
        {selectedItem.isActive ? (
          <button className="m365-cmd-btn m365-cmd-btn--danger" onClick={handleRemove}>
            <i className="fa-light fa-trash-can" />
            Delete
          </button>
        ) : (
          <button className="m365-cmd-btn m365-cmd-btn--success" onClick={handleReactivate}>
            <i className="fa-light fa-rotate-left" />
            Restore
          </button>
        )}
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelMode, selectedItem]);

  /* ── Render ── */

  return (
    <div className="checkup-template-page">
      {/* ── M365 Page Header ── */}
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-clipboard-list-check m365-page-header__icon" />
          <h2 className="m365-page-header__title">
            Checkup Templates
            <span className="m365-page-header__count">{templates.length}</span>
          </h2>
        </div>
        <div className="m365-page-header__actions">
          <button className="m365-btn m365-btn--primary" onClick={openCreatePanel}>
            <i className="fa-light fa-plus" />
            Add Item
          </button>
          <button className="m365-btn m365-btn--ghost" onClick={loadTemplates}>
            <i className="fa-light fa-rotate-right" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── M365 Filter Bar ── */}
      <div className="m365-filters">
        <select
          className="m365-select"
          value={filters.vehicleTypeId ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              vehicleTypeId: e.target.value === "" ? null : Number(e.target.value),
              vehicleModelId: null,
            }))
          }
        >
          <option value="">All Vehicle Types</option>
          {vehicleTypes.map((vt) => (
            <option key={vt.id} value={vt.id}>{vt.name}</option>
          ))}
        </select>

        <select
          className="m365-select"
          value={filters.vehicleModelId ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              vehicleModelId: e.target.value === "" ? null : Number(e.target.value),
            }))
          }
          disabled={filteredModels.length === 0 && !filters.vehicleTypeId}
        >
          <option value="">All Models</option>
          {filteredModels.map((vm) => (
            <option key={vm.id} value={vm.id}>{vm.name}</option>
          ))}
        </select>

        <label className="m365-checkbox">
          <input
            type="checkbox"
            checked={filters.includeInactive}
            onChange={(e) => setFilters((prev) => ({ ...prev, includeInactive: e.target.checked }))}
          />
          <span className="m365-checkbox__label">Include inactive</span>
        </label>
      </div>

      {/* ── Data Grid ── */}
      <div className="checkup-template-page__grid">
        <DataGrid
          dataSource={templates}
          keyExpr="id"
          showBorders={false}
          showRowLines={true}
          rowAlternationEnabled={false}
          columnAutoWidth={true}
          allowColumnResizing={true}
          allowColumnReordering={true}
          repaintChangesOnly={true}
          hoverStateEnabled={true}
          height="100%"
          noDataText={loading ? "Loading…" : "No template items found"}
          onRowClick={onRowClick}
        >
          <FilterRow visible={true} />
          <HeaderFilter visible={true} />
          <SearchPanel visible={true} width={240} placeholder="Search…" />
          <Paging defaultPageSize={25} />

          <Column dataField="serialNo" caption="#" width={60} alignment="center" />
          <Column dataField="description" caption="Description" minWidth={260} />
          <Column dataField="checkType" caption="Check Type" width={140} />
          <Column dataField="vehicleTypeName" caption="Vehicle Type" width={150} />
          <Column dataField="vehicleModelName" caption="Vehicle Model" width={150} />
          <Column dataField="sortOrder" caption="Sort" width={70} alignment="center" />
          <Column
            dataField="isActive"
            caption="Status"
            width={100}
            cellRender={renderStatus}
          />
        </DataGrid>
      </div>

      {/* ── Side Panel ── */}
      <SlidePanel
        open={panelOpen}
        onClose={closePanel}
        title={panelTitle}
        width={1000}
        headerActions={panelMode === "view" ? panelHeaderActions : undefined}
      >
        {panelMode === "view" && selectedItem && (
          <CheckupTemplateDetailView
            item={selectedItem}
            vehicleTypes={vehicleTypes}
            vehicleModels={vehicleModels}
          />
        )}

        {(panelMode === "edit" || panelMode === "create") && (
          <CheckupTemplateFormPanel
            editingItem={panelMode === "edit" ? selectedItem : null}
            formData={formData}
            checkTypes={CHECK_TYPES}
            vehicleTypes={vehicleTypes}
            vehicleModels={vehicleModels}
            saving={loading}
            onClose={cancelEdit}
            onSave={handleSave}
            onChange={handleFormFieldChange}
          />
        )}
      </SlidePanel>
    </div>
  );
};

/* ── Detail View (read-only) ── */

const CheckupTemplateDetailView = ({ item }) => {
  return (
    <div className="checkup-detail-view">
      {/* ── Item Details ── */}
      <div className="m365-flat-section" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
        <h3 className="m365-flat-section__title">Item Details</h3>
        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Description</span>
            <span className="m365-info-cell__value">{item.description || "—"}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Check Type</span>
            <span className="m365-info-cell__value">{item.checkType || "—"}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Serial No</span>
            <span className="m365-info-cell__value">{item.serialNo ?? "Auto"}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Sort Order</span>
            <span className="m365-info-cell__value">{item.sortOrder ?? "Auto"}</span>
          </div>
        </div>
      </div>

      {/* ── Applicability Criteria ── */}
      <div className="m365-flat-section">
        <h3 className="m365-flat-section__title">Applicability Criteria</h3>
        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Vehicle Type</span>
            <span className="m365-info-cell__value">{item.vehicleTypeName || "All Types"}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Vehicle Model</span>
            <span className="m365-info-cell__value">{item.vehicleModelName || "All Models"}</span>
          </div>
        </div>
      </div>

      {/* ── Settings ── */}
      <div className="m365-flat-section">
        <h3 className="m365-flat-section__title">Settings</h3>
        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Status</span>
            <span className="m365-info-cell__value">
              <span className={`m365-badge ${item.isActive ? "m365-badge--success" : "m365-badge--neutral"}`}>
                {item.isActive ? "Active" : "Inactive"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckupTemplateManagementPage;
