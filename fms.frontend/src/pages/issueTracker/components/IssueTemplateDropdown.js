import React, { useEffect, useState } from 'react';
import { SelectBox } from 'devextreme-react/select-box';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';

/**
 * IssueTemplateDropdown - Reusable dropdown for selecting issue templates
 * Filters templates based on selected device type
 * Pre-fills form fields when a template is selected
 */
const IssueTemplateDropdown = ({
  value,
  deviceTypeId, // Required - filters templates by device type
  onValueChanged,
  onTemplateSelected, // Callback with full template data for pre-filling
  placeholder = 'Select Issue Template...',
  showClearButton = true,
  disabled = false,
  isRequired = false,
  label = 'Issue Template',
  showLabel = true,
  className = '',
  onlyActive = true, // Show only active templates by default
}) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noDeviceTypeMessage, setNoDeviceTypeMessage] = useState(false);

  useEffect(() => {
    if (deviceTypeId) {
      loadTemplates();
      setNoDeviceTypeMessage(false);
    } else {
      setTemplates([]);
      setNoDeviceTypeMessage(true);
    }
  }, [deviceTypeId, onlyActive]);

  const loadTemplates = async () => {
    if (!deviceTypeId) {
      setTemplates([]);
      return;
    }

    try {
      setLoading(true);
      const response = await issueTrackerV2Service.getTemplatesByDeviceType(deviceTypeId);

      if (response.isSuccess && response.data) {
        let templateList = response.data;

        // Filter to only active if requested
        if (onlyActive) {
          templateList = templateList.filter(t => t.isActive);
        }

        setTemplates(templateList);
      } else {
        console.error('Failed to load templates:', response.message);
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChanged = (e) => {
    const selectedTemplate = templates.find(t => t.id === e.value);

    if (onValueChanged) {
      onValueChanged({
        value: e.value,
        template: selectedTemplate
      });
    }

    // Notify parent with full template data for pre-filling form fields
    if (onTemplateSelected && selectedTemplate) {
      onTemplateSelected(selectedTemplate);
    }
  };

  const itemRender = (item) => {
    if (!item) return null;

    return (
      <div className="tw-py-1">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-file-lines tw-text-orange-500 tw-w-4"></i>
          <span className="tw-font-medium">{item.name}</span>
          {item.canAutoClose && (
            <span className="tw-ml-auto tw-text-xs tw-bg-blue-100 tw-text-blue-700 tw-px-2 tw-py-0.5 tw-rounded">
              Auto-Close
            </span>
          )}
        </div>
        {item.titleTemplate && (
          <div className="tw-text-xs tw-text-gray-500 tw-ml-6 tw-truncate tw-max-w-xs">
            {item.titleTemplate}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`issue-template-dropdown ${className}`}>
      {showLabel && label && (
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
          {label}
          {isRequired && <span className="tw-text-red-500 tw-ml-1">*</span>}
        </label>
      )}

      {noDeviceTypeMessage && !deviceTypeId ? (
        <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-text-gray-500 tw-italic">
          <i className="fa-light fa-info-circle tw-mr-2"></i>
          Please select a Device Type first
        </div>
      ) : (
        <SelectBox
          value={value}
          dataSource={templates}
          displayExpr="name"
          valueExpr="id"
          placeholder={loading ? 'Loading templates...' : placeholder}
          showClearButton={showClearButton}
          disabled={disabled || loading || !deviceTypeId}
          searchEnabled={true}
          searchMode="contains"
          searchExpr={['name', 'titleTemplate']}
          onValueChanged={handleValueChanged}
          itemRender={itemRender}
          noDataText={deviceTypeId ? 'No templates found for this device type' : 'Select a device type first'}
          dropDownOptions={{
            minWidth: 350
          }}
        />
      )}

      {templates.length === 0 && deviceTypeId && !loading && (
        <div className="tw-text-xs tw-text-amber-600 tw-mt-1">
          <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>
          No templates configured for this device type
        </div>
      )}
    </div>
  );
};

export default IssueTemplateDropdown;
