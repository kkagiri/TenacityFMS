/**
 * File: StepEventTriggers.js
 * Purpose: Step 2 of Event Expression form — Event type selection and dynamic
 *          trigger condition fields based on the selected type's metadata.
 *          Groups event types by business domain (category) with icons.
 * Dependencies: devextreme-react SelectBox, Validator, parent renderConditionField
 * Last Modified: 2026-02-14
 *
 * Key Props:
 * - formData: current form state (eventType stores alertTypeKey)
 * - onEventTypeChange(alertTypeKey): handles event type swap + condition reset
 * - expressionTypes: flat array of available event types from backend
 * - selectedTypeMetadata: metadata for currently selected type
 * - availableConditions: condition definitions for selected type
 * - renderConditionField(condition): renders a single dynamic condition input
 *
 * Notes:
 * - DevExtreme SelectBox grouped={true} requires data in [{key, items}] format
 * - We transform the flat expressionTypes array into grouped format via useMemo
 * - valueExpr uses "alertTypeKey" (unique per entry) not "eventType" (may be shared)
 */

import React, { useMemo } from 'react';
import { SelectBox } from 'devextreme-react/select-box';
import { Validator, RequiredRule } from 'devextreme-react/validator';
import DataSource from 'devextreme/data/data_source';
import ArrayStore from 'devextreme/data/array_store';

const StepEventTriggers = ({
    formData,
    onEventTypeChange,
    expressionTypes,
    selectedTypeMetadata,
    availableConditions,
    renderConditionField
}) => {
    // ─── DevExtreme DataSource with built-in grouping by category ───
    const typesDataSource = useMemo(() => {
        if (!expressionTypes || expressionTypes.length === 0) return [];

        return new DataSource({
            store: new ArrayStore({
                data: expressionTypes,
                key: 'alertTypeKey'
            }),
            group: 'category'
        });
    }, [expressionTypes]);

    return (
        <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-6">
            {/* Left: Event type selector */}
            <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                <h4 className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-3">
                    <i className="fa-light fa-bolt tw-mr-2" />
                    Select Event Type
                </h4>
                <p className="tw-text-xs tw-text-gray-500 tw-mb-3">
                    Choose the type of system event this expression should monitor.
                    Each type exposes specific trigger conditions.
                </p>

                <div className="tw-mb-4">
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                        Event Type <span className="tw-text-red-500">*</span>
                    </label>
                    <SelectBox
                        dataSource={typesDataSource}
                        displayExpr="displayName"
                        valueExpr="alertTypeKey"
                        value={formData.eventType}
                        onValueChanged={(e) => onEventTypeChange(e.value)}
                        placeholder="Select event type..."
                        width="100%"
                        searchEnabled={true}
                        grouped={true}
                        groupRender={(data) => (
                            <div className="tw-flex tw-items-center tw-gap-2 tw-py-1">
                                <span className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wide">
                                    {data.key}
                                </span>
                            </div>
                        )}
                        itemRender={(data) => (
                            <div className="tw-py-1">
                                <div className="tw-font-medium tw-text-gray-800">
                                    {data.displayName}
                                </div>
                                <div className="tw-text-xs tw-text-gray-500 tw-mt-0.5">
                                    {data.description}
                                </div>
                            </div>
                        )}
                    >
                        <Validator>
                            <RequiredRule message="Event type is required" />
                        </Validator>
                    </SelectBox>
                </div>

                {/* Selected type info card */}
                {selectedTypeMetadata && (
                    <div className="tw-bg-gray-50 tw-rounded tw-border tw-border-gray-200 tw-p-3">
                        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1">
                            {selectedTypeMetadata.categoryIcon && (
                                <i className={`${selectedTypeMetadata.categoryIcon} tw-text-blue-600`} />
                            )}
                            <span className="tw-inline-block tw-px-2 tw-py-0.5 tw-bg-blue-100 tw-text-blue-700 tw-rounded tw-text-xs tw-font-medium">
                                {selectedTypeMetadata.category}
                            </span>
                            <span className="tw-text-sm tw-font-medium tw-text-gray-800">
                                {selectedTypeMetadata.displayName}
                            </span>
                        </div>
                        <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                            {selectedTypeMetadata.description}
                        </p>
                        {availableConditions.length > 0 && (
                            <p className="tw-text-xs tw-text-gray-400 tw-mt-2">
                                <i className="fa-light fa-sliders tw-mr-1" />
                                {availableConditions.length} configurable condition{availableConditions.length > 1 ? 's' : ''} available
                            </p>
                        )}
                        {selectedTypeMetadata.availableScopeFilters?.length > 0 && (
                            <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                <i className="fa-light fa-filter tw-mr-1" />
                                Scope: {selectedTypeMetadata.availableScopeFilters.join(', ')}
                            </p>
                        )}
                    </div>
                )}

                {/* No type selected hint */}
                {!formData.eventType && (
                    <div className="tw-bg-amber-50 tw-rounded tw-border tw-border-amber-200 tw-p-3 tw-text-xs tw-text-amber-700">
                        <i className="fa-light fa-triangle-exclamation tw-mr-1" />
                        Select an event type to see available trigger conditions.
                    </div>
                )}
            </div>

            {/* Right: Dynamic trigger conditions */}
            <div className="tw-flex-1">
                {selectedTypeMetadata && availableConditions.length > 0 ? (
                    <div className="tw-bg-white tw-rounded-lg tw-border tw-border-blue-200 tw-p-4">
                        <h4 className="tw-text-sm tw-font-semibold tw-text-blue-700 tw-mb-3">
                            <i className="fa-light fa-sliders tw-mr-2" />
                            Trigger Conditions
                        </h4>
                        <p className="tw-text-xs tw-text-gray-500 tw-mb-3">
                            Configure the thresholds that must be met to fire this expression.
                        </p>
                        {availableConditions.map(renderConditionField)}
                    </div>
                ) : selectedTypeMetadata && availableConditions.length === 0 ? (
                    <div className="tw-bg-green-50 tw-rounded-lg tw-border tw-border-green-200 tw-p-4">
                        <h4 className="tw-text-sm tw-font-semibold tw-text-green-700 tw-mb-2">
                            <i className="fa-light fa-check-circle tw-mr-2" />
                            No Additional Conditions
                        </h4>
                        <p className="tw-text-xs tw-text-gray-600">
                            This event type fires on any matching event without extra threshold filters.
                            You can still narrow the scope in the next step.
                        </p>
                    </div>
                ) : (
                    <div className="tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-flex tw-items-center tw-justify-center tw-h-full tw-min-h-[120px]">
                        <p className="tw-text-sm tw-text-gray-400">
                            <i className="fa-light fa-arrow-left tw-mr-2" />
                            Select an event type to configure conditions
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StepEventTriggers;
