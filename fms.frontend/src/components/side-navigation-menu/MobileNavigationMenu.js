import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { List } from 'devextreme-react/list';
import { TextBox } from 'devextreme-react/text-box';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNavigationItems } from '../../redux/actions/navigationActions';
import { useNavigation } from '../../contexts/navigation';
import './MobileNavigationMenu.scss';

const MobileNavigationMenu = ({ selectedItemChanged, onMenuReady }) => {
    const dispatch = useDispatch();
    const { navigationItems, loading } = useSelector((state) => state.navigation);
    const { user } = useSelector((state) => state.auth);
    const { navigationData: { currentPath } } = useNavigation();

    const [searchText, setSearchText] = useState('');
    const [expandedSections, setExpandedSections] = useState(new Set());
    const [breadcrumb, setBreadcrumb] = useState([]);

    useEffect(() => {
        if (user) {
            dispatch(fetchNavigationItems());
        }
    }, [user, dispatch]);

    useEffect(() => {
        if (onMenuReady) {
            onMenuReady();
        }
    }, [onMenuReady]);

    const transformNavigationItems = useMemo(() => {
        if (!navigationItems || navigationItems.length === 0) return [];

        const itemMap = {};
        const roots = [];

        // Create item map
        navigationItems.forEach(item => {
            itemMap[item.id] = {
                ...item,
                text: item.page.charAt(0).toUpperCase() + item.page.slice(1),
                path: item.link && item.link !== "''" ? item.link : '',
                icon: item.icon || 'fa-circle-o',
                children: []
            };
        });

        // Build hierarchy
        navigationItems.forEach(item => {
            if (item.parentId && itemMap[item.parentId]) {
                itemMap[item.parentId].children.push(itemMap[item.id]);
            } else if (!item.parentId) {
                roots.push(itemMap[item.id]);
            }
        });

        return roots;
    }, [navigationItems]);

    const filteredItems = useMemo(() => {
        if (!searchText) return transformNavigationItems;

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

        return filterItems(transformNavigationItems);
    }, [transformNavigationItems, searchText]);

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
        const isActive = currentPath === item.path;
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
    }, [expandedSections, currentPath, handleItemClick]);

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
                                className={`mobile-nav-item-content ${currentPath === item.path ? 'active' : ''} ${item.children && item.children.length > 0 ? 'has-children' : ''}`}
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