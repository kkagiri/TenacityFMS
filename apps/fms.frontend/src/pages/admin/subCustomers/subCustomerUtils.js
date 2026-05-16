/**
 * File:          subCustomerUtils.js
 * Purpose:       Shared constants and helpers for Client sub-customer admin pages.
 * Dependencies:  None
 * Last Modified: 2026-05-16
 *
 * Key Functions:
 * - resolveError(): Extracts a user-facing API error message.
 * - formatDate(): Formats UTC API timestamps in the user's local timezone.
 */

export const SUB_CUSTOMER_PERMISSIONS = {
    Manage: "_Manage_Subtenants",
    Read: "_Read_SubtenantData",
};

export const EMPTY_INVITE_FORM = {
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    roleName: "Admin",
};

export const resolveError = (error, fallback) => {
    const data = error?.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    return data?.message || data?.Message || error?.message || fallback;
};

export const formatDate = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
};

export const getSubCustomerDetailPath = (id) => `/admin/sub-customers/${id}`;
