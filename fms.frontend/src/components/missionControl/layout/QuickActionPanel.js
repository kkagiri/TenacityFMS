import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from 'devextreme-react/button';
import './QuickActionPanel.scss';

//Cursor - Fix: Added React import to resolve useState error
const QuickActionPanel = ({ title, actions = [] }) => {
  const [activeAction, setActiveAction] = useState(null);

  const handleActionClick = (action) => {
    setActiveAction(action.id);
    if (action.onClick) {
      action.onClick();
    }
  };

  return (
    <div className="quick-action-panel">
      <div className="quick-action-panel__header">
        <h3 className="quick-action-panel__title">{title}</h3>
      </div>
      <div className="quick-action-panel__actions">
        {actions.map((action) => (
          <Button
            key={action.id}
            text={action.label}
            icon={action.icon}
            onClick={() => handleActionClick(action)}
            disabled={action.disabled}
            type={action.isPrimary ? 'default' : 'normal'}
            stylingMode={action.isPrimary ? 'contained' : 'outlined'}
            className={`quick-action-panel__action-btn tw-mr-3 tw-mb-2 ${
              action.criticality === 'HIGH'
                ? 'tw-bg-red-600 tw-text-white hover:tw-bg-red-700'
                : action.criticality === 'MEDIUM'
                ? 'tw-bg-orange-600 tw-text-white hover:tw-bg-orange-700'
                : 'tw-bg-blue-600 tw-text-white hover:tw-bg-blue-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

QuickActionPanel.propTypes = {
  title: PropTypes.string.isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func,
      isPrimary: PropTypes.bool,
      criticality: PropTypes.oneOf(['HIGH', 'MEDIUM', 'LOW']),
      disabled: PropTypes.bool,
      requiresConfirmation: PropTypes.bool,
      estimatedTime: PropTypes.string
    })
  )
};

export default QuickActionPanel;