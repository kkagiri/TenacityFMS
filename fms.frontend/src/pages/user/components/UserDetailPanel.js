/**
 * File: UserDetailPanel.js
 * Purpose: M365 Admin Center style detail panel for viewing/managing a user
 * Dependencies: React, Redux, UserAvatar, UserStatusBadge, UserRoleBadge, ChangePasswordPopup, userActions
 * Last Modified: 2026-02-25
 *
 * Key Components:
 * - UserDetailPanel(): Slide-in panel with avatar header, action bar, and tabbed content
 *   Tabs: General (account/roles/settings/sign-in) | Activities | Sites
 *   Actions: Reset Password, Deactivate/Activate, Delete
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import notify from 'devextreme/ui/notify';
import { usePermissions } from '../../../hooks/usePermissions';
import {
    updateUser,
    softDeleteUser,
    restoreUser,
    fetchUserActivities,
    fetchLoginActivities,
    fetchAllSites,
    fetchUserSites,
    updateUserSites,
    resendUserConfirmationEmail,
} from '../../../redux/actions/userActions';
import UserAvatar from './UserAvatar';
import UserStatusBadge from './UserStatusBadge';
import { UserRoleBadgeList } from './UserRoleBadge';
import ChangePasswordPopup from './ChangePasswordPopup';
import SlidePanel from '../../../components/ui/SlidePanel';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const deriveEditFieldErrorsFromMessage = (message) => {
    const normalizedMessage = (message || '').toLowerCase();
    const nextErrors = {};

    if (normalizedMessage.includes('username')) {
        nextErrors.userName = message;
    }

    if (normalizedMessage.includes('email')) {
        nextErrors.email = message;
    }

    if (normalizedMessage.includes('role')) {
        nextErrors.roleName = message;
    }

    if (normalizedMessage.includes('phone')) {
        nextErrors.phone = message;
    }

    return nextErrors;
};

const PANEL_TABS = [
    { key: 'general', label: 'General', icon: 'fa-light fa-user' },
    { key: 'activities', label: 'Activities', icon: 'fa-light fa-clock-rotate-left' },
    { key: 'sites', label: 'Sites', icon: 'fa-light fa-building' },
];

const ACTIVITIES_PAGE_SIZE = 20;
const SIGNIN_PAGE_SIZE = 10;

const UserDetailPanel = ({
    visible,
    onHide,
    userId,
    initialTab = 'general',
    allUsers = [],
    roleOptions = [],
    departments = [],
    onUserChanged,
}) => {
    const dispatch = useDispatch();
    const { hasPermission } = usePermissions();
    const canManage = hasPermission('_Manage_Users');

    // ── State ──────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showPasswordPopup, setShowPwdPopup] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editValues, setEditValues] = useState({});
    const [saving, setSaving] = useState(false);
    const [resendingConfirmation, setResendingConfirmation] = useState(false);

    // Activities
    const [activities, setActivities] = useState([]);
    const [loadingAct, setLoadingAct] = useState(false);
    const [activitiesPage, setActivitiesPage] = useState(1);

    // Sign-in activity detail view
    const [showSignInDetail, setShowSignInDetail] = useState(false);
    const [loginActivities, setLoginActivities] = useState([]);
    const [loadingLoginAct, setLoadingLoginAct] = useState(false);
    const [signInPage, setSignInPage] = useState(1);

    // Sites
    const allSitesRedux = useSelector((s) => s.user.allSites || []);
    const userSitesRedux = useSelector((s) => s.user.userSites || []);
    const [selectedSiteIds, setSelectedSiteIds] = useState([]);
    const [loadingSites, setLoadingSites] = useState(false);
    const [savingSites, setSavingSites] = useState(false);

    // ── Resolve user ───────────────────────────────────────────────────────
    const user = useMemo(
        () => allUsers.find((u) => (u.id || u.Id) === userId) || null,
        [allUsers, userId]
    );

    const normalizedAllSites = useMemo(
        () => (allSitesRedux || []).map((site) => ({
            id: site.siteId || site.SiteId || site.id,
            name: site.siteName || site.SiteName || site.name,
            location: site.location || site.Location || '',
            siteAdministratorId: site.siteAdministratorId || site.SiteAdministratorId || null,
            siteAdministratorName: site.siteAdministratorName || site.SiteAdministratorName || null,
        })),
        [allSitesRedux]
    );

    // ── Reset on user change ──────────────────────────────────────────────
    useEffect(() => {
        setActiveTab(initialTab || 'general');
        setEditMode(false);
        setEditValues({});
        setActivities([]);
        setActivitiesPage(1);
        setShowSignInDetail(false);
        setLoginActivities([]);
        setSignInPage(1);
    }, [userId, initialTab]);

    // ── Load activities ───────────────────────────────────────────────────
    useEffect(() => {
        if (activeTab !== 'activities' || !userId || !visible) return;
        setLoadingAct(true);
        dispatch(fetchUserActivities(userId))
            .then((res) => {
                const d = res?.data || res || [];
                setActivities(Array.isArray(d) ? d : []);
            })
            .catch(() => setActivities([]))
            .finally(() => setLoadingAct(false));
    }, [activeTab, userId, visible, dispatch]);

    useEffect(() => {
        if (activeTab !== 'activities' || !userId || !visible) return;
        setLoadingLoginAct(true);
        dispatch(fetchLoginActivities(userId))
            .then((res) => {
                const d = res?.data || res || [];
                setLoginActivities(Array.isArray(d) ? d : []);
                setSignInPage(1);
            })
            .catch(() => setLoginActivities([]))
            .finally(() => setLoadingLoginAct(false));
    }, [activeTab, userId, visible, dispatch]);

    // ── Load sites ────────────────────────────────────────────────────────
    useEffect(() => {
        if (activeTab !== 'sites' || !userId || !visible) return;
        setLoadingSites(true);
        Promise.all([
            dispatch(fetchAllSites()),
            dispatch(fetchUserSites(userId)),
        ])
            .catch(() => { })
            .finally(() => setLoadingSites(false));
    }, [activeTab, userId, visible, dispatch]);

    useEffect(() => {
        const ids = (userSitesRedux || []).map((s) => s.siteId || s.SiteId || s.id);
        setSelectedSiteIds(ids);
    }, [userSitesRedux]);

    // ── Helpers ────────────────────────────────────────────────────────────
    const displayName = user
        ? (user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.userName || user.Username || 'User')
        : 'User';
    const userEmail = user?.email || user?.Email || '';
    const isActive = user ? !user.isDeleted : true;
    const isEmailConfirmed = (user?.emailConfirmed ?? user?.EmailConfirmed) === true;

    // ── Action handlers ───────────────────────────────────────────────────
    const handleToggleActive = useCallback(async () => {
        if (!user) return;
        const id = user.id || user.Id;
        const action = user.isDeleted ? 'activate' : 'deactivate';
        // eslint-disable-next-line no-restricted-globals
        if (!window.confirm(`Are you sure you want to ${action} ${displayName}?`)) return;
        try {
            if (user.isDeleted) {
                await dispatch(restoreUser(id));
            } else {
                await dispatch(softDeleteUser(id));
            }
            notify(`User ${action}d successfully`, 'success', 2500);
            onUserChanged?.();
        } catch (err) {
            notify(err.message || `Failed to ${action} user`, 'error', 3000);
        }
    }, [dispatch, user, displayName, onUserChanged]);

    const handleDelete = useCallback(() => {
        notify('Use deactivate to disable user access', 'info', 3000);
    }, []);

    const handleResendConfirmationEmail = useCallback(async () => {
        if (!userId || !userEmail || isEmailConfirmed) return;

        setResendingConfirmation(true);
        try {
            const response = await dispatch(resendUserConfirmationEmail(userId));
            notify(response?.message || 'Confirmation email sent successfully', 'success', 3000);
        } catch (err) {
            notify(err.message || 'Failed to resend confirmation email', 'error', 3000);
        } finally {
            setResendingConfirmation(false);
        }
    }, [dispatch, isEmailConfirmed, userEmail, userId]);

    // ── Edit mode ─────────────────────────────────────────────────────────
    const startEdit = useCallback(() => {
        if (!user) return;
        setActiveTab('general');
        setEditErrors({});
        setEditValues({
            firstName: user.firstName || user.FirstName || '',
            lastName: user.lastName || user.LastName || '',
            userName: user.userName || user.Username || '',
            email: user.email || user.Email || '',
            phone: user.phone || user.Phone || '',
            roleName: user.roleName || user.RoleName || (user.roleNames?.[0] ?? ''),
            departmentId: String(user.departmentId || user.DepartmentId || ''),
            bypassGps: user.bypassGps || user.BypassGps || false,
        });
        setEditMode(true);
    }, [user]);

    const [editErrors, setEditErrors] = useState({});

    const handleEditChange = useCallback((field, value) => {
        setEditValues((prev) => ({ ...prev, [field]: value }));
        // Clear field error on change
        setEditErrors((prev) => ({ ...prev, [field]: '' }));
    }, []);

    const handleSaveEdit = useCallback(async () => {
        if (!user || !editValues) return;

        // Validate fields
        const errors = {};

        // Username required
        if (!editValues.userName || !editValues.userName.trim()) {
            errors.userName = 'Username is required';
        }

        // Email required + format
        if (!editValues.email || !editValues.email.trim()) {
            errors.email = 'Email is required';
        } else if (!EMAIL_REGEX.test(editValues.email.trim())) {
            errors.email = 'Enter a valid email address';
        }

        if (!editValues.roleName || !String(editValues.roleName).trim()) {
            errors.roleName = 'Role is required';
        }

        // Phone validation (optional, but if provided must be valid)
        const phoneRaw = (editValues.phone || '').trim();
        if (phoneRaw) {
            const phoneClean = phoneRaw.replace(/[\s\-().]/g, '');
            if (!/^\+?\d{7,15}$/.test(phoneClean)) {
                errors.phone = 'Enter a valid phone number (7-15 digits, e.g. +254712345678)';
            }
        }

        if (Object.keys(errors).length > 0) {
            setEditErrors(errors);
            notify('Please fix the highlighted errors', 'warning', 3000);
            return;
        }

        setSaving(true);
        try {
            setEditErrors({});
            await dispatch(updateUser(user.id || user.Id, {
                ...editValues,
                userName: editValues.userName?.trim(),
                email: editValues.email?.trim(),
                phone: editValues.phone?.trim(),
                roleName: editValues.roleName?.trim(),
            }));
            notify('User updated successfully', 'success', 2500);
            setEditMode(false);
            onUserChanged?.();
        } catch (err) {
            const nextErrors = deriveEditFieldErrorsFromMessage(err.message);
            if (Object.keys(nextErrors).length > 0) {
                setEditErrors((prev) => ({ ...prev, ...nextErrors }));
            }
            notify(err.message || 'Failed to update user', 'error', 3000);
        } finally {
            setSaving(false);
        }
    }, [dispatch, user, editValues, onUserChanged]);

    const handleCancelEdit = useCallback(() => {
        setEditMode(false);
        setEditValues({});
        setEditErrors({});
    }, []);

    // ── Sites save ────────────────────────────────────────────────────────
    const handleSaveSites = useCallback(async () => {
        if (!userId) return;
        setSavingSites(true);
        try {
            await dispatch(updateUserSites(userId, selectedSiteIds));
            notify('Site assignments updated', 'success', 2500);
        } catch (err) {
            notify(err.message || 'Failed to update sites', 'error', 3000);
        } finally {
            setSavingSites(false);
        }
    }, [dispatch, userId, selectedSiteIds]);

    const handleAssignAllSites = useCallback(() => {
        setSelectedSiteIds(
            normalizedAllSites
                .map((site) => site.id)
                .filter((siteId, index, siteIds) => siteId != null && siteIds.indexOf(siteId) === index)
        );
    }, [normalizedAllSites]);

    const handleClose = useCallback(() => {
        if (editMode) {
            // eslint-disable-next-line no-restricted-globals
            if (!window.confirm('You have unsaved changes. Discard them?')) return;
        }
        onHide();
    }, [editMode, onHide]);

    const handleRefresh = useCallback(() => {
        if (!userId) return;
        // Re-trigger data loads for current tab
        if (activeTab === 'activities') {
            if (showSignInDetail) {
                setLoadingLoginAct(true);
                dispatch(fetchLoginActivities(userId))
                    .then((res) => { const d = res?.data || res || []; setLoginActivities(Array.isArray(d) ? d : []); })
                    .catch(() => setLoginActivities([]))
                    .finally(() => setLoadingLoginAct(false));
            } else {
                setLoadingAct(true);
                dispatch(fetchUserActivities(userId))
                    .then((res) => setActivities(Array.isArray(res?.data || res) ? (res?.data || res) : []))
                    .catch(() => setActivities([]))
                    .finally(() => setLoadingAct(false));
            }
        } else if (activeTab === 'sites') {
            setLoadingSites(true);
            Promise.all([dispatch(fetchAllSites()), dispatch(fetchUserSites(userId))])
                .finally(() => setLoadingSites(false));
        }
        // Trigger parent refresh if provided
        onUserChanged?.();
    }, [userId, activeTab, showSignInDetail, dispatch, onUserChanged]);

    if (!visible) return null;

    // ── Render: General Tab (View) ────────────────────────────────────────
    const renderGeneralView = () => (
        <div className="m365-detail-content">
            {/* Account info — 2-column grid like M365 */}
            <div className="m365-info-grid user-detail-info-grid">
                <div className="m365-info-cell user-detail-info-cell">
                    <span className="m365-info-cell__label">First name</span>
                    <span className="m365-info-cell__value">{user?.firstName || user?.FirstName || '—'}</span>
                </div>
                <div className="m365-info-cell user-detail-info-cell">
                    <span className="m365-info-cell__label">Last name</span>
                    <span className="m365-info-cell__value">{user?.lastName || user?.LastName || '—'}</span>
                </div>
                <div className="m365-info-cell user-detail-info-cell">
                    <span className="m365-info-cell__label">Username</span>
                    <span className="m365-info-cell__value">{user?.userName || user?.Username || '—'}</span>
                </div>
                <div className="m365-info-cell user-detail-info-cell">
                    <span className="m365-info-cell__label">Last sign-in</span>
                    <span className="m365-info-cell__value">
                        {user?.lastLogin || user?.LastLogin
                            ? new Date(user.lastLogin || user.LastLogin).toLocaleString()
                            : 'Never'}
                    </span>
                    <button className="m365-info-cell__link" onClick={handleOpenSignInDetail}>
                        View sign-in activity
                    </button>
                </div>

                <div className="m365-info-cell user-detail-info-cell">
                    <span className="m365-info-cell__label">Email</span>
                    <span className="m365-info-cell__value">{userEmail || '—'}</span>
                </div>
                <div className="m365-info-cell user-detail-info-cell">
                    <span className="m365-info-cell__label">Email confirmation</span>
                    <span className="m365-info-cell__value">
                        {userEmail ? (
                            isEmailConfirmed ? (
                                <span style={{ color: 'var(--m365-success)' }}>
                                    <i className="fa-light fa-circle-check" style={{ marginRight: 4 }} />Confirmed
                                </span>
                            ) : (
                                <span style={{ color: 'var(--m365-warning)' }}>
                                    <i className="fa-light fa-clock" style={{ marginRight: 4 }} />Pending confirmation
                                </span>
                            )
                        ) : 'No email set'}
                    </span>
                    {!isEmailConfirmed && !!userEmail && canManage && (
                        <button
                            className="m365-info-cell__link"
                            onClick={handleResendConfirmationEmail}
                            disabled={resendingConfirmation}
                            type="button"
                        >
                            {resendingConfirmation ? 'Sending confirmation...' : 'Resend confirmation email'}
                        </button>
                    )}
                </div>
                <div className="m365-info-cell user-detail-info-cell">
                    <span className="m365-info-cell__label">Phone</span>
                    <span className="m365-info-cell__value">{user?.phone || user?.Phone || '—'}</span>
                </div>

                <div className="m365-info-cell user-detail-info-cell">
                    <span className="m365-info-cell__label">Department</span>
                    <span className="m365-info-cell__value">{user?.departmentDisplay || '—'}</span>
                </div>
                <div className="m365-info-cell user-detail-info-cell">
                    <span className="m365-info-cell__label">Roles</span>
                    <span className="m365-info-cell__value">
                        <UserRoleBadgeList roles={user?.roleNames || user?.roles || []} maxVisible={3} />
                    </span>
                </div>

                <div className="m365-info-cell user-detail-info-cell">
                    <span className="m365-info-cell__label">Status</span>
                    <span className="m365-info-cell__value">
                        <UserStatusBadge isActive={isActive} />
                    </span>
                </div>
                <div className="m365-info-cell user-detail-info-cell">
                    <span className="m365-info-cell__label">Created</span>
                    <span className="m365-info-cell__value">
                        {user?.createdDate || user?.CreatedDate
                            ? new Date(user.createdDate || user.CreatedDate).toLocaleDateString()
                            : '—'}
                    </span>
                </div>
            </div>

            {/* Settings section */}
            <div className="m365-flat-section user-detail-settings-section">
                <h3 className="m365-flat-section__title">Settings</h3>
                <div className="m365-info-grid user-detail-info-grid">
                    <div className="m365-info-cell user-detail-info-cell">
                        <span className="m365-info-cell__label">
                            Bypass GPS
                            <span className="m365-info-tooltip" data-tip="Skip mobile check on location">
                                <i className="fa-light fa-circle-info" />
                            </span>
                        </span>
                        <span className="m365-info-cell__value">
                            {(user?.bypassGps || user?.BypassGps) ? (
                                <span style={{ color: 'var(--m365-warning)' }}>
                                    <i className="fa-light fa-check" style={{ marginRight: 4 }} />Enabled
                                </span>
                            ) : (
                                <span style={{ color: 'var(--m365-text-tertiary)' }}>Disabled</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Render: General Tab (Edit) ────────────────────────────────────────
    const renderGeneralEdit = () => (
        <div className="m365-edit-form">
            {/* Account */}
            <div className="m365-flat-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                <h3 className="m365-flat-section__title">Account</h3>
                <div className="m365-edit-fields">
                    <div className="m365-field">
                        <label className="m365-field__label">First name</label>
                        <input className="m365-input" value={editValues.firstName} onChange={(e) => handleEditChange('firstName', e.target.value)} autoComplete="off" placeholder="First name" />
                    </div>
                    <div className="m365-field">
                        <label className="m365-field__label">Last name</label>
                        <input className="m365-input" value={editValues.lastName} onChange={(e) => handleEditChange('lastName', e.target.value)} autoComplete="off" placeholder="Last name" />
                    </div>
                    <div className="m365-field">
                        <label className="m365-field__label m365-field__label--required">Username</label>
                        <input
                            className={`m365-input${editErrors.userName ? ' m365-input--error' : ''}`}
                            value={editValues.userName}
                            onChange={(e) => handleEditChange('userName', e.target.value)}
                            autoComplete="off"
                        />
                        {editErrors.userName && (
                            <span className="m365-field__error">{editErrors.userName}</span>
                        )}
                    </div>
                    <div className="m365-field">
                        <label className="m365-field__label m365-field__label--required">Email</label>
                        <input
                            className={`m365-input${editErrors.email ? ' m365-input--error' : ''}`}
                            type="email"
                            value={editValues.email}
                            onChange={(e) => handleEditChange('email', e.target.value)}
                            autoComplete="off"
                        />
                        {editErrors.email && (
                            <span className="m365-field__error">{editErrors.email}</span>
                        )}
                    </div>
                    <div className="m365-field">
                        <label className="m365-field__label">Phone</label>
                        <input
                            className={`m365-input${editErrors.phone ? ' m365-input--error' : ''}`}
                            type="tel"
                            value={editValues.phone}
                            onChange={(e) => handleEditChange('phone', e.target.value)}
                            placeholder="e.g. +254712345678"
                        />
                        {editErrors.phone && (
                            <span className="m365-field__error">{editErrors.phone}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Role & Access */}
            <div className="m365-flat-section">
                <h3 className="m365-flat-section__title">Role & Access</h3>
                <div className="m365-edit-fields">
                    <div className="m365-field">
                        <label className="m365-field__label">Role</label>
                        <select
                            className={`m365-select${editErrors.roleName ? ' m365-select--error' : ''}`}
                            style={{ width: '100%' }}
                            value={editValues.roleName}
                            onChange={(e) => handleEditChange('roleName', e.target.value)}
                        >
                            <option value="">— Select role —</option>
                            {roleOptions
                                .filter((r) => r.value !== 'all' && r.value !== 'unassigned')
                                .map((r) => (
                                    <option key={r.value || r.id} value={r.text || r.label || r.name}>{r.text || r.label || r.name}</option>
                                ))}
                        </select>
                        {editErrors.roleName && (
                            <span className="m365-field__error">{editErrors.roleName}</span>
                        )}
                    </div>
                    <div className="m365-field">
                        <label className="m365-field__label">Department</label>
                        <select className="m365-select" style={{ width: '100%' }} value={editValues.departmentId} onChange={(e) => handleEditChange('departmentId', e.target.value)}>
                            <option value="">— No department —</option>
                            {departments.map((d) => (
                                <option key={d.departmentId || d.id} value={String(d.departmentId || d.id)}>{d.name || d.Name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Settings */}
            <div className="m365-flat-section user-detail-settings-section">
                <h3 className="m365-flat-section__title">Settings</h3>
                <div className="m365-edit-fields">
                    <label className="m365-checkbox">
                        <input type="checkbox" checked={editValues.bypassGps} onChange={(e) => handleEditChange('bypassGps', e.target.checked)} />
                        <span className="m365-checkbox__label">Bypass GPS requirement</span>
                        <span className="m365-info-tooltip" data-tip="Skip mobile check on location">
                            <i className="fa-light fa-circle-info" />
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );

    // ── Render: General Tab ───────────────────────────────────────────────
    const renderGeneralTab = () => {
        if (!user) {
            return (
                <div className="m365-empty">
                    <i className="fa-light fa-circle-question m365-empty__icon" />
                    <p className="m365-empty__text">User not found.</p>
                </div>
            );
        }
        return editMode ? renderGeneralEdit() : renderGeneralView();
    };

    // ── Activity helpers ──────────────────────────────────────────────────
    const getActivityIcon = (act) => {
        const action = (act.action || act.Action || '').toLowerCase();
        const controller = (act.controller || act.Controller || '').toLowerCase();
        if (action.includes('login') || action.includes('sign') || action.includes('auth') || controller.includes('auth'))
            return { icon: 'fa-right-to-bracket', color: 'var(--m365-success)', bg: 'var(--m365-success-tint, #dff6dd)' };
        if (action.includes('logout') || action.includes('signout'))
            return { icon: 'fa-right-from-bracket', color: 'var(--m365-warning)', bg: 'var(--m365-warning-tint, #fff4ce)' };
        if (action.includes('create') || action.includes('post') || action.includes('add'))
            return { icon: 'fa-plus', color: 'var(--m365-primary)', bg: 'var(--m365-primary-tint)' };
        if (action.includes('update') || action.includes('put') || action.includes('edit'))
            return { icon: 'fa-pen', color: '#8764b8', bg: '#f3f0f9' };
        if (action.includes('delete') || action.includes('remove'))
            return { icon: 'fa-trash', color: 'var(--m365-error)', bg: 'var(--m365-error-tint, #fde7e9)' };
        if (controller.includes('vehicle'))
            return { icon: 'fa-truck', color: 'var(--m365-primary)', bg: 'var(--m365-primary-tint)' };
        if (controller.includes('fuel') || controller.includes('tank'))
            return { icon: 'fa-gas-pump', color: '#d83b01', bg: '#fed9cc' };
        if (controller.includes('site'))
            return { icon: 'fa-building', color: '#0078d4', bg: '#deecf9' };
        if (controller.includes('user'))
            return { icon: 'fa-user', color: '#0078d4', bg: '#deecf9' };
        return { icon: 'fa-circle-dot', color: 'var(--m365-primary)', bg: 'var(--m365-primary-tint)' };
    };

    const formatActionLabel = (act) => {
        const action = act.actionName || act.ActionName || act.action || act.Action || 'Activity';
        return action.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
    };

    const formatRelativeTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay === 1) return 'Yesterday';
        if (diffDay < 7) return `${diffDay}d ago`;
        return date.toLocaleDateString();
    };

    const getDayLabel = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    };

    // ── Render: Activities Tab ────────────────────────────────────────────
    const handleOpenSignInDetail = () => {
        setShowSignInDetail(true);
        setSignInPage(1);
        setLoadingLoginAct(true);
        dispatch(fetchLoginActivities(userId))
            .then((res) => {
                const d = res?.data || res || [];
                setLoginActivities(Array.isArray(d) ? d : []);
            })
            .catch(() => setLoginActivities([]))
            .finally(() => setLoadingLoginAct(false));
    };

    const renderSignInDetail = () => {
        const orderedSignIns = [...loginActivities].sort((a, b) => {
            const at = new Date(a.timestamp || a.Timestamp || 0).getTime();
            const bt = new Date(b.timestamp || b.Timestamp || 0).getTime();
            return bt - at;
        });
        const successCount = orderedSignIns.filter((a) => a.isSuccessful || a.IsSuccessful).length;
        const failureCount = orderedSignIns.filter((a) => !(a.isSuccessful || a.IsSuccessful)).length;
        const totalSignInPages = Math.max(1, Math.ceil(orderedSignIns.length / SIGNIN_PAGE_SIZE));
        const safeSignInPage = Math.min(signInPage, totalSignInPages);
        const pagedSignIns = orderedSignIns.slice(
            (safeSignInPage - 1) * SIGNIN_PAGE_SIZE,
            safeSignInPage * SIGNIN_PAGE_SIZE
        );

        return (
            <div className="m365-signin-detail">
                <button
                    className="m365-signin-detail__back"
                    onClick={() => setShowSignInDetail(false)}
                >
                    <i className="fa-light fa-arrow-left" />
                </button>

                <h2 className="m365-signin-detail__title">Sign-in activity</h2>
                <p className="m365-signin-detail__desc">
                    These are the times user signed in with their username and password the past 7 days.
                </p>

                <div className="m365-signin-detail__stats">
                    <span className="m365-signin-detail__stat m365-signin-detail__stat--success">
                        <i className="fa-light fa-circle-check" /> {successCount} successful
                    </span>
                    <span className="m365-signin-detail__stat m365-signin-detail__stat--failure">
                        <i className="fa-light fa-circle-xmark" /> {failureCount} failed
                    </span>
                </div>

                {loadingLoginAct ? (
                    <div className="m365-empty">
                        <i className="fa-light fa-spinner fa-spin m365-empty__icon" />
                        <p className="m365-empty__text">Loading sign-in activities...</p>
                    </div>
                ) : orderedSignIns.length === 0 ? (
                    <div className="m365-empty">
                        <i className="fa-light fa-right-to-bracket m365-empty__icon" />
                        <p className="m365-empty__text">No sign-in activities in the last 7 days</p>
                    </div>
                ) : (
                    <div>
                        <div className="m365-signin-table">
                            <div className="m365-signin-table__header">
                                <span className="m365-signin-table__col m365-signin-table__col--date">Date</span>
                                <span className="m365-signin-table__col m365-signin-table__col--status">Status</span>
                                <span className="m365-signin-table__col m365-signin-table__col--ip">IP Address</span>
                            </div>
                            {pagedSignIns.map((la, idx) => {
                                const ts = la.timestamp || la.Timestamp;
                                const success = la.isSuccessful ?? la.IsSuccessful ?? true;
                                const ip = la.ipAddress || la.IpAddress || '—';
                                return (
                                    <div key={la.id || la.Id || idx} className="m365-signin-table__row">
                                        <span className="m365-signin-table__col m365-signin-table__col--date">
                                            {ts ? new Date(ts).toLocaleString(undefined, {
                                                month: 'long', day: 'numeric', year: 'numeric',
                                                hour: 'numeric', minute: '2-digit', hour12: true
                                            }) : '—'}
                                        </span>
                                        <span className={`m365-signin-table__col m365-signin-table__col--status m365-signin-status--${success ? 'success' : 'failure'}`}>
                                            {success ? 'Success' : 'Failure'}
                                        </span>
                                        <span className="m365-signin-table__col m365-signin-table__col--ip">
                                            {ip}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {totalSignInPages > 1 && (
                            <div className="m365-tab-pager">
                                <button
                                    className="m365-btn m365-btn--ghost"
                                    onClick={() => setSignInPage((prev) => Math.max(1, prev - 1))}
                                    disabled={safeSignInPage <= 1}
                                >
                                    Previous
                                </button>
                                <span className="m365-tab-pager__info">Page {safeSignInPage} of {totalSignInPages}</span>
                                <button
                                    className="m365-btn m365-btn--ghost"
                                    onClick={() => setSignInPage((prev) => Math.min(totalSignInPages, prev + 1))}
                                    disabled={safeSignInPage >= totalSignInPages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderActivitiesTab = () => {
        if (loadingAct) {
            return (
                <div className="m365-empty">
                    <i className="fa-light fa-spinner fa-spin m365-empty__icon" />
                    <p className="m365-empty__text">Loading activities...</p>
                </div>
            );
        }
        if (!activities.length) {
            return (
                <div className="m365-empty">
                    <i className="fa-light fa-clock-rotate-left m365-empty__icon" />
                    <p className="m365-empty__text">No recent activities</p>
                </div>
            );
        }

        // Sign-in summary (last 7 days) from login activity feed
        const orderedSignIns = [...loginActivities].sort((a, b) => {
            const at = new Date(a.timestamp || a.Timestamp || 0).getTime();
            const bt = new Date(b.timestamp || b.Timestamp || 0).getTime();
            return bt - at;
        });
        const signIns = orderedSignIns;
        const lastSignIn = signIns.length > 0
            ? new Date(signIns[0].timestamp || signIns[0].Timestamp)
            : null;

        const orderedActivities = [...activities].sort((a, b) => {
            const at = new Date(a.timestamp || a.Timestamp || a.createdDate || a.CreatedDate || 0).getTime();
            const bt = new Date(b.timestamp || b.Timestamp || b.createdDate || b.CreatedDate || 0).getTime();
            return bt - at;
        });
        const totalActivityPages = Math.max(1, Math.ceil(orderedActivities.length / ACTIVITIES_PAGE_SIZE));
        const safeActivitiesPage = Math.min(activitiesPage, totalActivityPages);
        const pagedActivities = orderedActivities.slice(
            (safeActivitiesPage - 1) * ACTIVITIES_PAGE_SIZE,
            safeActivitiesPage * ACTIVITIES_PAGE_SIZE
        );

        // Group activities by day
        const grouped = {};
        pagedActivities.forEach((act) => {
            const ts = act.timestamp || act.Timestamp || act.createdDate || act.CreatedDate;
            const label = getDayLabel(ts);
            if (!grouped[label]) grouped[label] = [];
            grouped[label].push(act);
        });

        return (
            <div className="m365-activities-tab">
                {/* Sign-in summary card — clickable */}
                <div className="m365-signin-summary m365-signin-summary--clickable" onClick={handleOpenSignInDetail} role="button" tabIndex={0}>
                    <div className="m365-signin-summary__icon">
                        <i className="fa-light fa-right-to-bracket" />
                    </div>
                    <div className="m365-signin-summary__content">
                        <span className="m365-signin-summary__title">Sign-in activity (last 7 days)</span>
                        <span className="m365-signin-summary__value">
                            {loadingLoginAct ? 'Loading...' : `${signIns.length} sign-in${signIns.length !== 1 ? 's' : ''}`}
                            {lastSignIn && (
                                <span className="m365-signin-summary__last">
                                    &nbsp;&middot; Last: {lastSignIn.toLocaleString()}
                                </span>
                            )}
                        </span>
                    </div>
                    <i className="fa-light fa-chevron-right m365-signin-summary__arrow" />
                </div>

                {/* Activity timeline grouped by day */}
                {Object.entries(grouped).map(([dayLabel, dayActivities]) => (
                    <div key={dayLabel} className="m365-activity-day">
                        <div className="m365-activity-day__label">{dayLabel}</div>
                        <div className="m365-activity-list">
                            {dayActivities.map((act, idx) => {
                                const iconStyle = getActivityIcon(act);
                                const ts = act.timestamp || act.Timestamp || act.createdDate || act.CreatedDate;
                                const controller = act.controller || act.Controller || '';
                                const ip = act.ipAddress || act.IpAddress || '';
                                return (
                                    <div key={act.id || act.Id || idx} className="m365-activity-item">
                                        <div
                                            className="m365-activity-item__icon"
                                            style={{ background: iconStyle.bg, color: iconStyle.color }}
                                        >
                                            <i className={`fa-light ${iconStyle.icon}`} />
                                        </div>
                                        <div className="m365-activity-item__content">
                                            <span className="m365-activity-item__action">
                                                {formatActionLabel(act)}
                                            </span>
                                            <div className="m365-activity-item__meta">
                                                {controller && (
                                                    <span className="m365-activity-item__controller">
                                                        <i className="fa-light fa-cube" /> {controller}
                                                    </span>
                                                )}
                                                {ip && (
                                                    <span className="m365-activity-item__ip">
                                                        <i className="fa-light fa-globe" /> {ip}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="m365-activity-item__time">
                                            {formatRelativeTime(ts)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {totalActivityPages > 1 && (
                    <div className="m365-tab-pager">
                        <button
                            className="m365-btn m365-btn--ghost"
                            onClick={() => setActivitiesPage((prev) => Math.max(1, prev - 1))}
                            disabled={safeActivitiesPage <= 1}
                        >
                            Previous
                        </button>
                        <span className="m365-tab-pager__info">Page {safeActivitiesPage} of {totalActivityPages}</span>
                        <button
                            className="m365-btn m365-btn--ghost"
                            onClick={() => setActivitiesPage((prev) => Math.min(totalActivityPages, prev + 1))}
                            disabled={safeActivitiesPage >= totalActivityPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // ── Render: Sites Tab ─────────────────────────────────────────────────
    const renderSitesTab = () => {
        if (loadingSites) {
            return (
                <div className="m365-empty">
                    <i className="fa-light fa-spinner fa-spin m365-empty__icon" />
                    <p className="m365-empty__text">Loading sites...</p>
                </div>
            );
        }

        const normalizedSites = normalizedAllSites;

        const assigned = normalizedSites.filter((s) => selectedSiteIds.includes(s.id));
        const unassigned = normalizedSites.filter((s) => !selectedSiteIds.includes(s.id));

        return (
            <div className="m365-sites-tab">
                {/* Summary */}
                <div className="m365-sites-tab__summary">
                    <div className="tw-flex tw-items-center tw-gap-2">
                        <i className="fa-light fa-building-circle-check" />
                        <span>{assigned.length} of {normalizedSites.length} sites assigned</span>
                    </div>
                    {canManage && unassigned.length > 0 && (
                        <button
                            type="button"
                            className="m365-btn m365-btn--ghost"
                            onClick={handleAssignAllSites}
                        >
                            <i className="fa-light fa-buildings" />
                            Assign all sites
                        </button>
                    )}
                </div>

                {/* Assigned */}
                <div className="m365-sites-section">
                    <h4 className="m365-sites-section__title">
                        <i className="fa-light fa-circle-check" style={{ color: 'var(--m365-success)' }} />
                        Assigned
                        <span className="m365-sites-section__count">{assigned.length}</span>
                    </h4>
                    {assigned.length === 0 ? (
                        <div className="m365-sites-section__empty">
                            <i className="fa-light fa-circle-info" />
                            <span>No sites assigned to this user</span>
                        </div>
                    ) : (
                        <div className="m365-sites-section__list">
                            {assigned.map((site) => {
                                const isSiteAdmin = site.siteAdministratorId === userId;
                                return (
                                    <div key={site.id} className="m365-site-row">
                                        <div className="m365-site-row__icon-wrap">
                                            <i className="fa-light fa-location-dot" />
                                        </div>
                                        <div className="m365-site-row__info">
                                            <span className="m365-site-row__name">
                                                {site.name}
                                                {isSiteAdmin && (
                                                    <span className="m365-site-row__admin-badge">
                                                        <i className="fa-light fa-shield-check" /> Site Admin
                                                    </span>
                                                )}
                                            </span>
                                            {site.location && <span className="m365-site-row__location">{site.location}</span>}
                                        </div>
                                        {canManage && (
                                            <button
                                                className="m365-site-row__action m365-site-row__action--remove"
                                                title="Remove from user"
                                                onClick={() => setSelectedSiteIds((ids) => ids.filter((id) => id !== site.id))}
                                            >
                                                <i className="fa-light fa-circle-minus" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Unassigned */}
                {canManage && unassigned.length > 0 && (
                    <div className="m365-sites-section">
                        <h4 className="m365-sites-section__title">
                            <i className="fa-light fa-circle-plus" style={{ color: 'var(--m365-primary)' }} />
                            Available
                            <span className="m365-sites-section__count">{unassigned.length}</span>
                        </h4>
                        <div className="m365-sites-section__list">
                            {unassigned.map((site) => (
                                <div key={site.id} className="m365-site-row m365-site-row--available">
                                    <div className="m365-site-row__icon-wrap m365-site-row__icon-wrap--muted">
                                        <i className="fa-light fa-location-dot" />
                                    </div>
                                    <div className="m365-site-row__info">
                                        <span className="m365-site-row__name">{site.name}</span>
                                        {site.location && <span className="m365-site-row__location">{site.location}</span>}
                                    </div>
                                    <button
                                        className="m365-site-row__action m365-site-row__action--add"
                                        title="Add to user"
                                        onClick={() => setSelectedSiteIds((ids) => [...ids, site.id])}
                                    >
                                        <i className="fa-light fa-circle-plus" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ── Main render ───────────────────────────────────────────────────────
    return (
        <>
            <SlidePanel
                open={visible}
                onClose={handleClose}
                title={displayName}
                width={1000}
                headerActions={
                    <button
                        className="fms-slide-panel__close"
                        onClick={handleRefresh}
                        aria-label="Refresh"
                        title="Refresh"
                    >
                        <i className="fa-light fa-arrows-rotate" />
                    </button>
                }
            >
                <div className="udp-panel-layout" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                    {/* Profile header — M365 layout: avatar left, info right */}
                    <div className="m365-detail-profile">
                        <UserAvatar user={user} size={64} />
                        <div className="m365-detail-profile__body">
                            <span className="m365-detail-profile__eyebrow">User overview</span>
                            <div className="m365-detail-profile__meta">
                                <span className="m365-detail-profile__email">{userEmail}</span>
                                <UserStatusBadge isActive={isActive} />
                            </div>
                            <p className="m365-detail-profile__description">
                                Review identity, access, recent activity, and site assignments in one place.
                            </p>
                            {/* Inline action links */}
                            {canManage && (
                                <div className="m365-detail-profile__actions">
                                    {!editMode && (
                                        <button className="m365-action-link" onClick={startEdit}>
                                            <i className="fa-light fa-pen-to-square" />
                                            <span>Edit</span>
                                        </button>
                                    )}
                                    <button className="m365-action-link" onClick={() => setShowPwdPopup(true)}>
                                        <i className="fa-light fa-key" />
                                        <span>Reset password</span>
                                    </button>
                                    <button className="m365-action-link" onClick={handleToggleActive}>
                                        <i className={`fa-light ${isActive ? 'fa-ban' : 'fa-circle-check'}`} />
                                        <span>{isActive ? 'Block sign-in' : 'Unblock sign-in'}</span>
                                    </button>
                                    <button className="m365-action-link m365-action-link--danger" onClick={handleDelete}>
                                        <i className="fa-light fa-user-xmark" />
                                        <span>Delete user</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs — hidden when sign-in detail is shown */}
                    {!showSignInDetail && (
                        <div className="m365-detail-tabs">
                            {PANEL_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    className={`m365-detail-tab${activeTab === tab.key ? ' m365-detail-tab--active' : ''}`}
                                    onClick={() => setActiveTab(tab.key)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Scrollable body */}
                    <div className="m365-panel-body">
                        {showSignInDetail ? renderSignInDetail() : (
                            <>
                                {activeTab === 'general' && renderGeneralTab()}
                                {activeTab === 'activities' && renderActivitiesTab()}
                                {activeTab === 'sites' && renderSitesTab()}
                            </>
                        )}
                    </div>

                    {/* Footer — edit mode or sites tab (hidden during sign-in detail) */}
                    {!showSignInDetail && (editMode || activeTab === 'sites') && (
                        <div className="m365-panel-footer">
                            {editMode ? (
                                <>
                                    <button className="m365-btn m365-btn--ghost" onClick={handleCancelEdit} disabled={saving}>
                                        Cancel
                                    </button>
                                    <button className="m365-btn m365-btn--primary" onClick={handleSaveEdit} disabled={saving}>
                                        {saving ? <><i className="fa-light fa-spinner fa-spin" /> Saving...</> : 'Save changes'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="m365-btn m365-btn--ghost" onClick={handleClose}>
                                        Cancel
                                    </button>
                                    <button className="m365-btn m365-btn--primary" onClick={handleSaveSites} disabled={savingSites}>
                                        {savingSites ? <><i className="fa-light fa-spinner fa-spin" /> Saving...</> : <><i className="fa-light fa-floppy-disk" /> Save site assignments</>}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </SlidePanel>

            {/* Change Password */}
            {showPasswordPopup && (
                <ChangePasswordPopup
                    visible={showPasswordPopup}
                    onHide={() => setShowPwdPopup(false)}
                    userId={userId}
                />
            )}
        </>
    );
};

export default UserDetailPanel;
