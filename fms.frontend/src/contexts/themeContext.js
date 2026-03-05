/**
 * File: themeContext.js
 * Purpose: Manages application theme (light / dark / system) with cookie persistence.
 * Dependencies: React
 * Last Modified: 2026-03-03
 *
 * Key Functions:
 * - ThemeProvider: Wraps app, applies data-theme attribute to <html>
 * - useTheme(): Returns { theme, resolvedTheme, setTheme }
 *
 * Cookie: "fms_theme" — persists for 365 days
 * Values: "light" | "dark" | "system"
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext(undefined);

// ── Cookie helpers ──────────────────────────────────────────────
const COOKIE_NAME = "fms_theme";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name, value) {
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

// ── System preference detection ─────────────────────────────────
function getSystemPreference() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }
    return "light";
}

// ── Resolve effective theme ─────────────────────────────────────
function resolveTheme(preference) {
    if (preference === "system") {
        return getSystemPreference();
    }
    return preference;
}

// ── Apply theme to DOM ──────────────────────────────────────────
function applyTheme(resolved) {
    const root = document.documentElement;
    if (resolved === "dark") {
        root.setAttribute("data-theme", "dark");
        root.classList.add("tw-dark");
    } else {
        root.setAttribute("data-theme", "light");
        root.classList.remove("tw-dark");
    }
}

// ── Provider ────────────────────────────────────────────────────
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        const saved = getCookie(COOKIE_NAME);
        return saved && ["light", "dark", "system"].includes(saved) ? saved : "light";
    });

    const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(theme));

    // Apply theme whenever preference or system changes
    useEffect(() => {
        const resolved = resolveTheme(theme);
        setResolvedTheme(resolved);
        applyTheme(resolved);
    }, [theme]);

    // Listen for OS-level preference changes (only matters when theme === "system")
    useEffect(() => {
        const mql = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => {
            if (theme === "system") {
                const resolved = resolveTheme("system");
                setResolvedTheme(resolved);
                applyTheme(resolved);
            }
        };
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, [theme]);

    const setTheme = useCallback((newTheme) => {
        setCookie(COOKIE_NAME, newTheme);
        setThemeState(newTheme);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// ── Hook ────────────────────────────────────────────────────────
export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return ctx;
}
