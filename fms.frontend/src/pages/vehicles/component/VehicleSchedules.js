import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataGrid } from 'devextreme-react/data-grid';
import { Column, Paging, FilterRow, SearchPanel, Export, Selection, LoadPanel } from 'devextreme-react/data-grid';
import { Scheduler, View } from 'devextreme-react/scheduler';
import { DateBox } from 'devextreme-react/date-box';
import { SelectBox } from 'devextreme-react/select-box';
import Button from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { Form } from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';

// Redux actions
import { fetchVehicleSchedules, addVehicleSchedule, updateVehicleSchedule, deleteVehicleSchedule } from '../../../redux/actions/vehicleActions';

const VehicleSchedules = ({ vehicleId }) => {
  const dispatch = useDispatch();
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [schedulesData, setSchedulesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addFormVisible, setAddFormVisible] = useState(false);
  const [editFormVisible, setEditFormVisible] = useState(false);
  const [newSchedule, setNewSchedule] = useState({});
  const [editingSchedule, setEditingSchedule] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const dataLoadedRef = useRef(false); // Use ref instead of state to avoid dependency issues

  const scheduleTypes = [
    { value: 'Maintenance', text: 'Maintenance', color: '#f59e0b' },
    { value: 'Inspection', text: 'Inspection', color: '#3b82f6' },
    { value: 'Service', text: 'Service', color: '#10b981' },
    { value: 'Assignment', text: 'Assignment', color: '#8b5cf6' },
    { value: 'Delivery', text: 'Delivery', color: '#ef4444' },
    { value: 'Training', text: 'Training', color: '#06b6d4' },
    { value: 'Other', text: 'Other', color: '#6b7280' }
  ];

  const priorityOptions = [
    { value: 'High', text: 'High Priority', color: '#ef4444' },
    { value: 'Medium', text: 'Medium Priority', color: '#f59e0b' },
    { value: 'Low', text: 'Low Priority', color: '#10b981' }
  ];

  const statusOptions = [
    { value: 'Scheduled', text: 'Scheduled' },
    { value: 'In Progress', text: 'In Progress' },
    { value: 'Completed', text: 'Completed' },
    { value: 'Cancelled', text: 'Cancelled' },
    { value: 'Postponed', text: 'Postponed' }
  ];

  const viewModeOptions = [
    { value: 'list', text: 'List View', icon: 'fa-light fa-list' },
    { value: 'calendar', text: 'Calendar View', icon: 'fa-light fa-calendar' }
  ];

  const loadSchedules = useCallback(async (forceReload = false) => {
    if ((dataLoadedRef.current && !forceReload) || !vehicleId) return; // Prevent loading if already loaded

    try {
      setIsLoading(true);
      const response = await dispatch(fetchVehicleSchedules(vehicleId));

      if (response.success) {
        // Transform data for scheduler and convert ISO strings back to Date objects
        const transformedData = response.data.map(item => ({
          ...item,
          startDate: item.startDateTime ? new Date(item.startDateTime) : null,
          endDate: item.endDateTime ? new Date(item.endDateTime) : null,
          text: item.title,
          description: item.description
        }));
        setSchedulesData(transformedData);
        dataLoadedRef.current = true; // Mark as loaded
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
      notify(error.message || 'Failed to load schedules', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, vehicleId]);

  useEffect(() => {
    if (vehicleId && !dataLoadedRef.current) { // Only load if not already loaded
      loadSchedules();
    }
  }, [vehicleId, loadSchedules]);

  const handleAddSchedule = async () => {
    try {
      const response = await dispatch(addVehicleSchedule({
        ...newSchedule,
        vehicleId
      }));

      if (response.success) {
        notify('Schedule added successfully', 'success', 3000);
        setAddFormVisible(false);
        setNewSchedule({});
        loadSchedules();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      notify(error.message || 'Failed to add schedule', 'error', 3000);
    }
  };

  const handleUpdateSchedule = async () => {
    try {
      const response = await dispatch(updateVehicleSchedule(editingSchedule.id, editingSchedule));

      if (response.success) {
        notify('Schedule updated successfully', 'success', 3000);
        setEditFormVisible(false);
        setEditingSchedule({});
        loadSchedules();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      notify(error.message || 'Failed to update schedule', 'error', 3000);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      const response = await dispatch(deleteVehicleSchedule(scheduleId));

      if (response.success) {
        notify('Schedule deleted successfully', 'success', 3000);
        loadSchedules();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      notify(error.message || 'Failed to delete schedule', 'error', 3000);
    }
  };

  const formatDateTime = (value) => {
    return value ? new Date(value).toLocaleString() : '';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': 'tw-bg-blue-100 tw-text-blue-800',
      'In Progress': 'tw-bg-yellow-100 tw-text-yellow-800',
      'Completed': 'tw-bg-green-100 tw-text-green-800',
      'Cancelled': 'tw-bg-red-100 tw-text-red-800',
      'Postponed': 'tw-bg-gray-100 tw-text-gray-800'
    };
    return colors[status] || 'tw-bg-gray-100 tw-text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const priorityData = priorityOptions.find(p => p.value === priority);
    return priorityData ? priorityData.color : '#6b7280';
  };

  const getTypeColor = (type) => {
    const typeData = scheduleTypes.find(t => t.value === type);
    return typeData ? typeData.color : '#6b7280';
  };

  const formItems = [
    {
      itemType: 'group',
      caption: 'Schedule Information',
      items: [
        {
          dataField: 'title',
          label: { text: 'Title' },
          validationRules: [{ type: 'required', message: 'Title is required' }]
        },
        {
          dataField: 'scheduleType',
          label: { text: 'Schedule Type' },
          editorType: 'dxSelectBox',
          editorOptions: {
            dataSource: scheduleTypes,
            valueExpr: 'value',
            displayExpr: 'text'
          },
          validationRules: [{ type: 'required', message: 'Schedule type is required' }]
        },
        {
          dataField: 'priority',
          label: { text: 'Priority' },
          editorType: 'dxSelectBox',
          editorOptions: {
            dataSource: priorityOptions,
            valueExpr: 'value',
            displayExpr: 'text'
          }
        },
        {
          dataField: 'status',
          label: { text: 'Status' },
          editorType: 'dxSelectBox',
          editorOptions: {
            dataSource: statusOptions,
            valueExpr: 'value',
            displayExpr: 'text'
          }
        }
      ]
    },
    {
      itemType: 'group',
      caption: 'Date & Time',
      items: [
        {
          dataField: 'startDate',
          label: { text: 'Start Date & Time' },
          editorType: 'dxDateBox',
          editorOptions: {
            type: 'datetime',
            displayFormat: 'dd/MM/yyyy HH:mm'
          },
          validationRules: [{ type: 'required', message: 'Start date is required' }]
        },
        {
          dataField: 'endDate',
          label: { text: 'End Date & Time' },
          editorType: 'dxDateBox',
          editorOptions: {
            type: 'datetime',
            displayFormat: 'dd/MM/yyyy HH:mm'
          },
          validationRules: [{ type: 'required', message: 'End date is required' }]
        }
      ]
    },
    {
      itemType: 'group',
      caption: 'Details',
      items: [
        {
          dataField: 'description',
          label: { text: 'Description' },
          editorType: 'dxTextArea',
          editorOptions: {
            height: 100
          }
        },
        {
          dataField: 'location',
          label: { text: 'Location' }
        },
        {
          dataField: 'assignedTo',
          label: { text: 'Assigned To' }
        },
        {
          dataField: 'notes',
          label: { text: 'Notes' },
          editorType: 'dxTextArea',
          editorOptions: {
            height: 80
          }
        }
      ]
    }
  ];

  return (
    <div className="vehicle-schedules">
      <div className="tw-mb-6">
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-justify-between md:tw-items-center tw-mb-4">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 md:tw-mb-0">
            Vehicle Schedules
          </h3>
          <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-2">
            {viewModeOptions.map(option => (
              <Button
                key={option.value}
                text={option.text}
                icon={option.icon}
                onClick={() => setViewMode(option.value)}
                type={viewMode === option.value ? 'default' : 'normal'}
                stylingMode={viewMode === option.value ? 'contained' : 'outlined'}
              />
            ))}
            <Button
              text="Add Schedule"
              icon="fa-light fa-plus"
              onClick={() => setAddFormVisible(true)}
              type="default"
              stylingMode="contained"
            />
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <DataGrid
          dataSource={schedulesData}
          keyExpr="id"
          showBorders={true}
          showRowLines={true}
          showColumnLines={true}
          allowColumnReordering={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
          height={500}
          onRowDblClick={(e) => {
            setEditingSchedule(e.data);
            setEditFormVisible(true);
          }}
        >
          <LoadPanel enabled={isLoading} />

          <Column
            dataField="title"
            caption="Title"
            width={200}
          />

          <Column
            dataField="scheduleType"
            caption="Type"
            width={120}
            cellRender={(cellData) => (
              <span
                className="tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-text-white"
                style={{ backgroundColor: getTypeColor(cellData.value) }}
              >
                {cellData.value}
              </span>
            )}
          />

          <Column
            dataField="startDate"
            caption="Start Date"
            dataType="datetime"
            format="dd/MM/yyyy HH:mm"
            width={150}
            allowSorting={true}
          />

          <Column
            dataField="endDate"
            caption="End Date"
            dataType="datetime"
            format="dd/MM/yyyy HH:mm"
            width={150}
          />

          <Column
            dataField="priority"
            caption="Priority"
            width={100}
            cellRender={(cellData) => (
              <span
                className="tw-font-medium"
                style={{ color: getPriorityColor(cellData.value) }}
              >
                {cellData.value}
              </span>
            )}
          />

          <Column
            dataField="status"
            caption="Status"
            width={120}
            cellRender={(cellData) => (
              <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${getStatusColor(cellData.value)}`}>
                {cellData.value}
              </span>
            )}
          />

          <Column
            dataField="location"
            caption="Location"
            width={150}
          />

          <Column
            dataField="assignedTo"
            caption="Assigned To"
            width={150}
          />

          <Column
            caption="Actions"
            width={100}
            cellRender={(cellData) => (
              <div className="tw-flex tw-gap-2">
                <Button
                  icon="fa-light fa-edit"
                  hint="Edit"
                  onClick={() => {
                    setEditingSchedule(cellData.data);
                    setEditFormVisible(true);
                  }}
                  type="normal"
                  stylingMode="text"
                />
                <Button
                  icon="fa-light fa-trash"
                  hint="Delete"
                  onClick={() => handleDeleteSchedule(cellData.data.id)}
                  type="normal"
                  stylingMode="text"
                />
              </div>
            )}
          />

          <Paging enabled={true} pageSize={20} />
          <FilterRow visible={true} />
          <SearchPanel visible={true} width={240} placeholder="Search schedules..." />
          <Export enabled={true} fileName="vehicle-schedules" />
          <Selection mode="single" />
        </DataGrid>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200">
          <Scheduler
            dataSource={schedulesData}
            currentDate={currentDate}
            onCurrentDateChange={setCurrentDate}
            height={600}
            startDayHour={7}
            endDayHour={19}
            textExpr="title"
            startDateExpr="startDate"
            endDateExpr="endDate"
            allDayExpr="allDay"
            onAppointmentClick={(e) => {
              setEditingSchedule(e.appointmentData);
              setEditFormVisible(true);
            }}
          >
            <View type="day" />
            <View type="week" />
            <View type="month" />
          </Scheduler>
        </div>
      )}

      {/* Summary Cards */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mt-6">
        <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-blue-600 tw-font-medium">Total Schedules</p>
              <p className="tw-text-2xl tw-font-bold tw-text-blue-900">
                {schedulesData.length}
              </p>
            </div>
            <i className="fa-light fa-calendar tw-text-2xl tw-text-blue-600"></i>
          </div>
        </div>

        <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-yellow-600 tw-font-medium">Upcoming</p>
              <p className="tw-text-2xl tw-font-bold tw-text-yellow-900">
                {schedulesData.filter(item =>
                  new Date(item.startDate) > new Date() && item.status === 'Scheduled'
                ).length}
              </p>
            </div>
            <i className="fa-light fa-clock tw-text-2xl tw-text-yellow-600"></i>
          </div>
        </div>

        <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-green-600 tw-font-medium">Completed</p>
              <p className="tw-text-2xl tw-font-bold tw-text-green-900">
                {schedulesData.filter(item => item.status === 'Completed').length}
              </p>
            </div>
            <i className="fa-light fa-check-circle tw-text-2xl tw-text-green-600"></i>
          </div>
        </div>

        <div className="tw-bg-red-50 tw-p-4 tw-rounded-lg tw-border tw-border-red-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-red-600 tw-font-medium">High Priority</p>
              <p className="tw-text-2xl tw-font-bold tw-text-red-900">
                {schedulesData.filter(item => item.priority === 'High').length}
              </p>
            </div>
            <i className="fa-light fa-exclamation-triangle tw-text-2xl tw-text-red-600"></i>
          </div>
        </div>
      </div>

        <Popup
          visible={addFormVisible}
          onHiding={() => setAddFormVisible(false)}
          dragEnabled={false}
          showCloseButton={true}
          showTitle={true}
          title="Add New Schedule"
          width={'90%'}
          height={'auto'}
          maxWidth={800}
        >
          <div className="tw-p-4 tw-max-h-96 tw-overflow-y-auto">

            <Form
          formData={newSchedule}
          items={formItems}
          colCount={2}
          onFieldDataChanged={(e) => {
            setNewSchedule({
              ...newSchedule,
              [e.dataField]: e.value
            });
          }}
            />

            <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
          <Button
            text="Cancel"
            onClick={() => setAddFormVisible(false)}
            stylingMode="outlined"
          />
          <Button
            text="Add Schedule"
            icon="fa-light fa-plus"
            onClick={handleAddSchedule}
            type="default"
            stylingMode="contained"
          />
            </div>
          </div>
        </Popup>

        {/* Edit Schedule Popup */}
      <Popup
        visible={editFormVisible}
        onHiding={() => setEditFormVisible(false)}
        dragEnabled={false}
        showCloseButton
={true}
        showTitle={true}
        title="Edit Schedule"
        width={'90%'}
        height={'auto'}
        maxWidth={800}
      >
        <div className="tw-p-4">
          <Form
            formData={editingSchedule}
            items={formItems}
            colCount={2}
            onFieldDataChanged={(e) => {
              setEditingSchedule({
                ...editingSchedule,
                [e.dataField]: e.value
              });
            }}
          />

          <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
            <Button
              text="Cancel"
              onClick={() => setEditFormVisible(false)}
              stylingMode="outlined"
            />
            <Button
              text="Update Schedule"
              icon="fa-light fa-save"
              onClick={handleUpdateSchedule}
              type="default"
              stylingMode="contained"
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default VehicleSchedules;

