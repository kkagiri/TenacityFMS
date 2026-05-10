import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from 'devextreme-react/button';

//Cursor - Quick Action Panel component for fast stock operations (Phase 1 placeholder)
const QuickActionPanel = ({ onActionComplete, selectedSite, sites, tanks }) => {
  const [showActionMenu, setShowActionMenu] = useState(false);

  const quickActions = [
    {
      id: 'opening-stock',
      title: 'Opening Stock',
      icon: 'fa-light fa-door-open',
      description: 'Record opening stock for tanks'
    },
    {
      id: 'closing-stock',
      title: 'Closing Stock',
      icon: 'fa-light fa-door-closed',
      description: 'Record closing stock for tanks'
    },
    {
      id: 'delivery',
      title: 'Fuel Delivery',
      icon: 'fa-light fa-truck',
      description: 'Record fuel delivery'
    },
    {
      id: 'transfer',
      title: 'Tank Transfer',
      icon: 'fa-light fa-exchange',
      description: 'Transfer fuel between tanks'
    }
  ];

  const handleActionClick = (actionId) => {
    // Placeholder for quick actions - will be implemented in later phases
    console.log(`Quick action: ${actionId}`);
    setShowActionMenu(false);
    if (onActionComplete) {
      onActionComplete({ actionId, timestamp: new Date() });
    }
  };

  return (
    <div className="tw-fixed tw-bottom-6 tw-right-6 tw-z-50">
      {showActionMenu && (
        <div className="tw-mb-4 tw-bg-white tw-rounded-lg tw-shadow-xl tw-border tw-p-4 tw-min-w-[300px]">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
            Quick Actions
          </h3>
          <div className="tw-space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                className="tw-w-full tw-flex tw-items-center tw-p-3 tw-text-left tw-rounded-lg tw-border tw-border-gray-200 hover:tw-bg-gray-50 tw-transition-colors"
              >
                <div className="tw-mr-3">
                  <i className={`${action.icon} tw-text-blue-600 tw-text-xl`}></i>
                </div>
                <div>
                  <div className="tw-font-medium tw-text-gray-800">{action.title}</div>
                  <div className="tw-text-sm tw-text-gray-600">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        icon={showActionMenu ? "fa-light fa-times" : "fa-light fa-plus"}
        stylingMode="contained"
        type="default"
        width={56}
        height={56}
        onClick={() => setShowActionMenu(!showActionMenu)}
        hint={showActionMenu ? "Close quick actions" : "Quick actions"}
        elementAttr={{
          class: 'tw-rounded-full tw-shadow-lg'
        }}
      />
    </div>
  );
};

QuickActionPanel.propTypes = {
  onActionComplete: PropTypes.func,
  selectedSite: PropTypes.string,
  sites: PropTypes.array,
  tanks: PropTypes.array
};

export default QuickActionPanel;