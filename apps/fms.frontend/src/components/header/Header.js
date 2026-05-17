/**
 * File:          Header.js
 * Purpose:       Top navigation bar for the Inspinia feature shell.
 * Dependencies:  React, Redux auth state, UserPanel, NotificationCenter, ThemeSelector
 * Last Modified: 2026-05-17
 *
 * Key Functions:
 * - Header(): Renders sidebar toggle, logo/title, search, notifications, and profile.
 */

import React from "react";
import { useSelector } from "react-redux";

import UserPanel from "../user-panel/UserPanel";
import NotificationCenter from "../notifications/NotificationCenter";
import ThemeSelector from "./ThemeSelector";
import "./Header.scss";

/**
 * Shared application header used by the Inspinia shell (SideNavOuterToolbar).
 * Owns: sidebar toggle, branding, theme selector, notifications, user panel.
 *
 * The legacy app-launcher drawer has been removed - navigation now lives
 * exclusively in the Inspinia side navigation menu (or AdminLayout for /admin).
 */
export default function Header({ menuToggleEnabled, toggleMenu, title }) {
  const user = useSelector((state) => state.auth.user);
  const userLabel = user?.userName || user?.email || "User";
  const userInitial = userLabel.charAt(0).toUpperCase();

  const handleToggleMenu = (event) => {
    if (typeof toggleMenu === "function") {
      toggleMenu({ event });
    }
  };

  const handleButtonMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <header className="header-component app-header">
      <div className="header-toolbar" role="navigation" aria-label="Application toolbar">
        <div className="header-toolbar__left">
          {menuToggleEnabled && (
            <button
              type="button"
              onClick={handleToggleMenu}
              onMouseDown={handleButtonMouseDown}
              className="grid-icon-button native-button grid-icon-button--menu"
              aria-label="Toggle navigation menu"
            >
              <span className="app-menu-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          )}


        </div>

        <form
          className="topbar-search"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <i className="fa-light fa-magnifying-glass topbar-search__icon" aria-hidden="true" />
          <input
            className="topbar-search__input"
            type="search"
            placeholder="Quick search..."
            aria-label="Quick search"
          />
        </form>

        <div className="header-toolbar__actions">
          <div className="theme-selector-item">
            <ThemeSelector />
          </div>

          <div className="notification-item">
            <div className="notification-wrapper">
              <NotificationCenter />
            </div>
          </div>

          <div className="user-panel-item">
            <div className="topbar-profile" aria-label="User profile">
              <button
                type="button"
                className="user-button authorization user-avatar-circle"
                aria-label={`Open profile menu for ${userLabel}`}
                title={userLabel}
              >
                {userInitial}
              </button>
              <div className="topbar-profile__meta">
                <span className="topbar-profile__name">{userLabel}</span>
                <span className="topbar-profile__role">Profile</span>
              </div>
            </div>
            <UserPanel menuMode="context" />
          </div>
        </div>
      </div>
    </header>
  );
}
