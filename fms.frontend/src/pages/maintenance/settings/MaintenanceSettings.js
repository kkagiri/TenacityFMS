import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Button, Popup, ScrollView, TabPanel } from 'devextreme-react';
import { Column, Paging, SearchPanel } from 'devextreme-react/data-grid';
import { Form, SimpleItem, Label, RequiredRule, GroupItem } from 'devextreme-react/form';
import { Item } from 'devextreme-react/tab-panel';
import notify from 'devextreme/ui/notify';
import { confirm } from 'devextreme/ui/dialog';
import { fetchMaintenanceSchedules } from '../../../redux/actions/maintenanceActions';
import maintenanceService from '../../../services/maintenanceService';

const MaintenanceSettings = () => {
  const dispatch = useDispatch();
  const { schedules } = useSelector((state) => state.maintenance || { schedules: [] });
  const [showPopup, setShowPopup] = useState(false);
  const [showTypePopup, setShowTypePopup] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [intervalType, setIntervalType] = useState('km'); // 'km' or 'hrs'

  // Maintenance types management
  const [maintenanceTypes, setMaintenanceTypes] = useState([
    'Oil Change',
    'Tire Rotation',
    'Brake Service',
    'Engine Service',
    'Transmission Service',
    'Battery Replacement',
    'Air Filter Replacement',
    'Spark Plug Replacement',
    'Coolant Service',
    'Inspection',
    'General Repair',
    'Other'
  ]);
  const [newTypeName, setNewTypeName] = useState('');

  useEffect(() => {
    dispatch(fetchMaintenanceSchedules());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    setFormData({
      maintenanceType: '',
      description: '',
      intervalKilometers: null,
      intervalDays: null,
      intervalHours: null,
      warningThresholdKm: null,
      warningThresholdDays: null,
      isActive: true,
      applyToAllVehicles: true,
      defaultPriority: 2,
    });
    setIntervalType('km');
    setEditMode(false);
    setShowPopup(true);
  };

  // Maintenance Type Management
  const handleAddType = () => {
    if (newTypeName.trim()) {
      if (!maintenanceTypes.includes(newTypeName.trim())) {
        setMaintenanceTypes([...maintenanceTypes, newTypeName.trim()]);
        setNewTypeName('');
        notify('Maintenance type added successfully', 'success', 3000);
      } else {
        notify('This maintenance type already exists', 'warning', 3000);
      }
    }
  };

  const handleDeleteType = async (typeName) => {
    const result = await confirm(
      `Are you sure you want to delete "${typeName}"?`,
      'Confirm Delete'
    );

    if (result) {
      setMaintenanceTypes(maintenanceTypes.filter(t => t !== typeName));
      notify('Maintenance type deleted successfully', 'success', 3000);
    }
  };

  const handleEdit = (data) => {
    setFormData(data);
    setEditMode(true);
    setShowPopup(true);
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await maintenanceService.updateSchedule(formData.scheduleId, formData);
        notify('Schedule updated successfully', 'success', 3000);
      } else {
        await maintenanceService.createSchedule(formData);
        notify('Schedule created successfully', 'success', 3000);
      }
      setShowPopup(false);
      dispatch(fetchMaintenanceSchedules());
    } catch (error) {
      notify('Error saving schedule', 'error', 3000);
    }
  };

  const renderActionButtons = (cellData) => {
    return (
      <div className="tw-flex tw-gap-2">
        <Button
          icon="edit"
          onClick={() => handleEdit(cellData.data)}
          hint="Edit"
        />
      </div>
    );
  };

  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800">Maintenance Settings</h2>
            <p className="tw-text-gray-600 tw-mt-1">
              Configure maintenance schedules and service intervals
            </p>
          </div>
          <div className="tw-flex tw-gap-2">
            <Button
              text="Manage Types"
              icon="preferences"
              type="default"
              onClick={() => setShowTypePopup(true)}
            />
            <Button
              text="Add Schedule"
              icon="add"
              type="success"
              onClick={handleAdd}
            />
          </div>
        </div>

        {/* Schedules Grid */}
        <DataGrid
          dataSource={schedules}
          keyExpr="scheduleId"
          showBorders={true}
          columnAutoWidth={true}
          rowAlternationEnabled={true}
        >
          <SearchPanel visible={true} width={300} placeholder="Search..." />
          <Paging defaultPageSize={20} />

          <Column dataField="maintenanceType" caption="Maintenance Type" width={180} />
          <Column dataField="description" caption="Description" width={250} />
          <Column
            dataField="intervalKilometers"
            caption="Interval (KM)"
            width={120}
            format="#,##0"
          />
          <Column dataField="intervalDays" caption="Interval (Days)" width={120} />
          <Column
            dataField="isActive"
            caption="Active"
            width={80}
            dataType="boolean"
          />
          <Column
            dataField="applyToAllVehicles"
            caption="Apply to All"
            width={100}
            dataType="boolean"
          />
          <Column
            caption="Actions"
            width={100}
            cellRender={renderActionButtons}
            allowSorting={false}
          />
        </DataGrid>

        {/* Add/Edit Schedule Popup - Smaller with ScrollView */}
        <Popup
          visible={showPopup}
          onHiding={() => setShowPopup(false)}
          title={editMode ? 'Edit Maintenance Schedule' : 'Add Maintenance Schedule'}
          width={600}
          height={600}
          showCloseButton={true}
        >
          <ScrollView width="100%" height="100%">
            <div className="tw-p-4">
              <Form
                formData={formData}
                onFieldDataChanged={(e) => setFormData({ ...formData, [e.dataField]: e.value })}
                labelLocation="top"
              >
                <GroupItem caption="Basic Information">
                  <SimpleItem
                    dataField="maintenanceType"
                    editorType="dxSelectBox"
                    editorOptions={{
                      dataSource: maintenanceTypes,
                      searchEnabled: true,
                      placeholder: 'Select maintenance type'
                    }}
                  >
                    <Label text="Maintenance Type" />
                    <RequiredRule message="Maintenance type is required" />
                  </SimpleItem>
                  <SimpleItem
                    dataField="description"
                    editorType="dxTextArea"
                    editorOptions={{ height: 60 }}
                  >
                    <Label text="Description" />
                  </SimpleItem>
                </GroupItem>

                <GroupItem caption="Interval Configuration">
                  <SimpleItem
                    dataField="intervalType"
                    editorType="dxSelectBox"
                    editorOptions={{
                      items: [
                        { value: 'km', text: 'Kilometers' },
                        { value: 'hrs', text: 'Hours' }
                      ],
                      displayExpr: 'text',
                      valueExpr: 'value',
                      value: intervalType,
                      onValueChanged: (e) => setIntervalType(e.value)
                    }}
                  >
                    <Label text="Interval Type" />
                  </SimpleItem>

                  {intervalType === 'km' ? (
                    <SimpleItem dataField="intervalKilometers" editorType="dxNumberBox">
                      <Label text="Interval (Kilometers)" />
                    </SimpleItem>
                  ) : (
                    <SimpleItem dataField="intervalHours" editorType="dxNumberBox">
                      <Label text="Interval (Hours)" />
                    </SimpleItem>
                  )}

                  <SimpleItem dataField="intervalDays" editorType="dxNumberBox">
                    <Label text="Interval (Days)" />
                  </SimpleItem>
                </GroupItem>

                <GroupItem caption="Warning Thresholds">
                  {intervalType === 'km' && (
                    <SimpleItem dataField="warningThresholdKm" editorType="dxNumberBox">
                      <Label text="Warning Threshold (KM)" />
                    </SimpleItem>
                  )}
                  <SimpleItem dataField="warningThresholdDays" editorType="dxNumberBox">
                    <Label text="Warning Threshold (Days)" />
                  </SimpleItem>
                </GroupItem>

                <GroupItem caption="Settings">
                  <SimpleItem
                    dataField="defaultPriority"
                    editorType="dxSelectBox"
                    editorOptions={{
                      items: [
                        { value: 1, text: 'Low' },
                        { value: 2, text: 'Normal' },
                        { value: 3, text: 'Medium' },
                        { value: 4, text: 'High' },
                      ],
                      displayExpr: 'text',
                      valueExpr: 'value',
                    }}
                  >
                    <Label text="Default Priority" />
                  </SimpleItem>
                  <SimpleItem dataField="applyToAllVehicles" editorType="dxCheckBox">
                    <Label text="Apply to All Vehicles" />
                  </SimpleItem>
                  <SimpleItem dataField="isActive" editorType="dxCheckBox">
                    <Label text="Active" />
                  </SimpleItem>
                </GroupItem>
              </Form>

              <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4 tw-pb-4">
                <Button text="Cancel" onClick={() => setShowPopup(false)} stylingMode="outlined" />
                <Button text="Save" type="success" onClick={handleSave} />
              </div>
            </div>
          </ScrollView>
        </Popup>

        {/* Maintenance Type Management Popup */}
        <Popup
          visible={showTypePopup}
          onHiding={() => setShowTypePopup(false)}
          title="Manage Maintenance Types"
          width={500}
          height={600}
          showCloseButton={true}
        >
          <ScrollView width="100%" height="100%">
            <div className="tw-p-4">
              {/* Add New Type */}
              <div className="tw-mb-6">
                <h3 className="tw-text-lg tw-font-semibold tw-mb-3">Add New Type</h3>
                <div className="tw-flex tw-gap-2">
                  <input
                    type="text"
                    className="tw-flex-1 tw-px-3 tw-py-2 tw-border tw-rounded"
                    placeholder="Type name..."
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddType()}
                  />
                  <Button
                    text="Add"
                    icon="add"
                    type="success"
                    onClick={handleAddType}
                  />
                </div>
              </div>

              {/* Existing Types */}
              <div>
                <h3 className="tw-text-lg tw-font-semibold tw-mb-3">
                  Existing Types ({maintenanceTypes.length})
                </h3>
                <div className="tw-space-y-2">
                  {maintenanceTypes.map((type, index) => (
                    <div
                      key={index}
                      className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded tw-border"
                    >
                      <span className="tw-font-medium">{type}</span>
                      <Button
                        icon="trash"
                        type="danger"
                        stylingMode="text"
                        onClick={() => handleDeleteType(type)}
                        hint="Delete type"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="tw-mt-6 tw-pt-4 tw-border-t">
                <Button
                  text="Close"
                  onClick={() => setShowTypePopup(false)}
                  stylingMode="contained"
                  type="default"
                  width="100%"
                />
              </div>
            </div>
          </ScrollView>
        </Popup>
      </div>
    </div>
  );
};

export default MaintenanceSettings;
