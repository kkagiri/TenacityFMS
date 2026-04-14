/**
 * File: EmployeeFormPanel.js
 * Purpose: Side-panel form used for creating and editing employee records.
 * Dependencies: react, devextreme-react/tag-box, devextreme/data/custom_store, vehicle search API
 * Last Modified: 2026-04-11
 *
 * Props:
 * - mode: "create" | "edit"
 * - employee: current employee when editing
 * - sites: available site list
 * - saving: disables actions while submit is in progress
 * - onSubmit: async handler for create/update payload
 * - onClose: closes the side panel
 */
import React, { useEffect, useMemo, useState } from "react";
import TagBox from "devextreme-react/tag-box";
import CustomStore from "devextreme/data/custom_store";
import axiosInstance from "../../../api/axiosInstance";
import { checkEmployeeDuplicates, fetchEmployeePositions } from "../../../redux/actions/employeeActions";
import { quickSearchVehicles } from "../../../redux/actions/vehicleSearchActions";

const EMPTY_FORM = {
  fullName: "",
  employeephoneNumber: "",
  employeeWorkNo: "",
  position: "",
  employeestatus: "Active",
  siteId: "",
  vehicles: [],
};

const STATUS_OPTIONS = ["Active", "Terminated"];

const EMPTY_DUPLICATE_STATE = {
  isChecking: false,
  hasNameWarning: false,
  hasWorkNumberConflict: false,
  nameMatches: [],
  workNumberMatches: [],
};

const buildInitialForm = (initialValues = {}) => ({
  ...EMPTY_FORM,
  ...initialValues,
  siteId:
    initialValues?.siteId === undefined || initialValues?.siteId === null || initialValues?.siteId === ""
      ? ""
      : String(initialValues.siteId),
  vehicles: normalizeVehicleIds(initialValues?.vehicles),
});

const normalizeVehicleIds = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      typeof item === "object" && item !== null ? item.vehicleId : item
    )
    .filter((item) => item !== undefined && item !== null);
};

const arraysEqual = (left, right) => {
  if (left === right) return true;
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (String(left[index]) !== String(right[index])) return false;
  }
  return true;
};

const toVehicleDisplay = (vehicle) => {
  if (!vehicle) return "";
  const code = vehicle.hyoungNo || vehicle.numberPlate || `#${vehicle.vehicleId}`;
  const name = vehicle.vehicleName || "";
  return name ? `${code} - ${name}` : code;
};

const normalizeVehiclePayload = (payload) => {
  if (!payload) return null;
  if (payload.vehicleId) return payload;

  const wrapped = payload.data || payload.Data || payload.vehicleDto || payload.VehicleDto;
  if (wrapped?.vehicleId) return wrapped;

  return null;
};

const EmployeeFormPanel = ({
  mode = "create",
  employee = null,
  initialValues = null,
  sites = [],
  saving = false,
  hideSectionBorders = false,
  onSubmit,
  onClose,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [duplicateState, setDuplicateState] = useState(EMPTY_DUPLICATE_STATE);
  const [positionOptions, setPositionOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadPositions = async () => {
      const result = await fetchEmployeePositions(true);
      if (!cancelled && result.success) {
        setPositionOptions(Array.isArray(result.data) ? result.data : []);
      }
    };

    loadPositions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode === "edit" && employee) {
      setForm({
        fullName: employee.fullName || "",
        employeephoneNumber: employee.employeephoneNumber || "",
        employeeWorkNo: employee.employeeWorkNo || "",
        position: employee.position || "",
        employeestatus: employee.employeestatus || "Active",
        siteId:
          employee.siteId === undefined || employee.siteId === null || employee.siteId === ""
            ? buildInitialForm(initialValues).siteId
            : String(employee.siteId),
        vehicles:
          normalizeVehicleIds(employee.vehicles).length > 0
            ? normalizeVehicleIds(employee.vehicles)
            : buildInitialForm(initialValues).vehicles,
      });
      setErrors({});
      setDuplicateState(EMPTY_DUPLICATE_STATE);
      return;
    }

    setForm(buildInitialForm(initialValues));
    setErrors({});
    setDuplicateState(EMPTY_DUPLICATE_STATE);
  }, [employee, initialValues, mode]);

  const isCreate = mode === "create";

  const submitLabel = useMemo(() => {
    if (saving) return isCreate ? "Creating..." : "Saving...";
    return isCreate ? "Create Employee" : "Save Changes";
  }, [isCreate, saving]);

  const sectionClassName = hideSectionBorders
    ? "m365-flat-section m365-flat-section--no-border"
    : "m365-flat-section";

  const sectionStyle = hideSectionBorders
    ? {
      marginTop: 0,
      marginBottom: 24,
      paddingTop: 0,
      border: "none",
      borderTop: "none",
      borderRadius: 0,
      background: "transparent",
      boxShadow: "none",
      overflow: "visible",
    }
    : undefined;

  const sectionTitleStyle = hideSectionBorders
    ? {
      padding: 0,
      margin: "0 0 12px",
      borderBottom: "none",
      boxShadow: "none",
      background: "transparent",
    }
    : undefined;

  const availablePositionOptions = useMemo(() => {
    const currentPosition = (form.position || "").trim();
    const options = Array.isArray(positionOptions) ? [...positionOptions] : [];

    if (currentPosition && !options.some((option) => option?.name === currentPosition)) {
      options.push({
        id: `current-${currentPosition}`,
        name: currentPosition,
        isActive: false,
      });
    }

    return options;
  }, [form.position, positionOptions]);

  const vehicleStore = useMemo(
    () =>
      new CustomStore({
        key: "vehicleId",
        loadMode: "raw",
        load: async (loadOptions) => {
          const term = String(loadOptions?.searchValue || "").trim();
          if (term.length < 2) return [];

          const result = await quickSearchVehicles(term, 50);
          return result?.success ? result.data || [] : [];
        },
        byKey: async (key) => {
          if (key === undefined || key === null || key === "") return null;
          const response = await axiosInstance.get(`/vehicle/${key}`);
          return normalizeVehiclePayload(response?.data);
        },
      }),
    []
  );

  const vehicleValues = useMemo(
    () => normalizeVehicleIds(form.vehicles),
    [form.vehicles]
  );

  useEffect(() => {
    const fullName = (form.fullName || "").trim();
    const employeeWorkNo = (form.employeeWorkNo || "").trim();
    const siteId = Number(form.siteId || 0);

    if (!siteId || (!fullName && !employeeWorkNo)) {
      setDuplicateState(EMPTY_DUPLICATE_STATE);
      return undefined;
    }

    let cancelled = false;
    setDuplicateState((prev) => ({ ...prev, isChecking: true }));

    const handle = window.setTimeout(async () => {
      const result = await checkEmployeeDuplicates({
        employeeId: mode === "edit" ? employee?.id : undefined,
        siteId,
        fullName,
        employeeWorkNo,
      });

      if (cancelled) {
        return;
      }

      if (!result.success || !result.data) {
        setDuplicateState(EMPTY_DUPLICATE_STATE);
        return;
      }

      setDuplicateState({
        isChecking: false,
        hasNameWarning: Boolean(result.data.hasNameWarning),
        hasWorkNumberConflict: Boolean(result.data.hasWorkNumberConflict),
        nameMatches: Array.isArray(result.data.nameMatches) ? result.data.nameMatches : [],
        workNumberMatches: Array.isArray(result.data.workNumberMatches) ? result.data.workNumberMatches : [],
      });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [employee?.id, form.employeeWorkNo, form.fullName, form.siteId, mode]);

  const setField = (field, value) => {
    setForm((prev) => {
      if (field === "vehicles") {
        const currentVehicles = normalizeVehicleIds(prev.vehicles);
        const nextVehicles = normalizeVehicleIds(value);
        if (arraysEqual(currentVehicles, nextVehicles)) {
          return prev;
        }
        return { ...prev, vehicles: nextVehicles };
      }

      if (prev[field] === value) return prev;
      return { ...prev, [field]: value };
    });

    setErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: "" };
    });
  };

  const handleSubmit = async () => {
    const nextErrors = {};
    const fullName = (form.fullName || "").trim();
    const siteId = form.siteId === undefined || form.siteId === null ? "" : String(form.siteId).trim();

    if (!fullName) {
      nextErrors.fullName = "Employee name is required";
    }

    if (!siteId) {
      nextErrors.siteId = "Site selection is required";
    }

    if (duplicateState.hasWorkNumberConflict) {
      nextErrors.employeeWorkNo = "This work number already exists for the selected site";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      fullName: fullName.toUpperCase(),
      employeephoneNumber: (form.employeephoneNumber || "").trim(),
      employeeWorkNo: (form.employeeWorkNo || "").trim(),
      position: (form.position || "").trim(),
      employeestatus: form.employeestatus || "Active",
      siteId: Number(siteId),
      vehicles: normalizeVehicleIds(form.vehicles),
    };

    await onSubmit?.(payload);
  };

  return (
    <div className="employee-panel employee-panel--form">
      <div className="employee-panel__content">
        <div className={sectionClassName} style={sectionStyle ?? { marginTop: 0, paddingTop: 0, borderTop: "none" }}>
          <h3 className="m365-flat-section__title" style={sectionTitleStyle}>Employee Information</h3>
          <div className="employee-form-grid">
            <div className="m365-field">
              <label className="m365-field__label m365-field__label--required">
                Full Name
              </label>
              <input
                type="text"
                className={`m365-input${errors.fullName ? " m365-input--error" : ""}`}
                value={form.fullName}
                onChange={(event) => setField("fullName", event.target.value)}
                maxLength={200}
                placeholder="Enter employee full name"
                autoComplete="off"
              />
              {errors.fullName && <span className="m365-field__error">{errors.fullName}</span>}
            </div>

            <div className="m365-field">
              <label className="m365-field__label">Phone Number</label>
              <input
                type="text"
                className="m365-input"
                value={form.employeephoneNumber}
                onChange={(event) =>
                  setField("employeephoneNumber", event.target.value)
                }
                maxLength={40}
                placeholder="Enter phone number"
                autoComplete="off"
              />
            </div>

            <div className="m365-field">
              <label className="m365-field__label">Work Number</label>
              <input
                type="text"
                className={`m365-input${errors.employeeWorkNo || duplicateState.hasWorkNumberConflict ? " m365-input--error" : ""}`}
                value={form.employeeWorkNo}
                onChange={(event) => setField("employeeWorkNo", event.target.value)}
                maxLength={60}
                placeholder="Enter work number"
                autoComplete="off"
              />
              {errors.employeeWorkNo && <span className="m365-field__error">{errors.employeeWorkNo}</span>}
              {!errors.employeeWorkNo && duplicateState.hasWorkNumberConflict && (
                <span className="m365-field__error">This work number already exists for the selected site.</span>
              )}
            </div>

            <div className="m365-field">
              <label className="m365-field__label">Position</label>
              <select
                className="m365-select"
                value={form.position}
                onChange={(event) => setField("position", event.target.value)}
              >
                <option value="">Select position</option>
                {availablePositionOptions.map((position) => (
                  <option key={position.id} value={position.name}>
                    {position.name}
                  </option>
                ))}
              </select>
              <span className="m365-field__hint">Positions are loaded from employee position master data.</span>
            </div>

            <div className="m365-field">
              <label className="m365-field__label">Status</label>
              <select
                className="m365-select"
                value={form.employeestatus}
                onChange={(event) => setField("employeestatus", event.target.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {duplicateState.hasNameWarning && (
            <div className="m365-info-banner m365-info-banner--warning" style={{ marginTop: 12 }}>
              <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
              <div className="m365-info-banner__content">
                <span className="m365-info-banner__text">
                  Matching employee name found for this site. Review before saving.
                </span>
                <span className="m365-field__hint">
                  {duplicateState.nameMatches
                    .map((match) => `${match.fullName}${match.employeeWorkNo ? ` (${match.employeeWorkNo})` : ""}`)
                    .join(", ")}
                </span>
              </div>
            </div>
          )}

          {duplicateState.hasWorkNumberConflict && (
            <div className="m365-info-banner m365-info-banner--warning" style={{ marginTop: 12 }}>
              <i className="fa-light fa-ban m365-info-banner__icon" />
              <div className="m365-info-banner__content">
                <span className="m365-info-banner__text">
                  This work number is already assigned to another employee in the selected site.
                </span>
                <span className="m365-field__hint">
                  {duplicateState.workNumberMatches
                    .map((match) => `${match.fullName}${match.employeestatus ? ` - ${match.employeestatus}` : ""}`)
                    .join(", ")}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className={sectionClassName} style={sectionStyle}>
          <h3 className="m365-flat-section__title" style={sectionTitleStyle}>Assignment</h3>
          <div className="employee-form-grid">
            <div className="m365-field">
              <label className="m365-field__label m365-field__label--required">Site</label>
              <select
                className={`m365-select${errors.siteId ? " m365-input--error" : ""}`}
                value={form.siteId}
                onChange={(event) => setField("siteId", event.target.value)}
              >
                <option value="">Select site</option>
                {(sites || []).map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              {errors.siteId && <span className="m365-field__error">{errors.siteId}</span>}
            </div>

            <div className="m365-field">
              <label className="m365-field__label">Default Vehicles</label>
              <TagBox
                dataSource={vehicleStore}
                value={vehicleValues}
                valueExpr="vehicleId"
                displayExpr={toVehicleDisplay}
                searchEnabled
                minSearchLength={2}
                showDataBeforeSearch={false}
                showSelectionControls
                applyValueMode="useButtons"
                showClearButton
                maxDisplayedTags={5}
                searchExpr={["hyoungNo", "numberPlate"]}
                noDataText="Type at least 2 characters to search vehicles"
                onValueChanged={(event) => setField("vehicles", event.value || [])}
              />
              <span className="m365-field__hint">
                {duplicateState.isChecking
                  ? "Checking for duplicate employee records..."
                  : "Search vehicles by Hyoung No or plate. Results load from server."}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="m365-panel-footer">
        <button className="m365-btn m365-btn--ghost" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button className="m365-btn m365-btn--primary" onClick={handleSubmit} disabled={saving}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
};

export default EmployeeFormPanel;
