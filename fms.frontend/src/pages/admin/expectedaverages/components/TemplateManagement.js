import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DataGrid, {
  Column,
  Paging,
  FilterRow,
  SearchPanel,
  Toolbar,
  Item,
  Selection,
  HeaderFilter,
  ColumnChooser,
  Export
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup, ScrollView } from 'devextreme-react';
import notify from 'devextreme/ui/notify';

import {
  fetchTemplates,
  deleteTemplate,
  clearMessages
} from '../../../../redux/slices/expectedFuelAverageSlice';
import TemplateForm from './TemplateForm';

const TemplateManagement = () => {
  const dispatch = useDispatch();

  // Redux state
  const {
    templates,
    isLoading,
    successMessage,
    error
  } = useSelector(state => state.expectedFuelAverage);

  const vehicleTypes = useSelector(state => state.vehicleType?.vehicleTypes || []);
  const manufacturers = useSelector(state => state.vehicleManufacturer?.manufacturers || []);
  const models = useSelector(state => state.vehicleModel?.vehicleModels || []);
  const sites = useSelector(state => state.site?.sites || []);
  const { routes, loadClassifications, usageIntensities } = useSelector(state => state.expectedFuelAverage);

  // Local state
  const [showTemplatePopup, setShowTemplatePopup] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Load templates on mount
  useEffect(() => {
    dispatch(fetchTemplates({ includeInactive: true }));
  }, [dispatch]);

  // Handle messages
  useEffect(() => {
    if (successMessage) {
      notify(successMessage, 'success', 3000);
      dispatch(clearMessages());
      setShowTemplatePopup(false);
      setSelectedTemplate(null);
    }
    if (error) {
      notify(error, 'error', 3000);
      dispatch(clearMessages());
    }
  }, [successMessage, error, dispatch]);

  // Template CRUD operations
  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowTemplatePopup(true);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setShowTemplatePopup(true);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    dispatch(deleteTemplate(templateId));
  };

  const handleTemplateSaved = () => {
    // Success message handling is done in useEffect
    // Just need to close popup if it's not handled there
    // But we'll let the useEffect handle closing on success
  };

  // Render template actions column
  const renderTemplateActions = (cellData) => {
    return (
      <div className="tw-flex tw-gap-2">
        <Button
          icon="fa-light fa-edit"
          hint="Edit Template"
          stylingMode="text"
          onClick={() => handleEditTemplate(cellData.data)}
        />
        <Button
          icon="fa-light fa-trash"
          hint="Delete Template"
          stylingMode="text"
          onClick={() => handleDeleteTemplate(cellData.data.id)}
        />
      </div>
    );
  };

  // Render measurement type cell
  const renderMeasurementType = (cellData) => {
    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${
        cellData.value ? 'tw-bg-blue-100 tw-text-blue-800' : 'tw-bg-green-100 tw-text-green-800'
      }`}>
        {cellData.value ? 'km/L' : 'L/hr'}
      </span>
    );
  };

  // Render active status cell
  const renderActiveStatus = (cellData) => {
    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs ${
        cellData.value ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-gray-100 tw-text-gray-600'
      }`}>
        {cellData.value ? 'Active' : 'Inactive'}
      </span>
    );
  };

  // Render expected value with unit
  const renderExpectedValue = (cellData) => {
    const template = cellData.data;
    const unit = template.isKmPerLiter ? 'km/L' : 'L/hr';
    return (
      <span className="tw-font-semibold">
        {cellData.value?.toFixed(2)} {unit}
      </span>
    );
  };

  return (
    <div className="template-management">
      <DataGrid
        dataSource={templates}
        keyExpr="id"
        showBorders={true}
        showRowLines={true}
        rowAlternationEnabled={true}
        columnAutoWidth={true}
        allowColumnResizing={true}
        allowColumnReordering={true}
        height="calc(100vh - 350px)"
      >
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <SearchPanel visible={true} width={240} placeholder="Search templates..." />
        <Selection mode="single" />
        <Paging defaultPageSize={20} />
        <ColumnChooser enabled={true} mode="select" />
        <Export enabled={true} fileName="ExpectedFuelAverageTemplates" />

        <Toolbar>
          <Item location="before">
            <Button
              text="Add Template"
              icon="fa-light fa-plus"
              type="default"
              stylingMode="contained"
              onClick={handleCreateTemplate}
            />
          </Item>
          <Item name="searchPanel" />
          <Item name="columnChooserButton" />
          <Item name="exportButton" />
        </Toolbar>

        <Column dataField="name" caption="Template Name" width={200} />
        <Column
          dataField="isKmPerLiter"
          caption="Type"
          width={80}
          cellRender={renderMeasurementType}
        />
        <Column
          dataField="expectedValue"
          caption="Expected"
          width={100}
          cellRender={renderExpectedValue}
        />
        <Column dataField="vehicleTypeName" caption="Vehicle Type" width={120} />
        <Column dataField="vehicleManufacturerName" caption="Manufacturer" width={120} />
        <Column dataField="vehicleModelName" caption="Model" width={100} />
        <Column dataField="siteName" caption="Site" width={120} />
        <Column dataField="fuelRouteName" caption="Route" width={120} />
        <Column dataField="loadClassificationName" caption="Load" width={100} />
        <Column dataField="usageIntensityName" caption="Usage" width={80} />
        <Column dataField="tolerancePercent" caption="Tolerance %" width={100} />
        <Column
          dataField="isActive"
          caption="Status"
          width={80}
          cellRender={renderActiveStatus}
        />
        <Column
          caption="Actions"
          width={100}
          cellRender={renderTemplateActions}
          allowFiltering={false}
          allowSorting={false}
        />
      </DataGrid>

      {/* Template Form Popup */}
      <Popup
        visible={showTemplatePopup}
        onHiding={() => {
          setShowTemplatePopup(false);
          setSelectedTemplate(null);
        }}
        dragEnabled={false}
        showTitle={true}
        title={selectedTemplate ? 'Edit Template' : 'Create Template'}
        width="90%"
        maxWidth={800}
        height="auto"
        maxHeight="90%"
        showCloseButton={true}
      >
        <ScrollView width="100%" height="100%">
          <TemplateForm
            template={selectedTemplate}
            vehicleTypes={vehicleTypes}
            manufacturers={manufacturers}
            models={models}
            sites={sites}
            routes={routes}
            loadClassifications={loadClassifications}
            usageIntensities={usageIntensities}
            onSave={handleTemplateSaved}
            onCancel={() => {
              setShowTemplatePopup(false);
              setSelectedTemplate(null);
            }}
          />
        </ScrollView>
      </Popup>
    </div>
  );
};

export default TemplateManagement;
