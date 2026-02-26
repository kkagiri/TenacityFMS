/**
 * File: ChangePasswordPopup.js
 * Purpose: Modal popup allowing the logged-in user to change their own password.
 *          Validates current, new, and confirm-password fields before dispatching.
 * Dependencies: axiosInstance, useDispatch, useSelector (auth.user)
 * Last Modified: 2026-02-24
 *
 * Key Components:
 * - ChangePasswordPopup: Self-contained modal with form state, validation, and API dispatch
 */

import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import { useDispatch } from "react-redux";
import notify from "devextreme/ui/notify";
import { changePassword } from "../../redux/actions/userActions";
import "./ChangePasswordPopup.scss";

const INITIAL_FORM = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

export default function ChangePasswordPopup({ visible, onClose }) {
    const dispatch = useDispatch();

    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [show, setShow] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
    });
    const [saving, setSaving] = useState(false);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const toggleShow = (field) =>
        setShow((prev) => ({ ...prev, [field]: !prev[field] }));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Clear field-level error on change
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const next = {};
        if (!form.currentPassword)
            next.currentPassword = "Current password is required.";
        if (!form.newPassword)
            next.newPassword = "New password is required.";
        else if (form.newPassword.length < 6)
            next.newPassword = "Password must be at least 6 characters.";
        if (!form.confirmPassword)
            next.confirmPassword = "Please confirm your new password.";
        else if (form.newPassword !== form.confirmPassword)
            next.confirmPassword = "Passwords do not match.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            const result = await dispatch(
                changePassword(form.currentPassword, form.newPassword)
            );
            if (result && result.isSuccess === false) {
                setErrors({ api: result.message || "Failed to change password." });
                return;
            }
            notify("Password changed successfully", "success", 3000);
            handleClose();
        } catch (err) {
            const msg =
                err?.message ||
                "Failed to change password. Please check your current password.";
            setErrors({ api: msg });
        } finally {
            setSaving(false);
        }
    }, [form, dispatch]);

    const handleClose = useCallback(() => {
        setForm(INITIAL_FORM);
        setErrors({});
        setShow({ currentPassword: false, newPassword: false, confirmPassword: false });
        onClose();
    }, [onClose]);

    // ── Render ────────────────────────────────────────────────────────────────
    if (!visible) return null;

    const fields = [
        { name: "currentPassword", label: "Current Password", icon: "fa-lock" },
        { name: "newPassword", label: "New Password", icon: "fa-lock-keyhole" },
        { name: "confirmPassword", label: "Confirm Password", icon: "fa-lock-check" },
    ];

    const modal = (
        <div className="chpwd-overlay" onClick={handleClose}>
            <div
                className="chpwd-panel"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="chpwd-title"
            >
                {/* Header */}
                <div className="chpwd-header">
                    <div className="chpwd-header__left">
                        <span className="chpwd-header__icon-wrap">
                            <i className="fa-light fa-key" />
                        </span>
                        <span id="chpwd-title" className="chpwd-header__title">
                            Change Password
                        </span>
                    </div>
                    <button
                        className="chpwd-header__close"
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        <i className="fa-light fa-xmark" />
                    </button>
                </div>

                {/* Body */}
                <div className="chpwd-body">
                    {/* API-level error banner */}
                    {errors.api && (
                        <div className="chpwd-error-banner">
                            <i className="fa-light fa-circle-exclamation" />
                            <span>{errors.api}</span>
                        </div>
                    )}

                    {fields.map(({ name, label, icon }) => (
                        <div className="chpwd-field" key={name}>
                            <label className="chpwd-field__label" htmlFor={`chpwd-${name}`}>
                                {label}
                            </label>
                            <div
                                className={`chpwd-input-wrap${errors[name] ? " chpwd-input-wrap--error" : ""}`}
                            >
                                <i className={`fa-light ${icon} chpwd-input-wrap__icon`} />
                                <input
                                    id={`chpwd-${name}`}
                                    name={name}
                                    type={show[name] ? "text" : "password"}
                                    value={form[name]}
                                    onChange={handleChange}
                                    className="chpwd-input"
                                    autoComplete={
                                        name === "currentPassword"
                                            ? "current-password"
                                            : "new-password"
                                    }
                                    placeholder={`Enter ${label.toLowerCase()}`}
                                    disabled={saving}
                                />
                                <button
                                    type="button"
                                    className="chpwd-input-wrap__toggle"
                                    onClick={() => toggleShow(name)}
                                    tabIndex={-1}
                                    aria-label={show[name] ? "Hide password" : "Show password"}
                                >
                                    <i
                                        className={`fa-light ${show[name] ? "fa-eye-slash" : "fa-eye"}`}
                                    />
                                </button>
                            </div>
                            {errors[name] && (
                                <span className="chpwd-field__error">{errors[name]}</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="chpwd-footer">
                    <button
                        type="button"
                        className="m365-btn m365-btn--ghost"
                        onClick={handleClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="m365-btn m365-btn--primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <i className="fa-light fa-loader fa-spin" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <i className="fa-light fa-floppy-disk" />
                                Save
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
    return ReactDOM.createPortal(modal, document.body);
}
