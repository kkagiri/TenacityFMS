/**
 * File: GeoZoneManagementPanel.js
 * Purpose: Slide panel for CRUD operations on geo-zones grouped by type (Section, Borrow pit, Dump point, Corridor).
 * Dependencies: React, DevExtreme DataGrid/TextBox/NumberBox/SelectBox/Button, SlidePanel, vehicleTripService.
 * Last Modified: 2026-03-13
 *
 * Key Components:
 * - GeoZoneForm: Inline create/edit form for a single geo-zone
 * - GeoZoneManagementPanel: Full panel with DataGrid listing and form
 */
import React, { useCallback, useEffect, useState } from "react";
import DataGrid, { Column, Paging } from "devextreme-react/data-grid";
import { TextBox } from "devextreme-react/text-box";
import { NumberBox } from "devextreme-react/number-box";
import { SelectBox } from "devextreme-react/select-box";
import Button from "devextreme-react/button";
import notify from "devextreme/ui/notify";
import SlidePanel from "../../../../components/ui/SlidePanel";
import { PLANNING_GEO_ZONE_TYPES } from "../utils/vehicleTripUi";
import {
    fetchGeoZones,
    createGeoZone,
    updateGeoZone,
    deleteGeoZone,
} from "../services/vehicleTripService";
import "./GeoZoneManagementPanel.scss";

const EMPTY_FORM = {
    name: "",
    geoZoneType: null,
    latitude: null,
    longitude: null,
    radiusMeters: 200,
    description: "",
};

const GeoZoneForm = ({ initialValues, zoneType, saving, onSave, onCancel }) => {
    const [form, setForm] = useState(() => ({
        ...EMPTY_FORM,
        ...(initialValues || {}),
        geoZoneType: zoneType || initialValues?.geoZoneType || null,
    }));

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const isValid = form.name?.trim() && form.geoZoneType && form.latitude != null && form.longitude != null;

    return (
        <div className="geo-zone-form">
            <div className="geo-zone-form__grid">
                <div>
                    <label className="geo-zone-form__label">Name</label>
                    <TextBox
                        value={form.name}
                        onValueChanged={(e) => handleChange("name", e.value)}
                        placeholder="Zone name"
                        width="100%"
                        disabled={saving}
                    />
                </div>
                <div>
                    <label className="geo-zone-form__label">Type</label>
                    <SelectBox
                        dataSource={PLANNING_GEO_ZONE_TYPES}
                        valueExpr="key"
                        displayExpr="label"
                        value={form.geoZoneType}
                        onValueChanged={(e) => handleChange("geoZoneType", e.value)}
                        placeholder="Select type"
                        width="100%"
                        disabled={saving || Boolean(zoneType)}
                    />
                </div>
                <div>
                    <label className="geo-zone-form__label">Latitude</label>
                    <NumberBox
                        value={form.latitude}
                        onValueChanged={(e) => handleChange("latitude", e.value)}
                        format="#0.000000"
                        width="100%"
                        disabled={saving}
                    />
                </div>
                <div>
                    <label className="geo-zone-form__label">Longitude</label>
                    <NumberBox
                        value={form.longitude}
                        onValueChanged={(e) => handleChange("longitude", e.value)}
                        format="#0.000000"
                        width="100%"
                        disabled={saving}
                    />
                </div>
                <div>
                    <label className="geo-zone-form__label">Radius (m)</label>
                    <NumberBox
                        value={form.radiusMeters}
                        onValueChanged={(e) => handleChange("radiusMeters", e.value)}
                        min={10}
                        max={50000}
                        width="100%"
                        disabled={saving}
                    />
                </div>
                <div>
                    <label className="geo-zone-form__label">Description</label>
                    <TextBox
                        value={form.description}
                        onValueChanged={(e) => handleChange("description", e.value)}
                        placeholder="Optional description"
                        width="100%"
                        disabled={saving}
                    />
                </div>
            </div>
            <div className="geo-zone-form__actions">
                <Button
                    text={saving ? "Saving..." : (initialValues?.geoZoneId ? "Update" : "Create")}
                    type="default"
                    disabled={saving || !isValid}
                    onClick={() => onSave(form)}
                />
                <Button
                    text="Cancel"
                    stylingMode="outlined"
                    disabled={saving}
                    onClick={onCancel}
                />
            </div>
        </div>
    );
};

const GeoZoneManagementPanel = ({ open, onClose, filterZoneType = null }) => {
    const [zones, setZones] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingZone, setEditingZone] = useState(null);

    const typeConfig = filterZoneType
        ? PLANNING_GEO_ZONE_TYPES.find((t) => t.key === filterZoneType) || null
        : null;

    const loadZones = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await fetchGeoZones({
                geoZoneType: filterZoneType || undefined,
            });
            setZones(data);
        } catch {
            setZones([]);
        } finally {
            setIsLoading(false);
        }
    }, [filterZoneType]);

    useEffect(() => {
        if (open) {
            loadZones();
            setShowForm(false);
            setEditingZone(null);
        }
    }, [open, loadZones]);

    const handleSave = useCallback(async (formData) => {
        try {
            setIsSaving(true);
            if (editingZone?.geoZoneId) {
                await updateGeoZone(editingZone.geoZoneId, formData);
                notify("Geo-zone updated", "success", 3000);
            } else {
                await createGeoZone(formData);
                notify("Geo-zone created", "success", 3000);
            }
            setShowForm(false);
            setEditingZone(null);
            await loadZones();
        } catch (error) {
            notify(error?.message || "Failed to save geo-zone", "error", 4000);
        } finally {
            setIsSaving(false);
        }
    }, [editingZone, loadZones]);

    const handleDelete = useCallback(async (zone) => {
        if (!zone?.geoZoneId) {
            return;
        }

        try {
            setIsSaving(true);
            await deleteGeoZone(zone.geoZoneId);
            notify("Geo-zone deleted", "success", 3000);
            await loadZones();
        } catch (error) {
            notify(error?.message || "Failed to delete geo-zone", "error", 4000);
        } finally {
            setIsSaving(false);
        }
    }, [loadZones]);

    const panelTitle = typeConfig
        ? `Manage ${typeConfig.label} zones`
        : "Manage geo-zones";

    const headerActions = (
        <div className="geo-zone-panel__header-actions">
            <Button
                text="Refresh"
                icon="fa-light fa-arrows-rotate"
                stylingMode="outlined"
                onClick={loadZones}
            />
            <Button
                text="Add zone"
                icon="fa-light fa-plus"
                type="default"
                onClick={() => {
                    setEditingZone(null);
                    setShowForm(true);
                }}
            />
        </div>
    );

    return (
        <SlidePanel
            open={open}
            onClose={onClose}
            title={panelTitle}
            width="min(900px, 90vw)"
            panelClassName="geo-zone-panel-shell"
            headerActions={headerActions}
        >
            <div className="geo-zone-panel">
                {typeConfig ? (
                    <div className="geo-zone-panel__type-header">
                        <i className={typeConfig.icon} style={{ color: typeConfig.color }} />
                        <div>
                            <div className="geo-zone-panel__type-label">{typeConfig.label}</div>
                            <div className="geo-zone-panel__type-count">{zones.length} zone{zones.length !== 1 ? "s" : ""} defined</div>
                        </div>
                    </div>
                ) : null}

                {showForm ? (
                    <GeoZoneForm
                        initialValues={editingZone}
                        zoneType={filterZoneType}
                        saving={isSaving}
                        onSave={handleSave}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingZone(null);
                        }}
                    />
                ) : null}

                {isLoading ? (
                    <div className="geo-zone-panel__loading">
                        <i className="fa-light fa-spinner fa-spin" />
                        <span>Loading zones…</span>
                    </div>
                ) : (
                    <DataGrid
                        dataSource={zones}
                        keyExpr="geoZoneId"
                        showBorders={true}
                        rowAlternationEnabled={true}
                        hoverStateEnabled={true}
                        columnAutoWidth={true}
                        noDataText="No geo-zones defined yet. Click 'Add zone' to create one."
                    >
                        <Paging defaultPageSize={15} />
                        <Column dataField="name" caption="Name" minWidth={160} />
                        {!filterZoneType ? (
                            <Column dataField="geoZoneType" caption="Type" minWidth={120} />
                        ) : null}
                        <Column dataField="latitude" caption="Lat" minWidth={100} format="#0.0000" />
                        <Column dataField="longitude" caption="Lon" minWidth={100} format="#0.0000" />
                        <Column dataField="radiusMeters" caption="Radius (m)" minWidth={100} />
                        <Column dataField="description" caption="Description" minWidth={180} />
                        <Column
                            caption="Actions"
                            width={150}
                            allowFiltering={false}
                            cellRender={({ data: zone }) => (
                                <div className="tw-flex tw-gap-2">
                                    <Button
                                        text="Edit"
                                        icon="fa-light fa-pen"
                                        stylingMode="text"
                                        onClick={() => {
                                            setEditingZone(zone);
                                            setShowForm(true);
                                        }}
                                    />
                                    <Button
                                        text="Delete"
                                        icon="fa-light fa-trash"
                                        stylingMode="text"
                                        onClick={() => handleDelete(zone)}
                                    />
                                </div>
                            )}
                        />
                    </DataGrid>
                )}
            </div>
        </SlidePanel>
    );
};

export default GeoZoneManagementPanel;
