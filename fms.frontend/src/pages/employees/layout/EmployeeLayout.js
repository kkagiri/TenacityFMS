/**
 * File: EmployeeLayout.js
 * Purpose: Provides shared sidebar and header layout for all employee module routes.
 * Dependencies: react-router-dom, employee navigation helper, EmployeeSearchBar.
 * Last Modified: 2026-02-16
 *
 * Key Components:
 * - EmployeeLayout(): Wraps employee pages with orange-themed navigation and header.
 */

import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  employeeRoutes,
  isActiveRoute,
  navigationGroups,
} from "../utils/navigationHelper";
import EmployeeSearchBar from "../shared/EmployeeSearchBar";
import "./EmployeeLayout.scss";

const EmployeeLayout = ({ children, currentPath, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth <= 768
  );

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSidebarCollapsed(mobile);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (sidebarCollapsed || !isMobile) return;

    const onOutsideClick = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarCollapsed(true);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [isMobile, sidebarCollapsed]);

  useEffect(() => {
    if (sidebarCollapsed || !isMobile) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarCollapsed(true);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMobile, sidebarCollapsed]);

  const getPageInfo = () => {
    const pathname = location.pathname;

    if (pathname.includes("/list")) {
      return {
        title: "Employee List",
        subtitle: "Manage records, assignments, and employee profile details.",
      };
    }

    if (pathname.includes("/consumption-history")) {
      return {
        title: "Employee Consumption History",
        subtitle: "Review fueling activity and employee fuel usage trends.",
      };
    }

    if (pathname.includes("/details")) {
      return {
        title: "Employee Details",
        subtitle: "Consumption, refill, and vehicle change history for employee.",
      };
    }

    return {
      title: "Employee Dashboard",
      subtitle: "Overview of workforce activity, assignments, and performance.",
    };
  };

  const { title, subtitle } = getPageInfo();
  const finalTitle = pageTitle || title;
  const finalSubtitle = pageSubtitle || subtitle;

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  const renderNavigationGroup = (items, groupKey) =>
    items.map((item) => {
      const active = isActiveRoute(currentPath, item.path);

      return (
        <button
          type="button"
          key={`${groupKey}-${item.id}`}
          className={`employee-nav-item ${active ? "active" : ""}`}
          onClick={() => handleNavigation(item.path)}
          title={sidebarCollapsed ? item.title : ""}
        >
          <div className="employee-nav-item__content">
            <i className={item.icon}></i>
            {!sidebarCollapsed && <span>{item.title}</span>}
          </div>
        </button>
      );
    });

  return (
    <div className="employee-layout">
      <aside
        ref={sidebarRef}
        className={`employee-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
      >
        <div className="employee-sidebar__header">
          <div className="employee-sidebar__brand">
            <i className="fa-light fa-users"></i>
            {!sidebarCollapsed && <span>Employee Hub</span>}
          </div>

          <button
            type="button"
            className="employee-sidebar__toggle"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i
              className={`fa-light ${
                sidebarCollapsed ? "fa-angles-right" : "fa-angles-left"
              }`}
            ></i>
          </button>
        </div>

        <div className="employee-sidebar__content">
          <div className="employee-nav-group">
            {!sidebarCollapsed && (
              <div className="employee-nav-group__label">Main</div>
            )}
            <nav>{renderNavigationGroup(navigationGroups.main, "main")}</nav>
          </div>

          <div className="employee-sidebar__separator"></div>

          <div className="employee-nav-group">
            {!sidebarCollapsed && (
              <div className="employee-nav-group__label">History</div>
            )}
            <nav>{renderNavigationGroup(navigationGroups.history, "history")}</nav>
          </div>

          {!sidebarCollapsed && (
            <button
              type="button"
              className="employee-sidebar__cta"
              onClick={() => handleNavigation(`${employeeRoutes.list}#add-employee`)}
            >
              <i className="fa-light fa-user-plus"></i>
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </aside>

      {!sidebarCollapsed && isMobile && (
        <div
          className="employee-sidebar-overlay"
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        ></div>
      )}

      <main className="employee-main">
        <header className="employee-main__header">
          <div className="employee-main__title-wrap">
            <h1 className="employee-main__title">{finalTitle}</h1>
            <p className="employee-main__subtitle">{finalSubtitle}</p>
          </div>

          <div className="employee-main__search">
            <EmployeeSearchBar />
          </div>
        </header>

        <section className="employee-main__content">{children}</section>
      </main>
    </div>
  );
};

export default EmployeeLayout;
