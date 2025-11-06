import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./AppDrawer.scss";

const AppDrawer = ({ isOpen, onClose, buttonRef }) => {
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const containerRef = useRef(null); // Add ref for the container
  const [position, setPosition] = useState({ top: 70, left: 12 });
  const [drawerHeight, setDrawerHeight] = useState(100); // State for dynamic height

  // Get current user from Redux store
  const currentUser = useSelector(state => state.auth.user);

  // Get user roles, handle both 'roles' and 'Roles' properties
  const userRoles = currentUser?.roles || currentUser?.Roles || [];

  // If roles are not yet loaded, do not default to 'guest'.
  // Instead, treat as if no role is assigned, preventing the drawer from showing guest-only modules.
  const primaryRole = userRoles.length > 0 ? userRoles[0].toLowerCase() : null;

  const modules = [
    {
      id: 1,
      name: "Dashboard",
      icon: "fa-light fa-chart-line",
      route: "/home",
      color: "#0078d4",
      roles: ["admin", "management", "user", "guest","poweruser"] // Available to all roles
    },
    {
      id: 2,
      name: "Vehicles",
      icon: "fa-light fa-car",
      route: "/vehicles",
      color: "#107c10",
      roles: ["admin", "management", "user","poweruser"] // Not available to guests
    },
    {
      id: 3,
      name: "Employees",
      icon: "fa-light fa-users",
      route: "/employees",
      color: "#ff8c00",
      roles: ["admin", "management","user","poweruser"] // to allow users to see employees for assignment
    },
    {
      id: 4,
      name: "Automatic Fueling",
      icon: "fa-light fa-gas-pump",
      route: "/atg",
      color: "#d13438",
      roles: ["admin", "management", "user","poweruser"] // Operators need access to fueling
    },
    {
      id: 5,
      name: "Device Issues",
      icon: "fa-light fa-exclamation-triangle",
      route: "/issue-tracker",
      color: "#881798",
      roles: ["admin", "management", "user","poweruser"] // Users can report issues
    },
    {
      id: 6,
      name: "Reports",
      icon: "fa-light fa-chart-pie",
      route: "/reports",
      color: "#7c3aed",
      roles: ["admin", "management", "user"] // Users can view basic reports
    },
    {
      id: 7,
      name: "Tank Stock",
      icon: "fa-light fa-oil-can",
      route: "/tankstock",
      color: "#498205",
      roles: ["admin", "management", "user","poweruser"] // Users need tank stock access
    },
    {
      id: 8,
      name: "Admin",
      icon: "fa-light fa-cog",
      route: "/admin",
      color: "#005a70",
      roles: ["admin"] // ADMIN ONLY
    },
    {
      id: 9,
      name: "Task Management",
      icon: "fa-light fa-tasks",
      route: "/task-management",
      color: "#8764b8",
      roles: ["admin", "management", "user","poweruser"] // All roles can manage tasks
    },
    {
      id: 10,
      name: "Alarms",
      icon: "fa-light fa-bell",
      route: "/active-alarms",
      color: "#e74856",
      roles: ["admin", "management", "user","poweruser"] // All roles should see alarms
    },
    {
      id: 11,
      name: "Maintenance",
      icon: "fa-light fa-wrench",
      route: "/maintenance",
      color: "#ea580c",
      roles: ["admin", "management", "user", "poweruser"] // All users can access maintenance
    }
  ];

  // Filter modules based on user role
  const filteredModules = modules.filter(module =>
    module.roles.includes(primaryRole)
  );

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
  }  return (
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
        zIndex: 999999,
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
    </div>
  );
};

export default AppDrawer;
