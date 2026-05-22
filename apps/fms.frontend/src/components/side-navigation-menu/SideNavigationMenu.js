/**
 * File:          SideNavigationMenu.js
 * Purpose:       Backend-driven Inspinia side navigation for feature routes.
 * Dependencies:  React Router, DevExtreme TreeView, Redux navigation state
 * Last Modified: 2026-05-17
 *
 * Key Functions:
 * - SideNavigationMenu(): Renders tenant/customer navigation items in the shell sidebar.
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TreeView from 'devextreme-react/tree-view';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '../../contexts/navigation';
import { fetchNavigationItems } from '../../redux/actions/navigationActions';
import { CUSTOMER_NAVIGATION_ITEMS } from '../../constants/customerNavigation';
import { mergeNavigationPlaceholders } from '../../constants/navigationPlaceholders';
import './SideNavigationMenu.scss';
import * as events from 'devextreme/events';

const MENU_ICON_BY_PATH = Object.freeze({
  '/home': 'fa-light fa-gauge-high',
  '/dashboard': 'fa-light fa-gauge-high',
  '/vehicles': 'fa-light fa-cars',
  '/tankstock': 'fa-light fa-gas-pump',
  '/reports': 'fa-light fa-chart-line',
  '/users': 'fa-light fa-users',
  '/sites': 'fa-light fa-location-dot',
  '/tanks': 'fa-light fa-oil-can-drip',
  '/notifications': 'fa-light fa-bell',
  '/settings': 'fa-light fa-gear',
  '/finance': 'fa-light fa-wallet',
  '/fuel': 'fa-light fa-fuel-pump',
});

const normalizeIconClass = (iconValue) => {
  if (typeof iconValue !== 'string') {
    return null;
  }

  const normalizedValue = iconValue.trim();
  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.includes('fa-') && normalizedValue.includes(' ')) {
    return normalizedValue;
  }

  if (normalizedValue.startsWith('fa-')) {
    return `fa-light ${normalizedValue}`;
  }

  return normalizedValue;
};

const getFallbackIcon = (item) => {
  const normalizedPath = String(item.path || '').toLowerCase();
  const matchedPath = Object.keys(MENU_ICON_BY_PATH).find(
    (path) => normalizedPath === path || normalizedPath.startsWith(`${path}/`)
  );

  if (matchedPath) {
    return MENU_ICON_BY_PATH[matchedPath];
  }

  const normalizedText = String(item.text || '').toLowerCase();

  if (normalizedText.includes('vehicle')) return 'fa-light fa-cars';
  if (normalizedText.includes('tank')) return 'fa-light fa-gas-pump';
  if (normalizedText.includes('report')) return 'fa-light fa-chart-line';
  if (normalizedText.includes('user')) return 'fa-light fa-users';
  if (normalizedText.includes('site')) return 'fa-light fa-location-dot';
  if (normalizedText.includes('setting')) return 'fa-light fa-gear';
  if (normalizedText.includes('notification')) return 'fa-light fa-bell';
  if (normalizedText.includes('fuel')) return 'fa-light fa-fuel-pump';

  return 'fa-light fa-grid-2';
};

const resolveNavigationIcon = (item) => {
  const explicitIcon = normalizeIconClass(item.icon);
  if (explicitIcon) {
    return explicitIcon;
  }

  if (item.parentId) {
    return null;
  }

  return getFallbackIcon(item);
};

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
    return mergeNavigationPlaceholders(tree);
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

  const renderNavigationItem = useCallback((item) => {
    const iconClass = resolveNavigationIcon(item);

    return (
      <div className={`side-navigation-menu__item-body${item.parentId ? ' side-navigation-menu__item-body--nested' : ''}`}>
        {iconClass ? (
          <span className="menu-icon" aria-hidden="true">
            <i className={iconClass} />
          </span>
        ) : (
          <span className="menu-icon menu-icon--spacer" aria-hidden="true" />
        )}
        <span className="menu-text">{item.text}</span>
      </div>
    );
  }, []);

  return (
    <div
      id="app-menu"
      className={`dx-swatch-additional side-navigation-menu app-menu${compactMode ? " is-condensed" : ""}`}
      ref={getWrapperRef}
    >
      {children}
      <div className="side-navigation-menu__brand">
        <div className="side-navigation-menu__brand-mark">T</div>
        <span className="side-navigation-menu__brand-title">Tenacy FMS</span>
      </div>
      <div className="side-navigation-menu__nav-label">Menu</div>
      <div className={'menu-container'}>
        <TreeView
          ref={treeViewRef}
          items={transformedNavigationItems}
          keyExpr={'path'}
          itemRender={renderNavigationItem}
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
