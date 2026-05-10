import React from "react";

const PumpIcon = ({ className = "", color = "currentColor" }) => {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      stroke={color}
      strokeWidth="2"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base */}
      <rect x="20" y="80" width="60" height="20" rx="2" />

      {/* Main body */}
      <rect x="25" y="30" width="50" height="50" rx="2" />

      {/* Display screen */}
      <rect x="30" y="35" width="40" height="20" rx="1" />

      {/* Keypad */}
      <rect x="35" y="60" width="30" height="15" rx="1" />
      <line x1="45" y1="60" x2="45" y2="75" />
      <line x1="55" y1="60" x2="55" y2="75" />

      {/* Nozzle holder */}
      <rect x="75" y="40" width="10" height="30" rx="2" />

      {/* Nozzle */}
      <path d="M75 50 Q85 50, 85 60 L85 65" />
      <path d="M85 65 L90 65 L90 55 L85 55" />

      {/* Hose */}
      <path d="M75 55 C85 55, 85 45, 75 45" strokeDasharray="2 2" />
    </svg>
  );
};

export default PumpIcon;
