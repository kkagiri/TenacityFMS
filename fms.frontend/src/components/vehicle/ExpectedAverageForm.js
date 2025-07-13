import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popup } from 'devextreme-react/popup';
import { Form } from 'devextreme-react/form';
import { NumberBox } from 'devextreme-react/number-box';
import { SelectBox } from 'devextreme-react/select-box';
import { TextArea } from 'devextreme-react/text-area';
import Button from 'devextreme-react/button';
import { Chart, Series, CommonSeriesSettings, Legend, Tooltip, ArgumentAxis, ValueAxis } from 'devextreme-react/chart';
import notify from 'devextreme/ui/notify';

// Redux actions
import { fetchVehicleExpectedAverages, updateVehicleExpectedAverage } from '../../../redux/actions/vehicleActions';

const ExpectedAverageForm = ({ visible, onHiding, vehicle }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    expectedKmPerLiter: 0,
    fuelType: 'Diesel',
    conditionType: 'Normal',
    seasonType: 'All Season',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [currentAverage, setCurrentAverage] = useState(null);

  const fuelTypes = [
    { value: 'Petrol', text: 'Petrol' },
    { value: 'Diesel', text: 'Diesel' },
    { value: 'LPG', text: 'LPG' },
    { value: 'Hybrid', text: 'Hybrid' }
  ];

  const conditionTypes = [
    { value: 'City', text: 'City Driving' },
    { value: 'Highway', text: 'Highway Driving' },
    { value: 'Mixed', text: 'Mixed Driving' },
    { value: 'Off-road', text: 'Off-road Driving' },
    { value: 'Normal', text: 'Normal Conditions' }
  ];

  const seasonTypes = [
    { value: 'All Season', text: 'All Season' },
    { value: 'Summer', text: 'Summer' },
    { value: 'Winter', text: 'Winter' },
    { value: 'Rainy', text: 'Rainy Season' }
  ];

  useEffect(() => {
    if (visible && vehicle) {
      loadExpectedAverages();
      // Initialize form with current vehicle data
      setFormData({
        expectedKmPerLiter: vehicle.expectedKmPerLiter || 0,
        fuelType: vehicle.fuelType || 'Diesel',
        conditionType: 'Normal',
        seasonType: 'All Season',
        notes: ''
      });
    }
  }, [visible, vehicle]);

  const loadExpectedAverages = async () => {
    try {
      setIsLoading(true);
      const response = await dispatch(fetchVehicleExpectedAverages(vehicle.vehicleId));

      if (response.success) {
        setHistoricalData(response.data.historical || []);
        setCurrentAverage(response.data.current || null);
      }
    } catch (error) {
      console.error('Error loading expected averages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAverage = async () => {
    try {
      setIsLoading(true);

      if (!formData.expectedKmPerLiter || formData.expectedKmPerLiter <= 0) {
        notify('Please enter a valid expected km/L value', 'warning', 3000);
        return;
      }

      const response = await dispatch(updateVehicleExpectedAverage({
        vehicleId: vehicle.vehicleId,
        expectedKmPerLiter: formData.expectedKmPerLiter,
        fuelType: formData.fuelType,
        conditionType: formData.conditionType,
        seasonType: formData.seasonType,
        notes: formData.notes
      }));

      if (response.success) {
        notify('Expected average updated successfully', 'success', 3000);
        onHiding(true); // Pass true to indicate successful update
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error updating expected average:', error);
      notify(error.message || 'Failed to update expected average', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const getEfficiencyColor = (value) => {
    if (value >= 15) return 'tw-text-green-600';
    if (value >= 10) return 'tw-text-yellow-600';
    return 'tw-text-red-600';
  };

  const getEfficiencyStatus = (value) => {
    if (value >= 15) return 'Excellent';
    if (value >= 10) return 'Good';
    if (value >= 7) return 'Average';
    return 'Poor';
  };

  const formItems = [
    {
      itemType: 'group',
      caption: 'Expected Average Settings',
      items: [
        {
          dataField: 'expectedKmPerLiter',
          label: { text: 'Expected Km/L' },
          editorType: 'dxNumberBox',
          editorOptions: {
            min: 0,
            max: 50,
            step: 0.1,
            format: '#0.0',
            placeholder: 'Enter expected km per liter',
            onValueChanged: (e) => setFormData({ ...formData, expectedKmPerLiter: e.value })
          },
          validationRules: [
            { type: 'required', message: 'Expected km/L is required' },
            { type: 'range', min: 0.1, max: 50, message: 'Value must be between 0.1 and 50' }
          ]
        },
        {
          dataField: 'fuelType',
          label: { text: 'Fuel Type' },
          editorType: 'dxSelectBox',
          editorOptions: {
            dataSource: fuelTypes,
            valueExpr: 'value',
            displayExpr: 'text',
            onValueChanged: (e) => setFormData({ ...formData, fuelType: e.value })
          }
        },
        {
          dataField: 'conditionType',
          label: { text: 'Driving Conditions' },
          editorType: 'dxSelectBox',
          editorOptions: {
            dataSource: conditionTypes,
            valueExpr: 'value',
            displayExpr: 'text',
            onValueChanged: (e) => setFormData({ ...formData, conditionType: e.value })
          }
        },
        {
          dataField: 'seasonType',
          label: { text: 'Season Type' },
          editorType: 'dxSelectBox',
          editorOptions: {
            dataSource: seasonTypes,
            valueExpr: 'value',
            displayExpr: 'text',
            onValueChanged: (e) => setFormData({ ...formData, seasonType: e.value })
          }
        },
        {
          dataField: 'notes',
          label: { text: 'Notes' },
          editorType: 'dxTextArea',
          editorOptions: {
            height: 80,
            placeholder: 'Any additional notes about this expected average...',
            onValueChanged: (e) => setFormData({ ...formData, notes: e.value })
          }
        }
      ]
    }
  ];

  return (
    <Popup
      visible={visible}
      onHiding={() => onHiding(false)}
      dragEnabled={false}
      closeOnOutsideClick={true}
      showTitle={true}
      title="Update Expected Average"
      width={800}
      height={700}
    >
      <div className="tw-p-4">
        {/* Vehicle Information */}
        {vehicle && (
          <div className="tw-mb-6 tw-p-4 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200">
            <h4 className="tw-text-md tw-font-semibold tw-text-blue-800 tw-mb-2">
              Vehicle Information
            </h4>
            <div className="tw-grid tw-grid-cols-3 tw-gap-4 tw-text-sm">
              <div>
                <span className="tw-text-gray-600">Hyoung No:</span>
                <span className="tw-ml-2 tw-font-medium">{vehicle.hyoungNo}</span>
              </div>
              <div>
                <span className="tw-text-gray-600">Vehicle Type:</span>
                <span className="tw-ml-2 tw-font-medium">{vehicle.vehicleTypeName || 'N/A'}</span>
              </div>
              <div>
                <span className="tw-text-gray-600">Manufacturer:</span>
                <span className="tw-ml-2 tw-font-medium">{vehicle.manufacturerName || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Current Average Display */}
        {currentAverage && (
          <div className="tw-mb-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200">
            <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mb-3">
              Current Expected Average
            </h4>
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-4">
                <div className="tw-text-center">
                  <p className={`tw-text-3xl tw-font-bold ${getEfficiencyColor(currentAverage.kmPerLiter)}`}>
                    {currentAverage.kmPerLiter?.toFixed(1)} km/L
                  </p>
                  <p className="tw-text-sm tw-text-gray-600">
                    {getEfficiencyStatus(currentAverage.kmPerLiter)}
                  </p>
                </div>
                <div className="tw-text-sm tw-text-gray-600">
                  <p>Fuel Type: <span className="tw-font-medium">{currentAverage.fuelType}</span></p>
                  <p>Conditions: <span className="tw-font-medium">{currentAverage.conditionType}</span></p>
                  <p>Season: <span className="tw-font-medium">{currentAverage.seasonType}</span></p>
                </div>
              </div>
              <div className="tw-text-right tw-text-sm tw-text-gray-600">
                <p>Last Updated:</p>
                <p className="tw-font-medium">
                  {new Date(currentAverage.updatedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expected vs Actual Performance */}
        <div className="tw-mb-6 tw-grid tw-grid-cols-3 tw-gap-4">
          <div className="tw-p-4 tw-bg-green-50 tw-rounded-lg tw-border tw-border-green-200 tw-text-center">
            <p className="tw-text-sm tw-text-green-600 tw-font-medium">New Expected</p>
            <p className={`tw-text-2xl tw-font-bold ${getEfficiencyColor(formData.expectedKmPerLiter)}`}>
              {formData.expectedKmPerLiter?.toFixed(1) || '0.0'} km/L
            </p>
          </div>
          <div className="tw-p-4 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200 tw-text-center">
            <p className="tw-text-sm tw-text-blue-600 tw-font-medium">Current Actual</p>
            <p className="tw-text-2xl tw-font-bold tw-text-blue-900">
              {vehicle?.actualAverageKmL?.toFixed(1) || '0.0'} km/L
            </p>
          </div>
          <div className="tw-p-4 tw-bg-yellow-50 tw-rounded-lg tw-border tw-border-yellow-200 tw-text-center">
            <p className="tw-text-sm tw-text-yellow-600 tw-font-medium">Difference</p>
            <p className={`tw-text-2xl tw-font-bold ${
              (formData.expectedKmPerLiter - (vehicle?.actualAverageKmL || 0)) >= 0
                ? 'tw-text-green-600' : 'tw-text-red-600'
            }`}>
              {((formData.expectedKmPerLiter || 0) - (vehicle?.actualAverageKmL || 0)).toFixed(1)} km/L
            </p>
          </div>
        </div>

        {/* Historical Chart */}
        {historicalData.length > 0 && (
          <div className="tw-mb-6 tw-p-4 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200">
            <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mb-3">
              Historical Expected vs Actual Averages
            </h4>
            <Chart
              dataSource={historicalData}
              height={250}
            >
              <CommonSeriesSettings type="line" />
              <Series
                valueField="expectedKmL"
                argumentField="month"
                name="Expected km/L"
                color="#3b82f6"
              />
              <Series
                valueField="actualKmL"
                argumentField="month"
                name="Actual km/L"
                color="#10b981"
              />
              <ArgumentAxis />
              <ValueAxis />
              <Legend visible={true} />
              <Tooltip enabled={true} />
            </Chart>
          </div>
        )}

        {/* Form */}
        <Form
          formData={formData}
          items={formItems}
          colCount={2}
          showColonAfterLabel={true}
          labelLocation="top"
        />

        {/* Efficiency Guidelines */}
        <div className="tw-mt-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200">
          <h5 className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-2">
            Fuel Efficiency Guidelines
          </h5>
          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-xs tw-text-gray-600">
            <div>
              <p><span className="tw-w-3 tw-h-3 tw-bg-green-500 tw-inline-block tw-rounded-full tw-mr-2"></span>Excellent: 15+ km/L</p>
              <p><span className="tw-w-3 tw-h-3 tw-bg-yellow-500 tw-inline-block tw-rounded-full tw-mr-2"></span>Good: 10-15 km/L</p>
            </div>
            <div>
              <p><span className="tw-w-3 tw-h-3 tw-bg-orange-500 tw-inline-block tw-rounded-full tw-mr-2"></span>Average: 7-10 km/L</p>
              <p><span className="tw-w-3 tw-h-3 tw-bg-red-500 tw-inline-block tw-rounded-full tw-mr-2"></span>Poor: Below 7 km/L</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
          <Button
            text="Cancel"
            onClick={() => onHiding(false)}
            stylingMode="outlined"
            disabled={isLoading}
          />
          <Button
            text="Update Average"
            icon="fa-light fa-save"
            onClick={handleUpdateAverage}
            type="default"
            stylingMode="contained"
            disabled={isLoading || !formData.expectedKmPerLiter}
          />
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-white tw-bg-opacity-75 tw-rounded-lg">
            <div className="tw-text-center">
              <i className="fa-light fa-spinner fa-spin tw-text-3xl tw-text-blue-600 tw-mb-2"></i>
              <p className="tw-text-gray-600">Updating expected average...</p>
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
};

export default ExpectedAverageForm;
