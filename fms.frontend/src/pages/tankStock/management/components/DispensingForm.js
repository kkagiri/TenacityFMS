/**
 * DispensingForm Component
 * Purpose: Form for creating and editing dispensing volume records
 */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, GroupItem, Label, RequiredRule } from 'devextreme-react/form';
import { SelectBox } from 'devextreme-react/select-box';
import { NumberBox } from 'devextreme-react/number-box';
import { DateBox } from 'devextreme-react/date-box';
import { TextArea } from 'devextreme-react/text-area';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import {
  createDispensingVolume,
  updateDispensingVolume
} from '../../../../redux/actions/tankStockAction';

const DispensingForm = ({ record, onCancel, onSuccess }) => {
  const dispatch = useDispatch();
  const tanks = useSelector((state) => state.tank.tanks);
  const sites = useSelector((state) => state.site.sites);

  const [formData, setFormData] = useState({
    tankId: record?.tankId || null,
    siteId: record?.siteId || null,
    dispensedVolume: record?.dispensedVolume || 0,
    entryDate: record?.entryDate ? new Date(record.entryDate) : new Date(),
    notes: record?.notes || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredTanks, setFilteredTanks] = useState([]);

  // Filter tanks by selected site
  useEffect(() => {
    if (formData.siteId) {
      const tanksForSite = tanks.filter(tank => tank.siteId === formData.siteId);
      setFilteredTanks(tanksForSite);

      // Reset tank selection if it doesn't belong to the selected site
      if (formData.tankId) {
        const isTankInSite = tanksForSite.some(tank => tank.id === formData.tankId);
        if (!isTankInSite) {
          setFormData(prev => ({ ...prev, tankId: null }));
        }
      }
    } else {
      setFilteredTanks(tanks);
    }
  }, [formData.siteId, tanks, formData.tankId]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.siteId) {
      notify({
        message: 'Please select a site',
        type: 'error',
        displayTime: 3000
      });
      return;
    }

    if (!formData.tankId) {
      notify({
        message: 'Please select a tank',
        type: 'error',
        displayTime: 3000
      });
      return;
    }

    if (formData.dispensedVolume <= 0) {
      notify({
        message: 'Dispensed volume must be greater than 0',
        type: 'error',
        displayTime: 3000
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (record) {
        // Update existing record
        result = await dispatch(updateDispensingVolume({
          entryId: record.entryId,
          dispensedVolume: formData.dispensedVolume,
          entryDate: formData.entryDate,
          notes: formData.notes
        }));
      } else {
        // Create new record
        result = await dispatch(createDispensingVolume({
          tankId: formData.tankId,
          dispensedVolume: formData.dispensedVolume,
          entryDate: formData.entryDate,
          notes: formData.notes
        }));
      }

      if (result.success) {
        notify({
          message: result.message || (record ? 'Record updated successfully' : 'Record created successfully'),
          type: 'success',
          displayTime: 3000
        });
        onSuccess();
      } else {
        notify({
          message: result.message || 'Operation failed',
          type: 'error',
          displayTime: 4000
        });
      }
    } catch (error) {
      notify({
        message: 'An error occurred',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dispensing-form tw-p-4">
      <form onSubmit={handleSubmit}>
        <div className="tw-space-y-4">
          {/* Site Selection */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Site <span className="tw-text-red-500">*</span>
            </label>
            <SelectBox
              dataSource={sites}
              displayExpr="name"
              valueExpr="id"
              value={formData.siteId}
              onValueChanged={(e) => handleFieldChange('siteId', e.value)}
              placeholder="Select site..."
              searchEnabled={true}
              disabled={!!record} // Disable site change when editing
            />
          </div>

          {/* Tank Selection */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Tank <span className="tw-text-red-500">*</span>
            </label>
            <SelectBox
              dataSource={filteredTanks}
              displayExpr="name"
              valueExpr="id"
              value={formData.tankId}
              onValueChanged={(e) => handleFieldChange('tankId', e.value)}
              placeholder="Select tank..."
              searchEnabled={true}
              disabled={!!record} // Disable tank change when editing
            />
          </div>

          {/* Dispensed Volume */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Dispensed Volume (Liters) <span className="tw-text-red-500">*</span>
            </label>
            <NumberBox
              value={formData.dispensedVolume}
              onValueChanged={(e) => handleFieldChange('dispensedVolume', e.value)}
              min={0.01}
              format="#,##0.00"
              placeholder="Enter dispensed volume..."
            />
          </div>

          {/* Entry Date */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Entry Date & Time <span className="tw-text-red-500">*</span>
            </label>
            <DateBox
              value={formData.entryDate}
              onValueChanged={(e) => handleFieldChange('entryDate', e.value)}
              type="datetime"
              displayFormat="dd/MM/yyyy HH:mm"
              max={new Date()}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Notes
            </label>
            <TextArea
              value={formData.notes}
              onValueChanged={(e) => handleFieldChange('notes', e.value)}
              placeholder="Enter any additional notes..."
              height={80}
            />
          </div>

          {/* Action Buttons */}
          <div className="tw-flex tw-justify-end tw-space-x-3 tw-pt-4 tw-border-t tw-border-gray-200">
            <Button
              text="Cancel"
              onClick={onCancel}
              stylingMode="outlined"
              disabled={isSubmitting}
            />
            <Button
              text={record ? "Update" : "Create"}
              type="default"
              useSubmitBehavior={true}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default DispensingForm;
