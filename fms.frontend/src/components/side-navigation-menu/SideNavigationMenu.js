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
    layoutType = "outer", // "outer" or "inner"
    menuStatus
  } = props;

  const { isLarge } = useScreenSize();
  const dispatch = useDispatch();
  const { navigationItems, loading, error } = useSelector((state) => state.navigation);
  const { user } = useSelector((state) => state.auth);
  const [expandedItems, setExpandedItems] = useState(() => {
    // Load expanded items from sessionStorage with layout-specific key
    try {
      const saved = sessionStorage.getItem(`nav-expanded-items-${layoutType}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Force re-fetch navigation items when layout switches or component mounts
  useEffect(() => {
    if (user && (!navigationItems || navigationItems.length === 0)) {
      dispatch(fetchNavigationItems());
    }
  }, [user, dispatch, navigationItems, layoutType]);

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

  useEffect(() => {
    try {
      sessionStorage.setItem(`nav-expanded-items-${layoutType}`, JSON.stringify(expandedItems));
    } catch (error) {
      console.warn('Could not save expanded items to sessionStorage:', error);
    }
  }, [expandedItems, layoutType]);

  // Handle menu status changes - ensure navigation stays intact
  useEffect(() => {
    if (menuStatus && !loading && navigationItems && navigationItems.length === 0) {
      // If menu is opening but no navigation items, refetch them
      dispatch(fetchNavigationItems());
    }
  }, [menuStatus, loading, navigationItems, dispatch]);

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
    const nestedItems = transformToNested(navigationItems);

    const transformItems = (items) => {
      return items.map(item => ({
        text: item.page.charAt(0).toUpperCase() + item.page.slice(1),
        path: item.link && item.link !== "''" ? item.link : '',
        icon: item.icon || '',
        items: item.items && item.items.length > 0 ? transformItems(item.items) : []
      }));
    };

    return transformItems(nestedItems);
  }, [navigationItems]);

  // Debug logging for navigation issues
  useEffect(() => {
    console.log(`[${layoutType}] Navigation Debug:`, {
      navigationItemsCount: navigationItems?.length || 0,
      transformedItemsCount: transformedNavigationItems?.length || 0,
      loading,
      compactMode,
      menuStatus
    });
  }, [navigationItems, transformedNavigationItems, loading, compactMode, menuStatus, layoutType]);

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
    } else {
      // When opening the menu, ensure expanded items stay expanded
      expandedItems.forEach(path => {
        if (path) {
          treeView.expandItem(path);
        }
      });
    }

    // Cleanup function
    return () => {
      if (treeView) {
        // Don't dispose, just cleanup selections to prevent issues
        // treeView.dispose();
      }
    };
  }, [currentPath, compactMode, expandedItems, transformedNavigationItems]);

  const onItemExpanded = useCallback((e) => {
    const itemPath = e.itemData.path;
    setExpandedItems(prev => {
      if (!prev.includes(itemPath)) {
        return [...prev, itemPath];
      }
      return prev;
    });
  }, []);

  const onItemCollapsed = useCallback((e) => {
    const itemPath = e.itemData.path;
    setExpandedItems(prev => prev.filter(path => path !== itemPath));
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
          onItemCollapsed={onItemCollapsed}
          onContentReady={onMenuReady}
          width={'100%'}
          scrollDirection={'vertical'}
          showCheckBoxesMode={'none'}
          animationEnabled={true}
          key={`nav-${layoutType}-${transformedNavigationItems.length}-${compactMode}`}
        />
      </div>
    </div>
  );
}