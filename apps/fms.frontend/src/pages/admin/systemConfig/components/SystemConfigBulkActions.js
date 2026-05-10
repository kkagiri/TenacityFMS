/**
 * File: SystemConfigBulkActions.js
 * Purpose: Bulk operation toolbar for system configurations with side-panel confirmation.
 * Dependencies: react, prop-types, redux, devextreme-react controls, SlidePanel
 * Last Modified: 2026-03-03
 *
 * Key Functions:
 * - handleBulkAction(): Opens action confirmation panel
 * - executeBulkAction(): Applies selected action across selected configuration IDs
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import Button from 'devextreme-react/button';
import SelectBox from 'devextreme-react/select-box';
import notify from 'devextreme/ui/notify';
import SlidePanel from '../../../../components/ui/SlidePanel';

import {
  updateSystemConfiguration,
  deleteSystemConfiguration
} from '../../../../redux/actions/systemConfigActions';

const SystemConfigBulkActions = ({ selectedKeys, onClearSelection, onRefresh }) => {
  const dispatch = useDispatch();
  const [isActionPanelVisible, setIsActionPanelVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const bulkActionOptions = [
    { value: 'activate', text: 'Activate Selected' },
    { value: 'deactivate', text: 'Deactivate Selected' },
    { value: 'make_editable', text: 'Make Editable' },
    { value: 'make_readonly', text: 'Make Read-Only' },
    { value: 'delete', text: 'Delete Selected' }
  ];

  const handleBulkAction = () => {
    if (!selectedAction) {
      notify('Please select an action to perform', 'warning', 3000);
      return;
    }
    setIsActionPanelVisible(true);
  };

  const executeBulkAction = async () => {
    setIsProcessing(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const configId of selectedKeys) {
        try {
          switch (selectedAction) {
            case 'activate':
              await dispatch(updateSystemConfiguration(configId, { isActive: true }));
              break;
            case 'deactivate':
              await dispatch(updateSystemConfiguration(configId, { isActive: false }));
              break;
            case 'make_editable':
              await dispatch(updateSystemConfiguration(configId, { isEditable: true }));
              break;
            case 'make_readonly':
              await dispatch(updateSystemConfiguration(configId, { isEditable: false }));
              break;
            case 'delete':
              await dispatch(deleteSystemConfiguration(configId));
              break;
            default:
              throw new Error('Unknown action');
          }
          successCount++;
        } catch (error) {
          console.error(`Error processing config ${configId}:`, error);
          errorCount++;
        }
      }

      // Show success/error notifications
      if (successCount > 0) {
        notify(`Successfully processed ${successCount} configuration(s)`, 'success', 3000);
      }
      if (errorCount > 0) {
        notify(`Failed to process ${errorCount} configuration(s)`, 'error', 5000);
      }

      // Clear selection and refresh data
      onClearSelection();
      onRefresh();
      setIsActionPanelVisible(false);
      setSelectedAction('');

    } catch (error) {
      notify(`Bulk action failed: ${error.message}`, 'error', 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionDescription = () => {
    const actionText = bulkActionOptions.find(opt => opt.value === selectedAction)?.text || '';
    switch (selectedAction) {
      case 'activate':
        return `This will activate ${selectedKeys.length} configuration(s), making them available for use.`;
      case 'deactivate':
        return `This will deactivate ${selectedKeys.length} configuration(s), making them unavailable for use.`;
      case 'make_editable':
        return `This will make ${selectedKeys.length} configuration(s) editable through the UI.`;
      case 'make_readonly':
        return `This will make ${selectedKeys.length} configuration(s) read-only, preventing UI modifications.`;
      case 'delete':
        return `This will permanently delete ${selectedKeys.length} configuration(s). This action cannot be undone.`;
      default:
        return '';
    }
  };

  const isDestructiveAction = selectedAction === 'delete';

  return (
    <>
      <div className="bulk-actions-content">
        <div className="selected-count">
          <i className="fa-light fa-check-square tw-mr-2"></i>
          {selectedKeys.length} configuration(s) selected
        </div>

        <div className="bulk-actions">
          <SelectBox
            dataSource={bulkActionOptions}
            valueExpr="value"
            displayExpr="text"
            placeholder="Choose action..."
            value={selectedAction}
            onValueChanged={(e) => setSelectedAction(e.value)}
            width={200}
          />

          <Button
            text="Apply Action"
            type="default"
            icon="fa-light fa-play"
            onClick={handleBulkAction}
            disabled={!selectedAction || isProcessing}
          />

          <Button
            text="Clear Selection"
            type="normal"
            icon="fa-light fa-times"
            onClick={onClearSelection}
            disabled={isProcessing}
          />
        </div>
      </div>

      <SlidePanel
        open={isActionPanelVisible}
        onClose={() => setIsActionPanelVisible(false)}
        title="Confirm Bulk Action"
        width={520}
      >
        <div className="system-config-bulk-confirm tw-p-6">
          <div className={`tw-p-4 tw-rounded-lg tw-mb-4 ${
            isDestructiveAction
              ? 'tw-bg-red-50 tw-border tw-border-red-200'
              : 'tw-bg-blue-50 tw-border tw-border-blue-200'
          }`}>
            <div className="tw-flex tw-items-center tw-mb-2">
              <i className={`tw-mr-2 ${
                isDestructiveAction ? 'fa-light fa-exclamation-triangle tw-text-red-600' : 'fa-light fa-circle-info tw-text-blue-600'
              }`}></i>
              <h4 className={`tw-font-semibold ${
                isDestructiveAction ? 'tw-text-red-800' : 'tw-text-blue-800'
              }`}>
                {bulkActionOptions.find(opt => opt.value === selectedAction)?.text}
              </h4>
            </div>
            <p className={`tw-text-sm ${
              isDestructiveAction ? 'tw-text-red-700' : 'tw-text-blue-700'
            }`}>
              {getActionDescription()}
            </p>
          </div>

          {isDestructiveAction && (
            <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-3 tw-mb-4">
              <div className="tw-flex tw-items-center">
                <i className="fa-light fa-triangle-exclamation tw-text-yellow-600 tw-mr-2"></i>
                <span className="tw-text-yellow-800 tw-font-medium">
                  Warning: This action cannot be undone!
                </span>
              </div>
            </div>
          )}

          <div className="tw-flex tw-justify-end tw-space-x-3 tw-mt-6">
            <Button
              text="Cancel"
              type="normal"
              onClick={() => setIsActionPanelVisible(false)}
              disabled={isProcessing}
            />
            <Button
              text={isProcessing ? "Processing..." : "Confirm"}
              type={isDestructiveAction ? "danger" : "success"}
              onClick={executeBulkAction}
              disabled={isProcessing}
              icon={isProcessing ? "fa-light fa-spinner fa-spin" : undefined}
            />
          </div>
        </div>
      </SlidePanel>
    </>
  );
};

SystemConfigBulkActions.propTypes = {
  selectedKeys: PropTypes.array.isRequired,
  onClearSelection: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired
};

export default SystemConfigBulkActions;
