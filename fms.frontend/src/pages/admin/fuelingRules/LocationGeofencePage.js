/**
 * File: LocationGeofencePage.js
 * Purpose: Combined view for Location Rules and Geofence management.
 * Dependencies: LocationRulesSettings, GeofenceManagement
 * Last Modified: 2026-02-27
 *
 * Key Components:
 * - LocationGeofencePage: Two-section page with location rules and geofence definitions.
 */
import React, { useState } from "react";
import LocationRulesSettings from "../../../components/Tags/TagRuleManagement/LocationRulesSettings";
import { GeofenceManagement } from "./GeofenceManagement";

const SECTIONS = [
    { id: "location", label: "Location Rules", icon: "fa-light fa-location-dot" },
    { id: "geofence", label: "Geofences", icon: "fa-light fa-map-location-dot" },
];

const LocationGeofencePage = () => {
    const [activeSection, setActiveSection] = useState("location");

    return (
        <div className="tw-h-full">
            {/* M365 Tab Bar */}
            <div
                className="tw-flex tw-gap-1 tw-bg-white tw-border-b tw-px-6"
                style={{ borderColor: "#edebe9" }}
            >
                {SECTIONS.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className="tw-relative tw-inline-flex tw-items-center tw-gap-1.5 tw-border-none tw-bg-transparent tw-cursor-pointer tw-px-4 tw-py-2.5"
                        style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: activeSection === s.id ? "#0078d4" : "#605e5c",
                            transition: "color 0.15s",
                        }}
                    >
                        <i className={s.icon} style={{ fontSize: 13 }} />
                        <span>{s.label}</span>
                        {activeSection === s.id && (
                            <span
                                className="tw-absolute tw-bottom-0 tw-left-3 tw-right-3 tw-rounded-t"
                                style={{ height: 2, background: "#0078d4" }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Section Content */}
            <div className="tw-p-4">
                {activeSection === "location" && <LocationRulesSettings />}
                {activeSection === "geofence" && <GeofenceManagement />}
            </div>
        </div>
    );
};

export default LocationGeofencePage;
