/**
 * File: useDocumentTitle.js
 * Purpose: Sets the browser tab title based on the current route path
 * Dependencies: react-router-dom
 * Last Modified: 2026-02-14
 *
 * Key Functions:
 * - useDocumentTitle(): Watches route changes and updates document.title
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP_NAME = "Hyoung FMS";

/**
 * Converts a URL path segment into a readable title.
 * e.g. "/issue-tracker" → "Issue Tracker"
 *      "/tankstock/management" → "Tank Stock / Management"
 */
function pathToTitle(pathname) {
    if (!pathname || pathname === "/" || pathname === "/home") {
        return APP_NAME;
    }

    const segments = pathname
        .split("/")
        .filter(Boolean)
        // Skip numeric/uuid segments (route params like :id)
        .filter((seg) => !/^[0-9a-f-]{4,}$/i.test(seg) && !/^\d+$/.test(seg));

    if (segments.length === 0) {
        return APP_NAME;
    }

    // Use only the last meaningful segment as the title
    const last = segments[segments.length - 1]
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return `${last} | ${APP_NAME}`;
}

export default function useDocumentTitle() {
    const location = useLocation();

    useEffect(() => {
        document.title = pathToTitle(location.pathname);
    }, [location.pathname]);
}
