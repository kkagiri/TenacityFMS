//Cursor - Created Vehicle Edit page with metrics, form, tags, and consumption history
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ScrollView from 'devextreme-react/scroll-view';
import Button from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import TabPanel, { Item as TabItem } from 'devextreme-react/tab-panel';
import DateBox from 'devextreme-react/date-box';
import notify from 'devextreme/ui/notify';

// Components
import VehicleMetricsTiles from '../../components/vehicle/VehicleMetricsTiles';
import VehicleEditForm from '../../components/vehicle/VehicleEditForm';
import TagAssignmentPopup from '../../components/vehicle/TagAssignmentPopup';
import VehicleConsumptionHistoryDetails from '../../components/vehicleConsumptionHistoryDetails/vehicleConsumptionHistoryDetails';

// Services
import { getVehicleById, updateVehicle, deleteVehicle, getVehicleMetrics } from '../../dataservice';

const VehicleEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // State
  const [vehicle, setVehicle] = useState(null);
  const [vehicleMetrics, setVehicleMetrics] = useState({
    totalDistance: 0,
    totalFuel: 0,
    fuelIssues: 0,
    activeIssues: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTagAssignment, setShowTagAssignment] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [consumptionDays, setConsumptionDays] = useState(5);

  // Load vehicle data
  useEffect(() => {
    const loadVehicleData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const [vehicleData, metricsData] = await Promise.all([
          getVehicleById(id),
          getVehicleMetrics(id, 1) // 1 day filter for metrics
        ]);

        setVehicle(vehicleData);
        setVehicleMetrics(metricsData);
      } catch (error) {
        console.error('Error loading vehicle data:', error);
        notify('Failed to load vehicle data', 'error', 3000);
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicleData();
  }, [id]);

  // Handlers
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async (formData) => {
    try {
      setIsSaving(true);
      await updateVehicle(id, formData);
      setVehicle({ ...vehicle, ...formData });
      setIsEditing(false);
      notify('Vehicle updated successfully', 'success', 3000);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      notify('Failed to save vehicle', 'error', 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this vehicle?');
    if (!confirmed) return;

    try {
      await deleteVehicle(id);
      notify('Vehicle deleted successfully', 'success', 3000);
      navigate('/vehicles');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      notify('Failed to delete vehicle', 'error', 3000);
    }
  };

  const handleTagAssignment = () => {
    setShowTagAssignment(true);
  };

  const handleConsumptionRowClick = (consumptionId) => {
    navigate(`/vehicles/${id}/consumption/${consumptionId}/details`);
  };

  if (isLoading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <div className="tw-text-center">
          <i className="fa-light fa-spinner fa-spin tw-text-4xl tw-text-blue-600 tw-mb-4"></i>
          <p className="tw-text-gray-600">Loading vehicle data...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <div className="tw-text-center">
          <i className="fa-light fa-exclamation-triangle tw-text-4xl tw-text-red-600 tw-mb-4"></i>
          <p className="tw-text-gray-600">Vehicle not found</p>
          <Button
            text="Back to Vehicles"
            onClick={() => navigate('/vehicles')}
            className="tw-mt-4"
          />
        </div>
      </div>
    );
  }

  return (
    <ScrollView className="tw-view-wrapper-scroll">
      <h2>Vehicle Edit - {id}</h2>
      <Button text="Back" onClick={() => navigate('/vehicles')} />

      {/* Action Bar */}
      <div className="tw-bg-white tw-border-b tw-border-gray-200 tw-px-6 tw-py-4 tw-mb-6">
        <div className="tw-flex tw-justify-between tw-items-center">
          <div className="tw-flex tw-items-center">
            <Button
              icon="fa-light fa-arrow-left"
              onClick={() => navigate('/vehicles')}
              stylingMode="text"
              className="tw-mr-4"
            />
            <div>
              <h1 className="tw-text-2xl tw-font-semibold tw-text-gray-800">
                {vehicle.hyoungNo} - {vehicle.numberPlate}
              </h1>
              <p className="tw-text-sm tw-text-gray-600">
                {vehicle.vehicleType?.name} • {vehicle.vehicleManufacturer?.name} {vehicle.vehicleModel?.name}
              </p>
            </div>
          </div>

          <div className="tw-flex tw-gap-3">
            {!isEditing ? (
              <>
                <Button
                  text="Edit"
                  icon="fa-light fa-edit"
                  type="default"
                  stylingMode="contained"
                  onClick={handleEdit}
                  className="tw-bg-blue-600 tw-text-white"
                />
                <Button
                  text="Delete"
                  icon="fa-light fa-trash"
                  type="danger"
                  stylingMode="outlined"
                  onClick={handleDelete}
                  className="tw-border-red-300 tw-text-red-600"
                />
              </>
            ) : (
              <>
                <Button
                  text="Save"
                  icon="fa-light fa-save"
                  type="success"
                  stylingMode="contained"
                  onClick={() => document.getElementById('vehicle-form').requestSubmit()}
                  disabled={isSaving}
                />
                <Button
                  text="Cancel"
                  icon="fa-light fa-times"
                  type="normal"
                  stylingMode="outlined"
                  onClick={handleCancel}
                  disabled={isSaving}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Metrics Tiles */}
      <VehicleMetricsTiles
        metrics={vehicleMetrics}
        dateFilter={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Main Content */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6 tw-mt-6">
        {/* Vehicle Information Form */}
        <div className="lg:tw-col-span-2">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200">
            <div className="tw-p-4 tw-border-b tw-border-gray-200">
              <h3 className="tw-text-lg tw-font-medium tw-text-gray-800">
                <i className="fa-light fa-info-circle tw-mr-2"></i>
                Vehicle Information
              </h3>
            </div>
            <div className="tw-p-6">
              <VehicleEditForm
                vehicle={vehicle}
                isEditing={isEditing}
                onSave={handleSave}
                isSaving={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="tw-space-y-6">
          {/* Tag Assignment */}
          <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200">
            <div className="tw-p-4 tw-border-b tw-border-gray-200">
              <div className="tw-flex tw-justify-between tw-items-center">
                <h3 className="tw-text-lg tw-font-medium tw-text-gray-800">
                  <i className="fa-light fa-tags tw-mr-2"></i>
                  Tags
                </h3>
                <Button
                  text="Manage"
                  icon="fa-light fa-plus"
                  stylingMode="text"
                  onClick={handleTagAssignment}
                />
              </div>
            </div>
            <div className="tw-p-4">
              <div className="tw-flex tw-flex-wrap tw-gap-2">
                {vehicle.tags && vehicle.tags.length > 0 ? (
                  vehicle.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="tw-inline-flex tw-items-center tw-px-3 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-bg-blue-100 tw-text-blue-800"
                    >
                      {tag.tagId}
                    </span>
                  ))
                ) : (
                  <p className="tw-text-sm tw-text-gray-500">No tags assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200">
            <div className="tw-p-4 tw-border-b tw-border-gray-200">
              <h3 className="tw-text-lg tw-font-medium tw-text-gray-800">
                <i className="fa-light fa-chart-line tw-mr-2"></i>
                Quick Stats
              </h3>
            </div>
            <div className="tw-p-4 tw-space-y-3">
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-sm tw-text-gray-600">Status</span>
                <span className={`tw-text-sm tw-font-medium ${vehicle.isActive ? 'tw-text-green-600' : 'tw-text-red-600'}`}>
                  {vehicle.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-sm tw-text-gray-600">Year</span>
                <span className="tw-text-sm tw-font-medium tw-text-gray-900">{vehicle.yom}</span>
              </div>
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-sm tw-text-gray-600">Capacity</span>
                <span className="tw-text-sm tw-font-medium tw-text-gray-900">{vehicle.capacity}</span>
              </div>
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-sm tw-text-gray-600">GPS Installed</span>
                <span className={`tw-text-sm tw-font-medium ${vehicle.hasGPSInstalled ? 'tw-text-green-600' : 'tw-text-gray-500'}`}>
                  {vehicle.hasGPSInstalled ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consumption History Section */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-mt-6">
        <div className="tw-p-4 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-justify-between tw-items-center">
            <h3 className="tw-text-lg tw-font-medium tw-text-gray-800">
              <i className="fa-light fa-gas-pump tw-mr-2"></i>
              Consumption History
            </h3>
            <div className="tw-flex tw-items-center tw-gap-4">
              <label className="tw-text-sm tw-text-gray-600">Days:</label>
              <input
                type="number"
                min="1"
                max="30"
                value={consumptionDays}
                onChange={(e) => setConsumptionDays(parseInt(e.target.value))}
                className="tw-w-20 tw-px-2 tw-py-1 tw-border tw-border-gray-300 tw-rounded tw-text-sm"
              />
            </div>
          </div>
        </div>
        <div className="tw-p-4">
          <VehicleConsumptionHistoryDetails
            vehicleId={id}
            days={consumptionDays}
            onRowClick={handleConsumptionRowClick}
          />
        </div>
      </div>

      {/* Tag Assignment Popup */}
      <Popup
        visible={showTagAssignment}
        onHiding={() => setShowTagAssignment(false)}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Manage Vehicle Tags"
        width={600}
        height={500}
      >
        <TagAssignmentPopup
          vehicleId={id}
          currentTags={vehicle.tags || []}
          onSave={() => {
            setShowTagAssignment(false);
            // Refresh vehicle data
            window.location.reload();
          }}
          onCancel={() => setShowTagAssignment(false)}
        />
      </Popup>
    </ScrollView>
  );
};

export default VehicleEdit;