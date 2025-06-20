import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Popup, Position } from 'devextreme-react/popup';
import Button from 'devextreme-react/button';
import DropDownButton from 'devextreme-react/drop-down-button';
import notify from 'devextreme/ui/notify';
import './QuickActionsMenu.scss';

//Cursor - Quick actions menu for stock management operations (opening, closing, transfer, deliveries)
const QuickActionsMenu = ({
  onActionComplete,
  selectedSite,
  sites,
  tanks,
  permissions = []
}) => {
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const quickActions = [
    {
      id: 'opening-stock',
      title: 'Opening Stock',
      icon: 'fa-light fa-door-open',
      description: 'Record opening stock for tanks',
      permission: '_createOpeningStock',
      color: 'tw-text-green-600'
    },
    {
      id: 'closing-stock',
      title: 'Closing Stock',
      icon: 'fa-light fa-door-closed',
      description: 'Record closing stock for tanks',
      permission: '_createClosingStock',
      color: 'tw-text-orange-600'
    },
    {
      id: 'delivery',
      title: 'Fuel Delivery',
      icon: 'fa-light fa-truck',
      description: 'Record fuel delivery',
      permission: '_createDelivery',
      color: 'tw-text-blue-600'
    },
    {
      id: 'transfer',
      title: 'Tank Transfer',
      icon: 'fa-light fa-exchange',
      description: 'Transfer fuel between tanks',
      permission: '_createTransfer',
      color: 'tw-text-purple-600'
    }
  ];

  // Filter actions based on permissions
  const availableActions = quickActions.filter(action =>
    !action.permission || permissions.includes(action.permission)
  );

  const handleActionSelect = (actionId) => {
    const action = quickActions.find(a => a.id === actionId);
    setSelectedAction(action);
    setShowActionDialog(true);
  };

  const handleActionConfirm = () => {
    if (selectedAction) {
      // Placeholder for action implementation - will be connected to actual services
      console.log(`Executing action: ${selectedAction.id} for site: ${selectedSite}`);

      // Simulate action completion
      notify(`${selectedAction.title} action initiated successfully`, 'success', 3000);

      if (onActionComplete) {
        onActionComplete({
          actionId: selectedAction.id,
          actionTitle: selectedAction.title,
          siteId: selectedSite,
          timestamp: new Date()
        });
      }
    }

    setShowActionDialog(false);
    setSelectedAction(null);
  };

  const handleActionCancel = () => {
    setShowActionDialog(false);
    setSelectedAction(null);
  };

  // Create dropdown items for the button
  const dropdownItems = availableActions.map(action => ({
    ...action,
    text: action.title,
    icon: action.icon
  }));

  const onItemClick = (e) => {
    handleActionSelect(e.itemData.id);
  };

  if (availableActions.length === 0) {
    return null; // Don't render if no actions are available
  }

  const selectedSiteName = selectedSite === 'all'
    ? 'All Sites'
    : sites.find(s => s.id === selectedSite)?.name || 'Unknown Site';

  return (
    <>
      <DropDownButton
        text="Quick Actions"
        icon="fa-light fa-bolt"
        stylingMode="contained"
        type="default"
        items={dropdownItems}
        onItemClick={onItemClick}
        width={140}
        hint="Quick stock management actions"
        elementAttr={{
          class: 'quick-actions-dropdown'
        }}
      />

      {/* Action Confirmation Dialog */}
      <Popup
        visible={showActionDialog}
        onHiding={handleActionCancel}
        dragEnabled={false}
        closeOnOutsideClick={false}
        showTitle={true}
        title={selectedAction ? `Confirm ${selectedAction.title}` : 'Confirm Action'}
        width={450}
        height={300}
        showCloseButton={true}
      >
        <Position
          my="center"
          at="center"
          of={window}
        />

        <div className="tw-p-6">
          {selectedAction && (
            <>
              <div className="tw-flex tw-items-center tw-mb-4">
                <div className="tw-mr-4">
                  <i className={`${selectedAction.icon} ${selectedAction.color} tw-text-3xl`}></i>
                </div>
                <div>
                  <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
                    {selectedAction.title}
                  </h3>
                  <p className="tw-text-sm tw-text-gray-600">
                    {selectedAction.description}
                  </p>
                </div>
              </div>

              <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-mb-6">
                <div className="tw-space-y-2 tw-text-sm">
                  <div>
                    <span className="tw-font-medium tw-text-gray-700">Site:</span> {' '}
                    <span className="tw-text-gray-600">{selectedSiteName}</span>
                  </div>
                  <div>
                    <span className="tw-font-medium tw-text-gray-700">Available Tanks:</span> {' '}
                    <span className="tw-text-gray-600">
                      {selectedSite === 'all'
                        ? tanks.length
                        : tanks.filter(t => t.siteId === selectedSite).length} tanks
                    </span>
                  </div>
                  <div>
                    <span className="tw-font-medium tw-text-gray-700">Action Date:</span> {' '}
                    <span className="tw-text-gray-600">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-p-3 tw-rounded-lg tw-mb-6">
                <div className="tw-flex tw-items-start">
                  <i className="fa-light fa-exclamation-triangle tw-text-yellow-600 tw-mt-1 tw-mr-2"></i>
                  <div className="tw-text-sm tw-text-yellow-800">
                    <p className="tw-font-medium">Please Note:</p>
                    <p>This action will be recorded in the system and may affect stock calculations. Ensure all information is accurate before proceeding.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="tw-flex tw-justify-end tw-space-x-3">
            <Button
              text="Cancel"
              stylingMode="outlined"
              onClick={handleActionCancel}
            />
            <Button
              text={`Proceed with ${selectedAction?.title || 'Action'}`}
              icon="fa-light fa-check"
              type="default"
              stylingMode="contained"
              onClick={handleActionConfirm}
            />
          </div>
        </div>
      </Popup>
    </>
  );
};

QuickActionsMenu.propTypes = {
  onActionComplete: PropTypes.func,
  selectedSite: PropTypes.string,
  sites: PropTypes.array,
  tanks: PropTypes.array,
  permissions: PropTypes.array
};

QuickActionsMenu.defaultProps = {
  sites: [],
  tanks: [],
  permissions: []
};

export default QuickActionsMenu;