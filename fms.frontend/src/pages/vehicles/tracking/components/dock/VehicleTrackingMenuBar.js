/**
 * File: VehicleTrackingMenuBar.js
 * Purpose: Provides IDE-style top menu bar with Window management, workspace presets, and panel toggles
 * Dependencies: React, vehicleTrackingDockConfig
 * Last Modified: 2026-03-17
 *
 * Key Components:
 * - VehicleTrackingMenuBar(): Horizontal menu bar with dropdown menus for Window/Workspace control
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PANEL_REGISTRY, WORKSPACE_PRESETS } from '../../vehicleTrackingDockConfig';

const MenuDropdown = ({ children, label, isOpen, onToggle, onClose }) => {
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <div ref={dropdownRef} className="vt-menubar__menu-item">
            <button
                type="button"
                className={`vt-menubar__menu-trigger${isOpen ? ' vt-menubar__menu-trigger--active' : ''}`}
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {label}
            </button>
            {isOpen && (
                <div className="vt-menubar__dropdown" role="menu">
                    {children}
                </div>
            )}
        </div>
    );
};

const MenuItem = ({ checked, disabled, icon, label, onClick, shortcut }) => (
    <button
        type="button"
        role="menuitem"
        className={`vt-menubar__dropdown-item${disabled ? ' vt-menubar__dropdown-item--disabled' : ''}`}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
    >
        <span className="vt-menubar__dropdown-item-check">
            {checked ? <i className="fa-light fa-check"></i> : null}
        </span>
        {icon ? <i className={`${icon} vt-menubar__dropdown-item-icon`}></i> : <span className="vt-menubar__dropdown-item-icon" />}
        <span className="vt-menubar__dropdown-item-label">{label}</span>
        {shortcut ? <span className="vt-menubar__dropdown-item-shortcut">{shortcut}</span> : null}
    </button>
);

const MenuSeparator = () => <div className="vt-menubar__dropdown-separator" role="separator" />;

const SubMenu = ({ children, icon, label }) => {
    const [isHovered, setIsHovered] = useState(false);
    const timeoutRef = useRef(null);

    const handleEnter = useCallback(() => {
        clearTimeout(timeoutRef.current);
        setIsHovered(true);
    }, []);

    const handleLeave = useCallback(() => {
        timeoutRef.current = setTimeout(() => setIsHovered(false), 150);
    }, []);

    useEffect(() => () => clearTimeout(timeoutRef.current), []);

    return (
        <div
            className="vt-menubar__submenu"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <div className="vt-menubar__dropdown-item vt-menubar__dropdown-item--submenu">
                <span className="vt-menubar__dropdown-item-check" />
                {icon ? <i className={`${icon} vt-menubar__dropdown-item-icon`}></i> : <span className="vt-menubar__dropdown-item-icon" />}
                <span className="vt-menubar__dropdown-item-label">{label}</span>
                <i className="fa-light fa-chevron-right vt-menubar__dropdown-item-arrow"></i>
            </div>
            {isHovered && (
                <div className="vt-menubar__submenu-dropdown" role="menu">
                    {children}
                </div>
            )}
        </div>
    );
};

const VehicleTrackingMenuBar = ({
    activeWorkspace,
    children,
    onAddPanel,
    onResetLayout,
    onSelectWorkspace,
    openPanelIds,
}) => {
    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = useCallback((menuKey) => {
        setOpenMenu((current) => (current === menuKey ? null : menuKey));
    }, []);

    const closeMenus = useCallback(() => {
        setOpenMenu(null);
    }, []);

    const handleAddPanel = useCallback((panelId) => {
        onAddPanel?.(panelId);
        closeMenus();
    }, [closeMenus, onAddPanel]);

    const handleSelectWorkspace = useCallback((presetKey) => {
        onSelectWorkspace?.(presetKey);
        closeMenus();
    }, [closeMenus, onSelectWorkspace]);

    const handleResetLayout = useCallback(() => {
        onResetLayout?.();
        closeMenus();
    }, [closeMenus, onResetLayout]);

    const openPanelIdSet = new Set(openPanelIds || []);

    return (
        <div className="vt-menubar" role="menubar">
            <div className="vt-menubar__primary">
                <MenuDropdown
                    label="Window"
                    isOpen={openMenu === 'window'}
                    onToggle={() => toggleMenu('window')}
                    onClose={closeMenus}
                >
                    {Object.entries(PANEL_REGISTRY).map(([panelId, panel]) => (
                        <MenuItem
                            key={panelId}
                            label={panel.label}
                            icon={panel.icon}
                            checked={openPanelIdSet.has(panelId)}
                            onClick={() => handleAddPanel(panelId)}
                        />
                    ))}
                    <MenuSeparator />
                    <SubMenu label="Workspace" icon="fa-light fa-grid-2">
                        {Object.entries(WORKSPACE_PRESETS).map(([presetKey, preset]) => (
                            <MenuItem
                                key={presetKey}
                                label={preset.label}
                                icon={preset.icon}
                                checked={activeWorkspace === presetKey}
                                onClick={() => handleSelectWorkspace(presetKey)}
                            />
                        ))}
                    </SubMenu>
                    <MenuSeparator />
                    <MenuItem
                        label="Reset Layout"
                        icon="fa-light fa-arrows-rotate"
                        onClick={handleResetLayout}
                    />
                </MenuDropdown>
            </div>
            {children ? <div className="vt-menubar__secondary">{children}</div> : null}
        </div>
    );
};

export default VehicleTrackingMenuBar;
