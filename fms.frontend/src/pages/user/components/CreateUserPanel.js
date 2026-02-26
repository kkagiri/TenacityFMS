/**
 * File: CreateUserPanel.js
 * Purpose: M365 slide-in side panel for creating a new user account
 * Dependencies: React, Redux, userActions, m365 panel styles
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - CreateUserPanel(props): Slide-in panel with flat M365 form
 *   Fields: username, email, password, confirm password, role, department
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
    password: '',
    confirmPassword: '',
    roleName: '',
    departmentId: null,
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
        if (!form.email.trim()) e.email = 'Email is required';
        if (!form.password) e.password = 'Password is required';
        if (!form.roleName) e.roleName = 'Role is required';
        if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
            e.confirmPassword = 'Passwords do not match';
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
            await dispatch(createUser({
                FirstName: form.firstName || null,
                LastName: form.lastName || null,
                Email: form.email,
                Username: form.userName,
                Password: form.password,
                RoleName: form.roleName,
                DepartmentId: form.departmentId,
            }));
            notify('User created successfully', 'success', 3000);
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

    if (!visible) return null;

    return (
        <SlidePanel open={visible} onClose={handleClose} title="Add a user" width={420}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Scrollable form body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
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
                        <label className="m365-field__label m365-field__label--required">Email</label>
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

                    {/* Password */}
                    <div className="m365-field">
                        <label className="m365-field__label m365-field__label--required">Password</label>
                        <input
                            className={`m365-input${errors.password ? ' m365-input--error' : ''}`}
                            type="password"
                            value={form.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            placeholder="Minimum 6 characters"
                            autoComplete="new-password"
                            disabled={loading}
                        />
                        {errors.password && <span className="m365-field__error">{errors.password}</span>}
                    </div>

                    {/* Confirm Password */}
                    <div className="m365-field">
                        <label className="m365-field__label m365-field__label--required">Confirm password</label>
                        <input
                            className={`m365-input${errors.confirmPassword ? ' m365-input--error' : ''}`}
                            type="password"
                            value={form.confirmPassword}
                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            placeholder="Re-enter password"
                            autoComplete="new-password"
                            disabled={loading}
                        />
                        {errors.confirmPassword && <span className="m365-field__error">{errors.confirmPassword}</span>}
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
