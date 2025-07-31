
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, GroupItem, Label, RequiredRule, StringLengthRule } from 'devextreme-react/form';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { FileUploader } from 'devextreme-react/file-uploader';
import LoadIndicator from 'devextreme-react/load-indicator';
import { ValidationSummary } from 'devextreme-react/validation-summary';
import notify from 'devextreme/ui/notify';
import {
  fetchIssueById,
  createIssue,
  updateIssue,
  fetchIssueCategories,
  fetchIssuePriorities,
  fetchIssueStatuses
} from '../../redux/actions/issueTrackerActions';
import { fetchVehicleList } from '../../redux/actions/vehicleActions';
import { fetchSiteList } from '../../redux/actions/siteActions';
import { fetchUsers } from '../../redux/actions/userActions';
import './IssueTrackerFormPage.scss';

const IssueTrackerFormPage = ({
  isPopup = false,
  onClose = null,
  onSave = null,
  workflowType = 'standard',  // 'standard', 'gps-triggered', 'quick-create'
  prefilledData = {},
  gpsData = null
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();

  // Redux state selectors with fallbacks
  const issueTrackerState = useSelector(state => state.issueTracker) || {};
  const {
    currentIssue,
    categories = [],
    priorities = [],
    statuses = [],
    loading: issueLoading = false
  } = issueTrackerState;

  const vehicleState = useSelector(state => state.vehicle) || {};
  const { vehicles = [], loading: vehicleLoading = false } = vehicleState;

  const siteState = useSelector(state => state.site) || {};
  const { sites = [], loading: siteLoading = false } = siteState;

  const userState = useSelector(state => state.user) || {};
  const { users = [], loading: userLoading = false } = userState;

  // Determine if this is edit mode
  const isEditMode = Boolean(id);
  const isQuickCreate = workflowType === 'quick-create';
  const isGpsTriggered = workflowType === 'gps-triggered';

  // State management - Updated to match IssueTrackerDTO properties
  const [formData, setFormData] = useState({
    id: null,
    issueCategory: null,        // int IssueCategory -> Maps to categoryId
    site: null,                 // int Site -> Maps to siteId
    openby: 'System',           // string Openby - default to 'System'
    relatedIssue: null,         // int? RelatedIssue
    problemDescription: '',     // string ProblemDescription
    problemTitle: '',           // string ProblemTitle
    status: null,               // int? Status
    priority: null,             // int? Priority
    dueDate: null,              // DateTime? DueDate
    openDate: new Date(),       // DateTime? OpenDate
    closingDate: null,          // DateTime? ClosingDate
    lastModfield: null,         // DateTime? LastModfield
    vehicle: null,              // int Vehicle -> Maps to vehicleId
    device: null,               // int? Device
    deviceType: null,           // int? DeviceType
    assignTo: '',               // string AssignTo

    // Additional UI fields for enhanced functionality
    isUrgent: false,
    requiresApproval: false,
    notes: '',
    gpsLatitude: null,
    gpsLongitude: null,
    gpsAddress: '',
    gpsTimestamp: null,
    ...prefilledData
  });

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [attachments, setAttachments] = useState([]);

  // Auto-save functionality
  const [autoSaveEnabled] = useState(!isPopup);
  const [lastSaved, setLastSaved] = useState(null);

  // Load lookup data using Redux
  const loadLookupData = useCallback(async () => {
    try {
      console.log('Loading lookup data...');
      // Dispatch Redux actions to load lookup data
      const results = await Promise.all([
        dispatch(fetchIssueCategories()),
        dispatch(fetchIssuePriorities()),
        dispatch(fetchIssueStatuses()),
        dispatch(fetchUsers()),
        dispatch(fetchVehicleList()),
        dispatch(fetchSiteList())
      ]);
      console.log('Lookup data loaded successfully:', results);
    } catch (error) {
      console.error('Error loading lookup data:', error);
      notify({
        message: 'Failed to load form data. Please refresh the page.',
        type: 'error',
        displayTime: 4000
      });
    }
  }, [dispatch]);

  // Load existing issue data for edit mode using Redux
  const loadIssueData = useCallback(async () => {
    if (!isEditMode) return;

    try {
      const issueData = await dispatch(fetchIssueById(id));

      if (issueData) {
        setFormData(prev => ({
          ...prev,
          id: issueData.id,
          // Map from DTO structure
          issueCategory: issueData.issueCategoryId,
          site: issueData.siteId,
          openby: issueData.openbyUserName || '', // Use username from DTO
          relatedIssue: issueData.relatedIssue,
          problemDescription: issueData.problemDescription || '',
          problemTitle: issueData.problemTitle || '',
          status: issueData.status,
          priority: issueData.priority,
          dueDate: issueData.dueDate ? new Date(issueData.dueDate) : null,
          openDate: issueData.openDate ? new Date(issueData.openDate) : new Date(),
          closingDate: issueData.closingDate ? new Date(issueData.closingDate) : null,
          lastModfield: issueData.lastModfield ? new Date(issueData.lastModfield) : null,
          vehicle: issueData.vehicleId,
          device: issueData.deviceId,
          deviceType: issueData.deviceType,
          assignTo: issueData.assignToUserName || '', // Use username from DTO
          gpsTimestamp: issueData.gpsTimestamp ? new Date(issueData.gpsTimestamp) : null
        }));

        // Load attachments if any
        if (issueData.attachments) {
          setAttachments(issueData.attachments);
        }
      }
    } catch (error) {
      console.error('Error loading issue data:', error);
      notify({
        message: 'Failed to load issue data.',
        type: 'error',
        displayTime: 4000
      });
    }
  }, [id, isEditMode, dispatch]);

  // Initialize GPS data if provided
  useEffect(() => {
    if (gpsData && isGpsTriggered) {
      setFormData(prev => ({
        ...prev,
        gpsLatitude: gpsData.latitude,
        gpsLongitude: gpsData.longitude,
        gpsAddress: gpsData.address || '',
        gpsTimestamp: gpsData.timestamp ? new Date(gpsData.timestamp) : new Date(),
        vehicle: gpsData.vehicleId,
        problemTitle: gpsData.suggestedTitle || 'GPS Alert - Vehicle Issue Detected',
        problemDescription: gpsData.suggestedDescription || 'Automated issue created due to GPS signal loss or anomaly.',
        issueCategory: categories.find(cat => cat.name === 'GPS/Tracking')?.id || null,
        priority: priorities.find(p => p.name === (gpsData.severity || 'High'))?.id || null,
        isUrgent: gpsData.isUrgent || true
      }));
    }
  }, [gpsData, isGpsTriggered, categories, priorities]);

  // Load data on component mount
  useEffect(() => {
    loadLookupData();
    loadIssueData();
  }, [loadLookupData, loadIssueData]);

  // Auto-save functionality using Redux
  const handleAutoSave = useCallback(async () => {
    if (!formData.problemTitle.trim()) return;

    try {
      // Only auto-save if we have a title and it's not a new unsaved issue
      if (isEditMode) {
        await dispatch(updateIssue(id, formData));
        setLastSaved(new Date());
        notify({
          message: 'Auto-saved successfully',
          type: 'success',
          displayTime: 2000
        });
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [formData, isEditMode, id, dispatch]);

  useEffect(() => {
    if (!autoSaveEnabled || isPopup || !formData.problemTitle) return;

    const autoSaveTimer = setTimeout(async () => {
      await handleAutoSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [formData, autoSaveEnabled, isPopup, handleAutoSave]);

  // Form validation - Updated for DTO properties
  const validateForm = () => {
    const errors = [];

    if (!formData.problemTitle?.trim()) {
      errors.push('Title is required');
    }
    if (!formData.problemDescription?.trim()) {
      errors.push('Description is required');
    }
    if (!formData.issueCategory) {
      errors.push('Category is required');
    }
    if (!formData.priority) {
      errors.push('Priority is required');
    }
    if (!formData.vehicle) {
      errors.push('Vehicle is required');
    }

    // Site is required for all workflows based on backend validation
    if (!formData.site) {
      errors.push('Site is required');
    }

    // AssignTo is required based on backend validation
    if (!formData.assignTo?.trim()) {
      errors.push('Assigned To is required');
    }

    // Openby field validation (if required)
    if (!formData.openby?.trim()) {
      // Set a default value if not provided
      setFormData(prev => ({
        ...prev,
        openby: 'System'
      }));
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle form submission using Redux
  const handleSave = async () => {
    if (!validateForm()) {
      notify({
        message: 'Please fix the validation errors before saving.',
        type: 'warning',
        displayTime: 4000
      });
      return;
    }

    try {
      setSaving(true);

      // Prepare data according to backend expectations
      // Find the user objects for navigation fields
      const openbyUserName = formData.openby || 'System';
      const assignToUserName = formData.assignTo || 'Unassigned';

      const issueData = {
        // Only include id for edit mode, and ensure it's a number
        ...(isEditMode && formData.id ? { id: parseInt(formData.id) } : {}),

        // Map to backend field names (case-sensitive matching IssueTrackerDTO)
        IssueCategory: formData.issueCategory,
        Site: formData.site,
        Openby: openbyUserName,
        RelatedIssue: formData.relatedIssue,
        ProblemDescription: formData.problemDescription,
        ProblemTitle: formData.problemTitle,
        Status: formData.status,
        Priority: formData.priority,
        DueDate: formData.dueDate ? formData.dueDate.toISOString() : null,
        OpenDate: formData.openDate ? formData.openDate.toISOString() : new Date().toISOString(),
        ClosingDate: formData.closingDate ? formData.closingDate.toISOString() : null,
        LastModfield: new Date().toISOString(),
        Vehicle: formData.vehicle,
        Device: formData.device,
        DeviceType: formData.deviceType,
        AssignTo: assignToUserName
      };

      console.log('Sending issue data:', issueData);

      let savedIssue;
      if (isEditMode) {
        savedIssue = await dispatch(updateIssue(id, issueData));
      } else {
        savedIssue = await dispatch(createIssue(issueData));
      }

      // Handle attachments if any
      if (attachments.length > 0) {
        await handleAttachmentUpload(savedIssue.id);
      }

      notify({
        message: `Issue ${isEditMode ? 'updated' : 'created'} successfully!`,
        type: 'success',
        displayTime: 3000
      });

      // Call parent callback if provided (for popup mode)
      if (onSave) {
        onSave(savedIssue);
      }

      // Navigation or popup close
      if (isPopup && onClose) {
        onClose();
      } else {
        navigate('/issue-tracker/tickets');
      }

    } catch (error) {
      console.error('Error saving issue:', error);
      notify({
        message: `Failed to ${isEditMode ? 'update' : 'create'} issue. Please try again.`,
        type: 'error',
        displayTime: 4000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAttachmentUpload = async (issueId) => {
    // Implementation for file upload
    // This would integrate with your file upload service
    console.log('Uploading attachments for issue:', issueId, attachments);
  };

  const handleCancel = () => {
    if (isPopup && onClose) {
      onClose();
    } else {
      navigate('/issue-tracker/tickets');
    }
  };

  const handleFieldValueChanged = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Quick create simplified fields - Updated for DTO
  const quickCreateFields = [
    'problemTitle',
    'problemDescription',
    'issueCategory',
    'priority',
    'vehicle',
    'site',
    'assignTo',
    'openby',
    'isUrgent'
  ];

  // Standard workflow fields - Updated for DTO
  const standardFields = [
    'problemTitle',
    'problemDescription',
    'issueCategory',
    'priority',
    'status',
    'assignTo',
    'openby',
    'vehicle',
    'site',
    'dueDate',
    'notes',
    'isUrgent',
    'requiresApproval'
  ];

  // GPS triggered fields (pre-filled + editable) - Updated for DTO
  const gpsTriggeredFields = [
    'problemTitle',
    'problemDescription',
    'issueCategory',
    'priority',
    'vehicle',
    'site',
    'assignTo',
    'openby',
    'gpsAddress',
    'isUrgent',
    'notes'
  ];

  const getFieldsForWorkflow = () => {
    switch (workflowType) {
      case 'quick-create':
        return quickCreateFields;
      case 'gps-triggered':
        return gpsTriggeredFields;
      default:
        return standardFields;
    }
  };

  const shouldShowField = (fieldName) => {
    return getFieldsForWorkflow().includes(fieldName);
  };

  // Calculate overall loading state with debugging and timeout fallback
  const isLoading = issueLoading || vehicleLoading || siteLoading || userLoading;

  // Debug logging to identify which state is stuck
  useEffect(() => {
    console.log('Loading states:', {
      issueLoading,
      vehicleLoading,
      siteLoading,
      userLoading,
      overall: isLoading
    });
    console.log('Data counts:', {
      categories: categories?.length || 0,
      priorities: priorities?.length || 0,
      statuses: statuses?.length || 0,
      vehicles: vehicles?.length || 0,
      sites: sites?.length || 0,
      users: users?.length || 0
    });
  }, [issueLoading, vehicleLoading, siteLoading, userLoading, isLoading, categories, priorities, statuses, vehicles, sites, users]);

  // Timeout fallback to prevent infinite loading
  const [forceShowForm, setForceShowForm] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Form loading timeout reached, showing form anyway');
        setForceShowForm(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Only show loading if we have data available or timeout not reached
  const hasMinimumData = categories?.length > 0 && priorities?.length > 0 && statuses?.length > 0;
  const shouldShowLoading = (isLoading && !forceShowForm && !hasMinimumData) ||
                           (!hasMinimumData && !forceShowForm);

  if (shouldShowLoading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-py-12">
        <LoadIndicator visible={true} />
        <span className="tw-ml-3 tw-text-gray-600">Loading form data...</span>
        <div className="tw-ml-3 tw-text-xs tw-text-gray-500">
          {forceShowForm && '(Timeout reached - showing form)'}
        </div>
      </div>
    );
  }

  const formContent = (
    <div className={`issue-tracker-form-page ${isPopup ? 'popup-mode' : ''}`}>
      {!isPopup && (
        <div className="form-header">
          <div className="header-content">
            <h1>
              <i className={`fa-light ${isEditMode ? 'fa-edit' : 'fa-plus-circle'} tw-mr-2 tw-text-orange-500`}></i>
              {isEditMode ? 'Edit Issue' : 'Create New Issue'}
              {isGpsTriggered && ' (GPS Triggered)'}
              {isQuickCreate && ' (Quick Create)'}
            </h1>
            {autoSaveEnabled && lastSaved && (
              <div className="auto-save-status">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className="header-actions">
            <Button
              text="Cancel"
              type="normal"
              stylingMode="outlined"
              onClick={handleCancel}
              disabled={saving}
            />
            <Button
              text={saving ? 'Saving...' : (isEditMode ? 'Update Issue' : 'Create Issue')}
              type="default"
              stylingMode="contained"
              onClick={handleSave}
              disabled={saving}
              className="tw-bg-orange-600 tw-text-white"
            />
          </div>
        </div>
      )}

      <div className="form-content">
        {validationErrors.length > 0 && (
          <ValidationSummary items={validationErrors} />
        )}

        <Form
          formData={formData}
          onFieldDataChanged={(e) => handleFieldValueChanged(e.dataField, e.value)}
          colCount={isPopup ? 1 : 2}
          labelLocation="top"
        >
          {/* Basic Information Group */}
          <GroupItem caption="Issue Details" colCount={isPopup ? 1 : 2}>
            {shouldShowField('problemTitle') && (
              <SimpleItem
                dataField="problemTitle"
                isRequired={true}
                colSpan={isPopup ? 1 : 2}
              >
                <Label text="Issue Title" />
                <RequiredRule message="Title is required" />
                <StringLengthRule min={5} max={200} message="Title must be between 5 and 200 characters" />
              </SimpleItem>
            )}

            {shouldShowField('problemDescription') && (
              <SimpleItem
                dataField="problemDescription"
                isRequired={true}
                colSpan={isPopup ? 1 : 2}
                editorType="dxTextArea"
                editorOptions={{
                  height: isPopup ? 80 : 120,
                  placeholder: "Describe the issue in detail..."
                }}
              >
                <Label text="Description" />
                <RequiredRule message="Description is required" />
                <StringLengthRule min={10} max={2000} message="Description must be between 10 and 2000 characters" />
              </SimpleItem>
            )}

            {shouldShowField('issueCategory') && (
              <SimpleItem
                dataField="issueCategory"
                isRequired={true}
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: categories,
                  displayExpr: "name",
                  valueExpr: "id",
                  placeholder: "Select a category...",
                  searchEnabled: true,
                  searchMode: "contains",
                  searchExpr: "name",
                  searchTimeout: 300
                }}
              >
                <Label text="Category" />
                <RequiredRule message="Category is required" />
              </SimpleItem>
            )}

            {shouldShowField('priority') && (
              <SimpleItem
                dataField="priority"
                isRequired={true}
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: priorities,
                  displayExpr: "name",
                  valueExpr: "id",
                  placeholder: "Select priority...",
                  searchEnabled: true,
                  searchMode: "contains",
                  searchExpr: "name",
                  searchTimeout: 300
                }}
              >
                <Label text="Priority" />
                <RequiredRule message="Priority is required" />
              </SimpleItem>
            )}

            {/* Vehicle field for quick create and GPS triggered modes */}
            {(shouldShowField('vehicle') && (isQuickCreate || isGpsTriggered)) && (
              <SimpleItem
                dataField="vehicle"
                isRequired={true}
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: vehicles,
                  displayExpr: "hyoungNo", // Changed from vehicleName to hyoungNo
                  valueExpr: "vehicleId",   // Changed from id to vehicleId
                  placeholder: "Select vehicle...",
                  searchEnabled: true,
                  searchMode: "contains",
                  searchExpr: ["hyoungNo", "numberPlate"],
                  searchTimeout: 300
                }}
              >
                <Label text="Vehicle" />
                <RequiredRule message="Vehicle is required" />
              </SimpleItem>
            )}

            {/* Site field for quick create and GPS triggered modes */}
            {(shouldShowField('site') && (isQuickCreate || isGpsTriggered)) && (
              <SimpleItem
                dataField="site"
                isRequired={true}
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: sites,
                  displayExpr: "name",
                  valueExpr: "id",
                  placeholder: "Select site...",
                  searchEnabled: true,
                  searchMode: "contains",
                  searchExpr: "name",
                  searchTimeout: 300
                }}
              >
                <Label text="Site/Location" />
                <RequiredRule message="Site is required" />
              </SimpleItem>
            )}

            {/* Assign To field for quick create and GPS triggered modes */}
            {(shouldShowField('assignTo') && (isQuickCreate || isGpsTriggered)) && (
              <SimpleItem
                dataField="assignTo"
                isRequired={true}
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: users,
                  displayExpr: "userName",
                  valueExpr: "userName",
                  placeholder: "Assign to user...",
                  searchEnabled: true,
                  searchMode: "contains",
                  searchExpr: ["userName", "email"],
                  searchTimeout: 300
                }}
              >
                <Label text="Assigned To" />
                <RequiredRule message="Assigned To is required" />
              </SimpleItem>
            )}
          </GroupItem>

          {/* Assignment and Location Group */}
          {!isQuickCreate && (
            <GroupItem caption="Assignment & Location" colCount={isPopup ? 1 : 2}>
              {shouldShowField('status') && (
                <SimpleItem
                  dataField="status"
                  editorType="dxSelectBox"
                  editorOptions={{
                    dataSource: statuses,
                    displayExpr: "status", // Changed from name to status
                    valueExpr: "id",
                    placeholder: "Select status...",
                    searchEnabled: true,
                    searchMode: "contains",
                    searchExpr: "status",
                    searchTimeout: 300
                  }}
                >
                  <Label text="Status" />
                </SimpleItem>
              )}

              {shouldShowField('assignTo') && (
                <SimpleItem
                  dataField="assignTo"
                  isRequired={true}
                  editorType="dxSelectBox"
                  editorOptions={{
                    dataSource: users,
                    displayExpr: "userName",
                    valueExpr: "userName",
                    placeholder: "Assign to user...",
                    searchEnabled: true,
                    searchMode: "contains",
                    searchExpr: ["userName", "email"],
                    searchTimeout: 300
                  }}
                >
                  <Label text="Assigned To" />
                  <RequiredRule message="Assigned To is required" />
                </SimpleItem>
              )}

              {shouldShowField('vehicle') && (
                <SimpleItem
                  dataField="vehicle"
                  isRequired={true}
                  editorType="dxSelectBox"
                  editorOptions={{
                    dataSource: vehicles,
                    displayExpr: "hyoungNo", // Changed from vehicleName to hyoungNo based on your data structure
                    valueExpr: "vehicleId",   // Changed from id to vehicleId
                    placeholder: "Select vehicle...",
                    searchEnabled: true,
                    searchMode: "contains",
                    searchExpr: ["hyoungNo", "numberPlate"],
                    searchTimeout: 300
                  }}
                >
                  <Label text="Vehicle" />
                  <RequiredRule message="Vehicle is required" />
                </SimpleItem>
              )}

              {shouldShowField('site') && (
                <SimpleItem
                  dataField="site"
                  isRequired={true}
                  editorType="dxSelectBox"
                  editorOptions={{
                    dataSource: sites,
                    displayExpr: "name", // Changed from siteName to name
                    valueExpr: "id",
                    placeholder: "Select site...",
                    searchEnabled: true,
                    searchMode: "contains",
                    searchExpr: "name",
                    searchTimeout: 300
                  }}
                >
                  <Label text="Site/Location" />
                  <RequiredRule message="Site is required" />
                </SimpleItem>
              )}
            </GroupItem>
          )}

          {/* GPS Information (for GPS triggered issues) */}
          {isGpsTriggered && (
            <GroupItem caption="GPS Information" colCount={isPopup ? 1 : 2}>
              {shouldShowField('gpsAddress') && (
                <SimpleItem
                  dataField="gpsAddress"
                  colSpan={isPopup ? 1 : 2}
                  editorOptions={{ readOnly: true }}
                >
                  <Label text="GPS Location" />
                </SimpleItem>
              )}

              <SimpleItem
                dataField="gpsLatitude"
                editorOptions={{ readOnly: true, format: "#.######" }}
              >
                <Label text="Latitude" />
              </SimpleItem>

              <SimpleItem
                dataField="gpsLongitude"
                editorOptions={{ readOnly: true, format: "#.######" }}
              >
                <Label text="Longitude" />
              </SimpleItem>
            </GroupItem>
          )}

          {/* Dates and Costs */}
          {!isQuickCreate && (
            <GroupItem caption="Timeline & Budget" colCount={isPopup ? 1 : 2}>
              {shouldShowField('dueDate') && (
                <SimpleItem
                  dataField="dueDate"
                  editorType="dxDateBox"
                  editorOptions={{
                    type: "date",
                    displayFormat: "MM/dd/yyyy",
                    pickerType: "calendar",
                    placeholder: "Select due date...",
                    showClearButton: true
                  }}
                >
                  <Label text="Due Date" />
                </SimpleItem>
              )}

              <SimpleItem
                dataField="openDate"
                editorType="dxDateBox"
                editorOptions={{
                  readOnly: isEditMode,
                  type: "date",
                  displayFormat: "MM/dd/yyyy",
                  pickerType: "calendar"
                }}
              >
                <Label text="Open Date" />
              </SimpleItem>

              {shouldShowField('estimatedCost') && (
                <SimpleItem dataField="estimatedCost" editorType="dxNumberBox" editorOptions={{
                  format: "currency",
                  min: 0
                }}>
                  <Label text="Estimated Cost" />
                </SimpleItem>
              )}

              {isEditMode && (
                <SimpleItem dataField="actualCost" editorType="dxNumberBox" editorOptions={{
                  format: "currency",
                  min: 0
                }}>
                  <Label text="Actual Cost" />
                </SimpleItem>
              )}
            </GroupItem>
          )}

          {/* Additional Options */}
          <GroupItem caption="Additional Options" colCount={isPopup ? 1 : 2}>
            {shouldShowField('openby') && (
              <SimpleItem
                dataField="openby"
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: users,
                  displayExpr: "userName",
                  valueExpr: "userName",
                  placeholder: "Opened by...",
                  searchEnabled: true,
                  searchMode: "contains",
                  searchExpr: ["userName", "email"],
                  searchTimeout: 300
                }}
              >
                <Label text="Opened By" />
              </SimpleItem>
            )}

            {shouldShowField('isUrgent') && (
              <SimpleItem dataField="isUrgent" editorType="dxCheckBox">
                <Label text="Mark as Urgent" />
              </SimpleItem>
            )}

            {shouldShowField('requiresApproval') && (
              <SimpleItem dataField="requiresApproval" editorType="dxCheckBox">
                <Label text="Requires Approval" />
              </SimpleItem>
            )}

            {shouldShowField('notes') && (
              <SimpleItem
                dataField="notes"
                colSpan={isPopup ? 1 : 2}
                editorType="dxTextArea"
                editorOptions={{
                  height: 80,
                  placeholder: "Additional notes or comments..."
                }}
              >
                <Label text="Notes" />
              </SimpleItem>
            )}
          </GroupItem>

          {/* File Attachments (not for quick create) */}
          {!isQuickCreate && !isPopup && (
            <GroupItem caption="Attachments" colCount={1}>
              <SimpleItem
                template="attachmentTemplate"
                colSpan={2}
              />
            </GroupItem>
          )}
        </Form>

        {/* Attachment Template */}
        {!isQuickCreate && !isPopup && (
          <div className="attachment-area">
            <FileUploader
              multiple={true}
              accept="image/*,.pdf,.doc,.docx,.txt"
              uploadMode="useButtons"
              onValueChanged={(e) => setAttachments(e.value)}
            />
            {attachments.length > 0 && (
              <div className="attachment-list">
                {attachments.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                    <button
                      className="remove-btn"
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popup mode buttons */}
        {isPopup && (
          <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6">
            <Button
              text="Cancel"
              type="normal"
              stylingMode="outlined"
              onClick={handleCancel}
              disabled={saving}
            />
            <Button
              text={saving ? 'Saving...' : (isEditMode ? 'Update Issue' : 'Create Issue')}
              type="default"
              stylingMode="contained"
              onClick={handleSave}
              disabled={saving}
              className="tw-bg-orange-600 tw-text-white"
            />
          </div>
        )}
      </div>
    </div>
  );

  // Return popup version if requested
  if (isPopup) {
    return (
      <Popup
        visible={true}
        onHiding={onClose}
        dragEnabled={false}
        hideOnOutsideClick={false}
        showTitle={true}
        title={
          <span>
            <i className={`fa-light ${isEditMode ? 'fa-edit' : 'fa-plus-circle'} tw-mr-2`}></i>
            {isEditMode ? 'Edit Issue' : 'Create New Issue'}
            {isGpsTriggered && ' (GPS Triggered)'}
            {isQuickCreate && ' (Quick Create)'}
          </span>
        }
        width={isQuickCreate ? 500 : 800}
        height={isQuickCreate ? 600 : 700}
        resizeEnabled={true}
      >
        {formContent}
      </Popup>
    );
  }

  return formContent;
};

export default IssueTrackerFormPage;
