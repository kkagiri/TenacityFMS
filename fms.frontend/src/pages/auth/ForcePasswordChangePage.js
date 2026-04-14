/**
 * File: ForcePasswordChangePage.js
 * Purpose: Blocks newly onboarded users until they replace their temporary password.
 * Dependencies: React, react-redux, react-router-dom, userActions
 * Last Modified: 2026-04-13
 *
 * Key Functions:
 * - ForcePasswordChangePage(): Collects the current temporary password and the user's new password.
 */

import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import notify from 'devextreme/ui/notify';
import { USER_LOADED } from '../../redux/actions/types';
import { changePassword } from '../../redux/actions/userActions';

const INITIAL_FORM = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
};

const ForcePasswordChangePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const user = useSelector((state) => state.auth.user);

    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const redirectTarget = useMemo(() => {
        const requested = searchParams.get('redirect');
        if (!requested || !requested.startsWith('/') || requested.startsWith('//')) {
            return '/home';
        }

        return requested === '/change-password-required' ? '/home' : requested;
    }, [searchParams]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const nextErrors = {};

        if (!form.currentPassword) nextErrors.currentPassword = 'Temporary password is required.';
        if (!form.newPassword) nextErrors.newPassword = 'New password is required.';
        if (!form.confirmPassword) nextErrors.confirmPassword = 'Please confirm your new password.';
        if (form.newPassword && form.newPassword.length < 6) nextErrors.newPassword = 'New password must be at least 6 characters.';
        if (form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword) {
            nextErrors.confirmPassword = 'Passwords do not match.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate()) {
            return;
        }

        try {
            setSaving(true);
            await dispatch(changePassword(form.currentPassword, form.newPassword));
            dispatch({
                type: USER_LOADED,
                payload: {
                    ...user,
                    requirePasswordChangeOnFirstLogin: false,
                    RequirePasswordChangeOnFirstLogin: false,
                },
            });
            notify('Password updated successfully.', 'success', 3000);
            navigate(redirectTarget, { replace: true });
        } catch (error) {
            setErrors({ api: error.message || 'Unable to change password.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="tw-flex tw-justify-center tw-px-4 tw-py-10">
            <form className="tw-flex tw-w-full tw-max-w-[520px] tw-flex-col tw-gap-5 tw-rounded-lg tw-border tw-border-[#edebe9] tw-bg-white tw-p-6 tw-shadow-sm" onSubmit={handleSubmit}>
                <div className="tw-flex tw-flex-col tw-gap-2">
                    <h2 className="tw-text-[16px] tw-font-semibold tw-text-[#201f1e]">Change your temporary password</h2>
                    <p className="tw-text-[13px] tw-text-[#605e5c]">
                        Your account for <strong>{user?.userName || user?.UserName || 'this user'}</strong> is using a temporary password. Change it now before you continue.
                    </p>
                </div>

                <div className="m365-info-banner">
                    <i className="fa-light fa-shield-keyhole m365-info-banner__icon" />
                    <span className="m365-info-banner__text">
                        This step is required on the first sign-in after account creation.
                    </span>
                </div>

                {errors.api && (
                    <div className="m365-info-banner m365-info-banner--error">
                        <i className="fa-light fa-circle-exclamation m365-info-banner__icon" />
                        <span className="m365-info-banner__text">{errors.api}</span>
                    </div>
                )}

                <div className="m365-field">
                    <label className="m365-field__label m365-field__label--required">Temporary password</label>
                    <input
                        className={`m365-input${errors.currentPassword ? ' m365-input--error' : ''}`}
                        name="currentPassword"
                        type="password"
                        value={form.currentPassword}
                        onChange={handleChange}
                        autoComplete="current-password"
                        disabled={saving}
                    />
                    {errors.currentPassword && <span className="m365-field__error">{errors.currentPassword}</span>}
                </div>

                <div className="m365-field">
                    <label className="m365-field__label m365-field__label--required">New password</label>
                    <input
                        className={`m365-input${errors.newPassword ? ' m365-input--error' : ''}`}
                        name="newPassword"
                        type="password"
                        value={form.newPassword}
                        onChange={handleChange}
                        autoComplete="new-password"
                        disabled={saving}
                    />
                    {errors.newPassword && <span className="m365-field__error">{errors.newPassword}</span>}
                </div>

                <div className="m365-field">
                    <label className="m365-field__label m365-field__label--required">Confirm new password</label>
                    <input
                        className={`m365-input${errors.confirmPassword ? ' m365-input--error' : ''}`}
                        name="confirmPassword"
                        type="password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        autoComplete="new-password"
                        disabled={saving}
                    />
                    {errors.confirmPassword && <span className="m365-field__error">{errors.confirmPassword}</span>}
                </div>

                <button className="m365-btn m365-btn--primary tw-inline-flex tw-items-center tw-justify-center tw-gap-2" type="submit" disabled={saving}>
                    <i className={`fa-light ${saving ? 'fa-spinner fa-spin' : 'fa-key'}`} />
                    {saving ? 'Saving...' : 'Update password'}
                </button>
            </form>
        </div>
    );
};

export default ForcePasswordChangePage;