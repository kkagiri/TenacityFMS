import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DataGrid, {
  Column,
  Paging,
  FilterRow,
  Toolbar,
  Item
} from 'devextreme-react/data-grid';
import Tabs from 'devextreme-react/tabs';
import { Button } from 'devextreme-react/button';
import { Popup, ScrollView } from 'devextreme-react';
import { Form, SimpleItem, GroupItem, Label } from 'devextreme-react/form';
import { TextBox } from 'devextreme-react/text-box';
import { NumberBox } from 'devextreme-react/number-box';
import { SelectBox } from 'devextreme-react/select-box';
import { Switch } from 'devextreme-react/switch';
import notify from 'devextreme/ui/notify';

import expectedFuelAverageApi from '../../../../api/expectedFuelAverageApi';
import { fetchReferenceData } from '../../../../redux/slices/expectedFuelAverageSlice';

/**
 * Reference Data Management Component
 * Manages routes, load classifications, and usage intensities
 */
const ReferenceDataManagement = () => {
  const dispatch = useDispatch();
  const {
    routes,
    loadClassifications,
    usageIntensities,
    isLoading: isDataLoading
  } = useSelector(state => state.expectedFuelAverage);
  const sites = useSelector(state => state.site?.sites || []);

  const [activeTab, setActiveTab] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(null); // 'route', 'load', 'intensity'
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchReferenceData());
  }, [dispatch]);

  // Open popup for creating/editing
  const openPopup = (type, item = null) => {
    setPopupType(type);
    setEditItem(item);

    // Initialize form data based on type
    if (type === 'route') {
      setFormData(item || {
        name: '',
        description: '',
        fromLocation: '',
        toLocation: '',
        distanceKm: null,
        elevationChange: null,
        routeType: 'Highway',
        siteId: null,
        isActive: true
      });
    } else if (type === 'load') {
      setFormData(item || {
        name: '',
        description: '',
        minWeightTonnes: null,
        maxWeightTonnes: null,
        sortOrder: 0,
        isActive: true
      });
    } else if (type === 'intensity') {
      setFormData(item || {
        name: '',
        description: '',
        typicalHoursPerDay: null,
        sortOrder: 0,
        isActive: true
      });
    }

    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupType(null);
    setEditItem(null);
    setFormData({});
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let response;

      if (popupType === 'route') {
        if (!formData.name || !formData.fromLocation || !formData.toLocation) {
          notify('Please fill in all required fields', 'warning', 3000);
          setIsSaving(false);
          return;
        }
        response = editItem?.id
          ? await expectedFuelAverageApi.updateFuelRoute(editItem.id, formData)
          : await expectedFuelAverageApi.createFuelRoute(formData);
      } else if (popupType === 'load') {
        if (!formData.name) {
          notify('Please enter a name', 'warning', 3000);
          setIsSaving(false);
          return;
        }
        response = editItem?.id
          ? await expectedFuelAverageApi.updateLoadClassification(editItem.id, formData)
          : await expectedFuelAverageApi.createLoadClassification(formData);
      } else if (popupType === 'intensity') {
        if (!formData.name) {
          notify('Please enter a name', 'warning', 3000);
          setIsSaving(false);
          return;
        }
        response = editItem?.id
          ? await expectedFuelAverageApi.updateUsageIntensity(editItem.id, formData)
          : await expectedFuelAverageApi.createUsageIntensity(formData);
      }

      if (response?.isSuccess) {
        notify(response.message || 'Saved successfully', 'success', 3000);
        closePopup();
        dispatch(fetchReferenceData());
      } else {
        notify(response?.message || 'Failed to save', 'error', 3000);
      }
    } catch (error) {
      console.error('Error saving:', error);
      notify('Error saving data', 'error', 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      let response;
      if (type === 'route') {
        response = await expectedFuelAverageApi.deleteFuelRoute(id);
      } else if (type === 'load') {
        response = await expectedFuelAverageApi.deleteLoadClassification(id);
      } else if (type === 'intensity') {
        response = await expectedFuelAverageApi.deleteUsageIntensity(id);
      }

      if (response?.isSuccess) {
        notify(response.message || 'Deleted successfully', 'success', 3000);
        dispatch(fetchReferenceData());
      } else {
        notify(response?.message || 'Failed to delete', 'error', 3000);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      notify('Error deleting data', 'error', 3000);
    }
  };

  // Render actions column
  const renderActions = (type) => (cellData) => (
    <div className="tw-flex tw-gap-2">
      <Button
        icon="fa-light fa-edit"
        hint="Edit"
        stylingMode="text"
        onClick={() => openPopup(type, cellData.data)}
      />
      <Button
        icon="fa-light fa-trash"
        hint="Delete"
        stylingMode="text"
        onClick={() => handleDelete(type, cellData.data.id)}
      />
    </div>
  );

  // Render status cell
  const renderStatus = (cellData) => (
    <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs ${
      cellData.value ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-gray-100 tw-text-gray-600'
    }`}>
      {cellData.value ? 'Active' : 'Inactive'}
    </span>
  );

  // Get popup title
  const getPopupTitle = () => {
    const action = editItem?.id ? 'Edit' : 'Add';
    if (popupType === 'route') return `${action} Fuel Route`;
    if (popupType === 'load') return `${action} Load Classification`;
    if (popupType === 'intensity') return `${action} Usage Intensity`;
    return '';
  };

  const tabs = [
    { id: 0, text: 'Fuel Routes', icon: 'fa-light fa-route' },
    { id: 1, text: 'Load Classifications', icon: 'fa-light fa-weight-hanging' },
    { id: 2, text: 'Usage Intensities', icon: 'fa-light fa-gauge-high' }
  ];

  return (
    <div className="tw-p-4">
      <div className="tw-border-b tw-border-gray-200 tw-mb-4">
        <Tabs
          dataSource={tabs}
          selectedIndex={activeTab}
          onItemClick={(e) => setActiveTab(e.itemData.id)}
          itemRender={(item) => (
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className={item.icon}></i>
              <span>{item.text}</span>
            </div>
          )}
        />
      </div>

      {/* Fuel Routes Tab */}
      {activeTab === 0 && (
        <div className="tw-p-4">
          <div className="tw-mb-4 tw-p-4 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200">
            <p className="tw-text-sm tw-text-blue-800">
              <i className="fa-light fa-info-circle tw-mr-2"></i>
              Fuel routes define the from/to locations for km/L based vehicles.
              Routes are directional - create separate routes for outbound and return journeys.
            </p>
          </div>

          <DataGrid
            dataSource={routes}
            keyExpr="id"
            showBorders={true}
            showRowLines={true}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
          >
            <FilterRow visible={true} />
            <Paging defaultPageSize={10} />

            <Toolbar>
              <Item location="before">
                <Button
                  text="Add Route"
                  icon="fa-light fa-plus"
                  type="default"
                  stylingMode="contained"
                  onClick={() => openPopup('route')}
                />
              </Item>
            </Toolbar>

            <Column dataField="name" caption="Name" width={150} />
            <Column dataField="fromLocation" caption="From" width={150} />
            <Column dataField="toLocation" caption="To" width={150} />
            <Column dataField="distanceKm" caption="Distance (km)" width={100} />
            <Column dataField="routeType" caption="Type" width={100} />
            <Column dataField="siteName" caption="Site" width={120} />
            <Column dataField="isActive" caption="Status" width={80} cellRender={renderStatus} />
            <Column caption="Actions" width={100} cellRender={renderActions('route')} />
          </DataGrid>
        </div>
      )}

      {/* Load Classifications Tab */}
      {activeTab === 1 && (
        <div className="tw-p-4">
          <div className="tw-mb-4 tw-p-4 tw-bg-green-50 tw-rounded-lg tw-border tw-border-green-200">
            <p className="tw-text-sm tw-text-green-800">
              <i className="fa-light fa-info-circle tw-mr-2"></i>
              Load classifications define weight categories for vehicles (e.g., Empty, 20-30t, Full Load).
              Used for km/L based vehicles where fuel consumption varies by cargo weight.
            </p>
          </div>

          <DataGrid
            dataSource={loadClassifications}
            keyExpr="id"
            showBorders={true}
            showRowLines={true}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
          >
            <FilterRow visible={true} />
            <Paging defaultPageSize={10} />

            <Toolbar>
              <Item location="before">
                <Button
                  text="Add Classification"
                  icon="fa-light fa-plus"
                  type="default"
                  stylingMode="contained"
                  onClick={() => openPopup('load')}
                />
              </Item>
            </Toolbar>

            <Column dataField="name" caption="Name" width={150} />
            <Column dataField="description" caption="Description" width={200} />
            <Column dataField="minWeightTonnes" caption="Min Weight (t)" width={120} />
            <Column dataField="maxWeightTonnes" caption="Max Weight (t)" width={120} />
            <Column dataField="sortOrder" caption="Sort Order" width={100} />
            <Column dataField="isActive" caption="Status" width={80} cellRender={renderStatus} />
            <Column caption="Actions" width={100} cellRender={renderActions('load')} />
          </DataGrid>
        </div>
      )}

      {/* Usage Intensities Tab */}
      {activeTab === 2 && (
        <div className="tw-p-4">
          <div className="tw-mb-4 tw-p-4 tw-bg-yellow-50 tw-rounded-lg tw-border tw-border-yellow-200">
            <p className="tw-text-sm tw-text-yellow-800">
              <i className="fa-light fa-info-circle tw-mr-2"></i>
              Usage intensities define operating levels for L/hr based equipment (Heavy, Mid, Low).
              Used for generators, excavators, and other stationary equipment.
            </p>
          </div>

          <DataGrid
            dataSource={usageIntensities}
            keyExpr="id"
            showBorders={true}
            showRowLines={true}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
          >
            <FilterRow visible={true} />
            <Paging defaultPageSize={10} />

            <Toolbar>
              <Item location="before">
                <Button
                  text="Add Intensity"
                  icon="fa-light fa-plus"
                  type="default"
                  stylingMode="contained"
                  onClick={() => openPopup('intensity')}
                />
              </Item>
            </Toolbar>

            <Column dataField="name" caption="Name" width={150} />
            <Column dataField="description" caption="Description" width={200} />
            <Column dataField="typicalHoursPerDay" caption="Typical Hours/Day" width={150} />
            <Column dataField="sortOrder" caption="Sort Order" width={100} />
            <Column dataField="isActive" caption="Status" width={80} cellRender={renderStatus} />
            <Column caption="Actions" width={100} cellRender={renderActions('intensity')} />
          </DataGrid>
        </div>
      )}

      {/* Add/Edit Popup */}
      <Popup
        visible={showPopup}
        onHiding={closePopup}
        dragEnabled={false}
        showTitle={true}
        title={getPopupTitle()}
        width="90%"
        maxWidth={600}
        height="auto"
        maxHeight="90%"
        showCloseButton={true}
      >
        <ScrollView width="100%" height="100%">
          <div className="tw-p-4">
            {/* Route Form */}
            {popupType === 'route' && (
              <Form formData={formData} readOnly={isSaving}>
                <GroupItem colCount={2}>
                  <SimpleItem>
                    <TextBox
                      value={formData.name}
                      onValueChanged={(e) => handleFieldChange('name', e.value)}
                      placeholder="e.g., NAI-NVS"
                    />
                    <Label text="Route Name *" />
                  </SimpleItem>

                  <SimpleItem>
                    <SelectBox
                      dataSource={[
                        { id: 'Highway', name: 'Highway' },
                        { id: 'City', name: 'City' },
                        { id: 'Mixed', name: 'Mixed' },
                        { id: 'OffRoad', name: 'Off-Road' },
                        { id: 'Site', name: 'Site Section' }
                      ]}
                      valueExpr="id"
                      displayExpr="name"
                      value={formData.routeType}
                      onValueChanged={(e) => handleFieldChange('routeType', e.value)}
                    />
                    <Label text="Route Type" />
                  </SimpleItem>

                  <SimpleItem>
                    <TextBox
                      value={formData.fromLocation}
                      onValueChanged={(e) => handleFieldChange('fromLocation', e.value)}
                      placeholder="e.g., Nairobi"
                    />
                    <Label text="From Location *" />
                  </SimpleItem>

                  <SimpleItem>
                    <TextBox
                      value={formData.toLocation}
                      onValueChanged={(e) => handleFieldChange('toLocation', e.value)}
                      placeholder="e.g., Naivasha"
                    />
                    <Label text="To Location *" />
                  </SimpleItem>

                  <SimpleItem>
                    <NumberBox
                      value={formData.distanceKm}
                      onValueChanged={(e) => handleFieldChange('distanceKm', e.value)}
                      min={0}
                      format="#0.0 km"
                    />
                    <Label text="Distance (km)" />
                  </SimpleItem>

                  <SimpleItem>
                    <NumberBox
                      value={formData.elevationChange}
                      onValueChanged={(e) => handleFieldChange('elevationChange', e.value)}
                      format="+#0;-#0;0"
                    />
                    <Label text="Elevation Change (m)" />
                  </SimpleItem>

                  <SimpleItem>
                    <SelectBox
                      dataSource={sites}
                      valueExpr="id"
                      displayExpr="name"
                      value={formData.siteId}
                      onValueChanged={(e) => handleFieldChange('siteId', e.value)}
                      showClearButton={true}
                      placeholder="Optional - for site-specific routes"
                    />
                    <Label text="Associated Site" />
                  </SimpleItem>

                  <SimpleItem>
                    <Switch
                      value={formData.isActive}
                      onValueChanged={(e) => handleFieldChange('isActive', e.value)}
                    />
                    <Label text="Active" />
                  </SimpleItem>
                </GroupItem>
              </Form>
            )}

            {/* Load Classification Form */}
            {popupType === 'load' && (
              <Form formData={formData} readOnly={isSaving}>
                <GroupItem colCount={2}>
                  <SimpleItem>
                    <TextBox
                      value={formData.name}
                      onValueChanged={(e) => handleFieldChange('name', e.value)}
                      placeholder="e.g., 20-30t"
                    />
                    <Label text="Classification Name *" />
                  </SimpleItem>

                  <SimpleItem>
                    <NumberBox
                      value={formData.sortOrder}
                      onValueChanged={(e) => handleFieldChange('sortOrder', e.value)}
                      min={0}
                    />
                    <Label text="Sort Order" />
                  </SimpleItem>

                  <SimpleItem>
                    <NumberBox
                      value={formData.minWeightTonnes}
                      onValueChanged={(e) => handleFieldChange('minWeightTonnes', e.value)}
                      min={0}
                      format="#0.0 t"
                    />
                    <Label text="Min Weight (tonnes)" />
                  </SimpleItem>

                  <SimpleItem>
                    <NumberBox
                      value={formData.maxWeightTonnes}
                      onValueChanged={(e) => handleFieldChange('maxWeightTonnes', e.value)}
                      min={0}
                      format="#0.0 t"
                    />
                    <Label text="Max Weight (tonnes)" />
                  </SimpleItem>

                  <SimpleItem colSpan={2}>
                    <TextBox
                      value={formData.description}
                      onValueChanged={(e) => handleFieldChange('description', e.value)}
                      placeholder="Description..."
                    />
                    <Label text="Description" />
                  </SimpleItem>

                  <SimpleItem>
                    <Switch
                      value={formData.isActive}
                      onValueChanged={(e) => handleFieldChange('isActive', e.value)}
                    />
                    <Label text="Active" />
                  </SimpleItem>
                </GroupItem>
              </Form>
            )}

            {/* Usage Intensity Form */}
            {popupType === 'intensity' && (
              <Form formData={formData} readOnly={isSaving}>
                <GroupItem colCount={2}>
                  <SimpleItem>
                    <TextBox
                      value={formData.name}
                      onValueChanged={(e) => handleFieldChange('name', e.value)}
                      placeholder="e.g., Heavy"
                    />
                    <Label text="Intensity Name *" />
                  </SimpleItem>

                  <SimpleItem>
                    <NumberBox
                      value={formData.sortOrder}
                      onValueChanged={(e) => handleFieldChange('sortOrder', e.value)}
                      min={0}
                    />
                    <Label text="Sort Order" />
                  </SimpleItem>

                  <SimpleItem>
                    <NumberBox
                      value={formData.typicalHoursPerDay}
                      onValueChanged={(e) => handleFieldChange('typicalHoursPerDay', e.value)}
                      min={0}
                      max={24}
                      format="#0.0 hrs"
                    />
                    <Label text="Typical Hours/Day" />
                  </SimpleItem>

                  <SimpleItem>
                    <Switch
                      value={formData.isActive}
                      onValueChanged={(e) => handleFieldChange('isActive', e.value)}
                    />
                    <Label text="Active" />
                  </SimpleItem>

                  <SimpleItem colSpan={2}>
                    <TextBox
                      value={formData.description}
                      onValueChanged={(e) => handleFieldChange('description', e.value)}
                      placeholder="Description..."
                    />
                    <Label text="Description" />
                  </SimpleItem>
                </GroupItem>
              </Form>
            )}

            {/* Action Buttons */}
            <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
              <Button
                text="Cancel"
                stylingMode="outlined"
                onClick={closePopup}
                disabled={isSaving}
              />
              <Button
                text={editItem?.id ? 'Update' : 'Create'}
                type="default"
                stylingMode="contained"
                onClick={handleSave}
                disabled={isSaving}
              />
            </div>
          </div>
        </ScrollView>
      </Popup>
    </div>
  );
};

export default ReferenceDataManagement;
