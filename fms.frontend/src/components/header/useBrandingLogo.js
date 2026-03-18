/**
 * File: useBrandingLogo.js
 * Purpose: Resolves the shared header logo from SystemConfiguration with a bundled fallback asset.
 * Dependencies: react, axiosInstance, logoHyoung
 * Last Modified: 2026-03-13
 *
 * Key Functions:
 * - useBrandingLogo(): Loads the first configured branding logo and normalizes file-storage paths.
 */

import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import logoHyoung from "../../assets/logoHyoung.png";

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

const getConfigurationValue = (response) => {
    return (
        response?.data?.data?.configurationValue ||
        response?.data?.data?.ConfigurationValue ||
        response?.data?.Data?.ConfigurationValue ||
        response?.data?.Data?.configurationValue ||
        null
    );
};

export default function useBrandingLogo() {
    const [logoSrc, setLogoSrc] = useState(logoHyoung);

    useEffect(() => {
        let isMounted = true;

        const loadBrandingLogo = async () => {
            for (const key of BRANDING_LOGO_KEYS) {
                try {
                    const response = await axiosInstance.get(
                        `/SystemConfiguration/by-key/${encodeURIComponent(key)}`
                    );

                    const configurationValue = getConfigurationValue(response);
                    const resolvedUrl = resolveBrandingLogoUrl(configurationValue);

                    if (resolvedUrl) {
                        if (isMounted) {
                            setLogoSrc(resolvedUrl);
                        }
                        return;
                    }
                } catch (error) {
                    if (error?.response?.status !== 404 && process.env.NODE_ENV === "development") {
                        console.warn(`[Branding] Failed to load logo key ${key}`, error);
                    }
                }
            }

            if (isMounted) {
                setLogoSrc(logoHyoung);
            }
        };

        loadBrandingLogo();

        return () => {
            isMounted = false;
        };
    }, []);

    return logoSrc;
}