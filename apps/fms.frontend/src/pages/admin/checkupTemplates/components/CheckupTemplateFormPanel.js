/**
 * File: CheckupTemplateFormPanel.js
 * Purpose: M365-styled form panel content for creating/editing checkup template items.
 *          Rendered inside global SlidePanel component.
 * Dependencies: Native HTML controls (M365 Fluent Design), notify
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - CheckupTemplateFormPanel: M365 form with sections for item details, criteria, and settings.
 */
import React, { useMemo } from "react";

const CheckupTemplateFormPanel = ({
    editingItem,
    formData,
    checkTypes,
    vehicleTypes,
    vehicleModels,
    saving,
    onClose,
    onSave,
    onChange,
}) => {
    const filteredModels = useMemo(() => {
        if (!formData.vehicleTypeId) return vehicleModels;
        return vehicleModels.filter((m) => {
            const typeId =
                m.vehicleTypeId ?? m.VehicleTypeId ?? m.vehicletypeId ?? m.VehicletypeId ?? null;
            return typeId != null && String(typeId) === String(formData.vehicleTypeId);
        });
    }, [formData.vehicleTypeId, vehicleModels]);

    const isCreate = !editingItem;

    return (
        <div className="checkup-panel-form">
            {/* ── Item Details ── */}
            <div className="m365-flat-section" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                <h3 className="m365-flat-section__title">Item Details</h3>
                <div className="m365-edit-fields">
                    <div className="m365-field">
                        <label className="m365-field__label m365-field__label--required">Description</label>
                        <input
                            className="m365-input"
                            placeholder="Enter item description"
                            value={formData.description || ""}
                            onChange={(e) => onChange("description", e.target.value)}
                            autoComplete="off"
                        />
                        <span className="m365-field__hint">
                            What should the inspector check during vehicle transfer
                        </span>
                    </div>

                    <div className="m365-field">
                        <label className="m365-field__label">Check Type</label>
                        <select
                            className="m365-select"
                            value={formData.checkType || ""}
                            onChange={(e) => onChange("checkType", e.target.value || "")}
                        >
                            <option value="">Select type…</option>
                            {(checkTypes || []).map((ct) => (
                                <option key={ct} value={ct}>{ct}</option>
                            ))}
                        </select>
                    </div>

                    <div className="checkup-panel-form__row">
                        <div className="m365-field">
                            <label className="m365-field__label">Serial No</label>
                            <input
                                className="m365-input"
                                type="number"
                                min="1"
                                placeholder="Auto"
                                value={formData.serialNo ?? ""}
                                onChange={(e) =>
                                    onChange("serialNo", e.target.value === "" ? null : Number(e.target.value))
                                }
                            />
                        </div>

                        <div className="m365-field">
                            <label className="m365-field__label">Sort Order</label>
                            <input
                                className="m365-input"
                                type="number"
                                min="0"
                                placeholder="Auto"
                                value={formData.sortOrder ?? ""}
                                onChange={(e) =>
                                    onChange("sortOrder", e.target.value === "" ? null : Number(e.target.value))
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Applicability Criteria ── */}
            <div className="m365-flat-section">
                <h3 className="m365-flat-section__title">Applicability Criteria</h3>
                <span className="m365-field__hint" style={{ marginBottom: 12, display: "block" }}>
                    Leave blank to apply this item to all vehicles
                </span>
                <div className="m365-edit-fields">
                    <div className="m365-field">
                        <label className="m365-field__label">Vehicle Type</label>
                        <select
                            className="m365-select"
                            value={formData.vehicleTypeId ?? ""}
                            onChange={(e) => {
                                const val = e.target.value === "" ? null : Number(e.target.value);
                                onChange("vehicleTypeId", val);
                                onChange("vehicleModelId", null);
                            }}
                        >
                            <option value="">All Types</option>
                            {(vehicleTypes || []).map((vt) => (
                                <option key={vt.id} value={vt.id}>
                                    {vt.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="m365-field">
                        <label className="m365-field__label">Vehicle Model</label>
                        <select
                            className="m365-select"
                            value={formData.vehicleModelId ?? ""}
                            onChange={(e) =>
                                onChange("vehicleModelId", e.target.value === "" ? null : Number(e.target.value))
                            }
                            disabled={filteredModels.length === 0 && !formData.vehicleTypeId}
                        >
                            <option value="">All Models</option>
                            {filteredModels.map((vm) => (
                                <option key={vm.id} value={vm.id}>
                                    {vm.name}
                                </option>
                            ))}
                        </select>
                    </div>


                </div>
            </div>

            {/* ── Settings ── */}
            <div className="m365-flat-section">
                <h3 className="m365-flat-section__title">Settings</h3>
                <div className="m365-edit-fields">
                    <label className="m365-checkbox">
                        <input
                            type="checkbox"
                            checked={!!formData.isActive}
                            onChange={(e) => onChange("isActive", e.target.checked)}
                        />
                        <span className="m365-checkbox__label">Active</span>
                    </label>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="m365-panel-footer">
                <button className="m365-btn m365-btn--ghost" onClick={onClose} disabled={saving}>
                    Cancel
                </button>
                <button className="m365-btn m365-btn--primary" onClick={onSave} disabled={saving}>
                    {saving
                        ? isCreate
                            ? "Creating\u2026"
                            : "Saving\u2026"
                        : isCreate
                            ? "Create Item"
                            : "Save Changes"}
                </button>
            </div>
        </div>
    );
};

export default CheckupTemplateFormPanel;
