/**
 * File: AlertConfiguration.js
 * Purpose: Main page for the Unified Alert Configuration system. Displays all
 *          configurable alert types grouped by category (Tank Operations, PTS Device,
 *          GPS & Vehicle, System). Allows toggling, editing thresholds, and resetting defaults.
 * Dependencies: alertConfigurationApi, AlertTypeCard, DevExtreme (LoadIndicator, Button)
 * Last Modified: 2026-02-02
 *
 * Key Components:
 * - AlertConfiguration: Main page component
 */

import React, { useState, useEffect, useCallback } from 'react';
import LoadIndicator from 'devextreme-react/load-indicator';
import Button from 'devextreme-react/button';
import { confirm } from 'devextreme/ui/dialog';
import notify from 'devextreme/ui/notify';
import alertConfigurationApi from '../../../dataservice/alertConfigurationApi';
import AlertTypeCard from './AlertTypeCard';
import './AlertConfiguration.scss';

/** Maps group names to icons */
const groupIcons = {
    'Tank Operations': 'fa-light fa-oil-well',
    'PTS Device': 'fa-light fa-gas-pump',
    'GPS & Vehicle': 'fa-light fa-truck',
    System: 'fa-light fa-gear',
};

/** Maps group names to accent colors */
const groupColors = {
    'Tank Operations': 'tw-blue-600',
    'PTS Device': 'tw-amber-600',
    'GPS & Vehicle': 'tw-green-600',
    System: 'tw-purple-600',
};

const AlertConfiguration = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState({});

    const loadConfigurations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await alertConfigurationApi.getAllAlertConfigurations();
            if (result.isSuccess) {
                setGroups(result.data || []);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Failed to load alert configurations');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfigurations();
    }, [loadConfigurations]);

    const handleSeedDefaults = useCallback(async () => {
        const ok = await confirm(
            'This will seed default configurations for all alert types. Existing configurations will NOT be overwritten. Continue?',
            'Seed Default Configurations'
        );
        if (!ok) return;

        try {
            const result = await alertConfigurationApi.seedAlertConfigurations();
            if (result.isSuccess) {
                notify(result.message, 'success', 3000);
                loadConfigurations();
            } else {
                notify(result.message, 'error', 3000);
            }
        } catch {
            notify('Failed to seed configurations', 'error', 3000);
        }
    }, [loadConfigurations]);

    const toggleGroupCollapse = useCallback((groupName) => {
        setCollapsedGroups((prev) => ({
            ...prev,
            [groupName]: !prev[groupName],
        }));
    }, []);

    /** Count total and enabled alerts */
    const stats = React.useMemo(() => {
        let total = 0;
        let enabled = 0;
        groups.forEach((g) => {
            (g.alertTypes || []).forEach((a) => {
                total++;
                if (a.enabled) enabled++;
            });
        });
        return { total, enabled, disabled: total - enabled };
    }, [groups]);

    /** Filter groups/alerts by search text */
    const filteredGroups = React.useMemo(() => {
        if (!searchText.trim()) return groups;
        const term = searchText.toLowerCase();
        return groups
            .map((group) => ({
                ...group,
                alertTypes: (group.alertTypes || []).filter(
                    (a) =>
                        a.displayName?.toLowerCase().includes(term) ||
                        a.description?.toLowerCase().includes(term) ||
                        a.key?.toLowerCase().includes(term)
                ),
            }))
            .filter((g) => g.alertTypes.length > 0);
    }, [groups, searchText]);

    if (loading) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
                <LoadIndicator height={40} width={40} />
                <span className="tw-ml-3 tw-text-gray-500">
                    Loading alert configurations...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tw-p-6">
                <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-6 tw-text-center">
                    <i className="fa-light fa-circle-exclamation tw-text-red-500 tw-text-3xl tw-mb-3"></i>
                    <h3 className="tw-text-lg tw-font-semibold tw-text-red-800 tw-mb-2">
                        Failed to Load Configurations
                    </h3>
                    <p className="tw-text-red-600 tw-mb-4">{error}</p>
                    <Button
                        text="Retry"
                        type="default"
                        stylingMode="contained"
                        onClick={loadConfigurations}
                        icon="fa-light fa-arrows-rotate"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="alert-configuration-page tw-p-6">
            {/* Page Header */}
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
                <div>
                    <h2 className="tw-text-xl tw-font-bold tw-text-gray-900">
                        <i className="fa-light fa-sliders tw-mr-2 tw-text-blue-600"></i>
                        Alert Thresholds &amp; Configuration
                    </h2>
                    <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                        Configure alert thresholds, toggle alerts on/off, and manage
                        notification triggers.
                    </p>
                </div>
                <div className="tw-flex tw-items-center tw-gap-2">
                    <Button
                        text="Seed Defaults"
                        type="normal"
                        stylingMode="outlined"
                        onClick={handleSeedDefaults}
                        icon="fa-light fa-database"
                        hint="Seed default configurations for all alert types"
                    />
                    <Button
                        icon="fa-light fa-arrows-rotate"
                        type="normal"
                        stylingMode="text"
                        onClick={loadConfigurations}
                        hint="Refresh configurations"
                    />
                </div>
            </div>

            {/* Stats Bar */}
            <div className="tw-grid tw-grid-cols-3 tw-gap-4 tw-mb-6">
                <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-text-center">
                    <div className="tw-text-2xl tw-font-bold tw-text-gray-900">
                        {stats.total}
                    </div>
                    <div className="tw-text-sm tw-text-gray-500">Total Alert Types</div>
                </div>
                <div className="tw-bg-white tw-rounded-lg tw-border tw-border-green-200 tw-p-4 tw-text-center">
                    <div className="tw-text-2xl tw-font-bold tw-text-green-600">
                        {stats.enabled}
                    </div>
                    <div className="tw-text-sm tw-text-gray-500">Enabled</div>
                </div>
                <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-text-center">
                    <div className="tw-text-2xl tw-font-bold tw-text-gray-400">
                        {stats.disabled}
                    </div>
                    <div className="tw-text-sm tw-text-gray-500">Disabled</div>
                </div>
            </div>

            {/* Search */}
            <div className="tw-mb-6">
                <div className="tw-relative">
                    <i className="fa-light fa-search tw-absolute tw-left-3 tw-top-1/2 tw-transform tw--translate-y-1/2 tw-text-gray-400"></i>
                    <input
                        type="text"
                        placeholder="Search alert types..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="tw-w-full tw-pl-10 tw-pr-4 tw-py-2.5 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm tw-bg-white focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500 tw-outline-none"
                    />
                </div>
            </div>

            {/* Alert Groups */}
            {filteredGroups.length === 0 ? (
                <div className="tw-text-center tw-py-12 tw-text-gray-500">
                    <i className="fa-light fa-filter-slash tw-text-4xl tw-mb-3 tw-block"></i>
                    <p>No alert types match your search.</p>
                </div>
            ) : (
                <div className="tw-space-y-6">
                    {filteredGroups.map((group) => {
                        const isCollapsed = collapsedGroups[group.groupName];
                        const enabledCount = (group.alertTypes || []).filter(
                            (a) => a.enabled
                        ).length;
                        const totalCount = (group.alertTypes || []).length;
                        const color = groupColors[group.groupName] || 'tw-gray-600';
                        const icon = groupIcons[group.groupName] || 'fa-light fa-bell';

                        return (
                            <div
                                key={group.groupName}
                                className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-overflow-hidden"
                            >
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleGroupCollapse(group.groupName)}
                                    className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-bg-gray-50 hover:tw-bg-gray-100 tw-transition-colors tw-cursor-pointer tw-border-0"
                                >
                                    <div className="tw-flex tw-items-center tw-gap-3">
                                        <i className={`${icon} tw-text-xl ${`tw-text-${color.replace('tw-', '')}`}`}></i>
                                        <div className="tw-text-left">
                                            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                                                {group.groupName}
                                            </h3>
                                            <span className="tw-text-xs tw-text-gray-500">
                                                {enabledCount}/{totalCount} enabled
                                            </span>
                                        </div>
                                    </div>
                                    <i
                                        className={`fa-light fa-chevron-${isCollapsed ? 'down' : 'up'} tw-text-gray-400`}
                                    ></i>
                                </button>

                                {/* Group Content */}
                                {!isCollapsed && (
                                    <div className="tw-p-6 tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
                                        {(group.alertTypes || []).map((alert) => (
                                            <AlertTypeCard
                                                key={alert.key}
                                                alertConfig={alert}
                                                onRefresh={loadConfigurations}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AlertConfiguration;
