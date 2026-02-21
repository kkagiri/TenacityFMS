/**
 * File: EventTypesReference.js
 * Purpose: Read-only reference page showing all available event types, their categories,
 *          available conditions, scope filters, and defaults. Fetched from /types API.
 * Dependencies: react, react-redux, eventExpressionSlice
 * Last Modified: 2026-02-18
 *
 * Key Features:
 * - Grouped cards by category (Tank Stock, Tank Monitoring, PTS Device, etc.)
 * - Each card shows: display name, description, conditions, scope filters, defaults
 * - Quick "Create" button per type to pre-fill the form
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchEventExpressionTypes } from '../../../redux/slices/eventExpressionSlice';
import './EventTypesReference.scss';

const EventTypesReference = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { expressionTypes, typesLoading } = useSelector((state) => state.eventExpressions);

    useEffect(() => {
        if (!expressionTypes || expressionTypes.length === 0) {
            dispatch(fetchEventExpressionTypes());
        }
    }, [dispatch, expressionTypes]);

    // Group by category
    const grouped = (expressionTypes || []).reduce((acc, type) => {
        const cat = type.category || 'Other';
        if (!acc[cat]) acc[cat] = { icon: type.categoryIcon, items: [] };
        acc[cat].items.push(type);
        return acc;
    }, {});

    const handleCreateFromType = (alertTypeKey) => {
        navigate(`/event-expressions/create?type=${encodeURIComponent(alertTypeKey)}`);
    };

    if (typesLoading) {
        return (
            <div className="tw-p-8 tw-text-center tw-text-gray-400">
                <i className="fa-light fa-spinner-third fa-spin tw-text-2xl tw-mb-2"></i>
                <p>Loading event types...</p>
            </div>
        );
    }

    return (
        <div className="event-types-reference tw-p-4">
            <p className="tw-text-sm tw-text-gray-500 tw-mb-6">
                Browse all available event types. Each type defines what conditions can be monitored
                and what scope filters apply. Click "Create Rule" to start a new expression
                pre-filled with that type.
            </p>

            {Object.entries(grouped).map(([category, { icon, items }]) => (
                <div key={category} className="tw-mb-8">
                    {/* Category Header */}
                    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-4">
                        {icon && <i className={`${icon} tw-text-lg tw-text-violet-600`}></i>}
                        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
                            {category}
                        </h3>
                        <span className="tw-text-xs tw-text-gray-400 tw-ml-1">
                            ({items.length} type{items.length !== 1 ? 's' : ''})
                        </span>
                    </div>

                    {/* Type Cards Grid */}
                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-4">
                        {items.map((type) => (
                            <div key={type.alertTypeKey} className="type-card">
                                <div className="type-card__header">
                                    <h4 className="type-card__title">{type.displayName}</h4>
                                    <button
                                        className="type-card__create-btn"
                                        onClick={() => handleCreateFromType(type.alertTypeKey)}
                                        title="Create expression rule for this type"
                                    >
                                        <i className="fa-light fa-plus"></i>
                                        <span>Create Rule</span>
                                    </button>
                                </div>
                                <p className="type-card__desc">{type.description}</p>

                                {/* Conditions */}
                                {type.availableConditions?.length > 0 && (
                                    <div className="type-card__section">
                                        <span className="type-card__section-label">
                                            <i className="fa-light fa-sliders tw-mr-1"></i>
                                            Conditions
                                        </span>
                                        <div className="type-card__tags">
                                            {type.availableConditions.map((c) => (
                                                <span key={c.key} className="type-card__tag">
                                                    {c.label}
                                                    <span className="type-card__tag-type">
                                                        {c.inputType}
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Scope Filters */}
                                {type.availableScopeFilters?.length > 0 && (
                                    <div className="type-card__section">
                                        <span className="type-card__section-label">
                                            <i className="fa-light fa-filter tw-mr-1"></i>
                                            Scope Filters
                                        </span>
                                        <div className="type-card__tags">
                                            {type.availableScopeFilters.map((s) => (
                                                <span key={s} className="type-card__tag type-card__tag--scope">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Defaults */}
                                <div className="type-card__footer">
                                    <span className="type-card__meta">
                                        Severity: <strong>{type.defaultSeverity}</strong>
                                    </span>

                                    <span className="type-card__meta tw-text-xs tw-text-gray-400">
                                        Key: {type.alertTypeKey}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EventTypesReference;
