import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import Toolbar, { Item } from "devextreme-react/toolbar";

import UserPanel from "../user-panel/UserPanel";
import NotificationCenter from "../notifications/NotificationCenter";
import { AppDrawer } from "../app-drawer";
import ThemeSelector from "./ThemeSelector";
import useBrandingLogo from "./useBrandingLogo";
import "./Header.scss";

export default function Header({ menuToggleEnabled, title }) {
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState(false);
  const appButtonRef = useRef(null);
  const user = useSelector((state) => state.auth.user);
  const brandingLogoSrc = useBrandingLogo();

  const toggleAppDrawer = (e) => {
    setIsAppDrawerOpen(!isAppDrawerOpen);
  };

  const closeAppDrawer = () => {
    setIsAppDrawerOpen(false);
  };

  // Firefox-specific click handler to prevent double firing
  const handleButtonClick = (e) => {
    // Only handle if this is a mousedown event to prevent double firing
    if (e.type === 'mousedown') {
      e.preventDefault();
      e.stopPropagation();
      // Don't call toggleAppDrawer here, let the onClick handle it
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
          location={"center"}
          widget={"dxButton"}
          cssClass={"app-grid-button"}
        >
          <div ref={appButtonRef} className="app-button-wrapper">
            {/* Use native button for better Firefox compatibility */}
            <button
              type="button"
              onClick={toggleAppDrawer}
              onMouseDown={handleButtonClick}
              className="grid-icon-button native-button"
              aria-label="Open App Menu"
            >
              <div className="app-grid-icon">
                <div className="grid-dots">
                  <span></span><span></span><span></span>
                  <span></span><span></span><span></span>
                  <span></span><span></span><span></span>
                </div>
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

      {/* App Drawer Component */}
      <AppDrawer
        isOpen={isAppDrawerOpen}
        onClose={closeAppDrawer}
        buttonRef={appButtonRef}
      />
    </header>
  );
}
