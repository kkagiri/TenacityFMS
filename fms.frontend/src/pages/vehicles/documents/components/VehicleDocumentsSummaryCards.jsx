/**
 * File: VehicleDocumentsSummaryCards.jsx
 * Purpose: Status summary cards for the vehicle compliance workbench.
 * Dependencies: React.
 * Last Modified: 2026-03-25
 */

import React from "react";

const VehicleDocumentsSummaryCards = ({ stats, selectedStatus, onStatusChange }) => {
  const cards = [
    { key: "all", label: "All records", value: stats.total, helper: `${stats.vehicles} vehicles in scope` },
    { key: "valid", label: "Done / valid", value: stats.valid, helper: "Compliant documents" },
    { key: "expiring", label: "Due soon", value: stats.expiring, helper: "Inside alert window" },
    { key: "expired", label: "Expired", value: stats.expired, helper: "Immediate action required" },
  ];

  return (
    <div className="vehicle-documents-page__cards">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          className={`vehicle-documents-page__card${selectedStatus === card.key ? " vehicle-documents-page__card--active" : ""}`}
          onClick={() => onStatusChange(card.key)}
        >
          <span className="vehicle-documents-page__card-label">{card.label}</span>
          <strong>{card.value}</strong>
          <span>{card.helper}</span>
        </button>
      ))}
    </div>
  );
};

export default VehicleDocumentsSummaryCards;
