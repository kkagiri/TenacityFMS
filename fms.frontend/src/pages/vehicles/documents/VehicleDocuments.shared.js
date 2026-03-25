/**
 * File: VehicleDocuments.shared.js
 * Purpose: Shared constants and helpers for vehicle document and compliance workflows.
 * Dependencies: Browser Date APIs.
 * Last Modified: 2026-03-25
 */

export const DOCUMENT_TYPE_OPTIONS = [
    { value: 1, label: "Insurance" },
    { value: 2, label: "Registration" },
    { value: 3, label: "Inspection" },
    { value: 4, label: "Road Permit" },
    { value: 5, label: "Other" },
];

export const COMPLIANCE_CATEGORY_OPTIONS = [
    { value: 1, label: "Insurance Certificate" },
    { value: 2, label: "Vehicle Registration" },
    { value: 3, label: "NTSA Inspection Certificate" },
    { value: 4, label: "KENHA Road Permit" },
    { value: 5, label: "KENHA Permit Exemption" },
    { value: 6, label: "Speed Governor Certificate" },
    { value: 7, label: "Driving License" },
    { value: 99, label: "Other" },
];

export const STATUS_FILTER_OPTIONS = [
    { value: "all", label: "All statuses" },
    { value: "valid", label: "Done / valid" },
    { value: "expiring", label: "Due soon" },
    { value: "expired", label: "Expired" },
];

export const REQUIREMENT_TARGET_OPTIONS = [
    { value: 1, label: "Site" },
    { value: 2, label: "Vehicle type" },
];

export const EMPTY_DOCUMENT_FORM_STATE = {
    id: null,
    vehicleId: "",
    documentType: "",
    complianceCategory: "",
    documentNumber: "",
    issueDate: "",
    expiryDate: "",
    alertLeadDays: 30,
    issuingAuthority: "",
    notes: "",
    file: null,
};

export const EMPTY_REQUIREMENT_FORM_STATE = {
    name: "",
    targetType: 1,
    targetIds: [],
    documentType: "",
    complianceCategory: "",
    alertLeadDays: 30,
    defaultIssuingAuthority: "",
    notes: "",
};

export const normalizeDocument = (document) => {
    const id = document?.id ?? document?.Id ?? document?.vehicleDocumentId ?? null;
    const vehicleId = Number(document?.vehicleId ?? document?.VehicleId ?? 0);
    const documentType = Number(document?.documentType ?? document?.DocumentType ?? 0);
    const complianceCategory = Number(document?.complianceCategory ?? document?.ComplianceCategory ?? 99);

    return {
        id,
        vehicleId,
        vehicleRegistration: document?.vehicleRegistration ?? document?.VehicleRegistration ?? "",
        documentType,
        documentTypeName:
            document?.documentTypeName ??
            document?.DocumentTypeName ??
            DOCUMENT_TYPE_OPTIONS.find((option) => option.value === documentType)?.label ??
            "Unknown",
        complianceCategory,
        complianceCategoryName:
            document?.complianceCategoryName ??
            document?.ComplianceCategoryName ??
            COMPLIANCE_CATEGORY_OPTIONS.find((option) => option.value === complianceCategory)?.label ??
            "Other",
        documentNumber: document?.documentNumber ?? document?.DocumentNumber ?? "",
        issueDate: document?.issueDate ?? document?.IssueDate ?? null,
        expiryDate: document?.expiryDate ?? document?.ExpiryDate ?? null,
        alertLeadDays: Number(document?.alertLeadDays ?? document?.AlertLeadDays ?? 30) || 30,
        issuingAuthority: document?.issuingAuthority ?? document?.IssuingAuthority ?? "",
        notes: document?.notes ?? document?.Notes ?? "",
        documentFileName: document?.documentFileName ?? document?.DocumentFileName ?? "",
        documentFileUrl: document?.documentFileUrl ?? document?.DocumentFileUrl ?? "",
        status: Number(document?.status ?? document?.Status ?? 0),
        daysUntilExpiry: Number(document?.daysUntilExpiry ?? document?.DaysUntilExpiry ?? 0) || 0,
    };
};

export const normalizeVehicle = (vehicle) => ({
    vehicleId: Number(vehicle?.vehicleId ?? vehicle?.VehicleId ?? 0),
    label:
        vehicle?.hyoungNo ??
        vehicle?.HyoungNo ??
        vehicle?.numberPlate ??
        vehicle?.NumberPlate ??
        `Vehicle ${vehicle?.vehicleId ?? vehicle?.VehicleId ?? ""}`,
    vehicleTypeId: Number(vehicle?.vehicleTypeId ?? vehicle?.VehicleTypeId ?? 0) || null,
    workingSiteId: Number(vehicle?.workingSiteId ?? vehicle?.WorkingSiteId ?? 0) || null,
});

export const normalizeSite = (site) => ({
    siteId: Number(site?.siteId ?? site?.SiteId ?? site?.id ?? site?.Id ?? 0),
    label: site?.name ?? site?.Name ?? site?.siteName ?? site?.SiteName ?? "Unnamed site",
});

export const normalizeVehicleType = (vehicleType) => ({
    vehicleTypeId: Number(vehicleType?.id ?? vehicleType?.Id ?? vehicleType?.vehicleTypeId ?? 0),
    label: vehicleType?.name ?? vehicleType?.Name ?? "Unnamed type",
});

export const normalizeRequirement = (requirement) => ({
    id: requirement?.id ?? requirement?.Id ?? "",
    name: requirement?.name ?? requirement?.Name ?? "",
    complianceCategory: Number(requirement?.complianceCategory ?? requirement?.ComplianceCategory ?? 99),
    complianceCategoryName: requirement?.complianceCategoryName ?? requirement?.ComplianceCategoryName ?? "Other",
    documentType: Number(requirement?.documentType ?? requirement?.DocumentType ?? 0),
    documentTypeName: requirement?.documentTypeName ?? requirement?.DocumentTypeName ?? "Unknown",
    targetType: Number(requirement?.targetType ?? requirement?.TargetType ?? 0),
    targetTypeName: requirement?.targetTypeName ?? requirement?.TargetTypeName ?? "Unknown",
    siteId: requirement?.siteId ?? requirement?.SiteId ?? null,
    siteName: requirement?.siteName ?? requirement?.SiteName ?? null,
    vehicleTypeId: requirement?.vehicleTypeId ?? requirement?.VehicleTypeId ?? null,
    vehicleTypeName: requirement?.vehicleTypeName ?? requirement?.VehicleTypeName ?? null,
    alertLeadDays: Number(requirement?.alertLeadDays ?? requirement?.AlertLeadDays ?? 30) || 30,
    defaultIssuingAuthority: requirement?.defaultIssuingAuthority ?? requirement?.DefaultIssuingAuthority ?? "",
    notes: requirement?.notes ?? requirement?.Notes ?? "",
    isActive: Boolean(requirement?.isActive ?? requirement?.IsActive ?? true),
});

export const toDateInputValue = (value) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
};

export const getStatusDescriptor = (status, expiryDate) => {
    if (status === 3) {
        return { key: "expired", label: "Expired", tone: "danger" };
    }

    if (status === 2) {
        return { key: "expiring", label: "Due soon", tone: "warning" };
    }

    if (status === 1) {
        return { key: "valid", label: "Valid", tone: "success" };
    }

    if (expiryDate) {
        const expiry = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expiry < today) {
            return { key: "expired", label: "Expired", tone: "danger" };
        }

        const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
        if (daysToExpiry <= 30) {
            return { key: "expiring", label: "Due soon", tone: "warning" };
        }
    }

    return { key: "valid", label: "Valid", tone: "success" };
};
