/**
 * File: warningLetterService.js
 * Purpose: Wraps warning letter API calls and normalizes response payloads for vehicle-module pages.
 * Dependencies: axiosInstance
 * Last Modified: 2026-04-06
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

const getMessage = (payload, fallback) =>
    payload?.message || payload?.Message || fallback;

const getSuccess = (payload) =>
    payload?.isSuccess ?? payload?.success ?? payload?.IsSuccess ?? payload?.Success ?? false;

const getData = (payload) =>
    payload?.data ?? payload?.Data ?? payload;

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

    return getData(payload) || [];
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

export const sendWarningLetterEmail = async (id, emailRecipient) => {
    const response = await axiosInstance.post(`/warning-letters/${id}/send-email`, {
        emailRecipient,
    });
    const result = response.data;

    if (!getSuccess(result)) {
        throw new Error(getMessage(result, "Failed to send warning letter email."));
    }

    return result;
};

export const previewWarningLetterHtml = async (payload) => {
    const response = await axiosInstance.post("/warning-letters/preview", payload, {
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