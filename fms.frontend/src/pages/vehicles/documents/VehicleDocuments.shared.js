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

const FALLBACK_COMPLIANCE_RULES = [
    { complianceCategory: 1, documentType: 1, defaultIssuingAuthority: "" },
    { complianceCategory: 2, documentType: 2, defaultIssuingAuthority: "NTSA" },
    { complianceCategory: 3, documentType: 3, defaultIssuingAuthority: "NTSA" },
    { complianceCategory: 4, documentType: 4, defaultIssuingAuthority: "KENHA" },
    { complianceCategory: 5, documentType: 4, defaultIssuingAuthority: "KENHA" },
    { complianceCategory: 6, documentType: 3, defaultIssuingAuthority: "" },
    { complianceCategory: 7, documentType: 5, defaultIssuingAuthority: "NTSA" },
    { complianceCategory: 99, documentType: 5, defaultIssuingAuthority: "" },
];

const KNOWN_AUTHORITY_ACRONYMS = new Set(["ira", "kebs", "kenha", "kra", "nema", "nhif", "nssf", "ntsa", "sha"]);

export const REQUIREMENT_TARGET_OPTIONS = [
    { value: 1, label: "Site" },
    { value: 2, label: "Vehicle type" },
];

export const DEFAULT_NOTIFICATION_REMINDER_SETTINGS = {
    1: 30,
    2: 30,
    3: 30,
    4: 30,
    5: 30,
    6: 30,
    7: 30,
    99: 30,
};

export const EMPTY_DOCUMENT_FORM_STATE = {
    id: null,
    vehicleId: "",
    documentType: "",
    complianceCategory: "",
    documentNumber: "",
    issueDate: "",
    expiryDate: "",
    notifyBeforeExpiry: true,
    alertLeadDays: 30,
    issuingAuthority: "",
    customAuthorityOptions: [],
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

export const parseNotificationReminderSettings = (value) => {
    if (!value) {
        return { ...DEFAULT_NOTIFICATION_REMINDER_SETTINGS };
    }

    if (Array.isArray(value)) {
        const nextSettings = { ...DEFAULT_NOTIFICATION_REMINDER_SETTINGS };

        value.forEach((item) => {
            const category = Number(item?.complianceCategory ?? item?.ComplianceCategory ?? 0);
            const days = Number(item?.reminderLeadDays ?? item?.ReminderLeadDays ?? 0);

            if (Number.isFinite(category) && Number.isFinite(days) && category > 0) {
                nextSettings[category] = Math.max(0, Math.min(365, days));
            }
        });

        return nextSettings;
    }

    try {
        const parsedValue = typeof value === "string" ? JSON.parse(value) : value;
        const nextSettings = { ...DEFAULT_NOTIFICATION_REMINDER_SETTINGS };

        Object.entries(parsedValue || {}).forEach(([key, rawValue]) => {
            const category = Number(key);
            const days = Number(rawValue);

            if (Number.isFinite(category) && Number.isFinite(days)) {
                nextSettings[category] = Math.max(0, Math.min(365, days));
            }
        });

        return nextSettings;
    } catch (error) {
        return { ...DEFAULT_NOTIFICATION_REMINDER_SETTINGS };
    }
};

export const getDefaultReminderDays = (settings, complianceCategory) => {
    const category = Number(complianceCategory || 0);
    if (!category) {
        return DEFAULT_NOTIFICATION_REMINDER_SETTINGS[99];
    }

    return Number(settings?.[category] ?? DEFAULT_NOTIFICATION_REMINDER_SETTINGS[category] ?? DEFAULT_NOTIFICATION_REMINDER_SETTINGS[99]);
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
        issuingAuthority: normalizeAuthorityValue(document?.issuingAuthority ?? document?.IssuingAuthority ?? ""),
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
    defaultIssuingAuthority: normalizeAuthorityValue(requirement?.defaultIssuingAuthority ?? requirement?.DefaultIssuingAuthority ?? ""),
    notes: requirement?.notes ?? requirement?.Notes ?? "",
    isActive: Boolean(requirement?.isActive ?? requirement?.IsActive ?? true),
});

export const normalizeAuthorityValue = (value) => {
    const trimmedValue = `${value ?? ""}`.trim();

    if (!trimmedValue) {
        return "";
    }

    const lowercaseValue = trimmedValue.toLowerCase();
    if (KNOWN_AUTHORITY_ACRONYMS.has(lowercaseValue)) {
        return lowercaseValue.toUpperCase();
    }

    return trimmedValue
        .split(/\s+/)
        .map((segment) => {
            if (!segment) {
                return "";
            }

            if (KNOWN_AUTHORITY_ACRONYMS.has(segment.toLowerCase())) {
                return segment.toUpperCase();
            }

            return `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`;
        })
        .join(" ");
};

const getDocumentTypeLabel = (documentType) =>
    DOCUMENT_TYPE_OPTIONS.find((option) => option.value === Number(documentType))?.label ?? "Unknown";

const getComplianceCategoryLabel = (complianceCategory) =>
    COMPLIANCE_CATEGORY_OPTIONS.find((option) => option.value === Number(complianceCategory))?.label ?? "Other";

const ensureCatalogEntry = (catalogMap, complianceCategory, documentType) => {
    const resolvedComplianceCategory = Number(complianceCategory || 0);
    const resolvedDocumentType = Number(documentType || 0);

    if (!resolvedComplianceCategory) {
        return null;
    }

    const key = String(resolvedComplianceCategory);
    const existingEntry = catalogMap.get(key);
    const nextEntry = existingEntry || {
        complianceCategory: resolvedComplianceCategory,
        complianceCategoryName: getComplianceCategoryLabel(resolvedComplianceCategory),
        documentType: resolvedDocumentType,
        documentTypeName: getDocumentTypeLabel(resolvedDocumentType),
        defaultIssuingAuthority: "",
        authorityOptions: [],
    };

    if (resolvedDocumentType) {
        nextEntry.documentType = resolvedDocumentType;
        nextEntry.documentTypeName = getDocumentTypeLabel(resolvedDocumentType);
    }

    nextEntry.complianceCategoryName = getComplianceCategoryLabel(resolvedComplianceCategory);
    catalogMap.set(key, nextEntry);
    return nextEntry;
};

const mergeAuthority = (entry, authority) => {
    const normalizedAuthority = normalizeAuthorityValue(authority);
    if (!entry || !normalizedAuthority) {
        return;
    }

    if (!entry.authorityOptions.includes(normalizedAuthority)) {
        entry.authorityOptions.push(normalizedAuthority);
    }

    if (!entry.defaultIssuingAuthority) {
        entry.defaultIssuingAuthority = normalizedAuthority;
    }
};

export const buildDocumentComplianceCatalog = (requirements = [], documents = [], issuingAuthorities = []) => {
    const catalogMap = new Map();

    FALLBACK_COMPLIANCE_RULES.forEach((rule) => {
        const entry = ensureCatalogEntry(catalogMap, rule.complianceCategory, rule.documentType);
        if (entry) {
            entry.defaultIssuingAuthority = normalizeAuthorityValue(rule.defaultIssuingAuthority);
            mergeAuthority(entry, rule.defaultIssuingAuthority);
        }
    });

    requirements.forEach((requirement) => {
        const entry = ensureCatalogEntry(catalogMap, requirement?.complianceCategory, requirement?.documentType);
        if (entry) {
            const normalizedAuthority = normalizeAuthorityValue(requirement?.defaultIssuingAuthority);
            if (normalizedAuthority) {
                entry.defaultIssuingAuthority = normalizedAuthority;
            }
            mergeAuthority(entry, normalizedAuthority);
        }
    });

    documents.forEach((document) => {
        const entry = ensureCatalogEntry(catalogMap, document?.complianceCategory, document?.documentType);
        mergeAuthority(entry, document?.issuingAuthority);
    });

    issuingAuthorities.forEach((authority) => {
        const normalizedAuthority = normalizeAuthorityValue(authority?.name ?? authority?.Name ?? "");
        const associatedComplianceCategories = authority?.associatedComplianceCategories ?? authority?.AssociatedComplianceCategories ?? [];

        associatedComplianceCategories
            .map((value) => Number(value || 0))
            .filter((value) => value > 0)
            .forEach((complianceCategory) => {
                const entry = ensureCatalogEntry(catalogMap, complianceCategory, 0);
                mergeAuthority(entry, normalizedAuthority);

                if (entry && normalizedAuthority) {
                    entry.defaultIssuingAuthority = normalizedAuthority;
                }
            });
    });

    return Array.from(catalogMap.values())
        .map((entry) => ({
            ...entry,
            authorityOptions: [...entry.authorityOptions].sort((left, right) => left.localeCompare(right)),
        }))
        .sort((left, right) => {
            const leftIndex = COMPLIANCE_CATEGORY_OPTIONS.findIndex((option) => option.value === left.complianceCategory);
            const rightIndex = COMPLIANCE_CATEGORY_OPTIONS.findIndex((option) => option.value === right.complianceCategory);
            return leftIndex - rightIndex;
        });
};

export const getComplianceEntry = (catalog, complianceCategory) => {
    const resolvedComplianceCategory = Number(complianceCategory || 0);

    if (!resolvedComplianceCategory) {
        return null;
    }

    return catalog.find((entry) => entry.complianceCategory === resolvedComplianceCategory) || null;
};

export const getAuthorityOptionsForEntry = (entry, customAuthorities = [], currentAuthority = "") => {
    const authorityValues = [
        ...(entry?.authorityOptions || []),
        normalizeAuthorityValue(entry?.defaultIssuingAuthority),
        ...((customAuthorities || []).map(normalizeAuthorityValue)),
        normalizeAuthorityValue(currentAuthority),
    ].filter(Boolean);

    return [...new Set(authorityValues)]
        .sort((left, right) => left.localeCompare(right))
        .map((value) => ({ value, label: value }));
};

export const getPreferredIssuingAuthority = (entry, customAuthorities = [], currentAuthority = "") => {
    const normalizedCurrentAuthority = normalizeAuthorityValue(currentAuthority);
    const options = getAuthorityOptionsForEntry(entry, customAuthorities, normalizedCurrentAuthority);

    if (normalizedCurrentAuthority && options.some((option) => option.value === normalizedCurrentAuthority)) {
        return normalizedCurrentAuthority;
    }

    return normalizeAuthorityValue(entry?.defaultIssuingAuthority) || options[0]?.value || "";
};

export const getResolvedDocumentType = (catalog, complianceCategory, fallbackDocumentType = "") => {
    const entry = getComplianceEntry(catalog, complianceCategory);
    return Number(entry?.documentType ?? fallbackDocumentType ?? 0);
};

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
