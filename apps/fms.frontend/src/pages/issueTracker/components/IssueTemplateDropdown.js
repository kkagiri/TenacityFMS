/**
 * File: IssueTemplateDropdown.js
 * Purpose: Reusable issue template selector with in-dropdown quick template creation
 * Dependencies: React, DevExtreme SelectBox/Popup, issueTrackerV2Service
 * Last Modified: 2026-02-03
 *
 * Key Functions/Components:
 * - IssueTemplateDropdown: Loads templates by device type and handles template selection
 * - normalizeTemplatesResponse: Normalizes API response shape for template lists
 * - normalizeTemplateResponse: Normalizes API response shape for single template payload
 */
import React, { useEffect, useMemo, useState } from 'react';
import { SelectBox } from 'devextreme-react/select-box';
import { Popup } from 'devextreme-react/popup';
import { TagBox } from 'devextreme-react/tag-box';
import notify from 'devextreme/ui/notify';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';
import { fetchIssueCategories } from '../../../redux/actions/issueTrackerActions';

const ADD_TEMPLATE_OPTION_ID = '__add_new_template__';

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
  onTemplateCreated, // Callback when a template is created from popup
  priorities = [],
  statuses = [],
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
  const [isCreatePopupVisible, setIsCreatePopupVisible] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [templateDraft, setTemplateDraft] = useState(buildTemplateDraft());
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isCategoryPopupVisible, setIsCategoryPopupVisible] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch('/api/v1/issuetracker/categories');
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const openCategoryPopup = () => {
    setNewCategory({ name: '', description: '' });
    setIsCategoryPopupVisible(true);
  };

  const closeCategoryPopup = () => {
    if (isCreatingCategory) return;
    setIsCategoryPopupVisible(false);
    setNewCategory({ name: '', description: '' });
  };

  const handleCreateCategory = async () => {
    const normalizedName = newCategory.name.trim();

    if (!normalizedName) {
      notify({
        message: 'Category name is required.',
        type: 'warning',
        displayTime: 2500
      });
      return;
    }

    try {
      setIsCreatingCategory(true);

      const response = await fetch('/api/v1/issuetracker/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: normalizedName,
          description: newCategory.description.trim() || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.message || 'Failed to create category');
      }

      const result = await response.json();
      const createdCategoryId = result.id;

      notify({
        message: 'Category created successfully!',
        type: 'success',
        displayTime: 2000
      });

      // Reload categories
      await loadCategories();

      // Auto-select the new category
      if (createdCategoryId) {
        setTemplateDraft(prev => ({
          ...prev,
          categoryIds: [...(prev.categoryIds || []), createdCategoryId]
        }));
      }

      closeCategoryPopup();
    } catch (error) {
      console.error('Error creating category:', error);
      notify({
        message: error.message || 'Failed to create category',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

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
      let templateList = normalizeTemplatesResponse(response);

      // Filter to only active if requested
      if (onlyActive) {
        templateList = templateList.filter(t => t.isActive);
      }

      setTemplates(templateList);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateTemplatePopup = () => {
    if (!deviceTypeId) {
      notify({
        message: 'Please select a Device Type first.',
        type: 'warning',
        displayTime: 2500
      });
      return;
    }

    const selectedTemplate = templates.find(t => t.id === value);
    setTemplateDraft(buildTemplateDraft(selectedTemplate));
    setIsCreatePopupVisible(true);
  };

  const closeCreateTemplatePopup = () => {
    if (isCreatingTemplate) {
      return;
    }

    setIsCreatePopupVisible(false);
    setTemplateDraft(buildTemplateDraft());
  };

  const handleCreateTemplate = async () => {
    if (!deviceTypeId) {
      notify({
        message: 'Device Type is required before creating a template.',
        type: 'warning',
        displayTime: 2500
      });
      return;
    }

    const normalizedName = templateDraft.name.trim();

    if (!normalizedName) {
      notify({
        message: 'Template name is required.',
        type: 'warning',
        displayTime: 2500
      });
      return;
    }

    try {
      setIsCreatingTemplate(true);

      const createResponse = await issueTrackerV2Service.createTemplate({
        deviceTypeId,
        name: normalizedName,
        titleTemplate: templateDraft.titleTemplate?.trim() || null,
        descriptionTemplate: templateDraft.descriptionTemplate?.trim() || null,
        defaultPriorityId: templateDraft.defaultPriorityId ? Number(templateDraft.defaultPriorityId) : null,
        defaultStatusId: templateDraft.defaultStatusId ? Number(templateDraft.defaultStatusId) : null,
        isActive: templateDraft.isActive,
        categoryIds: templateDraft.categoryIds || []
      });

      const createdTemplate = normalizeTemplateResponse(createResponse);

      await loadTemplates();
      setIsCreatePopupVisible(false);
      setTemplateDraft(buildTemplateDraft());

      if (createdTemplate && (!onlyActive || createdTemplate.isActive)) {
        if (onValueChanged) {
          onValueChanged({
            value: createdTemplate.id,
            template: createdTemplate
          });
        }

        if (onTemplateSelected) {
          onTemplateSelected(createdTemplate);
        }
      }

      if (createdTemplate && onTemplateCreated) {
        onTemplateCreated(createdTemplate);
      }
    } catch (error) {
      // API service already handles error notification
      console.error('Error creating template from dropdown:', error);
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const handleValueChanged = (e) => {
    if (e.value === ADD_TEMPLATE_OPTION_ID) {
      openCreateTemplatePopup();
      return;
    }

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

  const templateOptions = useMemo(() => {
    if (!deviceTypeId) {
      return templates;
    }

    return [
      {
        id: ADD_TEMPLATE_OPTION_ID,
        name: 'Add New Template',
        isActionItem: true
      },
      ...templates
    ];
  }, [deviceTypeId, templates]);

  const itemRender = (item) => {
    if (!item) return null;

    if (item.isActionItem) {
      return (
        <div className="tw-flex tw-items-center tw-gap-2 tw-py-1 tw-text-blue-600 tw-font-medium">
          <i className="fa-light fa-plus tw-w-4"></i>
          <span>Add New Template</span>
        </div>
      );
    }

    return (
      <div className="tw-py-1">
        <div className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-font-medium tw-text-gray-700">{item.name}</span>
          {item.hasAutoCloseConfig && item.autoCloseEnabled && (
            <span className="tw-ml-auto tw-text-xs tw-bg-blue-100 tw-text-blue-700 tw-px-2 tw-py-0.5 tw-rounded">
              Auto-Close
            </span>
          )}
        </div>
        {(item.titleTemplate || item.descriptionTemplate) && (
          <div className="tw-text-xs tw-text-gray-500 tw-mt-0.5 tw-truncate tw-max-w-md">
            {item.titleTemplate ?
              item.titleTemplate.substring(0, 50) + (item.titleTemplate.length > 50 ? '...' : '') :
              item.descriptionTemplate ?
                item.descriptionTemplate.split(' ').slice(0, 4).join(' ') + '...' :
                ''
            }
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
          dataSource={templateOptions}
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

      <Popup
        visible={isCreatePopupVisible}
        onHiding={closeCreateTemplatePopup}
        showTitle={true}
        title="Create Issue Template"
        width={600}
        height="auto"
        dragEnabled={false}
        hideOnOutsideClick={!isCreatingTemplate}
      >
        <div className="tw-p-4 tw-space-y-4">
          {templateDraft.sourceTemplateName && (
            <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-text-blue-700">
              <i className="fa-light fa-clone tw-mr-2"></i>
              Based on template: <span className="tw-font-semibold">{templateDraft.sourceTemplateName}</span>
            </div>
          )}

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Template Name <span className="tw-text-red-500">*</span>
            </label>
            <input
              type="text"
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
              placeholder="Enter template name"
              value={templateDraft.name}
              onChange={(event) => setTemplateDraft(prev => ({ ...prev, name: event.target.value }))}
              disabled={isCreatingTemplate}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Title Template
            </label>
            <input
              type="text"
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
              placeholder="Optional title template"
              value={templateDraft.titleTemplate}
              onChange={(event) => setTemplateDraft(prev => ({ ...prev, titleTemplate: event.target.value }))}
              disabled={isCreatingTemplate}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Description Template
            </label>
            <textarea
              rows={4}
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
              placeholder="Optional description template"
              value={templateDraft.descriptionTemplate}
              onChange={(event) => setTemplateDraft(prev => ({ ...prev, descriptionTemplate: event.target.value }))}
              disabled={isCreatingTemplate}
            />
          </div>

          <div>
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                Categories / Tags
              </label>
              <button
                type="button"
                className="tw-text-xs tw-text-blue-600 hover:tw-text-blue-700 tw-flex tw-items-center tw-gap-1"
                onClick={openCategoryPopup}
                disabled={isCreatingTemplate || isCreatingCategory}
              >
                <i className="fa-light fa-plus tw-text-xs"></i>
                Add Category
              </button>
            </div>
            <TagBox
              dataSource={categories}
              displayExpr="name"
              valueExpr="id"
              placeholder="Select categories (e.g., Fuel Sensor, Disconnection, Hardware)"
              searchEnabled={true}
              showSelectionControls={true}
              applyValueMode="useButtons"
              value={templateDraft.categoryIds || []}
              onValueChanged={(e) => setTemplateDraft(prev => ({ ...prev, categoryIds: e.value }))}
              disabled={isCreatingTemplate || loadingCategories}
              noDataText={loadingCategories ? 'Loading categories...' : 'No categories available'}
            />
            <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
              <i className="fa-light fa-info-circle tw-mr-1"></i>
              Select multiple categories to tag this template (e.g., Device Type, Issue Type, Component)
            </p>
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Default Priority
            </label>
            <select
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-bg-white"
              value={templateDraft.defaultPriorityId ?? ''}
              onChange={(event) => setTemplateDraft(prev => ({
                ...prev,
                defaultPriorityId: event.target.value ? Number(event.target.value) : null
              }))}
              disabled={isCreatingTemplate}
            >
              <option value="">None</option>
              {priorities.map(priority => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Default Status
            </label>
            <select
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-bg-white"
              value={templateDraft.defaultStatusId ?? ''}
              onChange={(event) => setTemplateDraft(prev => ({
                ...prev,
                defaultStatusId: event.target.value ? Number(event.target.value) : null
              }))}
              disabled={isCreatingTemplate}
            >
              <option value="">None</option>
              {statuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.status || status.name || `Status ${status.id}`}
                </option>
              ))}
            </select>
          </div>

          <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
            <input
              type="checkbox"
              className="tw-h-4 tw-w-4"
              checked={templateDraft.isActive}
              onChange={(event) => setTemplateDraft(prev => ({ ...prev, isActive: event.target.checked }))}
              disabled={isCreatingTemplate}
            />
            Active template
          </label>

          <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-2">
            <button
              type="button"
              className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-gray-700 hover:tw-bg-gray-50"
              onClick={closeCreateTemplatePopup}
              disabled={isCreatingTemplate}
            >
              Cancel
            </button>
            <button
              type="button"
              className="tw-px-4 tw-py-2 tw-bg-orange-600 tw-text-white tw-rounded hover:tw-bg-orange-700 disabled:tw-opacity-60"
              onClick={handleCreateTemplate}
              disabled={isCreatingTemplate}
            >
              {isCreatingTemplate ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </Popup>

      {/* Category Creation Popup */}
      <Popup
        visible={isCategoryPopupVisible}
        onHiding={closeCategoryPopup}
        showTitle={true}
        title="Create New Category"
        width={500}
        height="auto"
        dragEnabled={false}
        hideOnOutsideClick={!isCreatingCategory}
      >
        <div className="tw-p-4 tw-space-y-4">
          <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-text-blue-700">
            <i className="fa-light fa-info-circle tw-mr-2"></i>
            Create a new category tag to organize and classify issue templates (e.g., "Fuel Sensor", "Disconnection", "Hardware")
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Category Name <span className="tw-text-red-500">*</span>
            </label>
            <input
              type="text"
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
              placeholder="e.g., Fuel Sensor, Hardware, Network"
              value={newCategory.name}
              onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              disabled={isCreatingCategory}
              autoFocus
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Description
            </label>
            <textarea
              rows={3}
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
              placeholder="Optional description for this category"
              value={newCategory.description}
              onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
              disabled={isCreatingCategory}
            />
          </div>

          <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-2">
            <button
              type="button"
              className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-gray-700 hover:tw-bg-gray-50"
              onClick={closeCategoryPopup}
              disabled={isCreatingCategory}
            >
              Cancel
            </button>
            <button
              type="button"
              className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded hover:tw-bg-blue-700 disabled:tw-opacity-60"
              onClick={handleCreateCategory}
              disabled={isCreatingCategory}
            >
              {isCreatingCategory ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </div>
      </Popup>
    </div>
  );
};

const buildTemplateDraft = (baseTemplate = null) => ({
  sourceTemplateName: baseTemplate?.name || '',
  name: baseTemplate?.name ? `${baseTemplate.name} Copy` : '',
  titleTemplate: baseTemplate?.titleTemplate || '',
  descriptionTemplate: baseTemplate?.descriptionTemplate || '',
  defaultPriorityId: baseTemplate?.defaultPriorityId || null,
  defaultStatusId: baseTemplate?.defaultStatusId || null,
  isActive: baseTemplate?.isActive ?? true,
  categoryIds: baseTemplate?.categoryIds || []
});

/**
 * Handles both raw array responses and wrapped FMSResponse payloads
 */
const normalizeTemplatesResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (response !== null && response !== undefined) {
    console.error('Unexpected issue template list response format:', response);
  }

  return [];
};

/**
 * Handles both raw object responses and wrapped FMSResponse payloads
 */
const normalizeTemplateResponse = (response) => {
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }

    return response;
  }

  return null;
};

export default IssueTemplateDropdown;
