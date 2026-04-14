/**
 * File: CreateUserPanel.js
 * Purpose: M365 slide-in side panel for creating a new user account
 * Dependencies: React, Redux, userActions, m365 panel styles
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - CreateUserPanel(props): Slide-in panel with flat M365 form
 *   Fields: username, email, role, department, onboarding options
 */
import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import notify from 'devextreme/ui/notify';
import { createUser } from '../../../redux/actions/userActions';
import SlidePanel from '../../../components/ui/SlidePanel';

const EMPTY_FORM = {
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    roleName: '',
    departmentId: null,
    sendOnboardingEmail: true,
    requireEmailConfirmation: true,
    requirePasswordChangeOnFirstLogin: true,
};

const CreateUserPanel = ({ visible, onHide, onSuccess, roleOptions = [], departments = [] }) => {
    const dispatch = useDispatch();
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = useCallback((field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
    }, [errors]);

    const validate = () => {
        const e = {};
        if (!form.userName.trim()) e.userName = 'Username is required';
        if ((form.sendOnboardingEmail || form.requireEmailConfirmation) && !form.email.trim()) {
            e.email = 'Email is required when onboarding email or email confirmation is enabled';
        }
        if (!form.roleName) e.roleName = 'Role is required';
        if (form.requireEmailConfirmation && !form.sendOnboardingEmail) {
            e.requireEmailConfirmation = 'Email confirmation requires onboarding email to be enabled';
        }
        return e;
    };

    const handleCreate = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        try {
            setLoading(true);
            const response = await dispatch(createUser({
                FirstName: form.firstName || null,
                LastName: form.lastName || null,
                Email: form.email.trim() || null,
                Username: form.userName,
                RoleName: form.roleName,
                DepartmentId: form.departmentId,
                SendOnboardingEmail: form.sendOnboardingEmail,
                RequireEmailConfirmation: form.requireEmailConfirmation,
                RequirePasswordChangeOnFirstLogin: form.requirePasswordChangeOnFirstLogin,
            }));
            const resultData = response?.data || response?.Data || null;
            const temporaryPassword = resultData?.temporaryPassword || resultData?.TemporaryPassword || null;
            const onboardingEmailSent = resultData?.onboardingEmailSent ?? resultData?.OnboardingEmailSent ?? false;

            if (temporaryPassword && !onboardingEmailSent) {
                window.alert(`User created successfully. Share this temporary password with the user: ${temporaryPassword}`);
                notify('User created successfully. Temporary password generated for manual sharing.', 'success', 4000);
            } else {
                notify('User created successfully. Onboarding instructions have been applied.', 'success', 4000);
            }
            setForm(EMPTY_FORM);
            setErrors({});
            onSuccess?.();
            onHide?.();
        } catch (error) {
            notify(error.message || 'Failed to create user', 'error', 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setForm(EMPTY_FORM);
            setErrors({});
            onHide?.();
        }
    };

    const handleCheckboxChange = useCallback((field, checked) => {
        setForm((prev) => {
            if (field === 'sendOnboardingEmail' && !checked) {
                return {
                    ...prev,
                    sendOnboardingEmail: false,
                    requireEmailConfirmation: false,
                };
            }

            return {
                ...prev,
                [field]: checked,
            };
        });

        if (errors[field] || (field === 'sendOnboardingEmail' && errors.requireEmailConfirmation)) {
            setErrors((prev) => ({
                ...prev,
                [field]: null,
                requireEmailConfirmation: null,
            }));
        }
    }, [errors]);

    if (!visible) return null;

    return (
        <SlidePanel open={visible} onClose={handleClose} title="Add a user" width={420}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Scrollable form body */}
                <div className="m365-panel-body">
                    <div className="m365-info-banner">
                        <i className="fa-light fa-circle-info m365-info-banner__icon" />
                        <span className="m365-info-banner__text">
                            A temporary password is always generated automatically. You can choose whether to email it, require email confirmation, and force a password change on first login.
                        </span>
                    </div>

                    {/* First name */}
                    <div className="m365-field">
                        <label className="m365-field__label">First name</label>
                        <input
                            className="m365-input"
                            value={form.firstName}
                            onChange={(e) => handleChange('firstName', e.target.value)}
                            placeholder="First name"
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    {/* Last name */}
                    <div className="m365-field">
                        <label className="m365-field__label">Last name</label>
                        <input
                            className="m365-input"
                            value={form.lastName}
                            onChange={(e) => handleChange('lastName', e.target.value)}
                            placeholder="Last name"
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    {/* Username */}
                    <div className="m365-field">
                        <label className="m365-field__label m365-field__label--required">Username</label>
                        <input
                            className={`m365-input${errors.userName ? ' m365-input--error' : ''}`}
                            value={form.userName}
                            onChange={(e) => handleChange('userName', e.target.value)}
                            placeholder="Enter username"
                            autoComplete="off"
                            disabled={loading}
                        />
                        {errors.userName && <span className="m365-field__error">{errors.userName}</span>}
                    </div>

                    {/* Email */}
                    <div className="m365-field">
                        <label className={`m365-field__label${form.sendOnboardingEmail || form.requireEmailConfirmation ? ' m365-field__label--required' : ''}`}>Email</label>
                        <input
                            className={`m365-input${errors.email ? ' m365-input--error' : ''}`}
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="user@example.com"
                            autoComplete="off"
                            disabled={loading}
                        />
                        {errors.email && <span className="m365-field__error">{errors.email}</span>}
                    </div>

                    <div className="m365-field">
                        <label className="m365-field__label">Onboarding Options</label>
                        <div className="tw-flex tw-flex-col tw-gap-3">
                            <label className="tw-inline-flex tw-items-start tw-gap-2 tw-text-[13px] tw-text-[#201f1e]">
                                <input
                                    type="checkbox"
                                    checked={form.sendOnboardingEmail}
                                    onChange={(e) => handleCheckboxChange('sendOnboardingEmail', e.target.checked)}
                                    disabled={loading}
                                />
                                <span>Send onboarding email with temporary password</span>
                            </label>
                            <label className="tw-inline-flex tw-items-start tw-gap-2 tw-text-[13px] tw-text-[#201f1e]">
                                <input
                                    type="checkbox"
                                    checked={form.requireEmailConfirmation}
                                    onChange={(e) => handleCheckboxChange('requireEmailConfirmation', e.target.checked)}
                                    disabled={loading || !form.sendOnboardingEmail}
                                />
                                <span>Require email confirmation before login</span>
                            </label>
                            <label className="tw-inline-flex tw-items-start tw-gap-2 tw-text-[13px] tw-text-[#201f1e]">
                                <input
                                    type="checkbox"
                                    checked={form.requirePasswordChangeOnFirstLogin}
                                    onChange={(e) => handleCheckboxChange('requirePasswordChangeOnFirstLogin', e.target.checked)}
                                    disabled={loading}
                                />
                                <span>Force password change on first login</span>
                            </label>
                        </div>
                        {errors.requireEmailConfirmation && <span className="m365-field__error">{errors.requireEmailConfirmation}</span>}
                        {!form.sendOnboardingEmail && (
                            <span className="m365-field__hint">The temporary password will be shown after creation so you can share it manually.</span>
                        )}
                    </div>

                    {/* Role */}
                    <div className="m365-field">
                        <label className="m365-field__label m365-field__label--required">Role</label>
                        <select
                            className={`m365-select${errors.roleName ? ' m365-select--error' : ''}`}
                            style={{ width: '100%' }}
                            value={form.roleName}
                            onChange={(e) => handleChange('roleName', e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Select a role...</option>
                            {roleOptions
                                .filter((r) => r.value !== 'all' && r.value !== 'unassigned')
                                .map((r) => (
                                    <option key={r.value} value={r.text}>{r.text}</option>
                                ))}
                        </select>
                        {errors.roleName && <span className="m365-field__error">{errors.roleName}</span>}
                    </div>

                    {/* Department */}
                    <div className="m365-field">
                        <label className="m365-field__label">Department</label>
                        <select
                            className="m365-select"
                            style={{ width: '100%' }}
                            value={form.departmentId ?? ''}
                            onChange={(e) => handleChange('departmentId', e.target.value || null)}
                            disabled={loading}
                        >
                            <option value="">No department</option>
                            {(departments || []).map((d) => (
                                <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="m365-panel-footer">
                    <button className="m365-btn m365-btn--ghost" onClick={handleClose} disabled={loading}>
                        Cancel
                    </button>
                    <button className="m365-btn m365-btn--primary" onClick={handleCreate} disabled={loading}>
                        {loading ? (
                            <><i className="fa-light fa-spinner fa-spin" /> Creating...</>
                        ) : (
                            <><i className="fa-light fa-user-plus" /> Create user</>
                        )}
                    </button>
                </div>
            </div>
        </SlidePanel>
    );
};

export default CreateUserPanel;
