/**
 * File: DeliveryForm.js
 * Purpose: Form for creating/editing deliveries
 * Dependencies: react, react-redux, DevExtreme form components
 * Last Modified: 2025-11-18
 */
import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Form, { SimpleItem, GroupItem, Label, RequiredRule } from 'devextreme-react/form';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import './DeliveryForm.scss';

const DeliveryForm = ({ delivery, isEditMode, onSubmit, onCancel }) => {
  const tanks = useSelector((state) => state.tank.tanks);
  const suppliers = useSelector((state) => state.supplier?.suppliers || []);

  // Form data state - managed by DevExtreme Form component
  // eslint-disable-next-line no-unused-vars
  const [formData, setFormData] = useState({
    tankId: delivery?.tankId || null,
    deliveryDate: delivery?.deliveryDate ? new Date(delivery.deliveryDate) : new Date(),
    manualDeliveryAmount: delivery?.manualDeliveryAmount || 0,
    sensorDeliveryAmount: delivery?.sensorDeliveryAmount || null,
    deliveryTemperature: delivery?.deliveryTemperature || null,
    deliveryDensity: delivery?.deliveryDensity || null,
    deliveryMass: delivery?.deliveryMass || null,
    stockBeforeDelivery: delivery?.stockBeforeDelivery || null,
    stockAfterDelivery: delivery?.stockAfterDelivery || null,
    pricePerLiter: delivery?.pricePerLiter || null,
    lponumber: delivery?.lponumber || '',
    product: delivery?.product || '',
    supplierId: delivery?.supplierId || null,
    correctionReason: '', // Only for edit mode
  });

  // Prepare tank lookup data
  const tankLookupData = useMemo(() => {
    return tanks.map((tank) => ({
      id: tank.tankId,
      displayName: `${tank.tankNumber} - ${tank.product || 'Unknown'} (${tank.siteName || 'Unknown Site'})`,
    }));
  }, [tanks]);

  // Prepare supplier lookup data
  const supplierLookupData = useMemo(() => {
    return suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
    }));
  }, [suppliers]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.tankId) {
      notify('Please select a tank', 'error', 3000);
      return;
    }

    if (!formData.supplierId) {
      notify('Please select a supplier', 'error', 3000);
      return;
    }

    if (!formData.manualDeliveryAmount || formData.manualDeliveryAmount <= 0) {
      notify('Delivery amount must be greater than 0', 'error', 3000);
      return;
    }

    if (!formData.deliveryDate) {
      notify('Please select a delivery date', 'error', 3000);
      return;
    }

    if (isEditMode && !formData.correctionReason) {
      notify('Please provide a correction reason', 'error', 3000);
      return;
    }

    // Auto-populate product from tank if not provided
    if (!formData.product && formData.tankId) {
      const selectedTank = tanks.find((t) => t.tankId === formData.tankId);
      if (selectedTank) {
        formData.product = selectedTank.product;
      }
    }

    // Submit
    onSubmit(formData);
  };

  return (
    <div className="delivery-form">
      <Form formData={formData} labelLocation="top" showColonAfterLabel={false}>
        <GroupItem caption="Delivery Information">
          <SimpleItem
            dataField="tankId"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: tankLookupData,
              displayExpr: 'displayName',
              valueExpr: 'id',
              searchEnabled: true,
              placeholder: 'Select a tank',
              disabled: isEditMode, // Can't change tank in edit mode
            }}
          >
            <Label text="Tank" />
            <RequiredRule message="Tank is required" />
          </SimpleItem>

          <SimpleItem
            dataField="supplierId"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: supplierLookupData,
              displayExpr: 'name',
              valueExpr: 'id',
              searchEnabled: true,
              placeholder: 'Select a supplier',
            }}
          >
            <Label text="Supplier" />
            <RequiredRule message="Supplier is required" />
          </SimpleItem>

          <SimpleItem
            dataField="deliveryDate"
            editorType="dxDateBox"
            editorOptions={{
              type: 'datetime',
              displayFormat: 'dd/MM/yyyy HH:mm',
              placeholder: 'Select delivery date and time',
              max: new Date(), // Can't set future delivery date
            }}
          >
            <Label text="Delivery Date & Time" />
            <RequiredRule message="Delivery date is required" />
          </SimpleItem>

          <SimpleItem
            dataField="manualDeliveryAmount"
            editorType="dxNumberBox"
            editorOptions={{
              format: '#,##0.00',
              placeholder: 'Enter delivery amount',
              min: 0,
            }}
          >
            <Label text="Delivery Amount (Liters)" />
            <RequiredRule message="Delivery amount is required" />
          </SimpleItem>

          <SimpleItem
            dataField="lponumber"
            editorType="dxTextBox"
            editorOptions={{
              placeholder: 'Enter LPO number',
            }}
          >
            <Label text="LPO Number" />
          </SimpleItem>

          <SimpleItem
            dataField="pricePerLiter"
            editorType="dxNumberBox"
            editorOptions={{
              format: 'currency',
              placeholder: 'Enter price per liter',
              min: 0,
            }}
          >
            <Label text="Price Per Liter" />
          </SimpleItem>
        </GroupItem>

        <GroupItem caption="Additional Details (Optional)">
          <SimpleItem
            dataField="sensorDeliveryAmount"
            editorType="dxNumberBox"
            editorOptions={{
              format: '#,##0.00',
              placeholder: 'Sensor detected amount',
              min: 0,
            }}
          >
            <Label text="Sensor Delivery Amount (L)" />
          </SimpleItem>

          <SimpleItem
            dataField="deliveryTemperature"
            editorType="dxNumberBox"
            editorOptions={{
              format: '#,##0.0',
              placeholder: 'Temperature in Celsius',
            }}
          >
            <Label text="Temperature (°C)" />
          </SimpleItem>

          <SimpleItem
            dataField="deliveryDensity"
            editorType="dxNumberBox"
            editorOptions={{
              format: '#,##0.000',
              placeholder: 'Density',
            }}
          >
            <Label text="Density" />
          </SimpleItem>

          <SimpleItem
            dataField="deliveryMass"
            editorType="dxNumberBox"
            editorOptions={{
              format: '#,##0.00',
              placeholder: 'Mass',
            }}
          >
            <Label text="Mass" />
          </SimpleItem>

          <SimpleItem
            dataField="stockBeforeDelivery"
            editorType="dxNumberBox"
            editorOptions={{
              format: '#,##0.00',
              placeholder: 'Stock before delivery',
              min: 0,
            }}
          >
            <Label text="Stock Before Delivery (L)" />
          </SimpleItem>

          <SimpleItem
            dataField="stockAfterDelivery"
            editorType="dxNumberBox"
            editorOptions={{
              format: '#,##0.00',
              placeholder: 'Stock after delivery',
              min: 0,
            }}
          >
            <Label text="Stock After Delivery (L)" />
          </SimpleItem>
        </GroupItem>

        {isEditMode && (
          <GroupItem caption="Correction Details">
            <SimpleItem
              dataField="correctionReason"
              editorType="dxTextArea"
              editorOptions={{
                placeholder: 'Explain why this correction is needed',
                height: 80,
              }}
            >
              <Label text="Correction Reason" />
              <RequiredRule message="Correction reason is required" />
            </SimpleItem>
          </GroupItem>
        )}
      </Form>

      {/* Action Buttons */}
      <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-200">
        <Button text="Cancel" onClick={onCancel} stylingMode="outlined" />
        <Button
          text={isEditMode ? 'Update Delivery' : 'Create Delivery'}
          onClick={handleSubmit}
          type="default"
        />
      </div>

      {/* Information Note */}
      <div className="tw-mt-4 tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
        <div className="tw-flex tw-items-start tw-gap-2">
          <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-1"></i>
          <div className="tw-text-sm tw-text-blue-800">
            {isEditMode ? (
              <>
                <strong>Note:</strong> Updating a delivery creates a correction entry and soft
                deletes the original. This also updates the tank volume history accordingly.
              </>
            ) : (
              <>
                <strong>Note:</strong> Creating a delivery automatically updates the tank volume
                history. Only one delivery per tank per day is allowed.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryForm;
