import React from "react";

const NozzleIcon = ({
  className = "",
  color = "currentColor",
  fuelType = "diesel",
}) => {
  // Define colors for different fuel types
  const fuelColors = {
    diesel: "#ffd700", // Gold for diesel
    petrol: "#ff6b6b", // Red for petrol
    default: "#6c757d", // Gray for default
  };

  const iconColor = fuelColors[fuelType.toLowerCase()] || fuelColors.default;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke={color}
      strokeWidth="2"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Nozzle body */}
      <path d="M30 50 L70 50" stroke={iconColor} />

      {/* Nozzle head */}
      <path d="M70 45 L85 45 L85 55 L70 55" stroke={iconColor} />

      {/* Fuel type indicator */}
      <circle cx="50" cy="50" r="5" fill={iconColor} />

      {/* Handle */}
      <path d="M30 45 L30 55" stroke={iconColor} />

      {/* Trigger */}
      <path d="M25 48 L30 48" stroke={iconColor} />
    </svg>
  );
};

export default NozzleIcon;
