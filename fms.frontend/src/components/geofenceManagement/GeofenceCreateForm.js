/**
 * File: GeofenceCreateForm.js
 * Purpose: Captures new geofence details in a simplified, map-first workflow.
 * Dependencies: React, devextreme-react/button, GeofenceDrawingMap.
 * Last Modified: 2026-03-13
 */
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "devextreme-react/button";
import GeofenceDrawingMap from "./GeofenceDrawingMap";

const DEFAULT_ROUTE_WIDTH_METERS = 50;

const formatCoordinateValue = (value) => (Number.isFinite(Number(value)) ? Number(value).toFixed(6) : "—");

const buildPreviewRows = (form) => {
  if (form.geofenceType === "Circle") {
    return [
      { label: "Latitude", value: formatCoordinateValue(form.centerLatitude) },
      { label: "Longitude", value: formatCoordinateValue(form.centerLongitude) },
      { label: "Radius", value: Number(form.radiusMeters) > 0 ? `${Math.round(Number(form.radiusMeters))} m` : "—" },
    ];
  }

  if (form.geofenceType === "Route") {
    const points = normalizeCoordinates(form.coordinates);
    return [
      { label: "Point records", value: points.length ? String(points.length) : "—" },
      { label: "First point", value: points.length ? `${formatCoordinateValue(points[0].latitude)}, ${formatCoordinateValue(points[0].longitude)}` : "—" },
      { label: "Corridor", value: Number(form.radiusMeters) > 0 ? `${Math.round(Number(form.radiusMeters))} m` : "—" },
    ];
  }

  const points = normalizeCoordinates(form.coordinates);
  return [
    { label: "Point records", value: points.length ? String(points.length) : "—" },
    { label: "First point", value: points.length ? `${formatCoordinateValue(points[0].latitude)}, ${formatCoordinateValue(points[0].longitude)}` : "—" },
    { label: "Last point", value: points.length ? `${formatCoordinateValue(points[points.length - 1].latitude)}, ${formatCoordinateValue(points[points.length - 1].longitude)}` : "—" },
  ];
};

const CLASSIFICATION_OPTIONS = ["Unknown", "Parking", "Load", "Dump", "Fuel", "Workshop"];

const defaultForm = {
  name: "",
  description: "",
  classification: "Unknown",
  geofenceType: "Circle",
  centerLatitude: null,
  centerLongitude: null,
  radiusMeters: null,
  coordinates: [],
  groupIds: [],
};

const normalizeCoordinates = (coordinates = []) =>
  (Array.isArray(coordinates) ? coordinates : [])
    .map((coordinate, index) => ({
      latitude: Number(coordinate.latitude),
      longitude: Number(coordinate.longitude),
      order: Number.isFinite(Number(coordinate.order)) ? Number(coordinate.order) : index,
    }))
    .filter((coordinate) => Number.isFinite(coordinate.latitude) && Number.isFinite(coordinate.longitude))
    .sort((left, right) => left.order - right.order)
    .map((coordinate, index) => ({ ...coordinate, order: index }));

const hasFiniteCoordinate = (value) => Number.isFinite(Number(value));

const buildCirclePoints = (geofence) => {
  if (!hasFiniteCoordinate(geofence?.centerLatitude) || !hasFiniteCoordinate(geofence?.centerLongitude)) {
    return [];
  }

  const centerLatitude = Number(geofence.centerLatitude);
  const centerLongitude = Number(geofence.centerLongitude);
  const radiusMeters = Number(geofence?.radiusMeters || 0);

  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    return [{ latitude: centerLatitude, longitude: centerLongitude }];
  }

  const latitudeOffset = radiusMeters / 111320;
  const longitudeOffset = radiusMeters / (111320 * Math.max(Math.cos((centerLatitude * Math.PI) / 180), 0.2));

  return [
    { latitude: centerLatitude + latitudeOffset, longitude: centerLongitude + longitudeOffset },
    { latitude: centerLatitude - latitudeOffset, longitude: centerLongitude - longitudeOffset },
  ];
};

const extractGeofencePoints = (geofence) => {
  const coordinates = normalizeCoordinates(geofence?.coordinates);
  if (coordinates.length > 0) {
    return coordinates;
  }

  return buildCirclePoints(geofence);
};

const buildViewportFromGeofences = (groupGeofences = [], fallbackViewport = null) => {
  const points = groupGeofences.flatMap((geofence) => extractGeofencePoints(geofence));
  if (points.length === 0) {
    return fallbackViewport;
  }

  const bounds = points.reduce(
    (summary, point) => ({
      north: Math.max(summary.north, point.latitude),
      east: Math.max(summary.east, point.longitude),
      south: Math.min(summary.south, point.latitude),
      west: Math.min(summary.west, point.longitude),
    }),
    {
      north: points[0].latitude,
      east: points[0].longitude,
      south: points[0].latitude,
      west: points[0].longitude,
    }
  );

  return {
    ...fallbackViewport,
    center: {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2,
    },
    bounds,
  };
};

const parseGeometryJsonToCoordinates = (geometryJson) => {
  if (!geometryJson) return [];
  try {
    const geo = typeof geometryJson === "string" ? JSON.parse(geometryJson) : geometryJson;
    let coords = [];
    if (geo.type === "Polygon" && Array.isArray(geo.coordinates?.[0])) {
      coords = geo.coordinates[0];
    } else if (geo.type === "MultiPolygon" && Array.isArray(geo.coordinates?.[0]?.[0])) {
      coords = geo.coordinates[0][0];
    } else if (geo.type === "LineString" && Array.isArray(geo.coordinates)) {
      coords = geo.coordinates;
    } else if (geo.type === "MultiLineString" && Array.isArray(geo.coordinates?.[0])) {
      coords = geo.coordinates[0];
    }
    return coords.map(([lng, lat], index) => ({
      latitude: lat,
      longitude: lng,
      order: index,
    }));
  } catch {
    return [];
  }
};

const GeofenceCreateForm = ({
  geofenceGroups = [],
  geofences = [],
  initialViewport = null,
  initialData = null,
  saving = false,
  creatingGroup = false,
  compact = false,
  hideMap = false,
  externalShape = null,
  onCreateGroup,
  onMapViewportChange,
  onShapePreviewChange,
  onGeofenceTypeChange,
  onCancel,
  onSubmit,
}) => {
  const isEditMode = !!initialData;
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const selectedGroupId = form.groupIds[0] ?? "";
  const selectedGroup = useMemo(
    () => geofenceGroups.find((group) => Number(group.id) === Number(selectedGroupId)) || null,
    [geofenceGroups, selectedGroupId]
  );
  const selectedGroupGeofences = useMemo(() => {
    if (!selectedGroup) {
      return [];
    }

    const groupGeofenceIds = new Set((Array.isArray(selectedGroup.geofences) ? selectedGroup.geofences : []).map((item) => Number(item?.id)));
    return geofences.filter((geofence) => groupGeofenceIds.has(Number(geofence.id)));
  }, [geofences, selectedGroup]);
  const mapViewport = useMemo(
    () => buildViewportFromGeofences(selectedGroupGeofences, initialViewport),
    [initialViewport, selectedGroupGeofences]
  );
  const payloadPreviewRows = useMemo(() => buildPreviewRows(form), [form]);
  const mapHeight = compact ? 360 : 720;

  // Populate form from initialData when entering edit mode
  useEffect(() => {
    if (!initialData) return;

    const geofenceType = initialData.geofenceType || "Circle";
    let coordinates = normalizeCoordinates(initialData.coordinates || []);
    if (coordinates.length === 0 && initialData.geometryJson) {
      coordinates = normalizeCoordinates(parseGeometryJsonToCoordinates(initialData.geometryJson));
    }

    setForm({
      name: initialData.name || "",
      description: initialData.description || "",
      classification: initialData.classification || "Unknown",
      geofenceType,
      centerLatitude: initialData.centerLatitude ?? null,
      centerLongitude: initialData.centerLongitude ?? null,
      radiusMeters: initialData.radiusMeters ?? null,
      coordinates,
      groupIds: Array.isArray(initialData.groupIds) ? initialData.groupIds : [],
    });

    onGeofenceTypeChange?.(geofenceType);
  }, [initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!externalShape) {
      return;
    }

    setForm((current) => ({
      ...current,
      centerLatitude: externalShape.centerLatitude ?? null,
      centerLongitude: externalShape.centerLongitude ?? null,
      radiusMeters:
        current.geofenceType === "Route"
          ? current.radiusMeters ?? DEFAULT_ROUTE_WIDTH_METERS
          : externalShape.radiusMeters ?? null,
      coordinates: normalizeCoordinates(externalShape.coordinates ?? []),
    }));
  }, [externalShape]);

  useEffect(() => {
    onMapViewportChange?.(mapViewport);
  }, [mapViewport, onMapViewportChange]);

  const clearError = () => {
    if (error) {
      setError("");
    }
  };

  const handleFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'radiusMeters') {
      onShapePreviewChange?.({ radiusMeters: value });
    }
    clearError();
  };

  const handleTypeChange = (value) => {
    setForm((current) => ({
      ...current,
      geofenceType: value,
      centerLatitude: null,
      centerLongitude: null,
      coordinates: [],
      radiusMeters: value === "Route" ? current.radiusMeters || DEFAULT_ROUTE_WIDTH_METERS : null,
    }));
    onGeofenceTypeChange?.(value);
    clearError();
  };

  const handleGroupChange = (value) => {
    setForm((current) => ({
      ...current,
      groupIds: value ? [Number(value)] : [],
    }));
    clearError();
  };

  const handleShapeChange = (shape) => {
    setForm((current) => ({
      ...current,
      ...shape,
      coordinates: normalizeCoordinates(shape.coordinates ?? current.coordinates),
      radiusMeters:
        current.geofenceType === "Route"
          ? current.radiusMeters ?? DEFAULT_ROUTE_WIDTH_METERS
          : shape.radiusMeters ?? current.radiusMeters,
    }));
    clearError();
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      classification: form.classification || "Unknown",
      geofenceType: form.geofenceType,
      centerLatitude: form.centerLatitude == null || form.centerLatitude === "" ? null : Number(form.centerLatitude),
      centerLongitude: form.centerLongitude == null || form.centerLongitude === "" ? null : Number(form.centerLongitude),
      radiusMeters: form.radiusMeters == null || form.radiusMeters === "" ? null : Number(form.radiusMeters),
      coordinates: normalizeCoordinates(form.coordinates),
      groupIds: form.groupIds,
    };

    if (!payload.name) {
      setError("Geofence name is required.");
      return;
    }

    if (payload.geofenceType === "Circle") {
      if (!Number.isFinite(payload.centerLatitude) || !Number.isFinite(payload.centerLongitude)) {
        setError("Draw a circle on the map to capture its center.");
        return;
      }

      if (!Number.isFinite(payload.radiusMeters) || payload.radiusMeters <= 0) {
        setError("Draw a circle on the map to capture a valid radius.");
        return;
      }
    }

    if (payload.geofenceType === "Polygon" && payload.coordinates.length < 3) {
      setError("Draw at least three polygon points on the map.");
      return;
    }

    if (payload.geofenceType === "Route") {
      if (payload.coordinates.length < 2) {
        setError("Draw at least two route points on the map.");
        return;
      }

      if (!Number.isFinite(payload.radiusMeters) || payload.radiusMeters <= 0) {
        setError("Route geofences require a corridor width greater than zero.");
        return;
      }
    }

    onSubmit?.(payload);
  };

  const handleCreateGroup = async () => {
    if (typeof onCreateGroup !== "function") {
      return;
    }

    const name = newGroupName.trim();
    if (!name) {
      setError("Group name is required.");
      return;
    }

    const createdGroup = await onCreateGroup({
      name,
      description: newGroupDescription.trim() || null,
      colour: "#0078d4",
      isPinned: false,
      useInGeocoding: false,
      geofenceIds: [],
    });

    if (createdGroup?.id != null) {
      handleGroupChange(createdGroup.id);
      setShowCreateGroup(false);
      setNewGroupName("");
      setNewGroupDescription("");
      clearError();
    }
  };

  const controlRail = (
    <div className={`${compact ? "tw-space-y-2.5" : "tw-space-y-4"}`}>
      <div className={`${compact ? "tw-space-y-2.5" : "tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-shadow-sm tw-space-y-4"}`}>
        <label className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-[12px] tw-font-medium tw-text-[#605e5c]">Name</span>
          <input
            value={form.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            className="tw-h-[32px] tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-text-[13px] tw-text-[#201f1e] focus:tw-border-[#0078d4] focus:tw-outline-none focus:tw-shadow-[0_0_0_1px_#0078d4]"
            placeholder="e.g. Loading Area A"
          />
        </label>

        <label className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-[12px] tw-font-medium tw-text-[#605e5c]">Classification</span>
          <select
            value={form.classification}
            onChange={(e) => handleFieldChange("classification", e.target.value)}
            className="tw-h-[32px] tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-text-[13px] tw-text-[#201f1e] focus:tw-border-[#0078d4] focus:tw-outline-none focus:tw-shadow-[0_0_0_1px_#0078d4]"
          >
            {CLASSIFICATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>

        <label className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-[12px] tw-font-medium tw-text-[#605e5c]">Type</span>
          <select
            value={form.geofenceType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="tw-h-[32px] tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-text-[13px] tw-text-[#201f1e] focus:tw-border-[#0078d4] focus:tw-outline-none focus:tw-shadow-[0_0_0_1px_#0078d4]"
          >
            <option value="Circle">Circle</option>
            <option value="Polygon">Polygon</option>
            <option value="Route">Route</option>
          </select>
        </label>

        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-[12px] tw-font-medium tw-text-[#605e5c]">Group</span>
          <div className="tw-flex tw-items-center tw-gap-2">
            <select
              value={selectedGroupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="tw-h-[32px] tw-flex-1 tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-text-[13px] tw-text-[#201f1e] focus:tw-border-[#0078d4] focus:tw-outline-none focus:tw-shadow-[0_0_0_1px_#0078d4]"
            >
              <option value="">No group selected</option>
              {geofenceGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCreateGroup((current) => !current)}
              className="tw-inline-flex tw-h-[32px] tw-items-center tw-gap-1.5 tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-text-[12px] tw-font-medium tw-text-[#323130] hover:tw-bg-[#f3f2f1]"
            >
              <i className="fa-light fa-plus"></i>
              <span>Group</span>
            </button>
          </div>
        </div>

        {showCreateGroup && (
          <div className="tw-rounded-[6px] tw-border tw-border-[#edebe9] tw-bg-white tw-p-2.5 tw-space-y-2.5">
            <label className="tw-flex tw-flex-col tw-gap-1">
              <span className="tw-text-[12px] tw-font-medium tw-text-[#605e5c]">Group name</span>
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="tw-h-[32px] tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-text-[13px] tw-text-[#201f1e] focus:tw-border-[#0078d4] focus:tw-outline-none focus:tw-shadow-[0_0_0_1px_#0078d4]"
                placeholder="e.g. Fuel route zones"
              />
            </label>
            <label className="tw-flex tw-flex-col tw-gap-1">
              <span className="tw-text-[12px] tw-font-medium tw-text-[#605e5c]">Description</span>
              <textarea
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                rows={2}
                className="tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-py-1.5 tw-text-[13px] tw-text-[#201f1e] focus:tw-border-[#0078d4] focus:tw-outline-none focus:tw-shadow-[0_0_0_1px_#0078d4]"
                placeholder="Optional group note"
              />
            </label>
            <div className="tw-flex tw-justify-end tw-gap-2">
              <button
                type="button"
                onClick={() => setShowCreateGroup(false)}
                className="tw-inline-flex tw-h-[32px] tw-items-center tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-text-[12px] tw-font-medium tw-text-[#323130] hover:tw-bg-[#f3f2f1]"
                disabled={creatingGroup}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                className="tw-inline-flex tw-h-[32px] tw-items-center tw-rounded-[4px] tw-bg-[#0078d4] tw-px-2.5 tw-text-[12px] tw-font-medium tw-text-white hover:tw-bg-[#106ebe] disabled:tw-opacity-50"
                disabled={creatingGroup}
              >
                {creatingGroup ? "Creating..." : "Create group"}
              </button>
            </div>
          </div>
        )}

        {form.geofenceType === "Route" && (
          <label className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-[12px] tw-font-medium tw-text-[#605e5c]">Corridor width (meters)</span>
            <input
              type="number"
              min="1"
              step="1"
              value={form.radiusMeters ?? DEFAULT_ROUTE_WIDTH_METERS}
              onChange={(e) => handleFieldChange("radiusMeters", e.target.value === "" ? "" : Number(e.target.value))}
              className="tw-h-[32px] tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-text-[13px] tw-text-[#201f1e] focus:tw-border-[#0078d4] focus:tw-outline-none focus:tw-shadow-[0_0_0_1px_#0078d4]"
            />
          </label>
        )}

        <div className="tw-rounded-[6px] tw-border tw-border-[#edebe9] tw-bg-[#f8faf8] tw-p-2.5">
          <div className="tw-mb-2 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-[#605e5c]">GPSGate payload preview</div>
          <div className="tw-grid tw-grid-cols-1 tw-gap-2">
            {payloadPreviewRows.map((item) => (
              <div key={item.label} className="tw-grid tw-grid-cols-[92px,1fr] tw-items-center tw-gap-2">
                <span className="tw-text-[12px] tw-text-[#605e5c]">{item.label}</span>
                <div className="tw-min-h-[30px] tw-rounded-[4px] tw-border tw-border-[#d2d0ce] tw-bg-white tw-px-2.5 tw-py-1.5 tw-text-[12px] tw-font-medium tw-text-[#201f1e]">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-[12px] tw-font-medium tw-text-[#605e5c]">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            rows={2}
            className="tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-py-1.5 tw-text-[13px] tw-text-[#201f1e] focus:tw-border-[#0078d4] focus:tw-outline-none focus:tw-shadow-[0_0_0_1px_#0078d4]"
            placeholder="Optional operational notes"
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className={`${compact ? "tw-flex tw-flex-col tw-bg-white" : "tw-space-y-4 tw-bg-[#faf9f8] tw-p-5"}`}>
      {compact ? (
        <>
          <div className="tw-bg-white tw-px-3 tw-py-2.5">
            {error && (
              <div className="tw-mb-3 tw-rounded-[4px] tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-[12px] tw-text-red-700">
                {error}
              </div>
            )}

            <div className="tw-grid tw-grid-cols-1 tw-gap-2.5">
              {controlRail}
              {!hideMap && (
                <div className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-4">
                  <GeofenceDrawingMap
                    geofenceType={form.geofenceType}
                    centerLatitude={form.centerLatitude}
                    centerLongitude={form.centerLongitude}
                    radiusMeters={form.radiusMeters}
                    coordinates={form.coordinates}
                    height={mapHeight}
                    initialViewport={mapViewport}
                    onShapeChange={handleShapeChange}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="tw-flex tw-shrink-0 tw-justify-end tw-gap-2 tw-border-t tw-border-[#eceeed] tw-bg-white tw-px-3 tw-py-2.5">
            <Button text="Cancel" stylingMode="outlined" onClick={onCancel} disabled={saving || creatingGroup} />
            <Button
              text={saving ? "Saving..." : isEditMode ? "Update geofence" : "Create geofence"}
              type="default"
              stylingMode="contained"
              onClick={handleSubmit}
              disabled={saving || creatingGroup}
            />
          </div>
        </>
      ) : (
        <>
          {error && (
            <div className="tw-rounded-md tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700">
              {error}
            </div>
          )}

          <div className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 lg:tw-p-5">
            <GeofenceDrawingMap
              geofenceType={form.geofenceType}
              centerLatitude={form.centerLatitude}
              centerLongitude={form.centerLongitude}
              radiusMeters={form.radiusMeters}
              coordinates={form.coordinates}
              height={mapHeight}
              initialViewport={mapViewport}
              onShapeChange={handleShapeChange}
            />

            <div className="tw-mt-4 lg:tw-mt-0 lg:tw-absolute lg:tw-left-8 lg:tw-top-8 lg:tw-z-10 lg:tw-w-[320px]">
              {controlRail}
            </div>

            <div className="tw-mt-4 tw-flex tw-justify-end tw-gap-3 lg:tw-mt-0 lg:tw-absolute lg:tw-bottom-8 lg:tw-right-8 lg:tw-z-10">
              <Button text="Cancel" stylingMode="outlined" onClick={onCancel} disabled={saving} />
              <Button
                text={saving ? "Saving..." : isEditMode ? "Update geofence" : "Create geofence"}
                type="default"
                stylingMode="contained"
                onClick={handleSubmit}
                disabled={saving}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GeofenceCreateForm;
