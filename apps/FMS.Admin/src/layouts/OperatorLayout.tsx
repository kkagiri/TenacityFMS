/**
 * File:          OperatorLayout.tsx
 * Purpose:       Inspinia-style shell for the standalone operator portal.
 * Dependencies:  react-router-dom, Redux auth state, useLayoutAttributes hook
 * Last Modified: 2026-05-16
 *
 * Key Functions:
 * - OperatorLayout(): Renders sidebar, topbar, and nested routes.
 *
 * The <html> data-* attributes are owned by useLayoutAttributes — see
 * apps/FMS.Admin/src/utils/useLayoutAttributes.ts and the canonical JS
 * version in apps/fms.frontend/src/hooks/. PRD §4.3.
 */

import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import useLayoutAttributes, {
  type SidenavSize,
} from "../utils/useLayoutAttributes";

const navItems = [
  { to: "/", label: "Dashboard", icon: "fa-light fa-gauge-high", end: true },
  { to: "/tenants", label: "Tenants", icon: "fa-light fa-building" },
  {
    to: "/device-providers",
    label: "Device Providers",
    icon: "fa-light fa-plug-circle-bolt",
  },
  {
    to: "/subscriptions",
    label: "Subscriptions",
    icon: "fa-light fa-file-invoice-dollar",
  },
  { to: "/invoices", label: "Invoices", icon: "fa-light fa-file-invoice" },
  { to: "/operator-users", label: "Operators", icon: "fa-light fa-user-shield" },
  { to: "/reports", label: "Reports", icon: "fa-light fa-chart-line" },
  { to: "/audit", label: "Audit Log", icon: "fa-light fa-shield-check" },
];

const MOBILE_BREAKPOINT_PX = 768;

function getIsLargeViewport(): boolean {
  if (typeof window === "undefined") return true;
  return window.innerWidth > MOBILE_BREAKPOINT_PX;
}

export default function OperatorLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [isLarge, setIsLarge] = useState<boolean>(getIsLargeViewport);
  // Tracks the user's explicit toggle of the sidebar. On desktop, false ⇒
  // condensed (icon-only) and true ⇒ default (full). On mobile this drives the
  // slide-in `is-sidebar-open` class. Default state mirrors fms.frontend:
  // open on desktop, closed on mobile.
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() =>
    getIsLargeViewport(),
  );

  useEffect(() => {
    const handleResize = () => {
      const large = getIsLargeViewport();
      setIsLarge(large);
      setIsSidebarOpen(large);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidenavSize: SidenavSize = useMemo(() => {
    if (!isLarge) return "offcanvas";
    return isSidebarOpen ? "default" : "condensed";
  }, [isLarge, isSidebarOpen]);

  useLayoutAttributes({ sidenavSize });

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const userLabel = user?.email || user?.userName || "Operator";
  const userInitial = userLabel.charAt(0).toUpperCase();
  const showMobileOpenClass = !isLarge && isSidebarOpen;

  return (
    <div
      className={`admin-shell inspinia-shell wrapper${
        showMobileOpenClass ? " is-sidebar-open" : ""
      }`}
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
            <div className="admin-shell__topbar-brand">
              <div className="admin-shell__topbar-mark">F</div>
              <div className="admin-shell__topbar-title">Platform Operations</div>
            </div>
          </div>
          <form className="admin-shell__search" role="search">
            <i
              className="fa-light fa-magnifying-glass admin-shell__search-icon"
              aria-hidden="true"
            />
            <input
              className="admin-shell__search-input"
              type="search"
              placeholder="Quick search..."
              aria-label="Quick search"
            />
          </form>
          <div className="admin-shell__topbar-actions">
            <button
              type="button"
              className="admin-shell__icon-button"
              aria-label="Notifications"
            >
              <i className="fa-light fa-bell" />
              <span className="admin-shell__notification-dot" />
            </button>
            <div className="admin-shell__profile" aria-label="User profile">
              <div className="admin-shell__avatar">{userInitial}</div>
              <div className="admin-shell__profile-meta">
                <span className="admin-shell__profile-name">{userLabel}</span>
                <span className="admin-shell__profile-role">Profile</span>
              </div>
            </div>
            <button
              type="button"
              className="m365-btn m365-btn--ghost"
              onClick={handleLogout}
            >
              <i className="fa-light fa-arrow-right-from-bracket" />
              <span>Sign out</span>
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
