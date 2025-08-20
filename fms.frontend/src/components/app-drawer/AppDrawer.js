import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AppDrawer.scss";

const AppDrawer = ({ isOpen, onClose, buttonRef }) => {
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const [position, setPosition] = useState({ top: 70, left: 12 });

  const modules = [
    {
      id: 1,
      name: "Dashboard",
      icon: "fa-light fa-chart-line",
      route: "/home",
      color: "#0078d4"
    },
    {
      id: 2,
      name: "Vehicles",
      icon: "fa-light fa-car",
      route: "/vehicles",
      color: "#107c10"
    },
    {
      id: 3,
      name: "Employees",
      icon: "fa-light fa-users",
      route: "/employees",
      color: "#ff8c00"
    },
    {
      id: 4,
      name: "Automatic Fueling",
      icon: "fa-light fa-gas-pump",
      route: "/atg",
      color: "#d13438"
    },
    {
      id: 5,
      name: "Device Issues",
      icon: "fa-light fa-exclamation-triangle",
      route: "/issue-tracker",
      color: "#881798"
    },
    {
      id: 6,
      name: "Reports",
      icon: "fa-light fa-chart-bar",
      route: "/consumption",
      color: "#00bcf2"
    },
    {
      id: 7,
      name: "Tank Stock",
      icon: "fa-light fa-oil-can",
      route: "/tankstock",
      color: "#498205"
    },
    {
      id: 8,
      name: "Admin",
      icon: "fa-light fa-cog",
      route: "/admin",
      color: "#005a70"
    },
    {
      id: 9,
      name: "Task Management",
      icon: "fa-light fa-tasks",
      route: "/task-management",
      color: "#8764b8"
    },
    {
      id: 10,
      name: "Alarms",
      icon: "fa-light fa-bell",
      route: "/active-alarms",
      color: "#e74856"
    }
  ];

  // Calculate position relative to the button
  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      try {
        const buttonWrapper = buttonRef.current;
        const rect = buttonWrapper.getBoundingClientRect();
        const drawerWidth = window.innerWidth <= 768 ? Math.min(280, window.innerWidth * 0.9) : 320;
        const viewportWidth = window.innerWidth;
        
        // Position below the button, centered horizontally relative to button
        let leftPosition = rect.left + (rect.width / 2) - (drawerWidth / 2);
        
        // Enhanced mobile positioning
        if (window.innerWidth <= 768) {
          // On mobile, ensure drawer is always visible and well-positioned
          const margin = 10;
          if (leftPosition < margin) {
            leftPosition = margin;
          } else if (leftPosition + drawerWidth > viewportWidth - margin) {
            leftPosition = viewportWidth - drawerWidth - margin;
          }
        } else {
          // Desktop positioning
          if (leftPosition < 10) {
            leftPosition = 10;
          } else if (leftPosition + drawerWidth > viewportWidth - 10) {
            leftPosition = viewportWidth - drawerWidth - 10;
          }
        }

        setPosition({
          top: rect.bottom + 8, // 8px below the button
          left: leftPosition
        });
      } catch (error) {
        console.warn('Could not calculate button position, using fallback');
        // Fallback positioning based on screen size
        const viewportWidth = window.innerWidth;
        const drawerWidth = window.innerWidth <= 768 ? Math.min(280, viewportWidth * 0.9) : 320;
        setPosition({
          top: 70, // Fallback top position
          left: (viewportWidth - drawerWidth) / 2
        });
      }
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

  const handleModuleClick = (route) => {
    console.log('Navigating to:', route); // Debug log
    navigate(route);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="app-drawer-container"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      <div className="app-drawer" ref={drawerRef}>
        <div className="modules-grid">
          {modules.map((module) => (
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
