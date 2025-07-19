import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'devextreme-react/popup';
import StockAdjustmentForm from '../../components/forms/StockAdjustmentForm';
import './TankActionsMenu.scss';

// AI-Generated: Custom Dropdown Menu for Tank Actions
const TankActionsMenu = ({
  tank,
  onViewTransactions,
  onStockReconciliation,
  onEditTank,
  onStockAdjustmentSubmit
}) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const menuRef = useRef(null);

  const menuItems = [
    {
      text: 'View Transactions',
      icon: 'fa-light fa-list',
      onClick: () => onViewTransactions(tank)
    },
    {
      text: 'Stock Reconciliation',
      icon: 'fa-light fa-balance-scale',
      onClick: () => onStockReconciliation(tank)
    },
    {
      text: 'Stock Adjustment',
      icon: 'fa-light fa-clipboard-list',
      onClick: () => setShowStockAdjustment(true)
    },
    {
      text: 'Edit Tank',
      icon: 'fa-light fa-edit',
      onClick: () => onEditTank(tank)
    }
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuItemClick = (item) => {
    console.log(`Executing action: ${item.text}`);
    item.onClick();
    setMenuOpen(false);
  };

  const handleStockAdjustmentSubmit = async (adjustmentData) => {
    try {
      const result = await onStockAdjustmentSubmit({
        ...adjustmentData,
        tankId: tank.id,
        siteId: tank.siteId
      });
      if (result?.success) {
        setShowStockAdjustment(false);
      }
      return result;
    } catch (error) {
      console.error('Error in stock adjustment:', error);
      throw error;
    }
  };

  return (
    <div className="tank-actions-menu" ref={menuRef}>
      <button
        className="actions-button"
        onClick={() => setMenuOpen(!isMenuOpen)}
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
      >
        <i className="fa-light fa-ellipsis-vertical"></i>
      </button>

      {isMenuOpen && (
        <div className="actions-dropdown">
          <ul>
            {menuItems.map((item) => (
              <li key={item.text}>
                <button onClick={() => handleMenuItemClick(item)}>
                 {item.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Popup
        visible={showStockAdjustment}
        onHiding={() => setShowStockAdjustment(false)}
        dragEnabled={true}
        hideOnOutsideClick={false}
        showCloseButton={true}
        title={`Stock Adjustment - ${tank.name}`}
        width="auto"
        height="auto"
        maxWidth="800px"
        maxHeight="90vh"
        className="stock-adjustment-popup"
      >
        <StockAdjustmentForm
          onSubmit={handleStockAdjustmentSubmit}
          onCancel={() => setShowStockAdjustment(false)}
          isVisible={true}
          preSelectedTank={{
            tankId: tank.id,
            siteId: tank.siteId
          }}
        />
      </Popup>
    </div>
  );
};

TankActionsMenu.propTypes = {
  tank: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    siteId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  onViewTransactions: PropTypes.func.isRequired,
  onStockReconciliation: PropTypes.func.isRequired,
  onEditTank: PropTypes.func.isRequired,
  onStockAdjustmentSubmit: PropTypes.func.isRequired
};

export default TankActionsMenu;