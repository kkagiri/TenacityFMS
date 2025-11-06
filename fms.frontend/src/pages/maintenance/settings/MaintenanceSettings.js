import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Button, Popup } from 'devextreme-react';
import { Column, Paging, SearchPanel } from 'devextreme-react/data-grid';
import { Form, SimpleItem, Label, RequiredRule } from 'devextreme-react/form';
import { notify } from 'devextreme/ui/notify';
import { fetchMaintenanceSchedules } from '../../../redux/actions/maintenanceActions';
import maintenanceService from '../../../services/maintenanceService';

const MaintenanceSettings = () => {
  const dispatch = useDispatch();
  const { schedules, loading } = useSelector((state) => state.maintenance);
  const [showPopup, setShowPopup] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      await dispatch(fetchMaintenanceSchedules());
    } catch (error) {
      notify('Error loading schedules', 'error', 3000);
    }
  };

  const handleAdd = () => {
    setFormData({
      maintenanceType: '',
      description: '',
      intervalKilometers: null,
      intervalDays: null,
      warningThresholdKm: null,
      warningThresholdDays: null,
      estimatedCost: null,
      isActive: true,
      applyToAllVehicles: true,
      defaultPriority: 2,
    });
    setEditMode(false);
    setShowPopup(true);
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
      loadSchedules();
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
          <Button
            text="Add Schedule"
            icon="add"
            type="success"
            onClick={handleAdd}
          />
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
            dataField="estimatedCost"
            caption="Estimated Cost"
            width={120}
            format="currency"
          />
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

        {/* Add/Edit Popup */}
        <Popup
          visible={showPopup}
          onHiding={() => setShowPopup(false)}
          title={editMode ? 'Edit Maintenance Schedule' : 'Add Maintenance Schedule'}
          width={700}
          height="auto"
        >
          <Form formData={formData} onFieldDataChanged={(e) => setFormData({ ...formData, [e.dataField]: e.value })}>
            <SimpleItem dataField="maintenanceType" editorType="dxTextBox">
              <Label text="Maintenance Type" />
              <RequiredRule message="Maintenance type is required" />
            </SimpleItem>
            <SimpleItem dataField="description" editorType="dxTextArea" editorOptions={{ height: 80 }}>
              <Label text="Description" />
            </SimpleItem>
            <SimpleItem dataField="intervalKilometers" editorType="dxNumberBox">
              <Label text="Interval (Kilometers)" />
            </SimpleItem>
            <SimpleItem dataField="intervalDays" editorType="dxNumberBox">
              <Label text="Interval (Days)" />
            </SimpleItem>
            <SimpleItem dataField="warningThresholdKm" editorType="dxNumberBox">
              <Label text="Warning Threshold (KM)" />
            </SimpleItem>
            <SimpleItem dataField="warningThresholdDays" editorType="dxNumberBox">
              <Label text="Warning Threshold (Days)" />
            </SimpleItem>
            <SimpleItem dataField="estimatedCost" editorType="dxNumberBox">
              <Label text="Estimated Cost" />
            </SimpleItem>
            <SimpleItem dataField="defaultPriority" editorType="dxSelectBox" editorOptions={{
              items: [
                { value: 1, text: 'Low' },
                { value: 2, text: 'Normal' },
                { value: 3, text: 'Medium' },
                { value: 4, text: 'High' },
              ],
              displayExpr: 'text',
              valueExpr: 'value',
            }}>
              <Label text="Default Priority" />
            </SimpleItem>
            <SimpleItem dataField="applyToAllVehicles" editorType="dxCheckBox">
              <Label text="Apply to All Vehicles" />
            </SimpleItem>
            <SimpleItem dataField="isActive" editorType="dxCheckBox">
              <Label text="Active" />
            </SimpleItem>
          </Form>

          <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4">
            <Button text="Cancel" onClick={() => setShowPopup(false)} />
            <Button text="Save" type="success" onClick={handleSave} />
          </div>
        </Popup>
      </div>
    </div>
  );
};

export default MaintenanceSettings;
