/**
 * File: warningLetterPreviewConstants.js
 * Purpose: Shared constants and lightweight mappers for warning letter preview workflows.
 * Dependencies: None
 * Last Modified: 2026-04-16
 *
 * Key Functions:
 * - mapGroupToViewModel(): Normalizes notification group data for the preview page.
 * - mapUserToViewModel(): Normalizes recipient candidate data for the preview page.
 */
export const workflowStageMap = {
    0: { label: "Draft", cls: "m365-badge--neutral" },
    1: { label: "Approved", cls: "m365-badge--primary" },
    2: { label: "Pending Signed", cls: "m365-badge--warning" },
    3: { label: "Signed", cls: "m365-badge--success" },
    4: { label: "Acknowledged", cls: "m365-badge--success" },
};

export const typeMap = {
    1: "Excess Fuel Consumption",
    2: "Excessive Speed",
    3: "Excessive Idling",
};

export const isValidEmail = (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isGuidLike = (value) =>
    typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const mapGroupToViewModel = (group) => ({
    id: group.id,
    name: group.name || group.id || group.groupName,
    displayName: group.name || group.displayName || group.groupName || `Group #${group.id}`,
    description: group.description,
    memberCount: group.memberCount ?? group.members?.length ?? 0,
    isActive: group.isActive === true || group.isActive !== false,
    siteId: group.siteId ?? group.siteID ?? null,
    siteName: group.siteName || group.site?.name || "",
});

export const mapUserToViewModel = (user) => ({
    id: user.id || user.userId || user.Id,
    firstName: user.firstName || user.FirstName || "",
    lastName: user.lastName || user.LastName || "",
    userName: user.userName || user.UserName || user.username || user.Username || "",
    email: user.email || user.Email || "",
    role: (user.role || user.Role || (Array.isArray(user.roles) ? user.roles.join(",") : "")) ?? "",
    isActive: user.isActive !== false && user.deleted !== true,
});
