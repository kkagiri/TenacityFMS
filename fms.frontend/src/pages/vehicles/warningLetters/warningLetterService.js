/**
 * File: warningLetterService.js
 * Purpose: Wraps warning letter API calls and normalizes response payloads for vehicle-module pages.
 * Dependencies: axiosInstance
 * Last Modified: 2026-04-14
 */
import axiosInstance from "../../../api/axiosInstance";

const ensureArray = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload?.Data)) {
        return payload.Data;
    }

    return [];
};

const getValidationErrors = (payload) => {
    if (Array.isArray(payload?.validationErrors)) {
        return payload.validationErrors.filter(Boolean);
    }

    if (Array.isArray(payload?.ValidationErrors)) {
        return payload.ValidationErrors.filter(Boolean);
    }

    return [];
};

const getMessage = (payload, fallback) => {
    const validationErrors = getValidationErrors(payload);
    if (validationErrors.length > 0) {
        return validationErrors.join("\n");
    }

    return payload?.message || payload?.Message || fallback;
};

const getSuccess = (payload) =>
    payload?.isSuccess ?? payload?.success ?? payload?.IsSuccess ?? payload?.Success ?? false;

const getData = (payload) =>
    payload?.data ?? payload?.Data ?? payload;

const toServiceError = (error, fallback) => {
    const payload = error?.response?.data;
    const message = getMessage(payload, error?.message || fallback);
    return new Error(message || fallback);
};

const normalizeWarningLetterListItem = (item = {}) => ({
    id: item?.id ?? item?.Id ?? 0,
    letterType: item?.letterType ?? item?.LetterType ?? null,
    employeeId: item?.employeeId ?? item?.EmployeeId ?? null,
    employeeName: item?.employeeName ?? item?.EmployeeName ?? "",
    vehicleId: item?.vehicleId ?? item?.VehicleId ?? null,
    vehicleHyoungNo: item?.vehicleHyoungNo ?? item?.VehicleHyoungNo ?? "",
    numberPlate: item?.numberPlate ?? item?.NumberPlate ?? null,
    siteId: item?.siteId ?? item?.SiteId ?? null,
    siteName: item?.siteName ?? item?.SiteName ?? "",
    letterDate: item?.letterDate ?? item?.LetterDate ?? null,
    periodStart: item?.periodStart ?? item?.PeriodStart ?? null,
    status: item?.status ?? item?.Status ?? null,
    workflowStage: item?.workflowStage ?? item?.WorkflowStage ?? null,
    emailSentAt: item?.emailSentAt ?? item?.EmailSentAt ?? null,
    emailRecipient: item?.emailRecipient ?? item?.EmailRecipient ?? null,
    signatureRequestRecipient: item?.signatureRequestRecipient ?? item?.SignatureRequestRecipient ?? null,
    signatureRequestCcRecipients: item?.signatureRequestCcRecipients ?? item?.SignatureRequestCcRecipients ?? null,
    approveLetterUploadedAt: item?.approveLetterUploadedAt ?? item?.ApproveLetterUploadedAt ?? null,
    signatureRequestedAt: item?.signatureRequestedAt ?? item?.SignatureRequestedAt ?? null,
    signedCopyUploadedAt: item?.signedCopyUploadedAt ?? item?.SignedCopyUploadedAt ?? null,
    employeeAcknowledgedAt: item?.employeeAcknowledgedAt ?? item?.EmployeeAcknowledgedAt ?? null,
});

const normalizeSignatureRecipient = (item = {}) => ({
    id: item?.id ?? item?.Id ?? "",
    userName: item?.userName ?? item?.UserName ?? "",
    email: item?.email ?? item?.Email ?? "",
    isSiteAdmin: item?.isSiteAdmin ?? item?.IsSiteAdmin ?? false,
});

const buildParams = (values = {}) => {
    const params = new URLSearchParams();

    Object.entries(values).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }

        params.append(key, value);
    });

    return params;
};

const extractFileName = (headers, fallback) => {
    const disposition = headers?.["content-disposition"] || headers?.["Content-Disposition"];
    if (!disposition) {
        return fallback;
    }

    const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
    return decodeURIComponent(match?.[1] || match?.[2] || fallback);
};

export const getWarningLetters = async (filters = {}) => {
    const params = buildParams(filters);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const response = await axiosInstance.get(`/warning-letters${suffix}`);
    const payload = response.data;

    if (!getSuccess(payload)) {
        throw new Error(getMessage(payload, "Failed to load warning letters."));
    }

    return ensureArray(getData(payload)).map(normalizeWarningLetterListItem);
};

export const getWarningLetter = async (id) => {
    const response = await axiosInstance.get(`/warning-letters/${id}`);
    const payload = response.data;

    if (!getSuccess(payload)) {
        throw new Error(getMessage(payload, "Failed to load warning letter."));
    }

    return getData(payload);
};

export const createWarningLetter = async (payload) => {
    const response = await axiosInstance.post("/warning-letters", payload);
    const result = response.data;

    if (!getSuccess(result)) {
        throw new Error(getMessage(result, "Failed to create warning letter."));
    }

    return getData(result);
};

export const updateWarningLetter = async (id, payload) => {
    const response = await axiosInstance.put(`/warning-letters/${id}`, payload);
    const result = response.data;

    if (!getSuccess(result)) {
        throw new Error(getMessage(result, "Failed to update warning letter."));
    }

    return getData(result);
};

export const deleteWarningLetter = async (id) => {
    const response = await axiosInstance.delete(`/warning-letters/${id}`);
    const result = response.data;

    if (!getSuccess(result)) {
        throw new Error(getMessage(result, "Failed to delete warning letter."));
    }

    return result;
};

export const finalizeWarningLetter = async (id) => {
    const response = await axiosInstance.put(`/warning-letters/${id}/finalize`);
    const result = response.data;

    if (!getSuccess(result)) {
        throw new Error(getMessage(result, "Failed to finalize warning letter."));
    }

    return getData(result);
};

export const acknowledgeWarningLetter = async (id) => {
    const response = await axiosInstance.put(`/warning-letters/${id}/acknowledge`);
    const result = response.data;

    if (!getSuccess(result)) {
        throw new Error(getMessage(result, "Failed to acknowledge warning letter."));
    }

    return getData(result);
};

export const sendWarningLetterEmail = async (id, emailRecipient = null) => {
    const response = await axiosInstance.post(`/warning-letters/${id}/send-email`, emailRecipient ? {
        emailRecipient,
    } : {});
    const result = response.data;

    if (!getSuccess(result)) {
        throw new Error(getMessage(result, "Failed to send warning letter email."));
    }

    return result;
};

export const requestWarningLetterSignature = async (id, emailRecipient) => {
    const payload = typeof emailRecipient === "object"
        ? emailRecipient
        : { emailRecipient };

    const response = await axiosInstance.post(`/warning-letters/${id}/request-signature`, payload);
    const result = response.data;

    if (!getSuccess(result)) {
        throw new Error(getMessage(result, "Failed to request warning letter signature."));
    }

    return getData(result);
};

export const fetchWarningLetterSignatureRecipients = async (id) => {
    const response = await axiosInstance.get(`/warning-letters/${id}/signature-recipients`);
    const payload = response.data;

    if (!getSuccess(payload)) {
        throw new Error(getMessage(payload, "Failed to load site representatives."));
    }

    const data = getData(payload) || {};

    return {
        siteRepresentativeGroupName: data.siteRepresentativeGroupName ?? data.SiteRepresentativeGroupName ?? "Warning Letter Site Representatives",
        signatureCcGroupName: data.signatureCcGroupName ?? data.SignatureCcGroupName ?? "Warning Letter Signature CC",
        siteRepresentatives: ensureArray(data.siteRepresentatives ?? data.SiteRepresentatives).map(normalizeSignatureRecipient),
        signatureCcRecipients: ensureArray(data.signatureCcRecipients ?? data.SignatureCcRecipients).map(normalizeSignatureRecipient),
    };
};

export const fetchWarningLetterSiteRecipients = async (siteId) => {
    const response = await axiosInstance.get(`/warning-letters/site-recipients?siteId=${siteId}`);
    const payload = response.data;

    if (!getSuccess(payload)) {
        throw new Error(getMessage(payload, "Failed to load site recipients."));
    }

    return ensureArray(getData(payload));
};

export const uploadWarningLetterSignedCopy = async (id, file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await axiosInstance.post(`/warning-letters/${id}/signed-copy`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        const result = response.data;
        if (!getSuccess(result)) {
            throw new Error(getMessage(result, "Failed to upload signed copy."));
        }

        return getData(result);
    } catch (error) {
        throw toServiceError(error, "Failed to upload signed copy.");
    }
};

export const uploadWarningLetterApproveLetter = async (id, file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await axiosInstance.post(`/warning-letters/${id}/approve-letter`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        const result = response.data;
        if (!getSuccess(result)) {
            throw new Error(getMessage(result, "Failed to upload approved letter."));
        }

        return getData(result);
    } catch (error) {
        throw toServiceError(error, "Failed to upload approved letter.");
    }
};

export const downloadWarningLetterSignedCopy = async (id) => {
    const response = await axiosInstance.get(`/warning-letters/${id}/signed-copy`, { responseType: "blob" });
    const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: "application/octet-stream" });

    return {
        blob,
        fileName: extractFileName(response.headers, `warning-letter-${id}-signed-copy`),
    };
};

export const downloadWarningLetterApproveLetter = async (id) => {
    const response = await axiosInstance.get(`/warning-letters/${id}/approve-letter`, { responseType: "blob" });
    const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: "application/octet-stream" });

    return {
        blob,
        fileName: extractFileName(response.headers, `warning-letter-${id}-approve-letter`),
    };
};

export const previewWarningLetterHtml = async (payload) => {
    const response = await axiosInstance.post("/warning-letters/preview", payload, {
        responseType: "text",
        transformResponse: [(value) => value],
    });

    return response.data;
};

export const fetchWarningLetterHtml = async (id) => {
    const response = await axiosInstance.get(`/warning-letters/${id}/html`, {
        responseType: "text",
        transformResponse: [(value) => value],
    });

    return response.data;
};

export const fetchWarningLetterPdf = async (id, generate = false) => {
    const endpoint = generate
        ? `/warning-letters/${id}/generate-pdf`
        : `/warning-letters/${id}/pdf`;

    const response = generate
        ? await axiosInstance.post(endpoint, {}, { responseType: "blob" })
        : await axiosInstance.get(endpoint, { responseType: "blob" });

    const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: "application/pdf" });

    return {
        blob,
        fileName: extractFileName(response.headers, `warning-letter-${id}.pdf`),
    };
};

export const getWarningLetterSettings = async () => {
    const response = await axiosInstance.get(`/warning-letters/settings`);
    const payload = response.data;

    if (!getSuccess(payload)) {
        throw new Error(getMessage(payload, "Failed to load warning letter settings."));
    }

    return getData(payload) || {};
};

export const updateWarningLetterSettings = async (settings) => {
    const response = await axiosInstance.put(`/warning-letters/settings`, settings);
    const payload = response.data;

    if (!getSuccess(payload)) {
        throw new Error(getMessage(payload, "Failed to update warning letter settings."));
    }

    return getData(payload) || {};
};

export const getConsumptionCandidates = async (filters) => {
    const params = buildParams(filters);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const response = await axiosInstance.get(`/warning-letters/consumption-candidates${suffix}`);
    const payload = response.data;

    if (!getSuccess(payload)) {
        throw new Error(getMessage(payload, "Failed to load warning letter candidates."));
    }

    return getData(payload) || [];
};

export const getSites = async () => {
    const response = await axiosInstance.get("/site");
    return ensureArray(response.data);
};

export const getVehicles = async () => {
    const response = await axiosInstance.get("/vehicle");
    return ensureArray(response.data);
};

export const getEmployees = async () => {
    const response = await axiosInstance.get("/employee?active=true");
    return ensureArray(response.data);
};