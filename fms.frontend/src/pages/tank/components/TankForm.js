import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Item, GroupItem, Label, RequiredRule, NumericRule } from 'devextreme-react/form';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import notify from 'devextreme/ui/notify';
import { createTank, updateTank } from '../../../redux/actions/tankActions';

const TankForm = ({ tank, onClose, onSubmit }) => {
  const dispatch = useDispatch();
  const { sites } = useSelector(state => state.site);
  const { ptsDevices } = useSelector(state => state.ptsDevice);

  const [formData, setFormData] = useState({
    name: '',
    tankVolume: 0,
    tankHeight: null,
    tankLength: null,
    ptsId: null,
    useBookKeeping: false,
    siteId: null,
    discrepancyThreshold: null,
    currentStock: 0
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tank) {
      setFormData({
        ...tank,
        useBookKeeping: tank.useBookKeeping === 1 || tank.useBookKeeping === true
      });
    }
  }, [tank]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.siteId || formData.tankVolume <= 0) {
      notify('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = {
        id: tank ? tank.id : 0,
        name: formData.name,
        tankVolume: formData.tankVolume,
        tankHeight: formData.tankHeight || null,
        tankLength: formData.tankLength || null,
        ptsId: formData.ptsId || null,
        useBookKeeping: Boolean(formData.useBookKeeping),
        siteId: formData.siteId,
        discrepancyThreshold: formData.discrepancyThreshold || null,
        currentStock: formData.currentStock || 0,
        lastStockUpdate: new Date().toISOString()
      };

      // Debug logging
      console.log('Submitting tank data:', dataToSubmit);

      let result;
      if (tank) {
        result = await dispatch(updateTank(tank.id, dataToSubmit));
      } else {
        result = await dispatch(createTank(dataToSubmit));
      }

      if (result?.success) {
        onSubmit();
        notify(tank ? 'Tank updated successfully' : 'Tank created successfully', 'success');
      }
    } catch (error) {
      console.error('Error saving tank:', error);

      // Handle validation errors
      if (error.validationErrors) {
        const validationMessages = Object.entries(error.validationErrors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        notify(`Validation errors:\n${validationMessages}`, 'error');
      } else if (error.response?.data) {
        // Handle API response errors
        const responseData = error.response.data;
        let errorMessage = responseData.title || responseData.message || 'Error saving tank';

        if (responseData.errors) {
          const errorDetails = Object.entries(responseData.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          errorMessage += `\n\nDetails:\n${errorDetails}`;
        }

        notify(errorMessage, 'error');
      } else {
        notify(error.message || 'Error saving tank', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (e) => {
    e.component.validate();
  };

  return (
    <div className="tank-form tw-p-4">
      <Form
        formData={formData}
        onFieldDataChanged={(e) => {
          if (e.dataField) {
            setFormData(prev => ({
              ...prev,
              [e.dataField]: e.value
            }));
          }
        }}
      >
        <GroupItem colCount={2}>
          <Item dataField="name" editorType="dxTextBox">
            <Label text="Tank Name" />
            <RequiredRule message="Tank name is required" />
          </Item>

          <Item dataField="siteId" editorType="dxSelectBox"
            editorOptions={{
              dataSource: sites,
              displayExpr: 'name',
              valueExpr: 'id',
              placeholder: 'Select Site',
              wrapItemText: true,
              searchEnabled: true,
              dropDownOptions: {
                wrapperAttr: { class: 'tw-max-w-full' }
              }
            }}>
            <Label text="Site" />
            <RequiredRule message="Site is required" />
          </Item>
        </GroupItem>

        <GroupItem colCount={2}>
          <Item dataField="tankVolume" editorType="dxNumberBox"
            editorOptions={{
              min: 0,
              format: '#,##0.## L',
              showSpinButtons: true
            }}>
            <Label text="Tank Capacity (Liters)" />
            <RequiredRule message="Tank capacity is required" />
            <NumericRule message="Capacity must be greater than 0" />
          </Item>

          <Item dataField="currentStock" editorType="dxNumberBox"
            editorOptions={{
              min: 0,
              format: '#,##0.## L',
              showSpinButtons: true
            }}>
            <Label text="Current Stock (Liters)" />
          </Item>
        </GroupItem>

        <GroupItem colCount={2}>
          <Item dataField="tankHeight" editorType="dxNumberBox"
            editorOptions={{
              min: 0,
              format: '#,##0.## m',
              showSpinButtons: true
            }}>
            <Label text="Tank Height (meters)" />
          </Item>

          <Item dataField="tankLength" editorType="dxNumberBox"
            editorOptions={{
              min: 0,
              format: '#,##0.## m',
              showSpinButtons: true
            }}>
            <Label text="Tank Length (meters)" />
          </Item>
        </GroupItem>

        <GroupItem colCount={2}>
          <Item dataField="ptsId" editorType="dxSelectBox"
            editorOptions={{
              dataSource: ptsDevices,
              displayExpr: (item) => item ? `${item.name} (${item.ptsid})` : '',
              valueExpr: 'ptsid',
              placeholder: 'Select PTS Device (Optional)',
              searchEnabled: true
            }}>
            <Label text="PTS Device" />
          </Item>

          <Item dataField="discrepancyThreshold" editorType="dxNumberBox"
            editorOptions={{
              min: 0,
              format: '#,##0.## L',
              showSpinButtons: true
            }}>
            <Label text="Discrepancy Threshold (Liters)" />
          </Item>
        </GroupItem>

        <Item dataField="useBookKeeping" editorType="dxCheckBox">
          <Label text="Use Book Keeping" />
        </Item>
      </Form>

      <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6">
        <Button
          text="Cancel"
          onClick={onClose}
          type="normal"
        />
        <Button
          text={tank ? 'Update' : 'Create'}
          onClick={handleSubmit}
          type="default"
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default TankForm;