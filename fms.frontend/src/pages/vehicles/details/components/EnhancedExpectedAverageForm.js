import React, { useState, useEffect, useCallback } from 'react';
import { SelectBox } from 'devextreme-react/select-box';
import { NumberBox } from 'devextreme-react/number-box';
import { TextArea } from 'devextreme-react/text-area';
import { Switch } from 'devextreme-react/switch';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import TabPanel, { Item as TabItem } from 'devextreme-react/tab-panel';
import DataGrid, { Column, Paging } from 'devextreme-react/data-grid';
import notify from 'devextreme/ui/notify';

import expectedFuelAverageApi from '../../../../api/expectedFuelAverageApi';

/**
 * Enhanced Expected Average Form for Vehicle Details
 * Allows assignment of templates to vehicles with optional overrides
 */
const EnhancedExpectedAverageForm = ({ vehicle, onClose, onSuccess }) => {
  // Reference data
  const [templates, setTemplates] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loadClassifications, setLoadClassifications] = useState([]);
  const [usageIntensities, setUsageIntensities] = useState([]);

  // Current assignments
  const [currentAssignments, setCurrentAssignments] = useState([]);

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedLoadClassificationId, setSelectedLoadClassificationId] = useState(null);
  const [selectedUsageIntensityId, setSelectedUsageIntensityId] = useState(null);
  const [overrideValue, setOverrideValue] = useState(null);
  const [useOverride, setUseOverride] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Determine if vehicle uses km/L (has odometer) or L/hr
  const isKmPerLiter = vehicle?.vehicleType?.isKmPerLiter !== false;

  // Load all data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [templatesRes, routesRes, loadRes, intensityRes, assignmentsRes] = await Promise.all([
        expectedFuelAverageApi.getTemplates({
          vehicleTypeId: vehicle?.vehicleTypeId,
          vehicleManufacturerId: vehicle?.vehicleManufacturerId,
          vehicleModelId: vehicle?.vehicleModelId,
          siteId: vehicle?.siteId,
          isKmPerLiter: isKmPerLiter
        }),
        expectedFuelAverageApi.getFuelRoutes(true),
        expectedFuelAverageApi.getLoadClassifications(true),
        expectedFuelAverageApi.getUsageIntensities(true),
        expectedFuelAverageApi.getAssignmentsByVehicle(vehicle?.vehicleId)
      ]);

      if (templatesRes.isSuccess) setTemplates(templatesRes.data || []);
      if (routesRes.isSuccess) setRoutes(routesRes.data || []);
      if (loadRes.isSuccess) setLoadClassifications(loadRes.data || []);
      if (intensityRes.isSuccess) setUsageIntensities(intensityRes.data || []);
      if (assignmentsRes.isSuccess) setCurrentAssignments(assignmentsRes.data || []);

    } catch (error) {
      console.error('Error loading data:', error);
      notify('Error loading template data', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [vehicle, isKmPerLiter]);

  useEffect(() => {
    if (vehicle) {
      loadData();
    }
  }, [vehicle, loadData]);

  // Filter templates based on selected criteria
  const filteredTemplates = templates.filter(t => {
    // Must match km/L vs L/hr
    if (t.isKmPerLiter !== isKmPerLiter) return false;

    // Filter by route if selected (for km/L vehicles)
    if (selectedRouteId && t.fuelRouteId !== selectedRouteId) return false;

    // Filter by load classification if selected
    if (selectedLoadClassificationId && t.loadClassificationId !== selectedLoadClassificationId) return false;

    // Filter by usage intensity if selected (for L/hr vehicles)
    if (selectedUsageIntensityId && t.usageIntensityId !== selectedUsageIntensityId) return false;

    return true;
  });

  // Handle template selection
  const handleTemplateSelected = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template);
    if (template) {
      setOverrideValue(template.expectedValue);
    }
  };

  // Handle assignment save
  const handleSave = async () => {
    if (!selectedTemplate) {
      notify('Please select a template', 'warning', 3000);
      return;
    }

    setIsSaving(true);
    try {
      const response = await expectedFuelAverageApi.assignVehicle({
        vehicleId: vehicle.vehicleId,
        expectedFuelAverageTemplateId: selectedTemplate.id,
        overrideExpectedValue: useOverride ? overrideValue : null,
        isDefault: isDefault,
        notes: notes,
        assignedByUserId: null // Will be set by backend from JWT
      });

      if (response.isSuccess) {
        notify(response.message || 'Assignment saved successfully', 'success', 3000);
        await loadData(); // Refresh assignments
        if (onSuccess) {
          onSuccess(useOverride ? overrideValue : selectedTemplate.expectedValue);
        }
      } else {
        notify(response.message || 'Failed to save assignment', 'error', 3000);
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
      notify('Error saving assignment', 'error', 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle assignment deletion
  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const response = await expectedFuelAverageApi.unassignVehicle(
        vehicle.vehicleId,
        assignmentId
      );

      if (response.isSuccess) {
        notify(response.message || 'Assignment removed', 'success', 3000);
        await loadData();
      } else {
        notify(response.message || 'Failed to remove assignment', 'error', 3000);
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      notify('Error removing assignment', 'error', 3000);
    }
  };

  // Render assignment status
  const renderAssignmentStatus = (cellData) => (
    <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs ${
      cellData.value ? 'tw-bg-blue-100 tw-text-blue-800' : 'tw-bg-gray-100 tw-text-gray-600'
    }`}>
      {cellData.value ? 'Default' : 'Additional'}
    </span>
  );

  // Render expected value
  const renderExpectedValue = (cellData) => {
    const assignment = cellData.data;
    const value = assignment.overrideExpectedValue || assignment.template?.expectedValue;
    const unit = isKmPerLiter ? 'km/L' : 'L/hr';
    const isOverride = !!assignment.overrideExpectedValue;

    return (
      <span className={`tw-font-semibold ${isOverride ? 'tw-text-orange-600' : ''}`}>
        {value?.toFixed(2)} {unit}
        {isOverride && <span className="tw-text-xs tw-ml-1">(override)</span>}
      </span>
    );
  };

  // Render assignment actions
  const renderActions = (cellData) => (
    <Button
      icon="fa-light fa-trash"
      hint="Remove Assignment"
      stylingMode="text"
      onClick={() => handleDeleteAssignment(cellData.data.id)}
    />
  );

  return (
    <div className="tw-p-4">
      <LoadPanel visible={isLoading || isSaving} />

      {/* Vehicle Info Header */}
      <div className="tw-bg-gradient-to-r tw-from-blue-50 tw-to-indigo-50 tw-rounded-lg tw-p-4 tw-mb-6 tw-border tw-border-blue-200">
        <div className="tw-flex tw-items-center tw-gap-4">
          <div className="tw-w-12 tw-h-12 tw-bg-blue-600 tw-rounded-full tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-truck tw-text-white tw-text-xl"></i>
          </div>
          <div>
            <h3 className="tw-font-bold tw-text-lg tw-text-gray-800">{vehicle?.vehicleCode}</h3>
            <div className="tw-flex tw-gap-4 tw-text-sm tw-text-gray-600">
              <span>
                <i className="fa-light fa-car tw-mr-1"></i>
                {vehicle?.vehicleType?.vehicleTypeName || 'N/A'}
              </span>
              <span>
                <i className="fa-light fa-industry tw-mr-1"></i>
                {vehicle?.vehicleManufacturer?.vehicleManufacturerName || 'N/A'}
              </span>
              <span className={`tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium ${
                isKmPerLiter ? 'tw-bg-blue-100 tw-text-blue-800' : 'tw-bg-green-100 tw-text-green-800'
              }`}>
                {isKmPerLiter ? 'km/L Vehicle' : 'L/hr Equipment'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <TabPanel
        selectedIndex={activeTab}
        onOptionChanged={(e) => {
          if (e.name === 'selectedIndex') {
            setActiveTab(e.value);
          }
        }}
      >
        {/* Assign Template Tab */}
        <TabItem title="Assign Template" icon="fa-light fa-plus-circle">
          <div className="tw-p-4">
            {/* Filter Section */}
            <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-mb-6 tw-border tw-border-gray-200">
              <h4 className="tw-font-semibold tw-text-gray-700 tw-mb-3">
                <i className="fa-light fa-filter tw-mr-2"></i>
                Filter Templates
              </h4>
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
                {isKmPerLiter ? (
                  <>
                    <div>
                      <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">Route</label>
                      <SelectBox
                        dataSource={routes}
                        valueExpr="id"
                        displayExpr="name"
                        value={selectedRouteId}
                        onValueChanged={(e) => setSelectedRouteId(e.value)}
                        showClearButton={true}
                        placeholder="Select route..."
                        itemTemplate={(data) => (
                          <div>
                            <div className="tw-font-medium">{data.name}</div>
                            <div className="tw-text-xs tw-text-gray-500">{data.fromLocation} → {data.toLocation}</div>
                          </div>
                        )}
                      />
                    </div>
                    <div>
                      <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">Load</label>
                      <SelectBox
                        dataSource={loadClassifications}
                        valueExpr="id"
                        displayExpr="name"
                        value={selectedLoadClassificationId}
                        onValueChanged={(e) => setSelectedLoadClassificationId(e.value)}
                        showClearButton={true}
                        placeholder="Select load..."
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">Usage Intensity</label>
                    <SelectBox
                      dataSource={usageIntensities}
                      valueExpr="id"
                      displayExpr="name"
                      value={selectedUsageIntensityId}
                      onValueChanged={(e) => setSelectedUsageIntensityId(e.value)}
                      showClearButton={true}
                      placeholder="Select intensity..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Template Selection */}
            <div className="tw-mb-6">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Select Template *
              </label>
              <SelectBox
                dataSource={filteredTemplates}
                valueExpr="id"
                displayExpr="name"
                value={selectedTemplate?.id}
                onValueChanged={(e) => handleTemplateSelected(e.value)}
                placeholder="Choose a template..."
                searchEnabled={true}
                itemTemplate={(data) => (
                  <div className="tw-py-2">
                    <div className="tw-flex tw-justify-between tw-items-center">
                      <span className="tw-font-medium">{data.name}</span>
                      <span className="tw-text-blue-600 tw-font-semibold">
                        {data.expectedValue?.toFixed(2)} {isKmPerLiter ? 'km/L' : 'L/hr'}
                      </span>
                    </div>
                    <div className="tw-text-xs tw-text-gray-500">
                      {data.vehicleTypeName} • {data.fuelRouteName || data.usageIntensityName || 'General'}
                    </div>
                  </div>
                )}
              />
              {filteredTemplates.length === 0 && !isLoading && (
                <p className="tw-text-sm tw-text-yellow-600 tw-mt-2">
                  <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>
                  No matching templates found. Try adjusting filters or create a new template in Admin.
                </p>
              )}
            </div>

            {/* Selected Template Info */}
            {selectedTemplate && (
              <div className="tw-bg-blue-50 tw-rounded-lg tw-p-4 tw-mb-6 tw-border tw-border-blue-200">
                <h4 className="tw-font-semibold tw-text-blue-800 tw-mb-2">Selected Template</h4>
                <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm">
                  <div>
                    <span className="tw-text-gray-600">Expected Value:</span>
                    <span className="tw-ml-2 tw-font-semibold">
                      {selectedTemplate.expectedValue?.toFixed(2)} {isKmPerLiter ? 'km/L' : 'L/hr'}
                    </span>
                  </div>
                  <div>
                    <span className="tw-text-gray-600">Tolerance:</span>
                    <span className="tw-ml-2 tw-font-semibold">
                      ±{selectedTemplate.tolerancePercent || 10}%
                    </span>
                  </div>
                  {selectedTemplate.fuelRouteName && (
                    <div>
                      <span className="tw-text-gray-600">Route:</span>
                      <span className="tw-ml-2">{selectedTemplate.fuelRouteName}</span>
                    </div>
                  )}
                  {selectedTemplate.loadClassificationName && (
                    <div>
                      <span className="tw-text-gray-600">Load:</span>
                      <span className="tw-ml-2">{selectedTemplate.loadClassificationName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Override Section */}
            <div className="tw-mb-6">
              <div className="tw-flex tw-items-center tw-gap-4 tw-mb-3">
                <Switch
                  value={useOverride}
                  onValueChanged={(e) => setUseOverride(e.value)}
                />
                <span className="tw-text-sm tw-font-medium tw-text-gray-700">
                  Override expected value for this vehicle
                </span>
              </div>

              {useOverride && (
                <div className="tw-pl-12">
                  <NumberBox
                    value={overrideValue}
                    onValueChanged={(e) => setOverrideValue(e.value)}
                    min={0}
                    step={0.1}
                    format={`#0.00 '${isKmPerLiter ? 'km/L' : 'L/hr'}'`}
                    width={200}
                  />
                  <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                    This vehicle-specific value will be used instead of the template default.
                  </p>
                </div>
              )}
            </div>

            {/* Default Toggle */}
            <div className="tw-mb-6">
              <div className="tw-flex tw-items-center tw-gap-4">
                <Switch
                  value={isDefault}
                  onValueChanged={(e) => setIsDefault(e.value)}
                />
                <span className="tw-text-sm tw-font-medium tw-text-gray-700">
                  Set as default expected average
                </span>
              </div>
              <p className="tw-text-xs tw-text-gray-500 tw-ml-12 tw-mt-1">
                The default average is used when no specific route/condition is selected.
              </p>
            </div>

            {/* Notes */}
            <div className="tw-mb-6">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Notes</label>
              <TextArea
                value={notes}
                onValueChanged={(e) => setNotes(e.value)}
                height={80}
                placeholder="Optional notes about this assignment..."
              />
            </div>

            {/* Action Buttons */}
            <div className="tw-flex tw-justify-end tw-gap-3 tw-pt-4 tw-border-t tw-border-gray-200">
              <Button
                text="Cancel"
                stylingMode="outlined"
                onClick={onClose}
              />
              <Button
                text="Save Assignment"
                type="default"
                stylingMode="contained"
                icon="fa-light fa-save"
                onClick={handleSave}
                disabled={!selectedTemplate || isSaving}
              />
            </div>
          </div>
        </TabItem>

        {/* Current Assignments Tab */}
        <TabItem title={`Current Assignments (${currentAssignments.length})`} icon="fa-light fa-list">
          <div className="tw-p-4">
            {currentAssignments.length === 0 ? (
              <div className="tw-text-center tw-py-8 tw-text-gray-500">
                <i className="fa-light fa-inbox tw-text-4xl tw-mb-4"></i>
                <p>No expected average assignments for this vehicle.</p>
                <p className="tw-text-sm">Use the "Assign Template" tab to add one.</p>
              </div>
            ) : (
              <DataGrid
                dataSource={currentAssignments}
                keyExpr="id"
                showBorders={true}
                showRowLines={true}
                rowAlternationEnabled={true}
                columnAutoWidth={true}
              >
                <Paging defaultPageSize={5} />

                <Column dataField="template.name" caption="Template" width={200} />
                <Column
                  dataField="isDefault"
                  caption="Type"
                  width={100}
                  cellRender={renderAssignmentStatus}
                />
                <Column
                  caption="Expected Value"
                  width={150}
                  cellRender={renderExpectedValue}
                />
                <Column dataField="template.fuelRouteName" caption="Route" width={120} />
                <Column dataField="template.loadClassificationName" caption="Load" width={100} />
                <Column dataField="notes" caption="Notes" width={150} />
                <Column
                  caption="Actions"
                  width={80}
                  cellRender={renderActions}
                  allowFiltering={false}
                />
              </DataGrid>
            )}
          </div>
        </TabItem>
      </TabPanel>
    </div>
  );
};

export default EnhancedExpectedAverageForm;
