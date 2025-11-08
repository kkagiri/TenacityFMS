import React from "react";

const DocumentStatusBadge = ({ status }) => {
  let badgeClass = "";
  let badgeText = "";

  switch (status) {
    case "Valid":
      badgeClass = "tw-bg-green-100 tw-text-green-800";
      badgeText = "Valid";
      break;
    case "ExpiringSoon":
      badgeClass = "tw-bg-yellow-100 tw-text-yellow-800";
      badgeText = "Expiring Soon";
      break;
    case "Expired":
      badgeClass = "tw-bg-red-100 tw-text-red-800";
      badgeText = "Expired";
      break;
    default:
      badgeClass = "tw-bg-gray-100 tw-text-gray-800";
      badgeText = "Unknown";
  }

  return (
    <span
      className={`tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-rounded-full ${badgeClass}`}
    >
      {badgeText}
    </span>
  );
};

export default DocumentStatusBadge;
