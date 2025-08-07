import React, { useState } from "react";
import { CheckBox, SelectBox, NumberBox } from "devextreme-react";
import notificationPreferencesApi from "../../../api/notificationPreferencesApi";

const NotificationCategoryCard = ({ category, preference, errors, onChange }) => {
  const [expanded, setExpanded] = useState(false);

  if (!preference) {
    return null;
  }

  const deliveryMethods = notificationPreferencesApi.getDeliveryMethods();
  const priorityLevels = notificationPreferencesApi.getPriorityLevels();

  // Helper to handle delivery method changes
  const handleDeliveryMethodChange = (methodId, isChecked) => {
    const currentMethods = Array.isArray(preference.deliveryMethods)
      ? preference.deliveryMethods
      : [];

    let newMethods;
    if (isChecked) {
      newMethods = [...currentMethods, methodId];
    } else {
      newMethods = currentMethods.filter(m => m !== methodId);
    }

    onChange(category.id, 'deliveryMethods', newMethods);
  };

  // Helper to format time for display
  const formatTime = (timeSpan) => {
    if (!timeSpan) return null;

    // If it's a TimeSpan string like "22:00:00", extract HH:mm
    if (typeof timeSpan === 'string' && timeSpan.includes(':')) {
      return timeSpan.substring(0, 5); // Get HH:mm part
    }

    return timeSpan;
  };

  // Helper to handle time changes
  const handleTimeChange = (field, value) => {
    // Convert time input to TimeSpan format (HH:mm:ss)
    if (value && !value.includes(':')) {
      value = `${value}:00`;
    }
    onChange(category.id, field, value);
  };

  return (
    <div className="category-card">
      <div className="card-header" onClick={() => setExpanded(!expanded)}>
        <div className="category-info">
          <div className="category-name">
            <i className="fa-light fa-tag tw-mr-2"></i>
            {category.name}
          </div>
          <div className="category-description">
            {category.description}
          </div>
        </div>
        <div className="card-controls">
          <div className="enabled-toggle">
            <CheckBox
              value={preference.isEnabled}
              onValueChanged={(e) => onChange(category.id, 'isEnabled', e.value)}
              text={preference.isEnabled ? "Enabled" : "Disabled"}
            />
          </div>
          <button className="expand-btn" type="button">
            <i className={`fa-light fa-chevron-${expanded ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="card-content">
          {/* Delivery Methods */}
          <div className="preference-section">
            <h4 className="section-title">
              <i className="fa-light fa-paper-plane tw-mr-2"></i>
              Delivery Methods
            </h4>
            <div className="delivery-methods">
              {deliveryMethods.map(method => (
                <div key={method.id} className="delivery-method-item">
                  <CheckBox
                    value={preference.deliveryMethods?.includes(method.id)}
                    onValueChanged={(e) => handleDeliveryMethodChange(method.id, e.value)}
                    disabled={!preference.isEnabled}
                  />
                  <i className={`${method.icon} tw-mx-2`}></i>
                  <span>{method.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Level */}
          <div className="preference-section">
            <h4 className="section-title">
              <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
              Priority Level
            </h4>
            <SelectBox
              items={priorityLevels}
              displayExpr="name"
              valueExpr="id"
              value={preference.priority}
              onValueChanged={(e) => onChange(category.id, 'priority', e.value)}
              disabled={!preference.isEnabled}
              placeholder="Select priority"
            />
          </div>

          {/* Quiet Hours */}
          <div className="preference-section">
            <h4 className="section-title">
              <i className="fa-light fa-moon tw-mr-2"></i>
              Quiet Hours
            </h4>
            <div className="quiet-hours">
              <div className="time-input">
                <label>Start Time</label>
                <input
                  type="time"
                  value={formatTime(preference.quietHoursStart) || ''}
                  onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
                  disabled={!preference.isEnabled}
                  className="time-picker"
                />
              </div>
              <div className="time-input">
                <label>End Time</label>
                <input
                  type="time"
                  value={formatTime(preference.quietHoursEnd) || ''}
                  onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
                  disabled={!preference.isEnabled}
                  className="time-picker"
                />
              </div>
            </div>
          </div>

          {/* Frequency Limits */}
          <div className="preference-section">
            <h4 className="section-title">
              <i className="fa-light fa-clock tw-mr-2"></i>
              Frequency Limits
            </h4>
            <div className="frequency-limits">
              <div className="limit-input">
                <label>Max per Hour (0 = unlimited)</label>
                <NumberBox
                  value={preference.maxNotificationsPerHour}
                  onValueChanged={(e) => onChange(category.id, 'maxNotificationsPerHour', e.value || 0)}
                  min={0}
                  disabled={!preference.isEnabled}
                  showSpinButtons={true}
                />
              </div>
              <div className="limit-input">
                <label>Max per Day (0 = unlimited)</label>
                <NumberBox
                  value={preference.maxNotificationsPerDay}
                  onValueChanged={(e) => onChange(category.id, 'maxNotificationsPerDay', e.value || 0)}
                  min={0}
                  disabled={!preference.isEnabled}
                  showSpinButtons={true}
                />
              </div>
            </div>
          </div>

          {/* Acknowledgment */}
          <div className="preference-section">
            <h4 className="section-title">
              <i className="fa-light fa-check-circle tw-mr-2"></i>
              Acknowledgment
            </h4>
            <CheckBox
              value={preference.requireAcknowledgment}
              onValueChanged={(e) => onChange(category.id, 'requireAcknowledgment', e.value)}
              text="Require acknowledgment for notifications"
              disabled={!preference.isEnabled}
            />
          </div>

          {/* Errors */}
          {errors && errors.length > 0 && (
            <div className="error-section">
              {errors.map((error, index) => (
                <div key={index} className="error-message">
                  <i className="fa-light fa-exclamation-circle tw-mr-1"></i>
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCategoryCard;
