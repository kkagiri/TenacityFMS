/**
 * File: LocationGeofencePage.js
 * Purpose: Combined view for Location Rules and Geofence management.
 * Dependencies: LocationRulesSettings, GeofenceManagement, react-router-dom
 * Last Modified: 2026-03-05
 *
 * Key Components:
 * - LocationGeofencePage: Two-section page with location rules and geofence definitions.
 */
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import LocationRulesSettings from "../../../components/Tags/TagRuleManagement/LocationRulesSettings";
import { GeofenceManagement } from "./GeofenceManagement";
import SlidePanel from "../../../components/ui/SlidePanel";

const SECTIONS = [
    { id: "location", label: "Location Rules", icon: "fa-light fa-location-dot" },
    { id: "geofence", label: "Geofences", icon: "fa-light fa-map-location-dot" },
];

const HELP_CONTENT = {
    location: {
        title: "Location Rules Help",
        description: "Configure how location validation is enforced before fueling authorization.",
        points: [
            "Enable location validation only when GPS accuracy and network are reliable.",
            "Use bypass options temporarily and always set clear expiry/justification.",
            "Review warning/threshold settings to balance fraud prevention and usability.",
        ],
    },
    geofence: {
        title: "Geofence Management Help",
        description: "Manage geofences and fueling group eligibility synced from GPSGate.",
        points: [
            "Geofences tab lists synced geofence records and their status.",
            "Allowed Groups controls which groups can pass geofence fueling validation.",
            "Sync Groups supports selective sync for faster updates than full sync.",
        ],
    },
};

const LocationGeofencePage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [showHelp, setShowHelp] = useState(false);
    const [locationActions, setLocationActions] = useState({
        onRefresh: null,
        onSave: null,
        canRefresh: false,
        canSave: false,
    });
    const sectionFromUrl = searchParams.get("section");
    const activeSection = sectionFromUrl === "geofence" ? "geofence" : "location";
    const activeHelp = HELP_CONTENT[activeSection];

    const handleSectionChange = (sectionId) => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("section", sectionId);
        setSearchParams(nextParams, { replace: false });
    };

    return (
        <div className="location-geofence-page tw-h-full tw-w-full">
            {/* M365 Tab Bar */}
            <div className="location-geofence-page__tabs tw-flex tw-items-center tw-justify-between tw-bg-white dark:tw-bg-gray-900 tw-border-b tw-border-gray-200 dark:tw-border-gray-700 tw-px-6">
                <div className="tw-flex tw-gap-1">
                    {SECTIONS.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => handleSectionChange(s.id)}
                            className={`tw-relative tw-inline-flex tw-items-center tw-gap-1.5 tw-border-none tw-bg-transparent tw-cursor-pointer tw-px-4 tw-py-2.5 tw-text-[13px] tw-font-medium tw-transition-colors ${activeSection === s.id
                                ? "tw-text-[#0078d4]"
                                : "tw-text-gray-600 dark:tw-text-gray-300 hover:tw-text-gray-800 dark:hover:tw-text-gray-100"
                                }`}
                        >
                            <i className={`${s.icon} tw-text-[13px]`} />
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

                <div className="tw-inline-flex tw-items-center tw-gap-3">
                    {activeSection === "location" && (
                        <>
                            <button
                                onClick={() => locationActions.onRefresh?.()}
                                disabled={!locationActions.canRefresh}
                                className="tw-inline-flex tw-items-center tw-gap-2 tw-px-1 tw-py-2 tw-text-sm tw-text-gray-600 dark:tw-text-gray-200 tw-bg-transparent tw-border-none hover:tw-text-blue-600 dark:hover:tw-text-blue-300 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                                title="Refresh location rules"
                            >
                                <i className="fa-light fa-rotate-right"></i>
                                <span>Refresh</span>
                            </button>
                            <button
                                onClick={() => locationActions.onSave?.()}
                                disabled={!locationActions.canSave}
                                className="tw-inline-flex tw-items-center tw-gap-2 tw-px-1 tw-py-2 tw-text-sm tw-text-gray-600 dark:tw-text-gray-200 tw-bg-transparent tw-border-none hover:tw-text-blue-600 dark:hover:tw-text-blue-300 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                                title="Save location rules"
                            >
                                <i className="fa-light fa-save"></i>
                                <span>Save</span>
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => setShowHelp(true)}
                        className="tw-inline-flex tw-items-center tw-gap-2 tw-px-1 tw-py-2 tw-text-sm tw-text-gray-600 dark:tw-text-gray-200 tw-bg-transparent tw-border-none hover:tw-text-blue-600 dark:hover:tw-text-blue-300 tw-transition-colors"
                        title="Open help"
                    >
                        <i className="fa-light fa-circle-question"></i>
                        <span>Help</span>
                    </button>
                </div>
            </div>

            {/* Section Content */}
            <div className="location-geofence-page__content tw-px-4 tw-py-3 tw-w-full">
                {activeSection === "location" && (
                    <LocationRulesSettings
                        showTopInfo={false}
                        onActionStateChange={setLocationActions}
                    />
                )}
                {activeSection === "geofence" && <GeofenceManagement />}
            </div>

            <SlidePanel
                open={showHelp}
                onClose={() => setShowHelp(false)}
                title={activeHelp.title}
                width={620}
            >
                <div className="tw-p-5">
                    <p className="tw-text-gray-700 tw-mb-4">{activeHelp.description}</p>
                    <ul className="tw-space-y-2 tw-text-sm tw-text-gray-600">
                        {activeHelp.points.map((point) => (
                            <li key={point} className="tw-flex tw-items-start tw-gap-2">
                                <i className="fa-light fa-circle-check tw-text-blue-600 tw-mt-0.5"></i>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </SlidePanel>
        </div>
    );
};

export default LocationGeofencePage;
