/**
 * File: StepBasicInfo.js
 * Purpose: Step 1 of Event Expression form — Name, Description, Priority,
 *          Minimum Severity, and Active toggle.
 * Dependencies: devextreme-react TextBox/TextArea/SelectBox, Validator
 * Last Modified: 2026-02-14
 *
 * Key Props:
 * - formData: current form state
 * - onFieldChange(field, value): updates a single form field
 */

import React from 'react';
import { TextBox } from 'devextreme-react/text-box';
import { TextArea } from 'devextreme-react/text-area';
import { SelectBox } from 'devextreme-react/select-box';
import {
    Validator,
    RequiredRule,
    StringLengthRule
} from 'devextreme-react/validator';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

const StepBasicInfo = ({ formData, onFieldChange }) => {
    return (
        <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-6">
            {/* Left: Core fields */}
            <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                <div className="tw-mb-3">
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                        Name <span className="tw-text-red-500">*</span>
                    </label>
                    <TextBox
                        value={formData.name}
                        onValueChanged={(e) => onFieldChange('name', e.value)}
                        placeholder="e.g., Low Tank Volume Alert"
                        width="100%"
                    >
                        <Validator>
                            <RequiredRule message="Name is required" />
                            <StringLengthRule max={100} message="Name must be under 100 characters" />
                        </Validator>
                    </TextBox>
                </div>

                <div className="tw-mb-3">
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                        Description
                    </label>
                    <TextArea
                        value={formData.description}
                        onValueChanged={(e) => onFieldChange('description', e.value)}
                        placeholder="Describe what this expression monitors..."
                        height={80}
                        width="100%"
                    />
                </div>

                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3">
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            Priority
                        </label>
                        <SelectBox
                            items={PRIORITY_OPTIONS}
                            value={formData.priority}
                            onValueChanged={(e) => onFieldChange('priority', e.value)}
                            width="100%"
                        />
                    </div>
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            Min. Severity
                        </label>
                        <SelectBox
                            items={SEVERITY_OPTIONS}
                            value={formData.minimumSeverity}
                            onValueChanged={(e) => onFieldChange('minimumSeverity', e.value)}
                            placeholder="Any"
                            showClearButton={true}
                            width="100%"
                        />
                    </div>
                </div>

                <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between">
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                        Active
                    </label>
                    <input
                        type="checkbox"
                        checked={!!formData.isActive}
                        onChange={(e) => onFieldChange('isActive', e.target.checked)}
                        className="tw-h-4 tw-w-4 tw-cursor-pointer"
                        aria-label="Active"
                    />
                </div>
            </div>

            {/* Right: Info card */}
            <div className="tw-flex-1 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200 tw-p-4">
                <h4 className="tw-text-sm tw-font-semibold tw-text-blue-700 tw-mb-2">
                    <i className="fa-light fa-circle-info tw-mr-2" />
                    About Event Expressions
                </h4>
                <p className="tw-text-xs tw-text-gray-600 tw-mb-2">
                    An event expression defines a rule that monitors your system for specific
                    conditions and triggers notifications when thresholds are met.
                </p>
                <ul className="tw-text-xs tw-text-gray-600 tw-list-disc tw-pl-4 tw-space-y-1">
                    <li><strong>Name</strong> — a descriptive label for this rule</li>
                    <li><strong>Priority</strong> — determines notification urgency (Low → Critical)</li>
                    <li><strong>Min. Severity</strong> — only events at or above this severity fire</li>
                    <li><strong>Active</strong> — toggle evaluation on/off without deleting</li>
                </ul>
            </div>
        </div>
    );
};

export default StepBasicInfo;
