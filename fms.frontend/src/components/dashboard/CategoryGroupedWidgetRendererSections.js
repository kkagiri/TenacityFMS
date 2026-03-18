/**
 * File: CategoryGroupedWidgetRendererSections.js
 * Purpose: Small presentational sections used by the category-grouped dashboard renderer.
 * Dependencies: React, PropTypes
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - EmptyDashboardState(): Shows the empty dashboard placeholder.
 * - WidgetGroupHeader(): Renders editable group header controls.
 * - LayoutSummary(): Shows edit-mode dashboard summary statistics.
 */

import React from 'react';
import PropTypes from 'prop-types';

export const EmptyDashboardState = ({ isEditMode }) => (
  <div className="category-grouped-widgets empty">
    <div className="empty-state">
      <i className="fa-solid fa-chart-line" />
      <h3>No Widgets Available</h3>
      <p>Add widgets to your dashboard to get started.</p>
      {isEditMode && (
        <button className="btn btn-primary">
          <i className="fa-solid fa-plus" />
          Add Widget
        </button>
      )}
    </div>
  </div>
);

export const WidgetGroupHeader = ({
  showGroupHeader,
  groupBy,
  isCollapsed,
  category,
  categoryTitle,
  isEditMode,
  categoryIndex,
  orderedCategoriesLength,
  onToggleCategory,
  onMoveGroup
}) => {
  if (!showGroupHeader) {
    return null;
  }

  return (
    <div className="category-header">
      <div className="category-info">
        {groupBy !== 'none' ? (
          <button
            className="category-toggle"
            onClick={() => onToggleCategory(category)}
            title={isCollapsed ? 'Expand category' : 'Collapse category'}
          >
            <i className={`fa-solid ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`} />
          </button>
        ) : null}
        <div className="category-title">
          <h2>{categoryTitle}</h2>
        </div>
      </div>

      {isEditMode && groupBy !== 'none' && (
        <div className="category-controls">
          <div className="category-order-controls">
            <button
              className="category-order-btn"
              onClick={() => onMoveGroup(category, 'up')}
              disabled={categoryIndex === 0}
              title="Move Group Up"
            >
              <i className="fa-solid fa-chevron-up" />
            </button>
            <button
              className="category-order-btn"
              onClick={() => onMoveGroup(category, 'down')}
              disabled={categoryIndex === orderedCategoriesLength - 1}
              title="Move Group Down"
            >
              <i className="fa-solid fa-chevron-down" />
            </button>
          </div>
        </div>
      )}

      {!isCollapsed && isEditMode && (
        <div className="layout-info">
          <span className="layout-info-text">
            <i className="fa-solid fa-info-circle" />
            {groupBy === 'none'
              ? 'Widgets are ungrouped. Use the position buttons to change the flat widget order.'
              : 'Use the arrows to change which accordion group appears first, then save the layout.'}
          </span>
        </div>
      )}
    </div>
  );
};

export const LayoutSummary = ({ groupedWidgets, widgets, widgetSizes, groupBy }) => (
  <div className="category-summary">
    <h3>Dashboard Summary</h3>
    <div className="summary-stats">
      <div className="stat">
        <span className="value">{Object.keys(groupedWidgets).length}</span>
        <span className="label">{groupBy === 'none' ? 'Groups' : 'Categories'}</span>
      </div>
      <div className="stat">
        <span className="value">{widgets.length}</span>
        <span className="label">Total Widgets</span>
      </div>
      <div className="stat">
        <span className="value">{Object.values(widgetSizes).filter(size => size.width === 12).length}</span>
        <span className="label">Full Width</span>
      </div>
    </div>
  </div>
);

EmptyDashboardState.propTypes = {
  isEditMode: PropTypes.bool
};

WidgetGroupHeader.propTypes = {
  showGroupHeader: PropTypes.bool,
  groupBy: PropTypes.oneOf(['category', 'widgetType', 'none']),
  isCollapsed: PropTypes.bool,
  category: PropTypes.string.isRequired,
  categoryTitle: PropTypes.string.isRequired,
  isEditMode: PropTypes.bool,
  categoryIndex: PropTypes.number.isRequired,
  orderedCategoriesLength: PropTypes.number.isRequired,
  onToggleCategory: PropTypes.func.isRequired,
  onMoveGroup: PropTypes.func.isRequired
};

LayoutSummary.propTypes = {
  groupedWidgets: PropTypes.object.isRequired,
  widgets: PropTypes.array.isRequired,
  widgetSizes: PropTypes.object.isRequired,
  groupBy: PropTypes.oneOf(['category', 'widgetType', 'none'])
};
