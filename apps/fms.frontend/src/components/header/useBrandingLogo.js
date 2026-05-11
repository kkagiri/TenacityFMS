/**
 * File: useBrandingLogo.js
 * Purpose: Resolves the shared header logo from tenant branding with a bundled fallback asset.
 * Dependencies: useBranding, logoTenacy
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - useBrandingLogo(): Returns the tenant logo URL when branding has one.
 */

import { useMemo } from "react";
import useBranding from "../../hooks/useBranding";
import logoTenacity from "../../assets/logoTenacity.png";

const getWindowOrigin = () => {
    if (typeof window === "undefined" || !window.location?.origin) {
        return "";
    }

    return window.location.origin;
};

const buildFileApiUrl = (relativePath) => {
    const normalizedPath = String(relativePath || "")
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")
        .trim();

    if (!normalizedPath) {
        return null;
    }

    return `${getWindowOrigin()}/api/v1/files/${normalizedPath}`;
};

const resolveUploadsPath = (value) => {
    const normalizedValue = value.replace(/\\/g, "/");
    const uploadsMarker = "/uploads/";
    const markerIndex = normalizedValue.toLowerCase().indexOf(uploadsMarker);

    if (markerIndex >= 0) {
        const relativePath = normalizedValue.slice(markerIndex + uploadsMarker.length);
        return buildFileApiUrl(relativePath);
    }

    if (/^uploads\//i.test(normalizedValue)) {
        return buildFileApiUrl(normalizedValue.replace(/^uploads\//i, ""));
    }

    return null;
};

const resolveBrandingLogoUrl = (rawValue) => {
    if (typeof rawValue !== "string") {
        return null;
    }

    const value = rawValue.trim();
    if (!value) {
        return null;
    }

    if (/^data:image\//i.test(value)) {
        return value;
    }

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    if (value.startsWith("/api/") || value.startsWith("/uploads/")) {
        return `${getWindowOrigin()}${value}`;
    }

    if (/^api\//i.test(value)) {
        return `${getWindowOrigin()}/${value}`;
    }

    const uploadsResolved = resolveUploadsPath(value);
    if (uploadsResolved) {
        return uploadsResolved;
    }

    return buildFileApiUrl(value);
};

export default function useBrandingLogo() {
    const { logoUrl } = useBranding();

    return useMemo(() => resolveBrandingLogoUrl(logoUrl) || logoTenacity, [logoUrl]);
}