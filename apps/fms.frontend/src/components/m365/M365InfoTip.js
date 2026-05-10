/**
 * File:          M365InfoTip.js
 * Purpose:       Click-to-open info popover with portal-based balloon.
 *                Renders a small (i) icon inline; clicking it opens a floating
 *                speech-bubble balloon anchored below the trigger.
 *                Dismisses on outside click or scroll.
 * Dependencies:  react, react-dom, m365-shared.scss
 * Last Modified: 2026-03-03
 *
 * Props:
 * - text (string|node): Content displayed inside the balloon
 *
 * Usage:
 *   <label>Scan Interval <M365InfoTip text="How often the folder is scanned." /></label>
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";

const M365InfoTip = ({ text }) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const balloonRef = useRef(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const close = useCallback(() => setOpen(false), []);

    /* Position the balloon below the trigger using fixed coords */
    useEffect(() => {
        if (!open || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({
            top: rect.bottom + 6,
            left: rect.left + rect.width / 2,
        });
    }, [open]);

    /* Close on outside click */
    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                balloonRef.current && !balloonRef.current.contains(e.target)
            ) close();
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open, close]);

    /* Close on scroll so balloon doesn't float detached */
    useEffect(() => {
        if (!open) return;
        const handleScroll = () => close();
        window.addEventListener("scroll", handleScroll, true);
        return () => window.removeEventListener("scroll", handleScroll, true);
    }, [open, close]);

    return (
        <span className="m365-infotip">
            <button
                ref={triggerRef}
                type="button"
                className="m365-infotip__trigger"
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                aria-label="More info"
            >
                <i className="fa-light fa-circle-info" />
            </button>
            {open && ReactDOM.createPortal(
                <div
                    ref={balloonRef}
                    className="m365-infotip__balloon"
                    style={{ top: pos.top, left: pos.left }}
                >
                    <span>{text}</span>
                </div>,
                document.body
            )}
        </span>
    );
};

export default M365InfoTip;
