import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Popover from "devextreme-react/popover";
import List from "devextreme-react/list";
import "./UserPanel.scss";
import { logout } from "../../redux/actions/AuthActions";

export default function UserPanel({ menuMode }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [popoverVisible, setPopoverVisible] = useState(false);

  const handleLogout = useCallback(() => {
    setPopoverVisible(false);
    dispatch(logout());
  }, [dispatch]);

  const menuItems = useMemo(
    () => [
      {
        text: "Logout",
        icon: "runner",
        onClick: handleLogout,
      },
    ],
    [handleLogout]
  );

  // Listen for user button clicks to toggle popover
  useEffect(() => {
    if (menuMode === "context") {
      const userButton = document.querySelector('.user-button');
      if (userButton) {
        const handleClick = () => {
          setPopoverVisible(!popoverVisible);
        };
        userButton.addEventListener('click', handleClick);
        return () => userButton.removeEventListener('click', handleClick);
      }
    }
  }, [menuMode, popoverVisible]);
  return (
    <div className={"user-panel"}>
      {/* //Cursor - Only show user info in list mode, not in context mode for header */}
      {menuMode === "list" && (
        <div className={"user-info"}>
          <div className={"image-container"}></div>
          <div className={"user-name"}>{user?.email || user?.userName || 'User'}</div>
        </div>
      )}

      {menuMode === "context" && (
        <Popover
          visible={popoverVisible}
          onHiding={() => setPopoverVisible(false)}
          target={".user-button"}
          position="bottom"
          width={240}
          showTitle={false}
          showCloseButton={false}
          className="user-menu-popover"
        >
          <div className="user-menu-content">
            <div className="user-menu-email-header">
              {user?.email || user?.userName || 'User'}
            </div>
            <div className="user-menu-items">
              {menuItems.map((item, index) => (
                <div
                  key={index}
                  className="user-menu-item"
                  onClick={item.onClick}
                >
                  <i className={`dx-icon dx-icon-${item.icon}`}></i>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </Popover>
      )}
      {menuMode === "list" && (
        <List className={"dx-toolbar-menu-action"} items={menuItems} />
      )}
    </div>
  );
}
