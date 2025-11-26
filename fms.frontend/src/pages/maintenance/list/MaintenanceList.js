import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Button, Popup, ScrollView } from 'devextreme-react';
import { Column, Paging, SearchPanel, FilterRow, HeaderFilter, Export, Selection } from 'devextreme-react/data-grid';
import { Form, SimpleItem, Label, RequiredRule, GroupItem } from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';
import { confirm } from 'devextreme/ui/dialog';
import {
  fetchMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} from '../../../redux/actions/maintenanceActions';
import { fetchVehicleList } from '../../../redux/actions/vehicleActions';

const MaintenanceList = () => {
  const dispatch = useDispatch();
  const { maintenanceRecords } = useSelector((state) => state.maintenance || { maintenanceRecords: [] });
  const vehicles = useSelector((state) => state.vehicle.vehicles || []);
  const [showPopup, setShowPopup] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loadingGpsData, setLoadingGpsData] = useState(false);

  // Maintenance types - can be fetched from backend or defined here
  const maintenanceTypes = [
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
  ];

  useEffect(() => {
    dispatch(fetchMaintenanceRecords());
    dispatch(fetchVehicleList());
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
      issueNote: '',
      description: '',
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

  // Fetch odometer reading from GPS accumulators
  const handleFetchOdometerFromGPS = async () => {
    if (!formData.vehicleId) {
      notify('Please select a vehicle first', 'warning', 3000);
      return;
    }

    try {
      setLoadingGpsData(true);

      // Call the accumulator API to get vehicle odometer and engine hours
      const response = await fetch(`/api/v1/vehiclemaintenance/${formData.vehicleId}/accumulators`);

      if (response.ok) {
        const result = await response.json();

        if (result.isSuccess && result.data && result.data.length > 0) {
          const accumulators = result.data;

          // Find odometer accumulator (typically System Odometer)
          const odometerAcc = accumulators.find(a =>
            a.accumulatorTypeName?.toLowerCase().includes('odometer')
          );

          // Find engine hours accumulator
          const engineHoursAcc = accumulators.find(a =>
            a.accumulatorTypeName?.toLowerCase().includes('engine') &&
            a.accumulatorTypeName?.toLowerCase().includes('hour')
          );

          if (accumulators.length === 1) {
            // Single accumulator - auto-populate
            const acc = accumulators[0];
            const value = Math.round(acc.value * 100) / 100;

            setFormData({
              ...formData,
              odometerAtSchedule: value,
            });

            notify(
              `${acc.accumulatorTypeName}: ${value.toLocaleString()} ${acc.unit} (from GPS)`,
              'success',
              4000
            );
          } else {
            // Multiple accumulators - show selection dialog
            const message = accumulators.map((a, idx) => {
              const value = Math.round(a.value * 100) / 100;
              return `${idx + 1}. ${a.accumulatorTypeName}: ${value.toLocaleString()} ${a.unit}`;
            }).join('\n');

            // Use DevExtreme popup or alert for selection
            if (odometerAcc) {
              const odometerValue = Math.round(odometerAcc.value * 100) / 100;
              setFormData({
                ...formData,
                odometerAtSchedule: odometerValue,
              });

              notify(
                `Multiple accumulators found. Using ${odometerAcc.accumulatorTypeName}: ${odometerValue.toLocaleString()} ${odometerAcc.unit}`,
                'success',
                5000
              );
            } else {
              notify(`Multiple accumulators available:\n${message}`, 'info', 6000);
            }
          }
        } else {
          notify(result.message || 'No GPS accumulators found for this vehicle', 'warning', 3000);
        }
      } else {
        const errorData = await response.json();
        notify(errorData.message || 'Failed to fetch GPS accumulators', 'error', 3000);
      }
    } catch (error) {
      console.error('Error fetching GPS accumulators:', error);
      notify('Error fetching odometer from GPS', 'error', 3000);
    } finally {
      setLoadingGpsData(false);
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
          <Column
            caption="Actions"
            width={120}
            cellRender={renderActionButtons}
            allowSorting={false}
            allowFiltering={false}
          />
        </DataGrid>

        {/* Add/Edit Popup - Full Screen & Mobile Friendly */}
        <Popup
          visible={showPopup}
          onHiding={() => setShowPopup(false)}
          title={editMode ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
          width="95%"
          height="95%"
          maxWidth={1200}
          showCloseButton={true}
          closeOnOutsideClick={false}
        >
          <ScrollView width="100%" height="100%">
            <div className="tw-p-4">
              <Form
                formData={formData}
                onFieldDataChanged={(e) => setFormData({ ...formData, [e.dataField]: e.value })}
                labelLocation="top"
                colCount={1}
              >
                <GroupItem caption="Vehicle Information" colSpan={1}>
                  <SimpleItem
                    dataField="vehicleId"
                    editorType="dxSelectBox"
                    editorOptions={{
                      dataSource: vehicles,
                      valueExpr: 'vehicleId',
                      displayExpr: 'hyoungNo',
                      searchEnabled: true,
                      placeholder: 'Select vehicle',
                      showClearButton: true,
                    }}
                  >
                    <Label text="Vehicle" />
                    <RequiredRule message="Vehicle is required" />
                  </SimpleItem>

                  <SimpleItem
                    dataField="maintenanceType"
                    editorType="dxSelectBox"
                    editorOptions={{
                      dataSource: maintenanceTypes,
                      searchEnabled: true,
                      placeholder: 'Select maintenance type',
                      showClearButton: true,
                    }}
                  >
                    <Label text="Maintenance Type" />
                    <RequiredRule message="Maintenance type is required" />
                  </SimpleItem>
                </GroupItem>

                <GroupItem caption="Scheduling" colSpan={1}>
                  <SimpleItem
                    dataField="status"
                    editorType="dxSelectBox"
                    editorOptions={{
                      items: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
                    }}
                  >
                    <Label text="Status" />
                  </SimpleItem>

                  <SimpleItem dataField="scheduledDate" editorType="dxDateBox">
                    <Label text="Scheduled Date" />
                  </SimpleItem>

                  <SimpleItem
                    dataField="priority"
                    editorType="dxSelectBox"
                    editorOptions={{
                      items: [
                        { value: 1, text: 'Low' },
                        { value: 2, text: 'Normal' },
                        { value: 3, text: 'Medium' },
                        { value: 4, text: 'High' },
                        { value: 5, text: 'Critical' },
                      ],
                      displayExpr: 'text',
                      valueExpr: 'value',
                    }}
                  >
                    <Label text="Priority" />
                  </SimpleItem>
                </GroupItem>

                <GroupItem caption="Odometer Reading" colSpan={1}>
                  <div className="tw-mb-2">
                    <Button
                      text="Pull Odometer from GPS"
                      icon="download"
                      type="default"
                      onClick={handleFetchOdometerFromGPS}
                      disabled={!formData.vehicleId || loadingGpsData}
                      hint="Fetch current odometer reading from GPS tracking"
                    />
                    {loadingGpsData && (
                      <span className="tw-ml-2 tw-text-sm tw-text-gray-600">Loading...</span>
                    )}
                  </div>

                  <SimpleItem
                    dataField="odometerAtSchedule"
                    editorType="dxNumberBox"
                    editorOptions={{
                      placeholder: 'Enter or pull from GPS'
                    }}
                  >
                    <Label text="Odometer at Schedule (km)" />
                  </SimpleItem>
                </GroupItem>

                <GroupItem caption="Details" colSpan={1}>
                  <SimpleItem
                    dataField="description"
                    editorType="dxTextArea"
                    editorOptions={{
                      height: 100,
                      placeholder: 'Describe the maintenance work'
                    }}
                  >
                    <Label text="Description" />
                  </SimpleItem>

                  <SimpleItem
                    dataField="notes"
                    editorType="dxTextArea"
                    editorOptions={{
                      height: 100,
                      placeholder: 'Additional notes'
                    }}
                  >
                    <Label text="Notes" />
                  </SimpleItem>

                  <SimpleItem
                    dataField="issueNote"
                    editorType="dxTextArea"
                    editorOptions={{
                      height: 100,
                      placeholder: 'Note any issues encountered'
                    }}
                  >
                    <Label text="Issue Note" />
                  </SimpleItem>
                </GroupItem>
              </Form>

              <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6 tw-pb-4">
                <Button text="Cancel" onClick={() => setShowPopup(false)} stylingMode="outlined" />
                <Button text="Save" type="success" onClick={handleSave} />
              </div>
            </div>
          </ScrollView>
        </Popup>
      </div>
    </div>
  );
};

export default MaintenanceList;
