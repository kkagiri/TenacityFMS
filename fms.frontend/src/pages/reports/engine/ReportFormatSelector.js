/**
 * File: ReportFormatSelector.js
 * Purpose: Output format picker — M365 segmented button group
 * Dependencies: React
 * Last Modified: 2026-03-02
 */

import React from 'react';
import './ReportFormatSelector.scss';

const FORMAT_OPTIONS = [
    { value: 'html', label: 'HTML', icon: 'fa-light fa-globe' },
    { value: 'pdf', label: 'PDF', icon: 'fa-light fa-file-pdf' },
];

const ReportFormatSelector = ({ supportedFormats = [], selectedFormat, onFormatChange }) => {
    const available = FORMAT_OPTIONS.filter((f) => supportedFormats.includes(f.value));

    return (
        <div className="fmt-group">
            {available.map((fmt) => (
                <button
                    key={fmt.value}
                    type="button"
                    className={`fmt-group__item${selectedFormat === fmt.value ? ' fmt-group__item--active' : ''}`}
                    onClick={() => onFormatChange(fmt.value)}
                >
                    <i className={fmt.icon} />
                    {fmt.label}
                </button>
            ))}
        </div>
    );
};

export default ReportFormatSelector;
