import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './QuickActionPanel.scss';

//Cursor - Fix: Added React import to resolve useState error
const QuickActionPanel = ({ title, actions = [] }) => {
  const [activeAction, setActiveAction] = useState(null);

  const handleActionClick = (actionId) => {
    setActiveAction(actionId);
    if (actions.find(a => a.id === actionId)?.onClick) {
      actions.find(a => a.id === actionId).onClick();
    }
  };

  return (
    <div className="quick-action-panel">
      <div className="quick-action-panel__header">
        <h3 className="quick-action-panel__title">{title}</h3>
      </div>
      <div className="quick-action-panel__actions">
        {actions.map((action) => (
          <button
            key={action.id}
            className={`quick-action-panel__action-btn quick-action-panel__action-btn--${action.type || 'secondary'}`}
            onClick={() => handleActionClick(action.id)}
            disabled={action.disabled}
          >
            {action.icon && <span className="action-icon">{action.icon}</span>}
            {action.label}
          </button>
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
      type: PropTypes.string,
      disabled: PropTypes.bool
    })
  )
};

export default QuickActionPanel;