import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'devextreme-react/popup';
import { Button } from 'devextreme-react/button';
import { List } from 'devextreme-react/list';
import './SiteActionsMenu.scss';

const SiteActionsMenu = ({ siteId, siteName, onActionSelected, visible, onClose }) => {
  const [selectedAction, setSelectedAction] = useState(null);

  const siteActions = [
    {
      id: 'opening-stock',
      text: 'Opening Stock',
      icon: 'fa-light fa-door-open',
      description: 'Set opening stock levels for the site'
    },
    {
      id: 'closing-stock',
      text: 'Closing Stock',
      icon: 'fa-light fa-door-closed',
      description: 'Record closing stock levels'
    },
    {
      id: 'transfer',
      text: 'Transfer',
      icon: 'fa-light fa-exchange-alt',
      description: 'Transfer fuel between tanks'
    },
    {
      id: 'delivery',
      text: 'Delivery',
      icon: 'fa-light fa-truck',
      description: 'Record fuel delivery to site'
    },
    {
      id: 'manual-refill',
      text: 'Manual Refill',
      icon: 'fa-light fa-fill-drip',
      description: 'Manually adjust fuel levels'
    },
    {
      id: 'reconciliation',
      text: 'Stock Reconciliation',
      icon: 'fa-light fa-balance-scale',
      description: 'Reconcile stock differences'
    }
  ];

  const handleActionClick = (actionId) => {
    setSelectedAction(actionId);
    if (onActionSelected) {
      onActionSelected(actionId, siteId);
    }
    onClose();
  };

  const renderActionItem = (data) => {
    return (
      <div className="site-action-item">
        <div className="action-icon">
          <i className={data.icon}></i>
        </div>
        <div className="action-content">
          <div className="action-title">{data.text}</div>
          <div className="action-description">{data.description}</div>
        </div>
        <div className="action-arrow">
          <i className="fa-light fa-chevron-right"></i>
        </div>
      </div>
    );
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={false}
      closeOnOutsideClick={true}
      showCloseButton={true}
      showTitle={true}
      title={`Site Actions - ${siteName || 'Site'}`}
      width="auto"
      height="auto"
      position={{
        my: 'center',
        at: 'center',
        of: window
      }}
      className="site-actions-popup"
    >
      <div className="site-actions-content">
        <div className="site-actions-header">
          <i className="fa-light fa-building-columns tw-text-blue-600 tw-mr-2"></i>
          <span className="tw-font-semibold">Select an action for {siteName}</span>
        </div>
        
        <List
          dataSource={siteActions}
          itemRender={renderActionItem}
          onItemClick={(e) => handleActionClick(e.itemData.id)}
          className="site-actions-list"
        />
        
        <div className="site-actions-footer">
          <Button
            text="Cancel"
            icon="fa-light fa-times"
            onClick={onClose}
            type="normal"
            stylingMode="outlined"
          />
        </div>
      </div>
    </Popup>
  );
};

SiteActionsMenu.propTypes = {
  siteId: PropTypes.string,
  siteName: PropTypes.string,
  onActionSelected: PropTypes.func,
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired
};

SiteActionsMenu.defaultProps = {
  visible: false,
  siteId: null,
  siteName: 'Unknown Site',
  onActionSelected: () => {}
};

export default SiteActionsMenu;
