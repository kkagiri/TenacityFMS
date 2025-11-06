import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Button, Popup } from 'devextreme-react';
import { Column, Paging, SearchPanel, FilterRow, HeaderFilter, Export, Selection } from 'devextreme-react/data-grid';
import { Form, SimpleItem, Label, RequiredRule } from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';
import { confirm } from 'devextreme/ui/dialog';
import {
  fetchMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} from '../../../redux/actions/maintenanceActions';

const MaintenanceList = () => {
  const dispatch = useDispatch();
  const { maintenanceRecords } = useSelector((state) => state.maintenance || { maintenanceRecords: [] });
  const [showPopup, setShowPopup] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    dispatch(fetchMaintenanceRecords());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    setFormData({
      vehicleId: null,
      maintenanceType: '',
      status: 'Scheduled',
      scheduledDate: new Date(),
      priority: 2,
      notes: '',
    });
    setEditMode(false);
    setShowPopup(true);
  };

  const handleEdit = (data) => {
    setFormData(data);
    setEditMode(true);
    setShowPopup(true);
  };

  const handleDelete = async (maintenanceId) => {
    const result = await confirm(
      'Are you sure you want to delete this maintenance record?',
      'Confirm Delete'
    );

    if (result) {
      try {
        await dispatch(deleteMaintenanceRecord(maintenanceId));
        notify('Maintenance record deleted successfully', 'success', 3000);
      } catch (error) {
        notify('Error deleting maintenance record', 'error', 3000);
      }
    }
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await dispatch(updateMaintenanceRecord(formData.maintenanceId, formData));
        notify('Maintenance record updated successfully', 'success', 3000);
      } else {
        await dispatch(createMaintenanceRecord(formData));
        notify('Maintenance record created successfully', 'success', 3000);
      }
      setShowPopup(false);
      dispatch(fetchMaintenanceRecords());
    } catch (error) {
      notify('Error saving maintenance record', 'error', 3000);
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
        <Button
          icon="trash"
          onClick={() => handleDelete(cellData.data.maintenanceId)}
          hint="Delete"
        />
      </div>
    );
  };

  const renderStatusCell = (cellData) => {
    const statusColors = {
      'Scheduled': 'tw-bg-blue-100 tw-text-blue-800',
      'In Progress': 'tw-bg-yellow-100 tw-text-yellow-800',
      'Completed': 'tw-bg-green-100 tw-text-green-800',
      'Cancelled': 'tw-bg-gray-100 tw-text-gray-800',
    };

    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-semibold ${statusColors[cellData.value] || ''}`}>
        {cellData.value}
      </span>
    );
  };

  const renderPriorityCell = (cellData) => {
    const priorities = ['Low', 'Normal', 'Medium', 'High', 'Critical'];
    const priorityColors = [
      'tw-bg-gray-100 tw-text-gray-800',
      'tw-bg-blue-100 tw-text-blue-800',
      'tw-bg-yellow-100 tw-text-yellow-800',
      'tw-bg-orange-100 tw-text-orange-800',
      'tw-bg-red-100 tw-text-red-800',
    ];

    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-semibold ${priorityColors[cellData.value - 1] || ''}`}>
        {priorities[cellData.value - 1] || cellData.value}
      </span>
    );
  };

  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800">Maintenance Records</h2>
            <p className="tw-text-gray-600 tw-mt-1">
              Manage all vehicle maintenance activities
            </p>
          </div>
          <Button
            text="Add Maintenance"
            icon="add"
            type="success"
            onClick={handleAdd}
          />
        </div>

        {/* Data Grid */}
        <DataGrid
          dataSource={maintenanceRecords}
          keyExpr="maintenanceId"
          showBorders={true}
          columnAutoWidth={true}
          rowAlternationEnabled={true}
          allowColumnResizing={true}
        >
          <SearchPanel visible={true} width={300} placeholder="Search..." />
          <FilterRow visible={true} />
          <HeaderFilter visible={true} />
          <Export enabled={true} fileName="maintenance_records" />
          <Selection mode="multiple" />
          <Paging defaultPageSize={20} />

          <Column dataField="vehicleName" caption="Vehicle" width={150} />
          <Column dataField="numberPlate" caption="Number Plate" width={120} />
          <Column dataField="maintenanceType" caption="Type" width={150} />
          <Column
            dataField="status"
            caption="Status"
            width={120}
            cellRender={renderStatusCell}
          />
          <Column
            dataField="priority"
            caption="Priority"
            width={100}
            cellRender={renderPriorityCell}
          />
          <Column dataField="scheduledDate" caption="Scheduled Date" width={120} dataType="date" />
          <Column dataField="completedDate" caption="Completed Date" width={120} dataType="date" />
          <Column dataField="cost" caption="Cost" width={100} dataType="number" format="currency" />
          <Column dataField="serviceProvider" caption="Service Provider" width={150} />
          <Column
            caption="Actions"
            width={120}
            cellRender={renderActionButtons}
            allowSorting={false}
            allowFiltering={false}
          />
        </DataGrid>

        {/* Add/Edit Popup */}
        <Popup
          visible={showPopup}
          onHiding={() => setShowPopup(false)}
          title={editMode ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
          width={600}
          height="auto"
        >
          <Form formData={formData} onFieldDataChanged={(e) => setFormData({ ...formData, [e.dataField]: e.value })}>
            <SimpleItem dataField="vehicleId" editorType="dxSelectBox">
              <Label text="Vehicle" />
              <RequiredRule message="Vehicle is required" />
            </SimpleItem>
            <SimpleItem dataField="maintenanceType" editorType="dxTextBox">
              <Label text="Maintenance Type" />
              <RequiredRule message="Maintenance type is required" />
            </SimpleItem>
            <SimpleItem dataField="status" editorType="dxSelectBox" editorOptions={{
              items: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
            }}>
              <Label text="Status" />
            </SimpleItem>
            <SimpleItem dataField="scheduledDate" editorType="dxDateBox">
              <Label text="Scheduled Date" />
            </SimpleItem>
            <SimpleItem dataField="priority" editorType="dxSelectBox" editorOptions={{
              items: [
                { value: 1, text: 'Low' },
                { value: 2, text: 'Normal' },
                { value: 3, text: 'Medium' },
                { value: 4, text: 'High' },
                { value: 5, text: 'Critical' },
              ],
              displayExpr: 'text',
              valueExpr: 'value',
            }}>
              <Label text="Priority" />
            </SimpleItem>
            <SimpleItem dataField="cost" editorType="dxNumberBox">
              <Label text="Cost" />
            </SimpleItem>
            <SimpleItem dataField="serviceProvider" editorType="dxTextBox">
              <Label text="Service Provider" />
            </SimpleItem>
            <SimpleItem dataField="notes" editorType="dxTextArea" editorOptions={{ height: 100 }}>
              <Label text="Notes" />
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

export default MaintenanceList;
