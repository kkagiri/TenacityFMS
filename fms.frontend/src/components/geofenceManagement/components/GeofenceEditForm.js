/**
 * File: GeofenceEditForm.js
 * Purpose: Slide-panel form for editing geofence classification and group memberships.
 * Dependencies: React, devextreme-react/button, geofenceService
 * Last Modified: 2026-06-10
 *
 * Key Functions:
 * - Edits classification via updateGeofenceClassification API
 * - Manages group memberships via addGeofenceToGroup / removeGeofenceFromGroup APIs
 * - Shows geofence metadata (type, coordinates, status) as read-only
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "devextreme-react/button";
import notify from "devextreme/ui/notify";
import geofenceService from "../../../api/geofenceService";

const CLASSIFICATION_OPTIONS = ["Unknown", "Parking", "Load", "Dump", "Fuel", "Workshop"];

const CLASSIFICATION_BADGE_MAP = {
  Parking: { bg: "tw-bg-purple-100", text: "tw-text-purple-800", icon: "fa-light fa-square-parking" },
  Load: { bg: "tw-bg-orange-100", text: "tw-text-orange-800", icon: "fa-light fa-truck-loading" },
  Dump: { bg: "tw-bg-yellow-100", text: "tw-text-yellow-800", icon: "fa-light fa-dumpster" },
  Fuel: { bg: "tw-bg-amber-100", text: "tw-text-amber-800", icon: "fa-light fa-gas-pump" },
  Workshop: { bg: "tw-bg-teal-100", text: "tw-text-teal-800", icon: "fa-light fa-wrench" },
};

const GeofenceEditForm = ({
  geofence,
  geofenceGroups = [],
  onSaved,
  onCancel,
}) => {
  const [classification, setClassification] = useState("Unknown");
  const [memberGroupIds, setMemberGroupIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!geofence) return;
    setClassification(geofence.classification || "Unknown");

    const currentGroupIds = geofenceGroups
      .filter((g) => Array.isArray(g.geofences) && g.geofences.some((gf) => Number(gf.id) === Number(geofence.id)))
      .map((g) => g.id);
    setMemberGroupIds(currentGroupIds);
    setDirty(false);
  }, [geofence, geofenceGroups]);

  const originalClassification = geofence?.classification || "Unknown";
  const originalGroupIds = useMemo(() => {
    if (!geofence) return [];
    return geofenceGroups
      .filter((g) => Array.isArray(g.geofences) && g.geofences.some((gf) => Number(gf.id) === Number(geofence.id)))
      .map((g) => g.id);
  }, [geofence, geofenceGroups]);

  const handleClassificationChange = (e) => {
    setClassification(e.target.value);
    setDirty(true);
  };

  const handleGroupToggle = (groupId) => {
    setMemberGroupIds((prev) => {
      const next = prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId];
      setDirty(true);
      return next;
    });
  };

  const handleSave = useCallback(async () => {
    if (!geofence) return;
    setSaving(true);

    try {
      const classificationChanged = classification !== originalClassification;
      const addedGroupIds = memberGroupIds.filter((id) => !originalGroupIds.includes(id));
      const removedGroupIds = originalGroupIds.filter((id) => !memberGroupIds.includes(id));

      if (classificationChanged) {
        const response = await geofenceService.updateGeofenceClassification(geofence.id, classification);
        if (!response?.isSuccess) {
          notify(response?.message || "Failed to update classification", "error", 3000);
          setSaving(false);
          return;
        }
      }

      for (const groupId of addedGroupIds) {
        const response = await geofenceService.addGeofenceToGroup(groupId, geofence.id);
        if (!response?.isSuccess) {
          notify(response?.message || `Failed to add geofence to group`, "error", 3000);
        }
      }

      for (const groupId of removedGroupIds) {
        const response = await geofenceService.removeGeofenceFromGroup(groupId, geofence.id);
        if (!response?.isSuccess) {
          notify(response?.message || `Failed to remove geofence from group`, "error", 3000);
        }
      }

      const changes = [];
      if (classificationChanged) changes.push("classification");
      if (addedGroupIds.length || removedGroupIds.length) changes.push("group memberships");

      notify(changes.length > 0 ? `Updated ${changes.join(" and ")}` : "No changes to save", changes.length > 0 ? "success" : "info", 3000);
      setDirty(false);

      if (onSaved) onSaved();
    } catch (error) {
      console.error("Error saving geofence:", error);
      notify(error.response?.data?.message || error.message || "Failed to save changes", "error", 4000);
    } finally {
      setSaving(false);
    }
  }, [classification, geofence, memberGroupIds, onSaved, originalClassification, originalGroupIds]);

  if (!geofence) {
    return (
      <div className="tw-p-6 tw-text-center tw-text-gray-500">
        <i className="fa-light fa-location-dot tw-text-3xl tw-mb-3 tw-text-gray-300"></i>
        <p>Select a geofence to edit its properties.</p>
      </div>
    );
  }

  const badge = CLASSIFICATION_BADGE_MAP[geofence.classification];
  const typeIcons = { Circle: "fa-circle", Polygon: "fa-draw-polygon", Route: "fa-route" };
  const typeIcon = typeIcons[geofence.geofenceType] || "fa-location-dot";

  return (
    <div className="tw-p-5 tw-space-y-5">
      {/* Header with geofence name */}
      <div className="tw-flex tw-items-start tw-gap-3">
        <div className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-rounded-lg tw-bg-blue-50 tw-text-blue-600">
          <i className={`fa-light ${typeIcon} tw-text-lg`}></i>
        </div>
        <div className="tw-flex-1 tw-min-w-0">
          <h3 className="tw-text-base tw-font-semibold tw-text-gray-900 tw-truncate">{geofence.name}</h3>
          <div className="tw-flex tw-items-center tw-gap-2 tw-mt-1">
            <span className="tw-text-xs tw-text-gray-500">{geofence.geofenceType || "Unknown type"}</span>
            {badge && (
              <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full ${badge.bg} tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium ${badge.text}`}>
                <i className={badge.icon}></i> {geofence.classification}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metadata - read only */}
      <div className="tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200 tw-p-3">
        <div className="tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-2">Geofence Details</div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-text-sm">
          <div>
            <span className="tw-text-gray-500">Latitude:</span>
            <span className="tw-ml-1 tw-text-gray-800">{Number(geofence.centerLatitude).toFixed(6) || "—"}</span>
          </div>
          <div>
            <span className="tw-text-gray-500">Longitude:</span>
            <span className="tw-ml-1 tw-text-gray-800">{Number(geofence.centerLongitude).toFixed(6) || "—"}</span>
          </div>
          {geofence.geofenceType === "Circle" && (
            <div>
              <span className="tw-text-gray-500">Radius:</span>
              <span className="tw-ml-1 tw-text-gray-800">{geofence.radiusMeters ? `${Math.round(geofence.radiusMeters)} m` : "—"}</span>
            </div>
          )}
          <div>
            <span className="tw-text-gray-500">Status:</span>
            <span className={`tw-ml-1 tw-font-medium ${geofence.isActive ? "tw-text-green-700" : "tw-text-gray-500"}`}>
              {geofence.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        {geofence.isUsedForFuelValidation && (
          <div className="tw-mt-2 tw-flex tw-items-center tw-gap-1 tw-text-xs tw-text-amber-700">
            <i className="fa-light fa-gas-pump"></i>
            Used for fuel validation in: {(geofence.fuelingGroupNames || []).join(", ") || "a fueling group"}
          </div>
        )}
        {geofence.isUsedForTripClassification && (
          <div className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-xs tw-text-blue-700">
            <i className="fa-light fa-route"></i>
            Trip classification: {geofence.tripClassificationLabel || "Linked"}
          </div>
        )}
      </div>

      {/* Classification selection */}
      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
          Classification
        </label>
        <select
          value={classification}
          onChange={handleClassificationChange}
          className="tw-w-full tw-h-[34px] tw-rounded tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-3 tw-text-[13px] tw-text-gray-800 focus:tw-border-[#0078d4] focus:tw-outline-none"
        >
          {CLASSIFICATION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <p className="tw-mt-1 tw-text-xs tw-text-gray-500">
          Classify this geofence for trip detection (e.g. Fuel stations, Load/Dump worksites, Parking areas).
        </p>
      </div>

      {/* Group memberships */}
      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          Group Memberships
        </label>
        {geofenceGroups.length === 0 ? (
          <p className="tw-text-sm tw-text-gray-500">No groups available. Create a group first.</p>
        ) : (
          <div className="tw-space-y-1.5 tw-max-h-[240px] tw-overflow-y-auto tw-border tw-border-gray-200 tw-rounded-lg tw-p-2">
            {geofenceGroups.map((group) => {
              const isMember = memberGroupIds.includes(group.id);
              return (
                <label
                  key={group.id}
                  className={`tw-flex tw-items-center tw-gap-2.5 tw-px-2.5 tw-py-2 tw-rounded tw-cursor-pointer tw-transition-colors ${isMember ? "tw-bg-blue-50 tw-border tw-border-blue-200" : "tw-bg-white tw-border tw-border-transparent hover:tw-bg-gray-50"}`}
                >
                  <input
                    type="checkbox"
                    checked={isMember}
                    onChange={() => handleGroupToggle(group.id)}
                    className="tw-h-4 tw-w-4 tw-rounded tw-border-gray-300"
                  />
                  <div className="tw-flex-1 tw-min-w-0">
                    <div className="tw-flex tw-items-center tw-gap-2">
                      {group.colour && (
                        <span className="tw-w-3 tw-h-3 tw-rounded-full tw-border tw-border-gray-300" style={{ backgroundColor: group.colour }} />
                      )}
                      <span className="tw-text-sm tw-text-gray-800 tw-truncate">{group.name}</span>
                      {group.isAllowedForFueling && (
                        <span className="tw-inline-flex tw-items-center tw-gap-0.5 tw-rounded-full tw-bg-amber-100 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-amber-800">
                          <i className="fa-light fa-gas-pump"></i> Fueling
                        </span>
                      )}
                    </div>
                    {group.description && (
                      <span className="tw-text-xs tw-text-gray-500 tw-truncate tw-block">{group.description}</span>
                    )}
                  </div>
                  <span className="tw-text-xs tw-text-gray-400">{group.geofenceCount || 0}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="tw-flex tw-items-center tw-justify-between tw-pt-3 tw-border-t tw-border-gray-200">
        <div className="tw-text-xs tw-text-gray-500">
          {dirty ? <span className="tw-text-amber-600"><i className="fa-light fa-circle-exclamation tw-mr-1"></i>Unsaved changes</span> : "No changes"}
        </div>
        <div className="tw-flex tw-gap-2">
          <Button text="Cancel" stylingMode="outlined" onClick={onCancel} disabled={saving} />
          <Button text={saving ? "Saving..." : "Save changes"} type="default" stylingMode="contained" onClick={handleSave} disabled={!dirty || saving} />
        </div>
      </div>
    </div>
  );
};

export default GeofenceEditForm;
