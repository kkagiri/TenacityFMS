/**
 * File: EventExpressionsLayout.js
 * Purpose: Layout shell for the Event Expressions module.
 *          Mirrors AdminLayout.js — full-height sidebar left, main content right.
 *          Violet/purple gradient theme.
 * Dependencies: react-router-dom, navigationHelper
 * Last Modified: 2026-02-19
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isActiveRoute, navigationGroups } from '../utils/navigationHelper';
import './EventExpressionsLayout.scss';

const EventExpressionsLayout = ({ children, currentPath }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const getPageInfo = () => {
        const pathname = location.pathname;
        if (pathname.includes('/active-events')) {
            return { title: 'Active Events', subtitle: 'Monitor and manage live event alerts' };
        } else if (pathname.includes('/create')) {
            return { title: 'Create Expression', subtitle: 'Define a new event expression rule' };
        } else if (pathname.includes('/edit')) {
            return { title: 'Edit Expression', subtitle: 'Modify event expression configuration' };
        } else if (pathname.includes('/executions')) {
            return { title: 'Execution History', subtitle: 'Audit log of expression evaluations' };
        } else if (pathname.includes('/expressions')) {
            return { title: 'Event Expressions', subtitle: 'Configure rules that trigger notifications and events' };
        } else if (pathname.includes('/types')) {
            return { title: 'Event Types', subtitle: 'Available event types and their configurable conditions' };
        } else {
            return { title: 'Event Engine Dashboard', subtitle: 'Overview of event activity and expression performance' };
        }
    };

    const { title, subtitle } = getPageInfo();

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="event-expressions-layout">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="ee-mobile-overlay" onClick={() => setMobileOpen(false)} />
            )}

            {/* Mobile edge toggle — blue arrow tab on left edge, slides with sidebar */}
            <button
                className={`ee-mobile-toggle ${mobileOpen ? 'open' : ''}`}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            >
                <i className={`fa-light ${mobileOpen ? 'fa-angles-left' : 'fa-angles-right'}`}></i>
            </button>

            {/* Sidebar */}
            <aside className={`ee-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                {/* Header */}
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <i className="fa-light fa-radar"></i>
                        {!sidebarCollapsed && (
                            <span className="tw-text-lg tw-font-semibold tw-ml-2">Event Engine</span>
                        )}
                    </div>
                    <button
                        className="collapse-btn"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <i className={`fa-light ${sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`}></i>
                    </button>
                </div>

                {/* Navigation */}
                <div className="sidebar-content">
                    <div className="nav-group">
                        {!sidebarCollapsed && <div className="group-label">Main</div>}
                        <nav className="nav-menu">
                            {navigationGroups.main.map((item) => {
                                const isActive = isActiveRoute(currentPath, item.path);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleNavigation(item.path)}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                        title={sidebarCollapsed ? item.title : ''}
                                    >
                                        <div className="nav-item-content">
                                            <i className={item.icon}></i>
                                            {!sidebarCollapsed && <span>{item.title}</span>}
                                        </div>
                                        {!sidebarCollapsed && item.badge && (
                                            <span className={`nav-badge ${item.badge === 'Live' ? 'live' : ''}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="nav-separator"></div>

                    <div className="nav-group">
                        {!sidebarCollapsed && <div className="group-label">Operations</div>}
                        <nav className="nav-menu">
                            {navigationGroups.operations.map((item) => {
                                const isActive = isActiveRoute(currentPath, item.path);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleNavigation(item.path)}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                        title={sidebarCollapsed ? item.title : ''}
                                    >
                                        <div className="nav-item-content">
                                            <i className={item.icon}></i>
                                            {!sidebarCollapsed && <span>{item.title}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ee-main">
                <header className="main-header">
                    <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-px-6 tw-py-3">
                        <div className="tw-flex-shrink-0">
                            <h1 className="tw-text-xl tw-font-bold tw-text-gray-800">{title}</h1>
                            {subtitle && (
                                <p className="tw-text-sm tw-text-gray-500 tw-mt-0.5">{subtitle}</p>
                            )}
                        </div>
                    </div>
                </header>
                <div className="main-content">{children}</div>
            </main>
        </div>
    );
};

export default EventExpressionsLayout;