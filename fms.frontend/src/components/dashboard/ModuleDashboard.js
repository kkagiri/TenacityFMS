/**
 * File: ModuleDashboard.js
 * Purpose: Reusable module dashboard shell using the same widget infrastructure as RealtimeDashboard.
 * Dependencies: useModuleDashboard, CategoryGroupedWidgetRenderer, WidgetConfigModal, DevExtreme
 * Last Modified: 2026-03-20
 *
 * Key Functions:
 * - Renders a standardized dashboard for any module (vehicle, issue_tracker, tank_stock, etc.)
 * - Supports edit mode, widget grouping, and layout persistence
 * - Accepts customSections for module-specific features (maps, heatmaps, navigation grids)
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from 'devextreme-react/button';

import { useModuleDashboard } from '../../hooks/useModuleDashboard';
import CategoryGroupedWidgetRenderer from './CategoryGroupedWidgetRenderer';
import { GROUP_BY_OPTIONS } from './CategoryGroupedWidgetRenderer.utils';
import WidgetConfigModal from './ModalPopup/WidgetConfigModal';
import serviceFactory from '../../services/core/ServiceFactory';

import './ModuleDashboard.scss';

/**
 * ModuleDashboard Component
 *
 * @param {object} props
 * @param {string} props.moduleId - Module identifier (vehicle, issue_tracker, tank_stock, etc.)
 * @param {string} props.title - Dashboard title text
 * @param {string} [props.icon] - FontAwesome icon class for the title
 * @param {string} [props.subtitle] - Optional subtitle or description
 * @param {React.ReactNode} [props.headerActions] - Custom action buttons for the header
 * @param {React.ReactNode} [props.customSectionsAbove] - Custom sections rendered above the widget grid
 * @param {React.ReactNode} [props.customSectionsBelow] - Custom sections rendered below the widget grid
 * @param {boolean} [props.enableRealtime=false] - Enable SignalR real-time updates
 * @param {string} [props.emptyStateMessage] - Custom empty state message
 * @param {string} [props.className] - Additional CSS classes
 */
const ModuleDashboard = ({
  moduleId,
  title,
  icon = 'fa-solid fa-gauge-high',
  subtitle,
  headerActions,
  customSectionsAbove,
  customSectionsBelow,
  enableRealtime = false,
  emptyStateMessage,
  className = ''
}) => {
  // Widget config modal state
  const [widgetConfigOpen, setWidgetConfigOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [layoutSaveRequestVersion, setLayoutSaveRequestVersion] = useState(0);
  const actionsMenuRef = useRef(null);

  // Module dashboard hook
  const {
    moduleWidgets,
    widgetData,
    widgetErrors,
    widgetLoadingStates,
    widgetStaleness,
    isLoading,
    isSeeding,
    isEditMode,
    layoutSettings,
    loadWidgetInstances,
    setIsEditMode,
    handleLayoutSettingsChange,
    canViewWidget
  } = useModuleDashboard({
    moduleId,
    enableRealtime,
    refreshInterval: 60000,
    autoSeedDefaults: true
  });

  // Close actions menu on outside click
  useEffect(() => {
    if (!actionsMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setActionsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [actionsMenuOpen]);

  const handleEditModeToggle = useCallback((enabled) => {
    setIsEditMode(enabled);
  }, [setIsEditMode]);

  const handleSaveLayout = useCallback(() => {
    setLayoutSaveRequestVersion(prev => prev + 1);
  }, []);

  const handleOpenWidgetManager = useCallback(() => {
    setActionsMenuOpen(false);
    setWidgetConfigOpen(true);
  }, []);

  const handleStartLayoutEdit = useCallback(() => {
    setActionsMenuOpen(false);
    handleEditModeToggle(true);
  }, [handleEditModeToggle]);

  const handleDashboardLayoutSettingsChange = useCallback((nextSettings) => {
    handleLayoutSettingsChange({
      ...(layoutSettings || {}),
      ...nextSettings,
      groupOrders: {
        ...(layoutSettings?.groupOrders || {}),
        ...(nextSettings?.groupOrders || {})
      }
    });
  }, [handleLayoutSettingsChange, layoutSettings]);

  const activeGroupBy = layoutSettings?.widgetGrouping || 'category';

  const handleWidgetMutation = useCallback(async () => {
    await loadWidgetInstances();
  }, [loadWidgetInstances]);

  return (
    <div className={`module-dashboard-container ${className}`.trim()}>
      {/* Dashboard Header */}
      <div className="module-dashboard-header">
        <div className="module-dashboard-header__left">
          <h1 className="module-dashboard-title">
            <i className={icon}></i>
            <span className="module-dashboard-title-text">{title}</span>
          </h1>
          {subtitle && (
            <p className="module-dashboard-subtitle">{subtitle}</p>
          )}
        </div>

        <div className="module-dashboard-header__right">
          {/* Custom header actions (module-specific buttons) */}
          {headerActions && (
            <div className="module-dashboard-header-actions">
              {headerActions}
            </div>
          )}

          {/* Group by selector */}
          <div className="module-dashboard-grouping-control">
            <label htmlFor={`${moduleId}-group-by`} className="module-dashboard-grouping-control__label">
              Group by
            </label>
            <select
              id={`${moduleId}-group-by`}
              className="module-dashboard-grouping-control__select"
              value={activeGroupBy}
              onChange={(e) => handleDashboardLayoutSettingsChange({ widgetGrouping: e.target.value })}
            >
              {GROUP_BY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Save layout button (edit mode) */}
          {isEditMode && (
            <button
              type="button"
              className="module-dashboard-save-btn"
              onClick={handleSaveLayout}
            >
              Save layout
            </button>
          )}

          {/* Actions menu */}
          <div className="module-dashboard-actions-menu" ref={actionsMenuRef}>
            <button
              type="button"
              className="module-dashboard-meatball-btn"
              aria-label="Dashboard actions"
              aria-expanded={actionsMenuOpen}
              onClick={() => setActionsMenuOpen(prev => !prev)}
            >
              <i className="fa-solid fa-ellipsis-vertical" />
            </button>

            {actionsMenuOpen && (
              <div className="module-dashboard-actions-menu__panel">
                {!isEditMode && (
                  <button
                    type="button"
                    className="module-dashboard-actions-menu__item"
                    onClick={handleStartLayoutEdit}
                  >
                    <i className="fa-light fa-pen-to-square" />
                    Edit layout
                  </button>
                )}
                <button
                  type="button"
                  className="module-dashboard-actions-menu__item"
                  onClick={handleOpenWidgetManager}
                >
                  <i className="fa-light fa-puzzle-piece" />
                  Edit widgets
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom sections above widget grid */}
      {customSectionsAbove && (
        <div className="module-dashboard-custom-sections-above">
          {customSectionsAbove}
        </div>
      )}

      {/* Widget Grid Section */}
      <div className="module-dashboard-widgets-section">
        {moduleWidgets && moduleWidgets.length > 0 ? (
          <CategoryGroupedWidgetRenderer
            widgets={moduleWidgets}
            widgetData={widgetData}
            isLoading={widgetLoadingStates}
            errors={widgetErrors}
            widgetStaleness={widgetStaleness}
            isEditMode={isEditMode}
            groupBy={activeGroupBy}
            layoutSettings={layoutSettings}
            onLayoutSettingsChange={handleDashboardLayoutSettingsChange}
            saveRequestVersion={layoutSaveRequestVersion}
            onEditModeComplete={(layoutData) => {
              console.log(`[ModuleDashboard:${moduleId}] Layout saved`, layoutData);
              setIsEditMode(false);
            }}
          />
        ) : (
          <div className="module-dashboard-empty-state">
            {isSeeding ? (
              <>
                <div className="module-dashboard-empty-state__spinner" />
                <h3 className="module-dashboard-empty-state__title">Setting up your dashboard...</h3>
                <p className="module-dashboard-empty-state__text">
                  Creating default widgets for this module.
                </p>
              </>
            ) : (
              <>
                <i className="fa-light fa-cube module-dashboard-empty-state__icon"></i>
                <h3 className="module-dashboard-empty-state__title">No Widgets Yet</h3>
                <p className="module-dashboard-empty-state__text">
                  {emptyStateMessage || 'Add widgets to build your custom dashboard for this module.'}
                </p>
                <Button
                  text="Add Widget"
                  icon="fa-solid fa-plus"
                  type="default"
                  stylingMode="contained"
                  height={36}
                  onClick={() => setWidgetConfigOpen(true)}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Custom sections below widget grid */}
      {customSectionsBelow && (
        <div className="module-dashboard-custom-sections-below">
          {customSectionsBelow}
        </div>
      )}

      {/* Widget configuration modal */}
      {widgetConfigOpen && (
        <WidgetConfigModal
          open={widgetConfigOpen}
          onClose={() => setWidgetConfigOpen(false)}
          onWidgetAdded={handleWidgetMutation}
          onWidgetUpdated={handleWidgetMutation}
          onWidgetDeleted={handleWidgetMutation}
        />
      )}

      {/* Loading overlay */}
      {isLoading && !moduleWidgets.length && (
        <div className="module-dashboard-loading-overlay">
          <div className="module-dashboard-loading-overlay__content">
            <div className="module-dashboard-loading-overlay__spinner" />
            <p>Loading dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
};

ModuleDashboard.propTypes = {
  moduleId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  icon: PropTypes.string,
  subtitle: PropTypes.string,
  headerActions: PropTypes.node,
  customSectionsAbove: PropTypes.node,
  customSectionsBelow: PropTypes.node,
  enableRealtime: PropTypes.bool,
  emptyStateMessage: PropTypes.string,
  className: PropTypes.string
};

export default ModuleDashboard;
