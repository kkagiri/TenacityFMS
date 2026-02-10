/**
 * File: ReportFormatSelector.js
 * Purpose: Output format picker component (HTML preview, PDF, Excel, CSV)
 * Dependencies: React
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - ReportFormatSelector: Renders format options based on source's supportedFormats
 */

import React from 'react';

const FORMAT_OPTIONS = [
    { value: 'html', label: 'HTML Preview', icon: 'fa-light fa-globe' },
    { value: 'pdf', label: 'PDF', icon: 'fa-light fa-file-pdf' },
    { value: 'excel', label: 'Excel', icon: 'fa-light fa-file-excel' },
    { value: 'csv', label: 'CSV', icon: 'fa-light fa-file-csv' },
];

const ReportFormatSelector = ({ supportedFormats = [], selectedFormat, onFormatChange }) => {
    const available = FORMAT_OPTIONS.filter((f) => supportedFormats.includes(f.value));

    return (
        <div className="tw-flex tw-gap-2 tw-flex-wrap">
            {available.map((fmt) => {
                const isActive = selectedFormat === fmt.value;
                return (
                    <button
                        key={fmt.value}
                        type="button"
                        onClick={() => onFormatChange(fmt.value)}
                        className={`tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-rounded-md tw-text-sm tw-font-medium tw-border tw-transition-colors ${isActive
                                ? 'tw-bg-blue-600 tw-text-white tw-border-blue-600'
                                : 'tw-bg-white tw-text-gray-700 tw-border-gray-300 hover:tw-bg-gray-50'
                            }`}
                    >
                        <i className={fmt.icon}></i>
                        {fmt.label}
                    </button>
                );
            })}
        </div>
    );
};

export default ReportFormatSelector;
