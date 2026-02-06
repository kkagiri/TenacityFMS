/**
 * File: StatCard.js
 * Purpose: Reusable statistic card component for Issue Tracker dashboards
 * Dependencies: React, Tailwind CSS
 * Last Modified: 2026-02-05
 *
 * Key Props:
 * - title: Card title text
 * - value: Main value to display
 * - icon: FontAwesome icon class (e.g., 'fa-light fa-check')
 * - color: Color theme (blue, red, orange, yellow, green, purple, gray, indigo, teal)
 * - subtitle: Optional subtitle text
 * - onClick: Optional click handler (makes card clickable)
 * - trend: Optional percentage trend value
 * - trendDirection: 'up' | 'down' | null
 */

import React from 'react';

const StatCard = ({
    title,
    value,
    icon,
    color = 'blue',
    subtitle,
    onClick,
    trend,
    trendDirection,
    className = ''
}) => {
    const getColorClasses = (colorName) => {
        const colorMap = {
            red: {
                bg: 'tw-bg-red-50',
                border: 'tw-border-red-500',
                icon: 'tw-text-red-600',
                text: 'tw-text-red-900',
                button: 'hover:tw-bg-red-100'
            },
            orange: {
                bg: 'tw-bg-orange-50',
                border: 'tw-border-orange-500',
                icon: 'tw-text-orange-600',
                text: 'tw-text-orange-900',
                button: 'hover:tw-bg-orange-100'
            },
            yellow: {
                bg: 'tw-bg-yellow-50',
                border: 'tw-border-yellow-500',
                icon: 'tw-text-yellow-600',
                text: 'tw-text-yellow-900',
                button: 'hover:tw-bg-yellow-100'
            },
            green: {
                bg: 'tw-bg-green-50',
                border: 'tw-border-green-500',
                icon: 'tw-text-green-600',
                text: 'tw-text-green-900',
                button: 'hover:tw-bg-green-100'
            },
            purple: {
                bg: 'tw-bg-purple-50',
                border: 'tw-border-purple-500',
                icon: 'tw-text-purple-600',
                text: 'tw-text-purple-900',
                button: 'hover:tw-bg-purple-100'
            },
            gray: {
                bg: 'tw-bg-gray-50',
                border: 'tw-border-gray-500',
                icon: 'tw-text-gray-600',
                text: 'tw-text-gray-900',
                button: 'hover:tw-bg-gray-100'
            },
            indigo: {
                bg: 'tw-bg-indigo-50',
                border: 'tw-border-indigo-500',
                icon: 'tw-text-indigo-600',
                text: 'tw-text-indigo-900',
                button: 'hover:tw-bg-indigo-100'
            },
            teal: {
                bg: 'tw-bg-teal-50',
                border: 'tw-border-teal-500',
                icon: 'tw-text-teal-600',
                text: 'tw-text-teal-900',
                button: 'hover:tw-bg-teal-100'
            },
            blue: {
                bg: 'tw-bg-blue-50',
                border: 'tw-border-blue-500',
                icon: 'tw-text-blue-600',
                text: 'tw-text-blue-900',
                button: 'hover:tw-bg-blue-100'
            }
        };

        return colorMap[colorName] || colorMap.blue;
    };

    const colorClasses = getColorClasses(color);
    const isClickable = typeof onClick === 'function';

    // Format value for display
    const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

    const content = (
        <div
            className={`
                tw-bg-white tw-rounded-lg tw-shadow-md tw-border-l-4 tw-p-4 tw-transition-all tw-duration-200
                ${colorClasses.border}
                ${isClickable ? `tw-cursor-pointer ${colorClasses.button} hover:tw-shadow-lg` : ''}
                ${className}
            `}
        >
            <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex-1">
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                        <h3 className="tw-text-sm tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wide">
                            {title}
                        </h3>
                        {icon && (
                            <div className={`tw-text-3xl tw-opacity-60 ${colorClasses.icon}`}>
                                <i className={icon}></i>
                            </div>
                        )}
                    </div>

                    <div className="tw-flex tw-items-baseline tw-justify-between">
                        <p className={`tw-text-2xl tw-font-bold tw-text-gray-800`}>
                            {displayValue}
                        </p>

                        {trend !== undefined && (
                            <div
                                className={`tw-flex tw-items-center tw-text-sm ${trendDirection === 'up'
                                        ? 'tw-text-green-600'
                                        : trendDirection === 'down'
                                            ? 'tw-text-red-600'
                                            : 'tw-text-gray-600'
                                    }`}
                            >
                                {trendDirection === 'up' && <i className="fa-light fa-arrow-up tw-mr-1"></i>}
                                {trendDirection === 'down' && <i className="fa-light fa-arrow-down tw-mr-1"></i>}
                                {trend}%
                            </div>
                        )}
                    </div>

                    {subtitle && (
                        <p className="tw-text-xs tw-text-gray-400 tw-mt-1">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );

    return isClickable ? <div onClick={onClick}>{content}</div> : content;
};

export default StatCard;
