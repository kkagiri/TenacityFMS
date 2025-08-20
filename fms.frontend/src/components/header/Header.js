import React, { useState, useRef } from "react";
import Toolbar, { Item } from "devextreme-react/toolbar";
import Button from "devextreme-react/button";

import DeviceStatusIndicator from "../deviceStatus/deviceStatusIndicator";
import UserPanel from "../user-panel/UserPanel";
import NotificationCenter from "../notifications/NotificationCenter";
import { AppDrawer } from "../app-drawer";
import "./Header.scss";

export default function Header({ menuToggleEnabled, title }) {
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState(false);
  const appButtonRef = useRef(null);

  const toggleAppDrawer = () => {
    setIsAppDrawerOpen(!isAppDrawerOpen);
  };

  const closeAppDrawer = () => {
    setIsAppDrawerOpen(false);
  };
  return (
    <header className={"header-component"}>
      <Toolbar  height className={"header-toolbar"}>
        <Item
          visible={true}
          location={"center"}
          widget={"dxButton"}
          cssClass={"app-grid-button"}
        >
          <div ref={appButtonRef} className="app-button-wrapper">
            <Button
              stylingMode="text"
              onClick={toggleAppDrawer}
              className="grid-icon-button"
            >
              <div className="app-grid-icon">
                <div className="grid-dots">
                  <span></span><span></span><span></span>
                  <span></span><span></span><span></span>
                  <span></span><span></span><span></span>
                </div>
              </div>
            </Button>
          </div>
        </Item>




        <Item
          location={"before"}
          cssClass={"header-title"}
          text={title}
          visible={!!title}
        />


       {/* Todo: insert Theme selector . */}

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

        {/* //Cursor - Simplified user button to show only icon */}
        <Item
          location={"after"}
          cssClass={"user-panel-item"}
        >
          <Button
            className={"user-button authorization"}
            icon="fa-light fa-user"
            width={40}
            height={40}
            stylingMode={"text"}
          />
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