import React, { useRef } from "react";
import { useSelector } from "react-redux";
import Toolbar, { Item } from "devextreme-react/toolbar";

import UserPanel from "../user-panel/UserPanel";
import NotificationCenter from "../notifications/NotificationCenter";
import ThemeSelector from "./ThemeSelector";
import useBrandingLogo from "./useBrandingLogo";
import "./Header.scss";

/**
 * Shared application header used by the Inspinia shell (SideNavOuterToolbar).
 * Owns: sidebar toggle, branding, theme selector, notifications, user panel.
 *
 * The legacy app-launcher drawer has been removed — navigation now lives
 * exclusively in the Inspinia side navigation menu (or AdminLayout for /admin).
 */
export default function Header({ menuToggleEnabled, toggleMenu, title }) {
  const appButtonRef = useRef(null);
  const user = useSelector((state) => state.auth.user);
  const brandingLogoSrc = useBrandingLogo();

  const handleToggleMenu = (e) => {
    if (typeof toggleMenu === "function") {
      toggleMenu({ event: e });
    }
  };

  // Firefox-specific click handler to prevent double firing
  const handleButtonClick = (e) => {
    if (e.type === 'mousedown') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Get first letter of username for avatar
  const getUserInitial = () => {
    if (user?.userName) {
      return user.userName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className={"header-component"}>
      <Toolbar height className={"header-toolbar"}>
        <Item
          visible={true}
          location={"before"}
          cssClass={"app-menu-button"}
        >
          <div ref={appButtonRef} className="app-button-wrapper">
            <button
              type="button"
              onClick={handleToggleMenu}
              onMouseDown={handleButtonClick}
              className="grid-icon-button native-button grid-icon-button--menu"
              aria-label="Toggle navigation menu"
            >
              <div className="app-menu-icon" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </div>
        </Item>




        <Item
          location={"before"}
          cssClass={"header-title"}
          visible={!!title}
        >
          <div className="header-brand" aria-label={title}>
            <img className="header-brand__logo" src={brandingLogoSrc} alt="Tenacy logo" />
            <span className="header-brand__title">{title}</span>
          </div>
        </Item>


        {/* Theme selector — Light / Dark / System */}
        <Item
          location={"after"}
          locateInMenu={"never"}
          cssClass={"theme-selector-item"}
        >
          <ThemeSelector />
        </Item>

        {/* //Cursor - Notification bell positioned on the right - moved to be first on right side */}
        <Item
          location={"after"}
          locateInMenu={"never"}
          cssClass={"notification-item"}
        >
          <div className="notification-wrapper">
            <NotificationCenter />
          </div>
        </Item>

        {/* //Cursor - User avatar with initial letter */}
        <Item
          location={"after"}
          cssClass={"user-panel-item"}
        >
          <div className="user-button authorization user-avatar-circle">
            {getUserInitial()}
          </div>
          <UserPanel menuMode={"context"} />
        </Item>
        {/* <Template name={"userPanelTemplate"}>
          <UserPanel menuMode={"list"} />
        </Template> */}
      </Toolbar>
    </header>
  );
}
