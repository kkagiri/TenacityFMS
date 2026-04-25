/**
 * File: EmployeeFormPanel.js
 * Purpose: Side-panel form used for creating and editing employee records.
 * Dependencies: react, devextreme-react/tag-box, vehicle search API
 * Last Modified: 2026-04-25
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
import SelectBox from "devextreme-react/select-box";
import { checkEmployeeDuplicates, fetchEmployeePositions } from "../../../redux/actions/employeeActions";
import MultiVehicleSearchableSelector from "../../../components/selectors/MultiVehicleSearchableSelector";

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

const normalizeSiteId = (value) => {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : "";
};

const buildInitialForm = (initialValues = {}) => ({
  ...EMPTY_FORM,
  ...initialValues,
  siteId: normalizeSiteId(initialValues?.siteId),
  vehicles: normalizeVehicleIds(initialValues?.vehicles),
});

const normalizeVehicleIds = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      typeof item === "object" && item !== null ? item.vehicleId ?? item.VehicleId : item
    )
    .filter((item) => item !== undefined && item !== null);
};

const mergeVehicleIds = (...collections) => {
  const seen = new Set();

  return collections.flatMap((collection) => normalizeVehicleIds(collection)).filter((item) => {
    const key = String(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
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
      const initialForm = buildInitialForm(initialValues);

      setForm({
        fullName: employee.fullName || "",
        employeephoneNumber: employee.employeephoneNumber || "",
        employeeWorkNo: employee.employeeWorkNo || "",
        position: employee.position || "",
        employeestatus: employee.employeestatus || "Active",
        siteId: normalizeSiteId(employee.siteId) || initialForm.siteId,
        vehicles: mergeVehicleIds(initialForm.vehicles, employee.vehicles),
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

  const activePositionOptions = useMemo(
    () => (Array.isArray(positionOptions) ? positionOptions : [])
      .filter((option) => option?.name && option.isActive !== false),
    [positionOptions]
  );

  const activePositionNames = useMemo(
    () => new Set(activePositionOptions.map((option) => option.name)),
    [activePositionOptions]
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
    const position = (form.position || "").trim();
    const siteId = normalizeSiteId(form.siteId);

    if (!fullName) {
      nextErrors.fullName = "Employee name is required";
    }

    if (!siteId) {
      nextErrors.siteId = "Site selection is required";
    }

    if (!position) {
      nextErrors.position = "Position selection is required";
    } else if (!activePositionNames.has(position)) {
      nextErrors.position = "Select a valid active position from the list";
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
      position,
      employeestatus: form.employeestatus || "Active",
      siteId,
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
              <label className="m365-field__label m365-field__label--required">Position</label>
              <SelectBox
                dataSource={activePositionOptions}
                value={form.position}
                valueExpr="name"
                displayExpr="name"
                onValueChanged={(event) => setField("position", event.value || "")}
                placeholder="Select position"
                searchEnabled
                searchExpr="name"
                showClearButton
                acceptCustomValue={false}
                noDataText="Position not found"
                height={34}
                stylingMode="outlined"
                inputAttr={errors.position ? { "aria-invalid": true } : undefined}
                elementAttr={errors.position ? { class: "m365-input--error" } : undefined}
              />
              {errors.position && <span className="m365-field__error">{errors.position}</span>}
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
              <SelectBox
                dataSource={sites || []}
                value={form.siteId}
                valueExpr="id"
                displayExpr="name"
                onValueChanged={(event) => setField("siteId", normalizeSiteId(event.value))}
                placeholder="Select site"
                searchEnabled
                searchExpr="name"
                showClearButton
                stylingMode="outlined"
                height={34}
                inputAttr={errors.siteId ? { "aria-invalid": true } : undefined}
                elementAttr={errors.siteId ? { class: "m365-input--error" } : undefined}
              />
              {errors.siteId && <span className="m365-field__error">{errors.siteId}</span>}
            </div>

            <div className="m365-field">
              <label className="m365-field__label">Default Vehicles</label>
              <MultiVehicleSearchableSelector
                value={vehicleValues}
                width="100%"
                placeholder="Search and add vehicles"
                onValueChanged={(event) => setField("vehicles", event.value || [])}
              />
              <span className="m365-field__hint">
                {duplicateState.isChecking
                  ? "Checking for duplicate employee records..."
                  : "Search vehicles by Hyoung No or plate, then add each vehicle to the selection list."}
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
