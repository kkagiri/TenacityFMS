import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StockManagementActions } from "./widget/StockManagementActions";

export const QuickActionButtons = ({ role, userPermissions }) => {
  const navigate = useNavigate();
  const [stockActionsVisible, setStockActionsVisible] = useState(false);

  // Define quick actions based on role
  const getQuickActions = () => {
    const fuelOperatorActions = [
      {
        id: "stock-management",
        label: "Stock Management Actions",
        icon: "fa-solid fa-warehouse",
        color: "#e91e63",
        bgColor: "#fce4ec",
        description: "Opening stock, closing stock, and other stock operations",
        roles: ["user", "admin", "management"],
        isStockManagement: true
      },
      {
        id: "fuel-issue",
        label: "Issue Fuel",
        icon: "fa-solid fa-gas-pump",
        color: "#2196f3",
        bgColor: "#e3f2fd",
        description: "Use PTS system for fuel dispensing",
        path: "/atg",
        roles: ["user"]
      },
      {
        id: "view-tanks",
        label: "Tank Status",
        icon: "fa-solid fa-gauge",
        color: "#4caf50",
        bgColor: "#e8f5e9",
        description: "Check current tank levels",
        path: "/tankstock",
        roles: ["user", "admin", "management", "guest"]
      },
      {
        id: "stock-analysis",
        label: "Stock Analysis",
        icon: "fa-solid fa-chart-line",
        color: "#ff9800",
        bgColor: "#fff3e0",
        description: "View stock analytics and trends",
        path: "/tankstock/stock-analytics",
        roles: ["user", "admin", "management"]
      },
      {
        id: "view-reports",
        label: "View Reports",
        icon: "fa-solid fa-file-text",
        color: "#9c27b0",
        bgColor: "#f3e5f5",
        description: "Access operational reports",
        path: "/reports",
        roles: ["user", "admin", "management"]
      }
    ];

    // Additional admin actions
    const adminActions = [
      {
        id: "user-management",
        label: "Manage Users",
        icon: "fa-solid fa-users",
        color: "#795548",
        bgColor: "#efebe9",
        description: "User administration",
        path: "/admin/users",
        roles: ["admin"]
      },
      {
        id: "system-config",
        label: "System Config",
        icon: "fa-solid fa-cogs",
        color: "#607d8b",
        bgColor: "#eceff1",
        description: "System configuration",
        path: "/admin/config",
        roles: ["admin"]
      },
      {
        id: "emergency-stop",
        label: "Emergency Stop",
        icon: "fa-solid fa-stop",
        color: "#d32f2f",
        bgColor: "#ffebee",
        description: "Emergency pump shutdown",
        roles: ["admin"],
        emergency: true
      }
    ];

    // Additional management actions
    const managementActions = [
      {
        id: "performance-review",
        label: "Performance Review",
        icon: "fa-solid fa-chart-pie",
        color: "#3f51b5",
        bgColor: "#e8eaf6",
        description: "Review performance metrics",
        path: "/reports/performance",
        roles: ["management"]
      },
      {
        id: "financial-overview",
        label: "Financial Overview",
        icon: "fa-solid fa-dollar-sign",
        color: "#009688",
        bgColor: "#e0f2f1",
        description: "Financial dashboard",
        path: "/finance/dashboard",
        roles: ["management"]
      }
    ];

    let allActions = [...fuelOperatorActions];

    if (role === "admin") {
      allActions = [...allActions, ...adminActions];
    } else if (role === "management") {
      allActions = [...allActions, ...managementActions];
    }

    // Filter actions based on role
    return allActions.filter(action => action.roles.includes(role));
  };

  const quickActions = getQuickActions();

  const handleActionClick = (actionId) => {
    const action = quickActions.find(a => a.id === actionId);

    if (!action) {
      console.log(`Action ${actionId} not found`);
      return;
    }

    // Handle stock management modal
    if (action.isStockManagement) {
      setStockActionsVisible(true);
      return;
    }

    // Handle special actions
    if (action.emergency) {
      if (window.confirm("Are you sure you want to initiate emergency pump shutdown?")) {
        console.log("Emergency stop initiated");
        // TODO: Add API call to emergency stop
      }
      return;
    }

    // Navigate to the action's path
    if (action.path) {
      navigate(action.path);
    } else {
      console.log(`No path defined for action: ${actionId}`);
    }
  };

  return (
    <>
      <div className="quick-actions-container">
        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className={`quick-action-btn ${action.emergency ? 'emergency' : ''}`}
              onClick={() => handleActionClick(action.id)}
              title={action.description}
              style={{
                '--action-color': action.color,
                '--action-bg-color': action.bgColor
              }}
            >
              <div className="action-icon">
                <i className={action.icon}></i>
              </div>
              <span className="action-label">{action.label}</span>
              {action.emergency && (
                <div className="emergency-indicator">
                  <i className="fa-solid fa-exclamation"></i>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Management Actions Modal */}
      <StockManagementActions
        visible={stockActionsVisible}
        onHiding={() => setStockActionsVisible(false)}
      />
    </>
  );
};