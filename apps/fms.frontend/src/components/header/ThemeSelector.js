/**
 * File: ThemeSelector.js
 * Purpose: Header dropdown for switching between Light / Dark / System themes.
 * Dependencies: React, themeContext, FontAwesome icons
 * Last Modified: 2026-03-03
 *
 * Key Components:
 * - ThemeSelector: Renders icon button + popover with three theme options
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "../../contexts/themeContext";
import "./ThemeSelector.scss";

const THEME_OPTIONS = [
    { key: "light", label: "Light", icon: "fa-light fa-sun-bright" },
    { key: "dark", label: "Dark", icon: "fa-light fa-moon" },
    { key: "system", label: "System", icon: "fa-light fa-desktop" },
];

export default function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    const handleSelect = useCallback(
        (key) => {
            setTheme(key);
            setOpen(false);
        },
        [setTheme]
    );

    const currentOption = THEME_OPTIONS.find((o) => o.key === theme) || THEME_OPTIONS[0];

    return (
        <div className="theme-selector" ref={containerRef}>
            <button
                type="button"
                className="theme-selector__trigger"
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Change theme"
                title="Change theme"
            >
                <i className={currentOption.icon}></i>
            </button>

            {open && (
                <div className="theme-selector__dropdown">
                    {THEME_OPTIONS.map((opt) => (
                        <button
                            key={opt.key}
                            type="button"
                            className={`theme-selector__option ${theme === opt.key ? "theme-selector__option--active" : ""}`}
                            onClick={() => handleSelect(opt.key)}
                        >
                            <i className={opt.icon}></i>
                            <span>{opt.label}</span>
                            {theme === opt.key && <i className="fa-light fa-check theme-selector__check"></i>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
