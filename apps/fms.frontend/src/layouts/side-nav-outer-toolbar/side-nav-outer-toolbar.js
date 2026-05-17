/**
 * File:          side-nav-outer-toolbar.js
 * Purpose:       Inspinia-style application shell with full-height sidebar and top navbar.
 * Dependencies:  React, DevExtreme ScrollView, Header, SideNavigationMenu
 * Last Modified: 2026-05-17
 *
 * Key Functions:
 * - SideNavOuterToolbar(): Renders the main feature shell chrome and nested pages.
 */

import ScrollView from "devextreme-react/scroll-view";
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Header, SideNavigationMenu, Footer } from "../../components";
import "./side-nav-outer-toolbar.scss";
import { useScreenSize } from "../../utils/media-query";
import useLayoutAttributes from "../../hooks/useLayoutAttributes";

export default function SideNavOuterToolbar({ title, children }) {
  const scrollViewRef = useRef(null);
  const navigate = useNavigate();
  const { isLarge } = useScreenSize();
  const [menuStatus, setMenuStatus] = useState(
    isLarge ? MenuStatus.Opened : MenuStatus.Closed
  );

  useEffect(() => {
    setMenuStatus(isLarge ? MenuStatus.Opened : MenuStatus.Closed);
  }, [isLarge]);

  const sidenavSize = useMemo(() => {
    if (!isLarge) return "offcanvas";
    return menuStatus === MenuStatus.Closed ? "condensed" : "default";
  }, [isLarge, menuStatus]);

  useLayoutAttributes({ sidenavSize });

  const toggleMenu = useCallback(({ event }) => {
    setMenuStatus(
      prevMenuStatus => prevMenuStatus === MenuStatus.Closed
        ? MenuStatus.Opened
        : MenuStatus.Closed
    );
    event.stopPropagation();
  }, []);

  const temporaryOpenMenu = useCallback(() => {
    if (isLarge) {
      return;
    }

    setMenuStatus((prevMenuStatus) =>
      prevMenuStatus === MenuStatus.Closed
        ? MenuStatus.TemporaryOpened
        : prevMenuStatus
    );
  }, [isLarge]);

  const onNavigationChanged = useCallback(
    ({ itemData, event, node }) => {
      if ((!isLarge && menuStatus === MenuStatus.Closed) || !itemData.path || node.selected) {
        event.preventDefault();
        return;
      }

      navigate(itemData.path); //only thing has changed

      scrollViewRef.current.instance.scrollTo(0);

      if (!isLarge || menuStatus === MenuStatus.TemporaryOpened) {
        setMenuStatus(MenuStatus.Closed);
        event.stopPropagation();
      }
    },
    [navigate, menuStatus, isLarge]
  );



  // Add click handler for main content area
  const onContentClick = useCallback((event) => {
    if (!isLarge && menuStatus !== MenuStatus.Closed) {
      setMenuStatus(MenuStatus.Closed);
      event.stopPropagation();
    }
  }, [isLarge, menuStatus]);

  const isSidebarOpen = menuStatus !== MenuStatus.Closed;
  const showMobileOpenClass = !isLarge && isSidebarOpen;
  const isCompact = isLarge && menuStatus === MenuStatus.Closed;

  return (
    <div
      className={`side-nav-outer-toolbar inspinia-shell wrapper${showMobileOpenClass ? " is-sidebar-open" : ""
        }`}
    >
      <aside
        className="side-nav-outer-toolbar__sidebar app-menu"
        aria-label="Application navigation"
      >
        <SideNavigationMenu
          compactMode={isCompact}
          selectedItemChanged={onNavigationChanged}
          openMenu={temporaryOpenMenu}
          layoutType="outer"
        />
      </aside>
      <button
        type="button"
        className="side-nav-outer-toolbar__overlay"
        aria-label="Close navigation menu"
        onClick={() => setMenuStatus(MenuStatus.Closed)}
      />
      <div
        className={"side-nav-outer-toolbar__main dx-theme-background-color page-content"}
        onClick={onContentClick}
      >
        <Header
          menuToggleEnabled={true}
          toggleMenu={toggleMenu}
          title={title}
        />
        <ScrollView ref={scrollViewRef} className={"layout-body with-footer"}>
          <div className={"content"}>
            {React.Children.map(children, (item) => {
              return item.type !== Footer && item;
            })}
          </div>
          <div className={"content-block"}>
            {React.Children.map(children, (item) => {
              return item.type === Footer && item;
            })}
          </div>
        </ScrollView>
      </div>
    </div>
  );
}

const MenuStatus = {
  Closed: 1,
  Opened: 2,
  TemporaryOpened: 3,
};
