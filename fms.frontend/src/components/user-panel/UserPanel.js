import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import ContextMenu, { Position } from 'devextreme-react/context-menu';
import List from 'devextreme-react/list';
import './UserPanel.scss';
import {logout} from '../../redux/actions/AuthActions';


export default function UserPanel({ menuMode }) {

  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  function navigateToProfile() {
    navigate("/profile");
  }
  const handleLogout = () => {
    dispatch(logout());
  };
  const menuItems = useMemo(() => ([
    {
      text: 'Profile',
      icon: 'user',
      onClick: navigateToProfile
    },
    {
      text: 'Logout',
      icon: 'runner',
      onClick: handleLogout
    }
  ]), [handleLogout]);
  return (
    <div className={'user-panel'}>
      <div className={'user-info'}>
        <div className={'image-container'}>
          
        </div>
        <div className={'user-name'}>{user?.email}</div>
      </div>

      {menuMode === 'context' && (
        <ContextMenu
          items={menuItems}
          target={'.user-button'}
          showEvent={'dxclick'}
          width={210}
          cssClass={'user-menu'}
        >
          <Position my={'top center'} at={'bottom center'} />
        </ContextMenu>
      )}
      {menuMode === 'list' && (
        <List className={'dx-toolbar-menu-action'} items={menuItems} />
      )}
    </div>
  );
}
