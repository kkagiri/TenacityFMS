import React, { useState } from 'react';
import Popup from 'devextreme-react/popup';
import CheckBox from 'devextreme-react/check-box';
import Button from 'devextreme-react/button';
import './WidgetVisibilityModal.css';

export default function WidgetVisibilityModal({
  open,
  onClose,
  category,
  widgetConfig,
  metricFilters,
  onUpdateWidgetConfig,
  onUpdateMetricFilter
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  if (!open) return null;
  const items = widgetConfig[category] || [];
  const ksFilters = metricFilters[category] || {};

  const toggle = (id) => {
    const updated = items.map(it => it.id === id ? { ...it, enabled: !it.enabled } : it);
    onUpdateWidgetConfig(category, updated);

    // Note: Preferences endpoint removed - widget visibility is now managed via widget instances
    console.log('Widget visibility toggled for:', id);
  };

  // Handle drag and drop reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder the items array
    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];

    // Remove the dragged item
    newItems.splice(draggedIndex, 1);

    // Insert it at the new position
    newItems.splice(dropIndex, 0, draggedItem);

    // Update positions in the data
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      position: index,
      positionX: index % 4, // Assuming 4-column grid
      positionY: Math.floor(index / 4)
    }));

    // Update the configuration
    onUpdateWidgetConfig(category, updatedItems);

    // Note: Preferences endpoint removed - widget order is now managed via widget instances
    console.log('Widget order updated for category:', category);

    // Reset drag state
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const renderMeta = (id) => {
    // Enhanced mapping for metric keys with better coverage
    let metricKey = 'fuel_dispense';
    if (id.startsWith('today_fuel_')) {
      const suffix = id.split('_').pop();
      metricKey = isNaN(suffix) ? 'fuel_dispense' : `fuel_dispense_${suffix}`;
    } else if (id.startsWith('today_fuel')) {
      metricKey = 'fuel_dispense';
    } else if (id === 'yesterday_fuel_total') {
      metricKey = 'fuel_dispense';
    } else if (id.includes('engine_hours')) {
      metricKey = 'engine_hours';
    } else if (id.includes('distance') || id.includes('km_travel')) {
      metricKey = 'km_travel';
    } else if (id.includes('idling')) {
      metricKey = 'idling';
    } else if (id.includes('fuel_used_gps')) {
      metricKey = 'fuel_used_gps';
    }

    const cfg = ksFilters[metricKey];
    if (!cfg) return null;

    const period = cfg.mode === 'live' ? cfg.datePreset : cfg.datePreset;
    const site = cfg.sitesMode === 'all' ? 'All Sites' : `${cfg.siteIds?.length || 0} Site(s)`;
    return (
      <div className="tw-text-[11px] tw-text-gray-500 tw-mt-1">
        <span className="tw-capitalize">{cfg.mode}</span> • {period.replace('_', ' ')} • {site}
      </div>
    );
  };

  return (
    <Popup
      visible={open}
      onHiding={onClose}
      title="Visible Key Statistics"
      width={700}
      height={'auto'}
      showCloseButton
    >
      <div className="tw-space-y-4 tw-p-4">
        <div className="tw-flex tw-justify-between tw-items-center">

          <div className="drag-instructions">
            <i className="fa-solid fa-arrows-up-down-left-right"></i>
            Drag to reorder widgets
          </div>
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
          {items.map((it, index) => (
            <div
              key={it.id}
              className={`widget-drag-item tw-border tw-rounded tw-p-3 tw-bg-white  tw-cursor-move ${
                draggedIndex === index ? 'dragging' : ''
              } ${
                dragOverIndex === index ? 'drag-over' : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <i className="fa-solid fa-grip-vertical drag-handle"></i>
                  <span className="widget-position-badge tw-px-2 tw-py-1 tw-rounded">
                    #{index + 1}
                  </span>
                  <CheckBox value={it.enabled} text={it.label} onValueChanged={() => toggle(it.id)} />
                </div>
              </div>E
              {renderMeta(it.id)}
            </div>
          ))}
        </div>
        {items.length === 0 && (
          <div className="tw-text-center tw-py-8 tw-text-gray-500">
            <i className="fa-solid fa-cube tw-text-3xl tw-mb-2"></i>
            <p>No widgets configured yet</p>
            <p className="tw-text-xs">Add widgets using the configuration modal</p>
          </div>
        )}
      </div>
    </Popup>
  );
}
