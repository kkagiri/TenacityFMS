import React, { useState, useEffect } from "react";

export const RoleTicker = ({ role, roleColor, userName, masterTagName, stats }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tickerMessages, setTickerMessages] = useState([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Generate role-specific ticker messages
  useEffect(() => {
    const generateMessages = () => {
      const baseMessages = [
        `Welcome back, ${userName}! System status: Online`,
        `Current time: ${currentTime.toLocaleTimeString()}`,
        `Active alerts: ${stats.activeAlerts}`,
        `Today's transactions: ${stats.todayTransactions}`,
      ];

      let roleSpecificMessages = [];

      switch (role) {
        case "admin":
          roleSpecificMessages = [
            `🔧 Admin Dashboard Active - Full System Access`,
            `🛡️ Security Status: All systems secure`,
            `📊 System Health: All services operational`,
            `👥 ${stats.activeTags} active users currently logged in`,
            `🏷️ Master Tag: ${masterTagName || 'Not assigned'}`,
            `⚡ Database Status: Healthy - Last backup: 2 hours ago`,
            `🔄 System Update Available - Version 2.1.3`,
            `📈 Performance: CPU 45%, Memory 62%, Disk 78%`
          ];
          break;

        case "management":
          roleSpecificMessages = [
            `📊 Management Dashboard - Analytics & Reports Available`,
            `💰 Monthly fuel cost: $45,234 (↓ 8% from last month)`,
            `🚛 Fleet efficiency: 12.3 L/100km average`,
            `📈 Performance KPIs: 94% operational efficiency`,
            `⏱️ Average transaction time: 3.2 minutes`,
            `🎯 Monthly targets: 87% achieved`,
            `📋 Pending approvals: 3 requests waiting`,
            `🔍 Weekly audit scheduled for tomorrow`
          ];
          break;

        case "user":
          roleSpecificMessages = [
            `🚛 Operator Dashboard - Ready for fuel operations`,
            `⛽ 2 pumps available for dispensing`,
            `📝 Please complete vehicle inspection before fueling`,
            `🏷️ Your tag: ${masterTagName || 'Tag not assigned'}`,
            `⚠️ Tank 3 level below 50% - refill scheduled`,
            `✅ All safety checks completed`,
            `📊 Your shift: 8 transactions completed`,
            `🔔 Remember to update vehicle mileage after fueling`
          ];
          break;

        case "guest":
          roleSpecificMessages = [
            `👀 Guest Access - Limited view mode`,
            `📊 System overview available`,
            `ℹ️ Contact administrator for full access`,
            `🕐 Session expires in 30 minutes`,
            `📈 Public metrics available`,
            `🔒 Restricted access - read-only mode`
          ];
          break;

        default:
          roleSpecificMessages = [`🌟 Welcome to Hyoung FMS`];
      }

      const allMessages = [...baseMessages, ...roleSpecificMessages];
      setTickerMessages(allMessages);
    };

    generateMessages();
  }, [role, userName, masterTagName, stats, currentTime]);

  // Cycle through messages
  useEffect(() => {
    if (tickerMessages.length > 0) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % tickerMessages.length);
      }, 4000); // Change message every 4 seconds

      return () => clearInterval(interval);
    }
  }, [tickerMessages]);

  const getRoleIcon = () => {
    switch (role) {
      case "admin":
        return "fa-solid fa-crown";
      case "management":
        return "fa-solid fa-chart-line";
      case "user":
        return "fa-solid fa-user-gear";
      case "guest":
        return "fa-solid fa-eye";
      default:
        return "fa-solid fa-user";
    }
  };

  const getStatusColor = () => {
    if (stats.activeAlerts > 0) return "#f44336"; // Red for alerts
    if (stats.todayTransactions > 20) return "#4caf50"; // Green for high activity
    return "#2196f3"; // Blue for normal
  };

  return (
    <div className="role-ticker-container">
      <div
        className="role-ticker"
        style={{
          borderLeft: `4px solid ${roleColor}`,
          background: `linear-gradient(135deg, ${roleColor}15 0%, ${roleColor}25 100%)`
        }}
      >
        {/* Role Info Section */}
        <div className="ticker-role-info">
          <div className="role-avatar" style={{ backgroundColor: roleColor }}>
            <i className={getRoleIcon()}></i>
          </div>
          <div className="role-details">
            <div className="role-name" style={{ color: roleColor }}>
              {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
            </div>
            <div className="user-info">
              <span className="username">{userName}</span>
              {masterTagName && (
                <span className="tag-info">
                  <i className="fa-solid fa-tag"></i>
                  {masterTagName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="ticker-status">
          <div className="status-item">
            <div
              className="status-dot"
              style={{ backgroundColor: getStatusColor() }}
            ></div>
            <span>System Online</span>
          </div>
          <div className="status-item">
            <i className="fa-solid fa-clock"></i>
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Scrolling Messages */}
        <div className="ticker-messages">
          <div className="message-container">
            {tickerMessages.length > 0 && (
              <div className="scrolling-message">
                <span className="message-text">
                  {tickerMessages[currentMessageIndex]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="ticker-quick-stats">
          <div className="quick-stat">
            <i className="fa-solid fa-bell"></i>
            <span>{stats.activeAlerts}</span>
          </div>
          <div className="quick-stat">
            <i className="fa-solid fa-file"></i>
            <span>{stats.todayTransactions}</span>
          </div>
          <div className="quick-stat">
            <i className="fa-solid fa-tag"></i>
            <span>{stats.activeTags}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
