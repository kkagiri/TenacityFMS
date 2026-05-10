import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from 'devextreme-react/button';
import NumberBox from 'devextreme-react/number-box';
import DateBox from 'devextreme-react/date-box';
import SelectBox from 'devextreme-react/select-box';
import TextBox from 'devextreme-react/text-box';
import { Validator, RequiredRule, RangeRule } from 'devextreme-react/validator';
import notify from 'devextreme/ui/notify';
import {
  submitReadingAction,
  selectLoading
} from '../../../../redux/slices/fuelAuditSlice';

/**
 * TankerReadingForm Component
 * Form for submitting tank/tanker readings
 */
const TankerReadingForm = ({ auditId, tanks = [], onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectLoading);

  const [formData, setFormData] = useState({
    tankId: null,
    readingType: 'Opening',
    volume: null,
    readingDateTime: new Date(),
    dipStickReading: null,
    temperature: null,
    density: null,
    source: 'Manual',
    notes: ''
  });

  const readingTypes = [
    { id: 'Opening', name: 'Opening Reading' },
    { id: 'Closing', name: 'Closing Reading' },
    { id: 'Intermediate', name: 'Intermediate Reading' }
  ];

  const sources = [
    { id: 'Manual', name: 'Manual Entry' },
    { id: 'ATG', name: 'ATG System' },
    { id: 'DipStick', name: 'Dipstick Measurement' }
  ];

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!formData.tankId) {
      notify('Please select a tank', 'warning', 3000);
      return;
    }
    if (formData.volume === null || formData.volume === undefined) {
      notify('Please enter the volume', 'warning', 3000);
      return;
    }

    try {
      await dispatch(submitReadingAction({
        auditId,
        reading: {
          tankId: formData.tankId,
          readingType: formData.readingType,
          volume: formData.volume,
          readingDateTime: formData.readingDateTime.toISOString(),
          dipStickReading: formData.dipStickReading,
          temperature: formData.temperature,
          density: formData.density,
          source: formData.source,
          notes: formData.notes
        }
      })).unwrap();

      notify('Reading submitted successfully', 'success', 3000);

      // Reset form
      setFormData({
        tankId: null,
        readingType: 'Opening',
        volume: null,
        readingDateTime: new Date(),
        dipStickReading: null,
        temperature: null,
        density: null,
        source: 'Manual',
        notes: ''
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      notify(error?.message || 'Failed to submit reading', 'error', 5000);
    }
  }, [auditId, formData, dispatch, onSuccess]);

  return (
    <div className="tanker-reading-form">
      <form onSubmit={handleSubmit}>
        <div className="tw-grid tw-grid-cols-2 tw-gap-6">
          {/* Tank Selection */}
          <div className="form-group">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Tank *
            </label>
            <SelectBox
              dataSource={tanks}
              displayExpr={(item) => item ? `Tank ${item.id} - ${item.name || 'Unknown'}` : ''}
              valueExpr="id"
              value={formData.tankId}
              onValueChanged={(e) => handleFieldChange('tankId', e.value)}
              placeholder="Select tank..."
              searchEnabled={true}
            >
              <Validator>
                <RequiredRule message="Tank is required" />
              </Validator>
            </SelectBox>
          </div>

          {/* Reading Type */}
          <div className="form-group">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Reading Type *
            </label>
            <SelectBox
              dataSource={readingTypes}
              displayExpr="name"
              valueExpr="id"
              value={formData.readingType}
              onValueChanged={(e) => handleFieldChange('readingType', e.value)}
            >
              <Validator>
                <RequiredRule message="Reading type is required" />
              </Validator>
            </SelectBox>
          </div>

          {/* Volume */}
          <div className="form-group">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Volume (Liters) *
            </label>
            <NumberBox
              value={formData.volume}
              onValueChanged={(e) => handleFieldChange('volume', e.value)}
              format="#,##0.## L"
              min={0}
              max={1000000}
              showSpinButtons={true}
            >
              <Validator>
                <RequiredRule message="Volume is required" />
                <RangeRule min={0} message="Volume must be positive" />
              </Validator>
            </NumberBox>
          </div>

          {/* Reading DateTime */}
          <div className="form-group">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Reading Date/Time *
            </label>
            <DateBox
              type="datetime"
              value={formData.readingDateTime}
              onValueChanged={(e) => handleFieldChange('readingDateTime', e.value)}
              displayFormat="dd MMM yyyy HH:mm"
              max={new Date()}
            >
              <Validator>
                <RequiredRule message="Date/Time is required" />
              </Validator>
            </DateBox>
          </div>

          {/* Source */}
          <div className="form-group">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Source
            </label>
            <SelectBox
              dataSource={sources}
              displayExpr="name"
              valueExpr="id"
              value={formData.source}
              onValueChanged={(e) => handleFieldChange('source', e.value)}
            />
          </div>

          {/* Dipstick Reading */}
          <div className="form-group">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Dipstick Reading (mm)
            </label>
            <NumberBox
              value={formData.dipStickReading}
              onValueChanged={(e) => handleFieldChange('dipStickReading', e.value)}
              format="#,##0 mm"
              min={0}
              showSpinButtons={true}
            />
          </div>

          {/* Temperature */}
          <div className="form-group">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Temperature (°C)
            </label>
            <NumberBox
              value={formData.temperature}
              onValueChanged={(e) => handleFieldChange('temperature', e.value)}
              format="#0.# °C"
              min={-50}
              max={100}
              showSpinButtons={true}
            />
          </div>

          {/* Density */}
          <div className="form-group">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Density (kg/L)
            </label>
            <NumberBox
              value={formData.density}
              onValueChanged={(e) => handleFieldChange('density', e.value)}
              format="#0.### kg/L"
              min={0.6}
              max={1.0}
              step={0.001}
              showSpinButtons={true}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="form-group tw-mt-6">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Notes
          </label>
          <TextBox
            value={formData.notes}
            onValueChanged={(e) => handleFieldChange('notes', e.value)}
            placeholder="Add any notes..."
          />
        </div>

        {/* Actions */}
        <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-100">
          {onCancel && (
            <Button
              text="Cancel"
              stylingMode="outlined"
              onClick={onCancel}
            />
          )}
          <Button
            text="Submit Reading"
            type="success"
            icon="check"
            useSubmitBehavior={true}
            disabled={loading.submitReading}
          />
        </div>
      </form>

      {/* Help Text */}
      <div className="tw-mt-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
        <h4 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          <i className="fa-light fa-circle-info tw-mr-2"></i>
          Reading Guidelines
        </h4>
        <ul className="tw-text-xs tw-text-gray-500 tw-space-y-1">
          <li>• <strong>Opening Reading:</strong> Record at the start of the audit period</li>
          <li>• <strong>Closing Reading:</strong> Record at the end of the audit period</li>
          <li>• <strong>Temperature:</strong> Record ambient temperature for density corrections</li>
          <li>• <strong>Dipstick:</strong> For verification against ATG readings</li>
        </ul>
      </div>
    </div>
  );
};

export default TankerReadingForm;
