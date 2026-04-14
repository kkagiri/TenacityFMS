/**
 * File: AppDrawer.js
 * Purpose: Renders the launcher-style app drawer and filters module visibility by user permissions.
 * Dependencies: react, react-dom, react-router-dom, usePermissions hook
 * Last Modified: 2026-03-25
 *
 * Key Functions:
 * - AppDrawer(): Positions the drawer and shows only modules the current user can access
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import "./AppDrawer.scss";
import { usePermissions } from "../../hooks/usePermissions";
import { WEB_APP_PERMISSIONS } from "../../constants/webAppPermissions";

const AppDrawer = ({ isOpen, onClose, buttonRef }) => {
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const containerRef = useRef(null); // Add ref for the container
  const [position, setPosition] = useState({ top: 70, left: 12 });
  const [drawerHeight, setDrawerHeight] = useState(100); // State for dynamic height
  const { hasAnyPermission, isAuthenticated } = usePermissions();

  const modules = useMemo(() => [
    {
      id: 1,
      name: "Dashboard",
      icon: "fa-light fa-chart-line",
      route: "/home",
      color: "#0078d4",
      webAppPermission: WEB_APP_PERMISSIONS.DASHBOARD,
      legacyPermissions: ["_View_Dashboard", "Dashboard Module"]
    },
    {
      id: 2,
      name: "Vehicles",
      icon: "fa-light fa-car",
      route: "/vehicles",
      color: "#107c10",
      webAppPermission: WEB_APP_PERMISSIONS.VEHICLES,
      legacyPermissions: ["Vehicle Module", "VehicleTrackingModule", "VehicleMaintenanceModule", "VehicleDocumentsModule", "VehicleTransferModule", "VehicleHealthModule", "GeofenceModule", "_Read_Vehicle", "_Read_VehicleTracking", "_Read_VehicleTrips", "_Read_VehicleMaintenance", "_Read_VehicleDocuments", "_Read_VehicleTransfer", "_Read_Geofence"]
    },
    {
      id: 3,
      name: "Employees",
      icon: "fa-light fa-users",
      route: "/employees",
      color: "#ff8c00",
      webAppPermission: WEB_APP_PERMISSIONS.EMPLOYEES,
      legacyPermissions: ["Employee Module", "_Read_Employee"]
    },
    {
      id: 4,
      name: "Automatic Fueling",
      icon: "fa-light fa-gas-pump",
      route: "/atg",
      color: "#d13438",
      webAppPermission: WEB_APP_PERMISSIONS.FUELING,
      legacyPermissions: ["ATG", "FuelRefil", "FuelingRuleModule", "PTSServiceModule", "PushDeviceModule", "_Manage_ATG", "_Read_PTSDevice", "_Read_FuelingRule", "_Read_FuelRefill"]
    },
    {
      id: 5,
      name: "Device Issues",
      icon: "fa-light fa-exclamation-triangle",
      route: "/issue-tracker",
      color: "#881798",
      webAppPermission: WEB_APP_PERMISSIONS.ISSUES,
      legacyPermissions: ["IssueTracker", "IssueManagementV2Module", "_Read_Issues", "_Manage_Issues"]
    },
    {
      id: 6,
      name: "Reports",
      icon: "fa-light fa-chart-pie",
      route: "/reports",
      color: "#7c3aed",
      webAppPermission: WEB_APP_PERMISSIONS.REPORTS,
      legacyPermissions: ["Data Analysis Module", "ReportingModule", "ReportModule", "StockReportModule", "TankVolumeHistoryModule", "_Read_Reporting", "_Generate_Report", "_Read_VehicleConsumptionReport", "_Read_FuelRefillReport", "_Read_TankVolumeHistory", "_Read_PTSDevice"]
    },
    {
      id: 7,
      name: "Tank Stock",
      icon: "fa-light fa-oil-can",
      route: "/tankstock",
      color: "#498205",
      webAppPermission: WEB_APP_PERMISSIONS.TANK_STOCK,
      legacyPermissions: ["TankStockModule", "TankReconciliationModule", "FuelComparisonModule", "FuelAuditModule", "DailyTankReconciliationModule", "TankVolumeDataCorrectionModule", "TankVolumeHistoryModule", "_Read_TankStock", "_Read_FuelComparison", "_Read_FuelAudit", "_Read_TankVolumeHistory"]
    },
    {
      id: 8,
      name: "Admin",
      icon: "fa-light fa-cog",
      route: "/admin",
      color: "#005a70",
      webAppPermission: WEB_APP_PERMISSIONS.ADMIN,
      legacyPermissions: []
    },

    {
      id: 10,
      name: "Events",
      icon: "fa-light fa-bell",
      route: "/event-expressions",
      color: "#e74856",
      webAppPermission: WEB_APP_PERMISSIONS.EVENTS,
      legacyPermissions: ["_Read_EventExpression", "_Manage_ATG"]
    },
    {
      id: 11,
      name: "Maintenance",
      icon: "fa-light fa-wrench",
      route: "/maintenance",
      color: "#ea580c",
      webAppPermission: WEB_APP_PERMISSIONS.MAINTENANCE,
      legacyPermissions: ["VehicleMaintenanceModule", "Vehicle Module", "_Read_VehicleMaintenance", "_Read_Vehicle"]
    }
  ], []);

  const filteredModules = useMemo(() => {
    if (!isAuthenticated) {
      return [];
    }

    const result = modules.filter((module) => {
      return hasAnyPermission([module.webAppPermission]) || hasAnyPermission(module.legacyPermissions);
    });
    return result;
  }, [hasAnyPermission, isAuthenticated, modules]);

  // Calculate dynamic height based on number of modules
  const calculateDrawerHeight = useCallback(() => {
    const moduleCount = filteredModules.length;
    const rowCount = Math.ceil(moduleCount / 2); // 2 columns in grid

    // Responsive module heights based on screen size
    let moduleHeight, padding, gap;

    if (window.innerWidth <= 480) {
      // Very small screens
      moduleHeight = 68;
      padding = 12;
      gap = 4;
    } else if (window.innerWidth <= 768) {
      // Mobile screens
      moduleHeight = 72;
      padding = 12;
      gap = 4;
    } else {
      // Desktop screens
      moduleHeight = 80;
      padding = 12;
      gap = 4;
    }

    // Calculate total height: padding + (rows * module height) + (gaps between rows)
    const totalHeight = (padding * 2) + (rowCount * moduleHeight) + ((rowCount - 1) * gap);

    return Math.max(totalHeight, 100); // Minimum height of 100px
  }, [filteredModules.length]);

  // Update drawer height when modules change or window resizes
  useEffect(() => {
    const updateHeight = () => {
      setDrawerHeight(calculateDrawerHeight());
    };

    updateHeight(); // Initial calculation

    // Recalculate on window resize for responsive behavior
    const handleResize = () => updateHeight();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [filteredModules.length, calculateDrawerHeight]); // Recalculate when number of modules changes

  // Calculate position relative to the button
  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const calculatePosition = () => {
        try {
          const buttonWrapper = buttonRef.current;
          const rect = buttonWrapper.getBoundingClientRect();
          const drawerWidth = window.innerWidth <= 768 ? Math.min(280, window.innerWidth * 0.9) : 320;
          const viewportWidth = window.innerWidth;
          const isFirefox = navigator.userAgent.includes('Firefox');

          // Firefox-specific positioning adjustments
          let topPosition, leftPosition;

          if (isFirefox) {
            // Firefox getBoundingClientRect() returns correct values
            // Use the button rect directly for more accurate positioning
            topPosition = rect.bottom + 8; // 8px below the button
            leftPosition = rect.left + (rect.width / 2) - (drawerWidth / 2);
          } else {
            // Standard positioning for other browsers
            topPosition = rect.bottom + 8;
            leftPosition = rect.left + (rect.width / 2) - (drawerWidth / 2);
          }

          // Enhanced mobile and boundary positioning
          if (window.innerWidth <= 768) {
            // On mobile, ensure drawer is always visible and well-positioned
            const margin = 10;
            if (leftPosition < margin) {
              leftPosition = margin;
            } else if (leftPosition + drawerWidth > viewportWidth - margin) {
              leftPosition = viewportWidth - drawerWidth - margin;
            }
          } else {
            // Desktop positioning with boundary checks
            if (leftPosition < 10) {
              leftPosition = 10;
            } else if (leftPosition + drawerWidth > viewportWidth - 10) {
              leftPosition = viewportWidth - drawerWidth - 10;
            }
          }

          const newPosition = {
            top: topPosition,
            left: leftPosition
          };

          setPosition(newPosition);

          // Firefox positioning enforcement
          if (isFirefox) {
            setTimeout(() => {
              const drawerElement = containerRef.current || document.querySelector('.app-drawer-container');
              if (drawerElement) {
                drawerElement.style.setProperty('top', `${topPosition}px`, 'important');
                drawerElement.style.setProperty('left', `${leftPosition}px`, 'important');
                drawerElement.style.setProperty('position', 'fixed', 'important');
              }
            }, 50);
          }
        } catch (error) {
          console.warn('Could not calculate button position, using fallback', error);
          // Enhanced fallback positioning
          const viewportWidth = window.innerWidth;
          const drawerWidth = window.innerWidth <= 768 ? Math.min(280, viewportWidth * 0.9) : 320;

          const fallbackPosition = {
            top: 60, // Standard fallback top position
            left: (viewportWidth - drawerWidth) / 2 // Center horizontally
          };
          setPosition(fallbackPosition);
        }
      };

      // Calculate position immediately for both browsers
      calculatePosition();
    }
  }, [isOpen, buttonRef]);  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && drawerRef.current && !drawerRef.current.contains(event.target)) {
        // Check if the click was on the button that opens the drawer
        const buttonElement = buttonRef?.current;
        if (buttonElement && buttonElement.contains(event.target)) {
          return; // Don't close if clicking the button itself
        }
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside); // Add touch support
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  // Additional useEffect for Firefox positioning enforcement
  useEffect(() => {
    if (isOpen && navigator.userAgent.includes('Firefox')) {
      const drawerElement = containerRef.current || document.querySelector('.app-drawer-container');
      if (drawerElement && position.top && position.left) {
        // Force apply positioning for Firefox
        drawerElement.style.setProperty('top', `${position.top}px`, 'important');
        drawerElement.style.setProperty('left', `${position.left}px`, 'important');
        drawerElement.style.setProperty('position', 'fixed', 'important');
      }
    }
  }, [isOpen, position]);

  const handleModuleClick = (route) => {
    navigate(route);
    onClose();
  };

  if (!isOpen) {
    return null;
  } return ReactDOM.createPortal(
    <div
      ref={containerRef}
      className="app-drawer-container"
      style={{
        '--drawer-top': `${position.top}px`,
        '--drawer-left': `${position.left}px`,
        top: `${position.top}px`,
        left: `${position.left}px`,
        // Force visibility in problematic browsers
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        pointerEvents: 'auto',
        zIndex: 100000,
        // Firefox-specific positioning overrides
        position: 'fixed',
        transform: 'none',
        // Ensure proper rendering
        willChange: 'auto'
      }}
    >
      <div
        className="app-drawer"
        ref={drawerRef}
        style={{
          // Additional inline styles for browser compatibility
          display: 'block',
          visibility: 'visible',
          transform: 'translateZ(0)',
          // Firefox-specific fixes
          position: 'relative',
          zIndex: 'auto',
          // Dynamic height based on number of modules
          height: `${drawerHeight}px`,
          minHeight: `${drawerHeight}px`
        }}
      >
        <div className="modules-grid">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              className="module-item"
              onClick={() => handleModuleClick(module.route)}
              onTouchEnd={() => handleModuleClick(module.route)} // Add touch support
              style={{ '--module-color': module.color }}
            >
              <div className="module-icon">
                <i className={module.icon}></i>
              </div>
              <div className="module-name">{module.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AppDrawer;
