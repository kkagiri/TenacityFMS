import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TreeView from 'devextreme-react/tree-view';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '../../contexts/navigation';
import { fetchNavigationItems } from '../../redux/actions/navigationActions';
import { CUSTOMER_NAVIGATION_ITEMS } from '../../constants/customerNavigation';
import './SideNavigationMenu.scss';
import * as events from 'devextreme/events';

const normalizeNavigationTree = (navigationItems) => {
  if (!Array.isArray(navigationItems) || navigationItems.length === 0) {
    return [];
  }

  const mappedItems = navigationItems.map((item) => ({
    id: item.id,
    text: item.page || item.pageName || item.text || '',
    path: item.link || item.path || '',
    icon: item.icon || null,
    parentId: item.parentId || null,
    items: [],
  }));

  const itemsById = new Map(mappedItems.map((item) => [item.id, item]));
  const roots = [];

  mappedItems.forEach((item) => {
    if (item.parentId && itemsById.has(item.parentId)) {
      itemsById.get(item.parentId).items.push(item);
      return;
    }

    roots.push(item);
  });

  return roots;
};

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

  const location = useLocation();
  const dispatch = useDispatch();
  const { navigationItems } = useSelector((state) => state.navigation);
  const { user } = useSelector((state) => state.auth);
  // 3-Audience: Customer-tenant users see a scoped sidebar.
  const tenantKind = useSelector((state) => state.tenantContext?.tenantKind ?? "client");
  const isCustomerView = tenantKind === "customer";
  const { navigationData: { currentPath } } = useNavigation();
  const [expandedItems, setExpandedItems] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`nav-expanded-items-${layoutType}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchNavigationItems());
    }
  }, [dispatch, user]);

  useEffect(() => {
    try {
      sessionStorage.setItem(`nav-expanded-items-${layoutType}`, JSON.stringify(expandedItems));
    } catch {
      // Ignore storage errors.
    }
  }, [expandedItems, layoutType]);

  const transformedNavigationItems = useMemo(() => {
    if (isCustomerView) {
      return CUSTOMER_NAVIGATION_ITEMS;
    }

    const tree = normalizeNavigationTree(navigationItems);
    return tree;
  }, [navigationItems, isCustomerView]);

  const selectedPath = useMemo(() => {
    const activePath = currentPath || location.pathname;
    const findMatch = (items) => {
      for (const item of items) {
        if (item.path && (activePath === item.path || activePath.startsWith(`${item.path}/`))) {
          return item.path;
        }

        if (item.items?.length) {
          const nestedMatch = findMatch(item.items);
          if (nestedMatch) {
            return nestedMatch;
          }
        }
      }

      return null;
    };

    return findMatch(transformedNavigationItems) || activePath;
  }, [currentPath, location.pathname, transformedNavigationItems]);

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

    if (selectedPath !== undefined) {
      treeView.selectItem(selectedPath);
    }

    if (compactMode) {
      treeView.collapseAll();
      return;
    }

    expandedItems.forEach((itemPath) => {
      treeView.expandItem(itemPath);
    });
  }, [compactMode, expandedItems, selectedPath, transformedNavigationItems]);

  const onItemExpanded = useCallback((e) => {
    const itemPath = e.itemData.path;
    if (!itemPath) {
      return;
    }

    setExpandedItems((previous) => {
      if (previous.includes(itemPath)) {
        return previous;
      }

      return [...previous, itemPath];
    });
  }, []);

  const onItemCollapsed = useCallback((e) => {
    const itemPath = e.itemData.path;
    if (!itemPath) {
      return;
    }

    setExpandedItems((previous) => previous.filter((path) => path !== itemPath));
  }, []);

  const onItemClick = useCallback((e) => {
    selectedItemChanged(e);
  }, [selectedItemChanged]);

  return (
    <div
      id="app-menu"
      className={`dx-swatch-additional side-navigation-menu app-menu${compactMode ? " is-condensed" : ""}`}
      ref={getWrapperRef}
    >
      {children}
      <div className="side-navigation-menu__brand">
        <div className="side-navigation-menu__brand-mark">F</div>
        <span className="side-navigation-menu__brand-title">FMS</span>
      </div>
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