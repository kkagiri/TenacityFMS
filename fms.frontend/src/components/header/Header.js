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

        <Item
          location={"after"}
          locateInMenu={"auto"}
          menuItemTemplate={"deviceStatusTemplate"}
        />
       {/* Todo: insert Theme selector . */}

        <Item
          location={"after"}
          locateInMenu={"auto"}
          cssClass={"notification-item"}
        >
          <div className="header-notification-wrapper">
            <NotificationCenter />
          </div>
        </Item>

        <Item
          location={"after"}
          locateInMenu={"auto"}
          cssClass={"user-panel-item"}
        >
          <Button
            className={"user-button authorization"}
            width={210}
            height={"100%"}
            stylingMode={"text"}
          >
            <UserPanel menuMode={"context"} />
          </Button>
        </Item>
        <Template name={"userPanelTemplate"}>
          <UserPanel menuMode={"list"} />
        </Template>
      </Toolbar>
    </header>
  );
}
