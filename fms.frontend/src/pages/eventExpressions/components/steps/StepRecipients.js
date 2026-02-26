/**
 * File: StepRecipients.js
 * Purpose: Step 5 of Event Expression form — Dynamic routing rules + static user
 *          selection via a dual-pane filterable list. Follows M365 Admin Center design.
 * Dependencies: React, notificationsApi, devextreme-react TagBox
 * Last Modified: 2026-02-20
 *
 * Key Props:
 * - selectedUserIds / onUserIdsChange: static user recipients
 * - recipientRules / onRecipientRulesChange: dynamic routing rule state
 * - roles: available roles list for RolesAtSite picker
 * - sites: available sites list for filter dropdown
 * - departments: available departments for filter dropdown
 * - loadingData: whether role data is still loading
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TagBox } from 'devextreme-react/tag-box';
import notificationsApi from '../../../../dataservice/notificationsApi';
import './StepRecipients.scss';

/* ── Helpers ────────────────────────────────────────────────── */
const DEFAULT_RULES = {
    dynamicRules: [
        { type: 'SiteUsers', enabled: false },
        { type: 'SiteAdmin', enabled: true },
        { type: 'RolesAtSite', enabled: false, roleIds: [] }
    ]
};

const RULE_META = {
    SiteUsers: {
        label: 'All site users',
        hint: 'Every user assigned to the site where the event fires will be notified.',
        icon: 'fa-light fa-building-user'
    },
    SiteAdmin: {
        label: 'Site administrator',
        hint: 'The designated site admin receives the notification automatically.',
        icon: 'fa-light fa-user-shield'
    },
    RolesAtSite: {
        label: 'Roles at site',
        hint: 'Users with selected roles at the event site receive the notification.',
        icon: 'fa-light fa-users-gear'
    }
};

const StepRecipients = ({
    selectedUserIds,
    onUserIdsChange,
    recipientRules,
    onRecipientRulesChange,
    roles,
    sites,
    departments,
    loadingData
}) => {
    /* ── Local state ───────────────────────────────────────── */
    const [candidates, setCandidates] = useState([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [filterSite, setFilterSite] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterAdmin, setFilterAdmin] = useState('');
    const [searchText, setSearchText] = useState('');
    const searchTimer = useRef(null);

    const rules = recipientRules || DEFAULT_RULES;

    /* ── Fetch candidates (debounced) ──────────────────────── */
    const loadCandidates = useCallback(async () => {
        setLoadingCandidates(true);
        try {
            const params = {};
            if (filterSite) params.siteId = Number(filterSite);
            if (filterDept) params.departmentId = Number(filterDept);
            if (filterAdmin === 'true') params.isSiteAdmin = true;
            if (filterAdmin === 'false') params.isSiteAdmin = false;
            if (searchText) params.search = searchText;
            params.take = 200;
            const res = await notificationsApi.getRecipientCandidates(params);
            if (res.isSuccess) setCandidates(res.data || []);
        } catch (err) {
            console.error('Failed to load candidates:', err);
        } finally {
            setLoadingCandidates(false);
        }
    }, [filterSite, filterDept, filterAdmin, searchText]);

    useEffect(() => {
        loadCandidates();
    }, [loadCandidates]);

    /* ── Search debounce ───────────────────────────────────── */
    const [searchInput, setSearchInput] = useState('');
    const handleSearchInput = useCallback((e) => {
        const val = e.target.value;
        setSearchInput(val);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setSearchText(val), 300);
    }, []);

    /* ── Rule toggle helpers ───────────────────────────────── */
    const toggleRule = useCallback((type) => {
        const updated = {
            ...rules,
            dynamicRules: rules.dynamicRules.map((r) =>
                r.type === type ? { ...r, enabled: !r.enabled } : r
            )
        };
        onRecipientRulesChange(updated);
    }, [rules, onRecipientRulesChange]);

    const updateRoleIds = useCallback((roleIds) => {
        const updated = {
            ...rules,
            dynamicRules: rules.dynamicRules.map((r) =>
                r.type === 'RolesAtSite' ? { ...r, roleIds: roleIds || [] } : r
            )
        };
        onRecipientRulesChange(updated);
    }, [rules, onRecipientRulesChange]);

    /* ── User toggle ───────────────────────────────────────── */
    const toggleUser = useCallback((userId) => {
        const current = selectedUserIds || [];
        const exists = current.includes(userId);
        onUserIdsChange(
            exists ? current.filter((id) => id !== userId) : [...current, userId]
        );
    }, [selectedUserIds, onUserIdsChange]);

    const removeUser = useCallback((userId) => {
        onUserIdsChange((selectedUserIds || []).filter((id) => id !== userId));
    }, [selectedUserIds, onUserIdsChange]);

    /* ── Derived data ──────────────────────────────────────── */
    const selectedSet = useMemo(
        () => new Set(selectedUserIds || []),
        [selectedUserIds]
    );

    // Build a lookup for selected users (name/email) from candidates
    const candidateMap = useMemo(() => {
        const map = {};
        candidates.forEach((c) => { map[c.id] = c; });
        return map;
    }, [candidates]);

    const rolesAtSiteRule = rules.dynamicRules.find((r) => r.type === 'RolesAtSite');
    const hasDynamic = rules.dynamicRules.some((r) => r.enabled);
    const hasStatic = (selectedUserIds || []).length > 0;
    const noRecipients = !hasDynamic && !hasStatic;

    /* ── Render ─────────────────────────────────────────────── */
    return (
        <div className="step-recipients">
            {/* ── Dynamic Routing Rules ─────────────────────── */}
            <div className="step-recipients__rules">
                <h4 className="step-recipients__rules-title">
                    <i className="fa-light fa-bolt" />
                    Dynamic Routing Rules
                </h4>
                <p className="step-recipients__rules-desc">
                    Automatically deliver notifications based on where the event fires.
                </p>

                {rules.dynamicRules.map((rule) => {
                    const meta = RULE_META[rule.type] || {};
                    return (
                        <div key={rule.type} className="step-recipients__rule-row">
                            <label className="step-recipients__rule-check">
                                <input
                                    type="checkbox"
                                    checked={!!rule.enabled}
                                    onChange={() => toggleRule(rule.type)}
                                />
                                <i className={meta.icon} />
                                <span>{meta.label}</span>
                            </label>
                            <span className="step-recipients__rule-hint">{meta.hint}</span>

                            {/* RolesAtSite: show role picker when enabled */}
                            {rule.type === 'RolesAtSite' && rule.enabled && (
                                <div className="step-recipients__role-picker">
                                    <TagBox
                                        items={roles}
                                        displayExpr="text"
                                        valueExpr="value"
                                        value={rolesAtSiteRule?.roleIds || []}
                                        onValueChanged={(e) => updateRoleIds(e.value)}
                                        searchEnabled={true}
                                        showSelectionControls={true}
                                        placeholder="Select roles..."
                                        multiline={false}
                                        width="100%"
                                        height={30}
                                        noDataText={loadingData ? 'Loading...' : 'No roles'}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Dual-pane Static Recipients ───────────────── */}
            <div className="step-recipients__panes">
                {/* Left: Available users */}
                <div className="step-recipients__pane">
                    <div className="step-recipients__pane-header">
                        <h4>
                            <i className="fa-light fa-users" />
                            Available Users
                        </h4>
                        <span className="step-recipients__pane-count">{candidates.length}</span>
                    </div>

                    {/* Filters */}
                    <div className="step-recipients__filters">
                        <select
                            className="step-recipients__filter-select"
                            value={filterSite}
                            onChange={(e) => setFilterSite(e.target.value)}
                        >
                            <option value="">All Sites</option>
                            {(sites || []).map((s) => (
                                <option key={s.siteId ?? s.id} value={s.siteId ?? s.id}>
                                    {s.siteName ?? s.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="step-recipients__filter-select"
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {(departments || []).map((d) => (
                                <option key={d.departmentId ?? d.id} value={d.departmentId ?? d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="step-recipients__filter-select"
                            value={filterAdmin}
                            onChange={(e) => setFilterAdmin(e.target.value)}
                        >
                            <option value="">Admin?</option>
                            <option value="true">Site Admins</option>
                            <option value="false">Non-Admins</option>
                        </select>

                        <div className="step-recipients__filter-search">
                            <i className="fa-light fa-magnifying-glass step-recipients__filter-search-icon" />
                            <input
                                className="step-recipients__filter-search-input"
                                type="text"
                                placeholder="Search name or email..."
                                value={searchInput}
                                onChange={handleSearchInput}
                            />
                        </div>
                    </div>

                    {/* User list */}
                    {loadingCandidates ? (
                        <div className="step-recipients__loading">
                            <i className="fa-light fa-spinner-third fa-spin" />
                        </div>
                    ) : candidates.length === 0 ? (
                        <div className="step-recipients__empty">
                            <i className="fa-light fa-users-slash" />
                            <p>No users match the current filters</p>
                        </div>
                    ) : (
                        <ul className="step-recipients__user-list">
                            {candidates.map((user) => {
                                const isSelected = selectedSet.has(user.id);
                                return (
                                    <li
                                        key={user.id}
                                        className={`step-recipients__user-item${isSelected ? ' step-recipients__user-item--selected' : ''}`}
                                        onClick={() => toggleUser(user.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => { }}
                                            tabIndex={-1}
                                        />
                                        <div className="step-recipients__user-info">
                                            <div className="step-recipients__user-name">
                                                {user.userName || user.email || user.id}
                                            </div>
                                            <div className="step-recipients__user-meta">
                                                {user.email}
                                                {user.departmentName ? ` · ${user.departmentName}` : ''}
                                            </div>
                                        </div>
                                        {user.isSiteAdmin && (
                                            <span className="step-recipients__user-badge step-recipients__user-badge--admin">
                                                Admin
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Right: Selected users */}
                <div className="step-recipients__pane">
                    <div className="step-recipients__pane-header">
                        <h4>
                            <i className="fa-light fa-user-check" />
                            Selected Recipients
                        </h4>
                        <span className="step-recipients__pane-count">
                            {(selectedUserIds || []).length}
                        </span>
                    </div>

                    {(selectedUserIds || []).length === 0 ? (
                        <div className="step-recipients__empty">
                            <i className="fa-light fa-user-plus" />
                            <p>Click users on the left to add them as static recipients</p>
                        </div>
                    ) : (
                        <ul className="step-recipients__user-list">
                            {(selectedUserIds || []).map((uid) => {
                                const user = candidateMap[uid];
                                return (
                                    <li key={uid} className="step-recipients__user-item">
                                        <div className="step-recipients__user-info">
                                            <div className="step-recipients__user-name">
                                                {user?.userName || user?.email || uid}
                                            </div>
                                            {user?.email && (
                                                <div className="step-recipients__user-meta">
                                                    {user.email}
                                                    {user.departmentName ? ` · ${user.departmentName}` : ''}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className="step-recipients__remove-btn"
                                            onClick={() => removeUser(uid)}
                                            title="Remove recipient"
                                        >
                                            <i className="fa-light fa-xmark" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* ── Warning when nothing configured ──────────── */}
            {noRecipients && (
                <div className="step-recipients__warning">
                    <i className="fa-light fa-triangle-exclamation" />
                    <span>
                        No recipients configured. Enable at least one dynamic rule or add
                        static users so notifications can be delivered.
                    </span>
                </div>
            )}
        </div>
    );
};

export default StepRecipients;
