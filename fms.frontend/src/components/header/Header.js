import React from "react";
import Toolbar, { Item } from "devextreme-react/toolbar";
import Button from "devextreme-react/button";

import DeviceStatusIndicator from "../deviceStatus/deviceStatusIndicator";
import UserPanel from "../user-panel/UserPanel";
import NotificationCenter from "../notifications/NotificationCenter";
import "./Header.scss";
import { Template } from "devextreme-react/core/template";

export default function Header({ menuToggleEnabled, title, toggleMenu }) {
  return (
    <header className={"header-component"}>
      <Toolbar  height className={"header-toolbar"}>
        <Item
          visible={true}
          location={"before"}
          widget={"dxButton"}
          // cssClass={"menu-button"}
        >
          <Button icon="menu" stylingMode="text" onClick={toggleMenu} />
        </Item>




        <Item
          location={"before"}
          cssClass={"header-title"}
          text={title}
          visible={!!title}
        />


       {/* Todo: insert Theme selector . */}

        {/* //Cursor - Notification bell positioned on the right */}
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
    </header>
  );
}