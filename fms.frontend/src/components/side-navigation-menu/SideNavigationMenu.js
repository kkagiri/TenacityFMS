import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import TreeView from 'devextreme-react/tree-view';
import { useNavigation } from '../../contexts/navigation';
import { useScreenSize } from '../../utils/media-query';
import './SideNavigationMenu.scss';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNavigationItems } from '../../redux/actions/navigationActions';
import * as events from 'devextreme/events';

export default function SideNavigationMenu(props) {
  const {
    children,
    selectedItemChanged,
    openMenu,
    compactMode,
    onMenuReady,
    isMenuOpen // Cursor: New prop from layout
  } = props;

  const { isLarge } = useScreenSize();
  const dispatch = useDispatch();
  const { navigationItems, loading, error } = useSelector((state) => state.navigation);
  const { user } = useSelector((state) => state.auth);
  const [expandedItems, setExpandedItems] = useState([]);

  useEffect(() => {
    if (user) {
      dispatch(fetchNavigationItems());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (loading) {
      // Handle loading state if needed
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
    // Clean up events from previous element
    if (prevElement) {
      events.off(prevElement, 'dxclick');
    }

    // Only attach new event if element exists
    if (element) {
      wrapperRef.current = element;
      events.on(element, 'dxclick', (e) => {
        openMenu(e);
      });
    }
  }, [openMenu]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (wrapperRef.current) {
        events.off(wrapperRef.current, 'dxclick');
      }
    };
  }, []);

  useEffect(() => {
    const treeView = treeViewRef.current && treeViewRef.current.instance;
    if (!treeView) {
      return;
    }

    if (currentPath !== undefined) {
      treeView.selectItem(currentPath);
      treeView.expandItem(currentPath);
    }

    if (compactMode) {
      treeView.collapseAll();
    }

    // Cleanup function
    return () => {
      if (treeView) {
        treeView.dispose();
      }
    };
  }, [currentPath, compactMode]);

  const onItemExpanded = useCallback((e) => {
    // Cursor: Simple item expansion handling
    setExpandedItems([e.itemData.path]);
  }, []);

  const onItemClick = useCallback((e) => {
    selectedItemChanged(e);
  }, [selectedItemChanged]);

  return (
    <div
      className={`dx-swatch-additional side-navigation-menu`}
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
          scrollDirection={'vertical'}
          showCheckBoxesMode={'none'}
          animationEnabled={true}
        />
      </div>
    </div>
  );
}