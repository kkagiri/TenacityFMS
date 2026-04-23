/**
 * File: DeliveryForm.js
 * Purpose: Form for creating/editing deliveries
 * Dependencies: react, react-redux, DevExtreme form components
 * Last Modified: 2026-04-23
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Form, { SimpleItem, GroupItem, Label, RequiredRule } from 'devextreme-react/form';
import Button from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import deliveryApi from '../../../../../api/deliveryApi';
import './DeliveryForm.scss';

const DeliveryForm = ({ delivery, isEditMode, onSubmit, onCancel }) => {
  const tanks = useSelector((state) => state.tank.tanks);
  const suppliers = useSelector((state) => state.supplier?.suppliers || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAutoDetections, setIsCheckingAutoDetections] = useState(false);
  const [autoDetectedDeliveries, setAutoDetectedDeliveries] = useState([]);

  // Form data state - managed by DevExtreme Form component
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

  const selectedTank = useMemo(
    () => tanks.find((tank) => Number(tank.tankId) === Number(formData.tankId)) || null,
    [formData.tankId, tanks]
  );

  const selectedTankSiteId =
    selectedTank?.siteId ??
    selectedTank?.siteID ??
    selectedTank?.site?.id ??
    null;

  const primaryAutoDetectedDelivery = useMemo(() => {
    return [...autoDetectedDeliveries]
      .sort((left, right) => {
        const leftIsUnmatched = ['Unmatched', 'Detected'].includes(left?.status);
        const rightIsUnmatched = ['Unmatched', 'Detected'].includes(right?.status);

        if (leftIsUnmatched !== rightIsUnmatched) {
          return leftIsUnmatched ? -1 : 1;
        }

        return Number(right?.absoluteProductVolume || 0) - Number(left?.absoluteProductVolume || 0);
      })
      .at(0);
  }, [autoDetectedDeliveries]);

  useEffect(() => {
    let isCancelled = false;

    const loadAutoDetectedDeliveries = async () => {
      if (isEditMode || !formData.tankId || !formData.deliveryDate || !selectedTankSiteId) {
        setAutoDetectedDeliveries([]);
        return;
      }

      setIsCheckingAutoDetections(true);
      try {
        const rows = await deliveryApi.getAutoDetectedDeliveriesForTankDate({
          siteId: selectedTankSiteId,
          tankId: formData.tankId,
          deliveryDate: formData.deliveryDate,
        });

        if (isCancelled) {
          return;
        }

        setAutoDetectedDeliveries(rows);
      } catch (error) {
        if (!isCancelled) {
          setAutoDetectedDeliveries([]);
          notify('Failed to load system-detected deliveries for the selected day', 'warning', 2500);
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingAutoDetections(false);
        }
      }
    };

    loadAutoDetectedDeliveries();

    return () => {
      isCancelled = true;
    };
  }, [formData.deliveryDate, formData.tankId, isEditMode, selectedTankSiteId]);

  useEffect(() => {
    if (
      isEditMode ||
      !primaryAutoDetectedDelivery ||
      formData.sensorDeliveryAmount != null
    ) {
      return;
    }

    const detectedVolume = Number(primaryAutoDetectedDelivery.absoluteProductVolume || 0);
    if (detectedVolume <= 0) {
      return;
    }

    setFormData((current) => {
      if (current.sensorDeliveryAmount != null) {
        return current;
      }

      return {
        ...current,
        sensorDeliveryAmount: detectedVolume,
      };
    });
  }, [formData.sensorDeliveryAmount, isEditMode, primaryAutoDetectedDelivery]);

  const handleSubmit = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

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
    const payload = {
      ...formData,
    };

    if (!formData.product && formData.tankId) {
      const selectedTank = tanks.find((t) => t.tankId === formData.tankId);
      if (selectedTank) {
        payload.product = selectedTank.product;
      }
    }

    try {
      setIsSubmitting(true);
      await Promise.resolve(onSubmit(payload));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="delivery-form">
      {isCheckingAutoDetections && !isEditMode && (
        <div className="delivery-form__system-check">
          <LoadIndicator width={16} height={16} visible={true} />
          <span>Checking system-detected deliveries for this tank and date...</span>
        </div>
      )}

      {!isEditMode && primaryAutoDetectedDelivery && (
        <div className="delivery-form__system-banner delivery-form__system-banner--warning">
          <div className="delivery-form__system-banner-icon">
            <i className="fa-light fa-triangle-exclamation"></i>
          </div>
          <div className="delivery-form__system-banner-content">
            <div className="delivery-form__system-banner-title">
              System-detected delivery found for this tank and day
            </div>
            <div className="delivery-form__system-banner-text">
              The probe readings show a detected delivery of about{' '}
              <strong>
                {Number(primaryAutoDetectedDelivery.absoluteProductVolume || 0).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 2 }
                )}
                L
              </strong>{' '}
              ending at{' '}
              <strong>
                {primaryAutoDetectedDelivery.endDateTime
                  ? new Date(primaryAutoDetectedDelivery.endDateTime).toLocaleString()
                  : 'an unknown time'}
              </strong>
              . Saving this manual delivery will keep your supplier and LPO details, and the backend
              will attempt to match it to the detected event automatically.
            </div>
            {autoDetectedDeliveries.length > 1 && (
              <div className="delivery-form__system-banner-meta">
                {autoDetectedDeliveries.length} system-detected in-tank deliveries were found on the
                selected day. Review the amount carefully before saving.
              </div>
            )}
          </div>
        </div>
      )}

      <Form
        formData={formData}
        labelLocation="top"
        showColonAfterLabel={false}
        onFieldDataChanged={(event) => {
          setFormData((current) => ({
            ...current,
            [event.dataField]: event.value,
          }));
        }}
      >

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

      {isSubmitting && (
        <div className="delivery-form__posting-indicator">
          <LoadIndicator width={20} height={20} visible={true} />
          <span>Posting delivery...</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-200">
        <Button text="Cancel" onClick={onCancel} stylingMode="outlined" disabled={isSubmitting} />
        <Button
          text={isSubmitting ? 'Posting...' : isEditMode ? 'Update Delivery' : 'Create Delivery'}
          onClick={handleSubmit}
          type="default"
          disabled={isSubmitting}
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
