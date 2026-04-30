/**
 * File: useBrandingLogo.js
 * Purpose: Resolves the shared header logo from SystemConfiguration with a bundled fallback asset.
 * Dependencies: react, axiosInstance, logoTenacy
 * Last Modified: 2026-03-30
 *
 * Key Functions:
 * - useBrandingLogo(): Loads the first configured branding logo and normalizes file-storage paths.
 */

import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import logoTenacy from "../../assets/logoHyoung.png";

const BRANDING_LOGO_KEYS = [
    "Branding.HeaderLogo",
    "Branding.HeaderLogoPath",
    "Branding.Logo",
    "Branding.LogoPath",
    "UI.HeaderLogo",
    "UI.HeaderLogoPath",
];

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

const getConfigurations = (response) => {
    if (Array.isArray(response?.data?.data)) {
        return response.data.data;
    }

    if (Array.isArray(response?.data?.Data)) {
        return response.data.Data;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    return [];
};

const getConfigurationKey = (configuration) => {
    return configuration?.configurationKey || configuration?.ConfigurationKey || null;
};

const getConfigurationEntryValue = (configuration) => {
    return configuration?.configurationValue || configuration?.ConfigurationValue || null;
};

const getConfiguration = (response) => {
    return response?.data?.data || response?.data?.Data || response?.data || null;
};

const resolveConfiguredBrandingLogo = (configurations) => {
    const valueByKey = new Map();

    configurations.forEach((configuration) => {
        const configurationKey = getConfigurationKey(configuration);
        if (configurationKey) {
            valueByKey.set(configurationKey, getConfigurationEntryValue(configuration));
        }
    });

    for (const key of BRANDING_LOGO_KEYS) {
        const resolvedUrl = resolveBrandingLogoUrl(valueByKey.get(key));
        if (resolvedUrl) {
            return resolvedUrl;
        }
    }

    return null;
};

export default function useBrandingLogo() {
    const [logoSrc, setLogoSrc] = useState(logoTenacy);

    useEffect(() => {
        let isMounted = true;

        const loadBrandingLogo = async () => {
            try {
                for (const key of BRANDING_LOGO_KEYS) {
                    try {
                        const response = await axiosInstance.get(
                            `/SystemConfiguration/by-key/${encodeURIComponent(key)}`
                        );

                        const configuration = getConfiguration(response);
                        const resolvedUrl = resolveBrandingLogoUrl(getConfigurationEntryValue(configuration));
                        if (resolvedUrl) {
                            if (isMounted) {
                                setLogoSrc(resolvedUrl);
                            }
                            return;
                        }
                    } catch (error) {
                        if (error?.response?.status !== 404 && process.env.NODE_ENV === "development") {
                            console.warn(`[Branding] Failed to load branding logo key ${key}`, error);
                        }
                    }
                }
            } catch (error) {
                if (process.env.NODE_ENV === "development") {
                    console.warn("[Branding] Failed to load branding logo configuration", error);
                }
            }

            if (isMounted) {
                setLogoSrc(logoTenacy);
            }
        };

        loadBrandingLogo();

        return () => {
            isMounted = false;
        };
    }, []);

    return logoSrc;
}