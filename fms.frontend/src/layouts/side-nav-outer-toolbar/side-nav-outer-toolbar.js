import Drawer from "devextreme-react/drawer";
import ScrollView from "devextreme-react/scroll-view";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Header, SideNavigationMenu, Footer } from "../../components";
import "./side-nav-outer-toolbar.scss";
import { useScreenSize } from "../../utils/media-query";
import { Template } from "devextreme-react/core/template";
import { useMenuPatch } from "../../utils/patches";

export default function SideNavOuterToolbar({ title, children }) {
  const scrollViewRef = useRef(null);
  const drawerRef = useRef(null);
  const navigate = useNavigate();
  const { isLarge } = useScreenSize();
  const [patchCssClass, onMenuReady] = useMenuPatch();
  const [menuStatus, setMenuStatus] = useState(
    isLarge ? MenuStatus.Opened : MenuStatus.Closed
  );

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuStatus !== MenuStatus.Closed && drawerRef.current) {
        const drawerElement = drawerRef.current;
        const menuElement = drawerElement.querySelector('.dx-drawer-panel-content');

        // If click is outside the menu panel, close the drawer
        if (menuElement && !menuElement.contains(event.target)) {
          setMenuStatus(MenuStatus.Closed);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuStatus]);

  const toggleMenu = useCallback(({ event }) => {
    setMenuStatus(
      prevMenuStatus => prevMenuStatus === MenuStatus.Closed
        ? MenuStatus.Opened
        : MenuStatus.Closed
    );
    event.stopPropagation();
  }, []);

  const temporaryOpenMenu = useCallback(() => {
    setMenuStatus((prevMenuStatus) =>
      prevMenuStatus === MenuStatus.Closed
        ? MenuStatus.TemporaryOpened
        : prevMenuStatus
    );
  }, []);

  const onNavigationChanged = useCallback(
    ({ itemData, event, node }) => {
      if (menuStatus === MenuStatus.Closed || !itemData.path || node.selected) {
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
    if (menuStatus !== MenuStatus.Closed) {
      setMenuStatus(MenuStatus.Closed);
      event.stopPropagation();
    }
  }, [menuStatus]);

  return (
    <div className={"side-nav-outer-toolbar"}>
      <Header
        menuToggleEnabled={true}
        toggleMenu={toggleMenu}
        title={title}
      />
      <Drawer
        ref={drawerRef}
        className={["drawer", patchCssClass].join(" ")}
        position={"before"}
        closeOnOutsideClick={true}
        openedStateMode={isLarge ? 'shrink' : 'overlap'}
        revealMode={'slide'}
        minSize={0}
        maxSize={250}
        shading={!isLarge}
        opened={menuStatus === MenuStatus.Closed ? false : true}
        template={"menu"}
      >
        <div className={"container dx-theme-background-color"} onClick={onContentClick}>
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
        <Template name={"menu"}>
          <SideNavigationMenu
            compactMode={menuStatus === MenuStatus.Closed}
            selectedItemChanged={onNavigationChanged}
            openMenu={temporaryOpenMenu}
            onMenuReady={onMenuReady}
            layoutType="outer"
            menuStatus={menuStatus}
          ></SideNavigationMenu>
        </Template>
      </Drawer>
    </div>
  );
}

const MenuStatus = {
  Closed: 1,
  Opened: 2,
  TemporaryOpened: 3,
};
