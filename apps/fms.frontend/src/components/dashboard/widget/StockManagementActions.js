import React, { useState } from "react";
import { Popup } from "devextreme-react/popup";

// Import the existing stock forms (all using default exports)
import OpeningStockForm from "../../../pages/tankStock/forms/OpeningStockForm";
import ClosingStockForm from "../../../pages/tankStock/forms/ClosingStockForm";
import TankDeliveryForm from "../../../pages/tankStock/forms/TankDeliveryForm";
import TankTransferForm from "../../../pages/tankStock/forms/TankTransferForm";
import ManualRefillForm from "../../../pages/tankStock/forms/ManualRefillForm";

// Stock Management Actions Modal Component
export const StockManagementActions = ({ visible, onHiding }) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionPopupVisible, setActionPopupVisible] = useState(false);

  const stockActions = [
    {
      id: "opening",
      title: "Opening Stock",
      description: "Record opening stock for a tank",
      icon: "fa-solid fa-lock-open",
      color: "#2196f3",
      Component: OpeningStockForm
    },
    {
      id: "closing",
      title: "Closing Stock",
      description: "Record closing stock for a tank",
      icon: "fa-solid fa-lock",
      color: "#4caf50",
      Component: ClosingStockForm
    },
    {
      id: "delivery",
      title: "Tank Delivery",
      description: "Record fuel delivery to tank",
      icon: "fa-solid fa-truck",
      color: "#ff9800",
      Component: TankDeliveryForm
    },
    {
      id: "transfer",
      title: "Tank Transfer",
      description: "Transfer fuel between tanks",
      icon: "fa-solid fa-exchange-alt",
      color: "#9c27b0",
      Component: TankTransferForm
    },
    {
      id: "manual",
      title: "Manual Refill",
      description: "Manual fuel refill entry",
      icon: "fa-solid fa-edit",
      color: "#f44336",
      Component: ManualRefillForm
    }
  ];

  const handleActionClick = (action) => {
    setSelectedAction(action);
    setActionPopupVisible(true);
  };

  const handleActionComplete = () => {
    setActionPopupVisible(false);
    setSelectedAction(null);
    // Optionally refresh data or show success message
  };

  const handleActionCancel = () => {
    setActionPopupVisible(false);
    setSelectedAction(null);
  };

  return (
    <>
      {/* Main Stock Management Actions Modal */}
      <Popup
        visible={visible}
        onHiding={onHiding}
        title="Stock Management Actions"
        width="90%"
        maxWidth="800px"
        height="auto"
        maxHeight="80vh"
        showCloseButton={true}
        dragEnabled={true}
        resizeEnabled={false}
        position={{ my: 'center', at: 'center', of: window }}
      >
        <div className="stock-actions-grid">
          {stockActions.map((action) => (
            <div
              key={action.id}
              className="stock-action-card"
              onClick={() => handleActionClick(action)}
              style={{ borderLeft: `4px solid ${action.color}` }}
            >
              <div className="action-header">
                <div className="action-icon" style={{ color: action.color }}>
                  <i className={action.icon}></i>
                </div>
                <h3 className="action-title">{action.title}</h3>
              </div>
              <p className="action-description">{action.description}</p>
              <div className="action-arrow">
                <i className="fa-solid fa-chevron-right"></i>
              </div>
            </div>
          ))}
        </div>
      </Popup>

      {/* Individual Action Form Popup */}
      {selectedAction && (
        <Popup
          visible={actionPopupVisible}
          onHiding={handleActionCancel}
          title={selectedAction.title}
          width="90%"
          maxWidth="800px"
          height="auto"
          maxHeight="85vh"
          showCloseButton={true}
          dragEnabled={true}
          resizeEnabled={false}
          position={{ my: 'center', at: 'center', of: window }}
        >
          <selectedAction.Component
            onSubmit={handleActionComplete}
            onCancel={handleActionCancel}
            isLoading={false}
          />
        </Popup>
      )}

      <style>{`
        .stock-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          padding: 1rem;
        }

        .stock-action-card {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .stock-action-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .action-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .action-icon {
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 50%;
        }

        .action-title {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #333;
        }

        .action-description {
          color: #666;
          margin: 0.5rem 0 0 0;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .action-arrow {
          position: absolute;
          top: 50%;
          right: 1rem;
          transform: translateY(-50%);
          color: #ccc;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .stock-actions-grid {
            grid-template-columns: 1fr;
            padding: 0.5rem;
          }

          .stock-action-card {
            padding: 1rem;
          }
        }
      `}</style>
    </>
  );
};
