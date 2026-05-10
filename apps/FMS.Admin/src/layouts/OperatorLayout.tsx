/**
 * File:          OperatorLayout.tsx
 * Purpose:       Inspinia-style shell for the standalone operator portal.
 * Dependencies:  react-router-dom, Redux auth state
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - OperatorLayout(): Renders sidebar, topbar, and nested routes.
 */

import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

const navItems = [
  { to: "/", label: "Dashboard", icon: "fa-light fa-gauge-high", end: true },
  { to: "/tenants", label: "Tenants", icon: "fa-light fa-building" },
  {
    to: "/subscriptions",
    label: "Subscriptions",
    icon: "fa-light fa-file-invoice-dollar",
  },
  { to: "/reports", label: "Reports", icon: "fa-light fa-chart-line" },
  { to: "/audit", label: "Audit Log", icon: "fa-light fa-shield-check" },
];

export default function OperatorLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const layoutAttributes = {
      "data-layout": "basic-left",
      "data-menu-color": "dark",
      "data-topbar-color": "light",
      "data-sidenav-size": "default",
      "data-layout-position": "fixed",
      "data-layout-width": "fluid",
      "data-footer-position": "scrollable",
    };

    Object.entries(layoutAttributes).forEach(([attribute, value]) => {
      root.setAttribute(attribute, value);
    });

    return () => {
      Object.keys(layoutAttributes).forEach((attribute) => {
        root.removeAttribute(attribute);
      });
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div
      className={`admin-shell wrapper${isSidebarOpen ? " is-sidebar-open" : ""}`}
    >
      <aside
        id="app-menu"
        className="admin-shell__sidebar app-menu"
        aria-label="Operator navigation"
      >
        <div className="admin-shell__brand">
          <div className="admin-shell__brand-mark">F</div>
          <div>
            <div className="admin-shell__brand-title">FMS Admin</div>
            <div className="admin-shell__brand-subtitle">Operator portal</div>
          </div>
        </div>
        <div className="admin-shell__nav-label">Menu</div>
        <nav className="admin-shell__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-shell__nav-item${isActive ? " is-active" : ""}`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              <i className={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <button
        type="button"
        className="admin-shell__overlay"
        aria-label="Close navigation menu"
        onClick={() => setIsSidebarOpen(false)}
      />
      <div className="admin-shell__main page-content">
        <header className="admin-shell__topbar app-header">
          <div className="admin-shell__topbar-left">
            <button
              type="button"
              className="m365-btn admin-shell__menu-button"
              aria-label="Toggle navigation menu"
              onClick={() => setIsSidebarOpen((current) => !current)}
            >
              <i className="fa-light fa-bars" />
            </button>
            <div className="admin-shell__topbar-title">Platform Operations</div>
          </div>
          <div className="admin-shell__user">
            <span>{user?.email || user?.userName || "Operator"}</span>
            <button
              type="button"
              className="m365-btn m365-btn--ghost"
              onClick={handleLogout}
            >
              <i className="fa-light fa-arrow-right-from-bracket" />
              Sign out
            </button>
          </div>
        </header>
        <main className="admin-shell__content main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
