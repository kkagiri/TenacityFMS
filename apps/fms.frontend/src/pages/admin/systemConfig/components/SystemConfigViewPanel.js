/**
 * File: SystemConfigViewPanel.js
 * Purpose: Read-only side panel for viewing system configuration details with tabbed sections.
 * Dependencies: react, prop-types, devextreme-react/button, SlidePanel
 * Last Modified: 2026-03-03
 *
 * Key Functions:
 * - Displays configuration details in Basic Info and Validation tabs
 * - Exposes Edit action to open editable form flow
 */
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Button from "devextreme-react/button";
import SlidePanel from "../../../../components/ui/SlidePanel";

const SystemConfigViewPanel = ({ visible, config, onClose, onEdit }) => {
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (visible) {
            setActiveTab(0);
        }
    }, [visible, config?.id]);

    const tabs = [
        { id: 0, title: "Basic Info" },
        { id: 1, title: "Validation" },
    ];

    const renderItem = (label, value) => (
        <div className="system-config-view__item">
            <span className="system-config-view__label">{label}</span>
            <span className="system-config-view__value">{value || "-"}</span>
        </div>
    );

    if (!config) return null;

    return (
        <SlidePanel open={visible} onClose={onClose} title="View Configuration" width={720}>
            <div className="system-config-m365-form system-config-view tw-p-6">
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-3 tw-mb-5">
                    <div>
                        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-m-0">
                            {config.configurationKey}
                        </h3>
                        <p className="tw-text-sm tw-text-gray-500 tw-m-0 tw-mt-1">
                            {config.description || "System configuration details"}
                        </p>
                    </div>
                    <Button
                        text="Edit"
                        type="default"
                        stylingMode="contained"
                        icon="fa-light fa-pen-to-square"
                        onClick={() => onEdit(config)}
                    />
                </div>

                <div className="m365-detail-tabs tw-mb-5">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`m365-detail-tab ${activeTab === tab.id ? "m365-detail-tab--active" : ""}`}
                        >
                            {tab.title}
                        </button>
                    ))}
                </div>

                {activeTab === 0 && (
                    <div className="m365-section tw-grid tw-grid-cols-2 tw-gap-4">
                        {renderItem("Configuration Key", config.configurationKey)}
                        {renderItem("Category", config.category)}
                        {renderItem("Data Type", config.dataType)}
                        {renderItem("Configuration Value", config.configurationValue)}
                        {renderItem("Default Value", config.defaultValue)}
                        {renderItem("Status", config.isActive ? "Active" : "Inactive")}
                        {renderItem("Editable", config.isEditable ? "Yes" : "No")}
                        <div className="tw-col-span-2">{renderItem("Description", config.description)}</div>
                    </div>
                )}

                {activeTab === 1 && (
                    <div className="m365-section tw-grid tw-grid-cols-2 tw-gap-4">
                        {renderItem("Validation Pattern", config.validationPattern)}
                        {renderItem("Allowed Values", config.possibleValues)}
                        {renderItem("Minimum Value", config.minValue)}
                        {renderItem("Maximum Value", config.maxValue)}
                        <div className="tw-col-span-2">{renderItem("Comments", config.comments)}</div>
                    </div>
                )}
            </div>
        </SlidePanel>
    );
};

SystemConfigViewPanel.propTypes = {
    visible: PropTypes.bool.isRequired,
    config: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
};

SystemConfigViewPanel.defaultProps = {
    config: null,
};

export default SystemConfigViewPanel;
