/**
 * File: ChangePasswordPopup.js
 * Purpose: M365-styled popup for changing a user's password
 * Dependencies: React, DevExtreme Popup, Redux changeUserPassword action
 * Last Modified: 2026-02-25
 *
 * Key Functions:
 * - ChangePasswordPopup(): 460px popup, new/confirm fields, client validation, dispatches action
 */
import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Popup, ToolbarItem } from 'devextreme-react/popup';
import notify from 'devextreme/ui/notify';
import { updateUser } from '../../../redux/actions/userActions';

// ─────────────────────────────────────────────────────────────────────────────

const ChangePasswordPopup = ({ visible, onHide, userId, userName, user }) => {
    const dispatch = useDispatch();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // ── Validation ────────────────────────────────────────────────────────
    const validate = useCallback(() => {
        const errs = {};
        if (!newPassword.trim()) errs.newPassword = 'New password is required.';
        else if (newPassword.length < 6) errs.newPassword = 'Password must be at least 6 characters.';
        if (!confirmPassword.trim()) errs.confirmPassword = 'Please confirm your password.';
        else if (newPassword !== confirmPassword)
            errs.confirmPassword = 'Passwords do not match.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }, [newPassword, confirmPassword]);

    const buildUpdatePayload = useCallback(() => {
        if (!user) {
            return null;
        }

        return {
            firstName: user.firstName || user.FirstName || '',
            lastName: user.lastName || user.LastName || '',
            userName: user.userName || user.Username || '',
            email: user.email || user.Email || '',
            phone: user.phone || user.Phone || '',
            roleName: user.roleName || user.RoleName || (user.roleNames?.[0] ?? ''),
            departmentId: String(user.departmentId ?? user.DepartmentId ?? ''),
            bypassGps: user.bypassGps ?? user.BypassGps ?? false,
            password: newPassword,
        };
    }, [newPassword, user]);

    // ── Submit ────────────────────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        if (!validate()) return;

        const payload = buildUpdatePayload();
        if (!payload) {
            notify('Unable to load the selected user details.', 'error', 3000);
            return;
        }

        setSaving(true);
        try {
            await dispatch(updateUser(userId, payload));
            notify('Password changed successfully', 'success', 2500);
            handleReset();
            onHide();
        } catch (err) {
            notify(err.message || 'Failed to change password', 'error', 3000);
        } finally {
            setSaving(false);
        }
    }, [buildUpdatePayload, dispatch, onHide, userId, validate]);

    const handleReset = () => {
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        setShowNew(false);
        setShowConfirm(false);
    };

    const handleHide = () => {
        handleReset();
        onHide();
    };

    // ── Toolbar buttons ───────────────────────────────────────────────────
    const saveBtn = {
        text: saving ? 'Saving…' : 'Change password',
        type: 'default',
        stylingMode: 'contained',
        disabled: saving,
        onClick: handleSave,
    };
    const cancelBtn = {
        text: 'Cancel',
        type: 'normal',
        stylingMode: 'outlined',
        disabled: saving,
        onClick: handleHide,
    };

    return (
        <Popup
            visible={visible}
            onHiding={handleHide}
            title={`Change password — ${userName || 'User'}`}
            width={460}
            height="auto"
            dragEnabled={false}
            closeOnOutsideClick={!saving}
            wrapperAttr={{ class: 'm365-popup-wrap' }}
        >
            <ToolbarItem widget="dxButton" toolbar="bottom" location="after" options={saveBtn} />
            <ToolbarItem widget="dxButton" toolbar="bottom" location="after" options={cancelBtn} />

            <div className="m365-popup-body" style={{ padding: '24px 24px 8px' }}>

                {/* New password */}
                <div className="m365-field">
                    <label className="m365-field__label m365-field__label--required">
                        New password
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showNew ? 'text' : 'password'}
                            className={`m365-input${errors.newPassword ? ' m365-input--error' : ''}`}
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                            }}
                            placeholder="Enter new password"
                            autoComplete="new-password"
                            style={{ paddingRight: 36 }}
                        />
                        <button
                            type="button"
                            className="m365-icon-btn"
                            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}
                            onClick={() => setShowNew((v) => !v)}
                            tabIndex={-1}
                            aria-label={showNew ? 'Hide password' : 'Show password'}
                        >
                            <i className={`fa-light ${showNew ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                    </div>
                    {errors.newPassword && (
                        <span className="m365-field__error">{errors.newPassword}</span>
                    )}
                </div>

                {/* Confirm password */}
                <div className="m365-field" style={{ marginTop: 16 }}>
                    <label className="m365-field__label m365-field__label--required">
                        Confirm new password
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            className={`m365-input${errors.confirmPassword ? ' m365-input--error' : ''}`}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                            }}
                            placeholder="Re-enter new password"
                            autoComplete="new-password"
                            style={{ paddingRight: 36 }}
                        />
                        <button
                            type="button"
                            className="m365-icon-btn"
                            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}
                            onClick={() => setShowConfirm((v) => !v)}
                            tabIndex={-1}
                            aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        >
                            <i className={`fa-light ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <span className="m365-field__error">{errors.confirmPassword}</span>
                    )}
                </div>

                <p
                    className="m365-field__hint"
                    style={{ marginTop: 12, color: 'var(--m365-text-secondary)', fontSize: 12 }}
                >
                    <i className="fa-light fa-circle-info" style={{ marginRight: 6 }} />
                    Minimum 6 characters. The user will be prompted to log in again.
                </p>
            </div>
        </Popup>
    );
};

export default ChangePasswordPopup;
