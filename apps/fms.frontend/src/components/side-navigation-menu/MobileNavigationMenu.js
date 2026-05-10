import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { List } from 'devextreme-react/list';
import { TextBox } from 'devextreme-react/text-box';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '../../contexts/navigation';
import { fetchNavigationItems } from '../../redux/actions/navigationActions';
import { CUSTOMER_NAVIGATION_ITEMS } from '../../constants/customerNavigation';
import './MobileNavigationMenu.scss';

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
        children: [],
    }));

    const itemsById = new Map(mappedItems.map((item) => [item.id, item]));
    const roots = [];

    mappedItems.forEach((item) => {
        if (item.parentId && itemsById.has(item.parentId)) {
            itemsById.get(item.parentId).children.push(item);
            return;
        }

        roots.push(item);
    });

    return roots;
};

const MobileNavigationMenu = ({ selectedItemChanged, onMenuReady }) => {
    const location = useLocation();
    const dispatch = useDispatch();
    const { navigationItems: rawNavigationItems, loading } = useSelector((state) => state.navigation);
    const { user } = useSelector((state) => state.auth);
    const tenantKind = useSelector((state) => state.tenantContext?.tenantKind ?? 'client');
    const isCustomerView = tenantKind === 'customer';
    const { navigationData: { currentPath } } = useNavigation();

    const [searchText, setSearchText] = useState('');
    const [expandedSections, setExpandedSections] = useState(new Set());

    useEffect(() => {
        if (onMenuReady) {
            onMenuReady();
        }
    }, [onMenuReady]);

    useEffect(() => {
        if (user) {
            dispatch(fetchNavigationItems());
        }
    }, [dispatch, user]);

    const navigationItems = useMemo(() => {
        if (!isCustomerView) {
            return normalizeNavigationTree(rawNavigationItems);
        }

        return CUSTOMER_NAVIGATION_ITEMS.map((item) => ({ ...item, children: [] }));
    }, [rawNavigationItems, isCustomerView]);

    const filteredItems = useMemo(() => {
        if (!searchText) return navigationItems;

        const filterItems = (items) => {
            return items.reduce((acc, item) => {
                const matchesSearch = item.text.toLowerCase().includes(searchText.toLowerCase());
                const filteredChildren = filterItems(item.children || []);

                if (matchesSearch || filteredChildren.length > 0) {
                    acc.push({
                        ...item,
                        children: filteredChildren
                    });
                }
                return acc;
            }, []);
        };

        return filterItems(navigationItems);
    }, [navigationItems, searchText]);

    const activeRootPath = useMemo(() => {
        const activePath = currentPath || location.pathname;
        const findMatch = (items) => {
            for (const item of items) {
                if (item.path && (activePath === item.path || activePath.startsWith(`${item.path}/`))) {
                    return item.path;
                }

                if (item.children?.length) {
                    const nestedMatch = findMatch(item.children);
                    if (nestedMatch) {
                        return nestedMatch;
                    }
                }
            }

            return null;
        };

        return findMatch(navigationItems) || activePath;
    }, [currentPath, location.pathname, navigationItems]);

    const toggleSection = useCallback((itemId) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    }, []);

    const handleItemClick = useCallback((item) => {
        if (item.children && item.children.length > 0) {
            toggleSection(item.id);
        } else if (item.path) {
            selectedItemChanged({ itemData: item });
        }
    }, [selectedItemChanged, toggleSection]);

    const renderNavigationItem = useCallback((item, level = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedSections.has(item.id);
        const isActive = activeRootPath === item.path;
        const paddingLeft = level * 20 + 16;

        return (
            <div key={item.id} className="mobile-nav-item">
                <div
                    className={`mobile-nav-item-content ${isActive ? 'active' : ''} ${hasChildren ? 'has-children' : ''}`}
                    style={{ paddingLeft: `${paddingLeft}px` }}
                    onClick={() => handleItemClick(item)}
                >
                    <div className="mobile-nav-item-left">
                        {item.icon && (
                            <i className={`fa ${item.icon} mobile-nav-icon`}></i>
                        )}
                        <span className="mobile-nav-text">{item.text}</span>
                    </div>
                    {hasChildren && (
                        <i className={`fa ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} mobile-nav-arrow`}></i>
                    )}
                </div>
                {hasChildren && isExpanded && (
                    <div className="mobile-nav-children">
                        {item.children.map(child => renderNavigationItem(child, level + 1))}
                    </div>
                )}
            </div>
        );
    }, [activeRootPath, expandedSections, handleItemClick]);

    const flattenItems = (items, level = 0) => {
        return items.reduce((acc, item) => {
            acc.push({ ...item, level });
            if (item.children && expandedSections.has(item.id)) {
                acc.push(...flattenItems(item.children, level + 1));
            }
            return acc;
        }, []);
    };

    const listItems = useMemo(() => flattenItems(filteredItems), [filteredItems, expandedSections]);

    if (loading) {
        return (
            <div className="mobile-nav-container">
                <div className="mobile-nav-loading">
                    <i className="fa fa-spinner fa-spin"></i>
                    <span>Loading navigation...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mobile-nav-container">
            {/* Search */}
            <div className="mobile-nav-search">
                <TextBox
                    placeholder="Search navigation..."
                    value={searchText}
                    onValueChanged={(e) => setSearchText(e.value)}
                    showClearButton={true}
                >
                    <div slot="before">
                        <i className="fa fa-search"></i>
                    </div>
                </TextBox>
            </div>

            {/* Navigation Items */}
            <div className="mobile-nav-list">
                {filteredItems.length === 0 ? (
                    <div className="mobile-nav-empty">
                        {searchText ? 'No items found' : 'No navigation items available'}
                    </div>
                ) : (
                    <List
                        dataSource={listItems}
                        keyExpr="id"
                        showSelectionControls={false}
                        itemRender={(item) => (
                            <div
                                className={`mobile-nav-item-content ${activeRootPath === item.path ? 'active' : ''} ${item.children && item.children.length > 0 ? 'has-children' : ''}`}
                                style={{ paddingLeft: `${item.level * 20 + 16}px` }}
                                onClick={() => handleItemClick(item)}
                            >
                                <div className="mobile-nav-item-left">
                                    {item.icon && (
                                        <i className={`fa ${item.icon} mobile-nav-icon`}></i>
                                    )}
                                    <span className="mobile-nav-text">{item.text}</span>
                                </div>
                                {item.children && item.children.length > 0 && (
                                    <i className={`fa ${expandedSections.has(item.id) ? 'fa-chevron-up' : 'fa-chevron-down'} mobile-nav-arrow`}></i>
                                )}
                            </div>
                        )}
                    />
                )}
            </div>

            {/* Quick Actions */}
            {searchText && (
                <div className="mobile-nav-quick-actions">
                    <button
                        className="mobile-nav-clear-search"
                        onClick={() => setSearchText('')}
                    >
                        <i className="fa fa-times"></i>
                        Clear Search
                    </button>
                </div>
            )}
        </div>
    );
};

export default MobileNavigationMenu;