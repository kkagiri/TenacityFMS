import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import TreeView from 'devextreme-react/tree-view';
//import { navigation } from '../../app-navigation';
import { useNavigation } from '../../contexts/navigation';
import { useScreenSize } from '../../utils/media-query';
import './SideNavigationMenu.scss';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNavigationItems } from '../../redux/actions/navigationActions';
import * as events from 'devextreme/events';
import MobileNavigationMenu from './MobileNavigationMenu';

export default function SideNavigationMenu(props) {
  const {
    children,
    selectedItemChanged,
    openMenu,
    compactMode,
    onMenuReady
  } = props;

  const { isXSmall, isSmall, isMedium, isLarge } = useScreenSize();
  const dispatch = useDispatch();
  const { navigationItems, loading, error } = useSelector((state) => state.navigation);
  const { user } = useSelector((state) => state.auth);
  const [expandedItems, setExpandedItems] = useState([]);

  // Use mobile navigation for very small screens
  const useMobileNav = isXSmall;

  useEffect(() => {
    if (user) {
      dispatch(fetchNavigationItems());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (loading) {
    }
  }, [loading]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching navigation items:', error);
    }
  }, [error]);

  const transformToNested = (items) => {
    const itemMap = {};
    const roots = [];

    items.forEach(item => {
      itemMap[item.id] = { ...item, items: [] };
    });

    items.forEach(item => {
      if (item.parentId) {
        if (itemMap[item.parentId]) {
          itemMap[item.parentId].items.push(itemMap[item.id]);
        } else {
          console.warn(`Parent ID ${item.parentId} not found for item ID ${item.id}`);
        }
      } else {
        roots.push(itemMap[item.id]);
      }
    });

    return roots;
  };

  const transformedNavigationItems = useMemo(() => {
    if (!navigationItems || navigationItems.length === 0) return [];
    return transformToNested(navigationItems).map(item => ({
      text: item.page.charAt(0).toUpperCase() + item.page.slice(1),
      path: item.link && item.link !== "''" ? item.link : '',
      icon: item.icon || '',
      items: item.items.map(subItem => ({
        text: subItem.page.charAt(0).toUpperCase() + subItem.page.slice(1),
        path: subItem.link,
        icon: subItem.icon || '',
        items: subItem.items // Recursive nesting
      }))
    }));
  }, [navigationItems]);

  const { navigationData: { currentPath } } = useNavigation();

  const treeViewRef = useRef(null);
  const wrapperRef = useRef();
  const getWrapperRef = useCallback((element) => {
    const prevElement = wrapperRef.current;
    if (prevElement) {
      events.off(prevElement, 'dxclick');
    }

    wrapperRef.current = element;
    events.on(element, 'dxclick', (e) => {
      openMenu(e);
    });
  }, [openMenu]);

  useEffect(() => {
    if (useMobileNav) return; // Skip TreeView setup for mobile

    const treeView = treeViewRef.current && treeViewRef.current.instance;
    if (!treeView) {
      return;
    }

    if (currentPath !== undefined) {
      treeView.selectItem(currentPath);
      treeView.expandItem(currentPath);
    }

    // On small screens, collapse all items initially except the current path
    if (isSmall && !compactMode) {
      treeView.collapseAll();
      if (currentPath) {
        treeView.expandItem(currentPath);
      }
    }

    if (compactMode) {
      treeView.collapseAll();
    }
  }, [currentPath, compactMode, isSmall, useMobileNav]);

  const onItemExpanded = useCallback((e) => {
    // On small screens, collapse other expanded items when expanding a new one
    if (isSmall) {
      const treeView = treeViewRef.current && treeViewRef.current.instance;
      if (treeView) {
        const expandedPaths = expandedItems.filter(path => path !== e.itemData.path);
        expandedPaths.forEach(path => {
          if (path && !e.itemData.path.startsWith(path)) {
            treeView.collapseItem(path);
          }
        });
        setExpandedItems([e.itemData.path]);
      }
    }
  }, [isSmall, expandedItems]);

  const onItemClick = useCallback((e) => {
    selectedItemChanged(e);

    // On mobile, close the menu after selection if it has no children
    if ((isXSmall || isSmall) && (!e.itemData.items || e.itemData.items.length === 0)) {
      const drawerInstance = document.querySelector('.dx-drawer')?.dxDrawer?.instance;
      if (drawerInstance) {
        drawerInstance.hide();
      }
    }
  }, [selectedItemChanged, isXSmall, isSmall]);

  // Render mobile navigation for very small screens
  if (useMobileNav) {
    return (
      <div
        className={`dx-swatch-additional side-navigation-menu mobile-navigation`}
        ref={getWrapperRef}
      >
        {children}
        <MobileNavigationMenu
          selectedItemChanged={selectedItemChanged}
          onMenuReady={onMenuReady}
        />
      </div>
    );
  }

  return (
    <div
      className={`dx-swatch-additional side-navigation-menu ${isSmall ? 'mobile-view' : ''}`}
      ref={getWrapperRef}
    >
      {children}
      <div className={'menu-container'}>
        <TreeView
          ref={treeViewRef}
          items={transformedNavigationItems}
          keyExpr={'path'}
          selectionMode={'single'}
          focusStateEnabled={false}
          expandEvent={'click'}
          onItemClick={onItemClick}
          onItemExpanded={onItemExpanded}
          onContentReady={onMenuReady}
          width={'100%'}
          scrollDirection={isSmall ? 'both' : 'vertical'}
          showCheckBoxesMode={'none'}
          animationEnabled={!isSmall}
        />
      </div>
    </div>
  );
}