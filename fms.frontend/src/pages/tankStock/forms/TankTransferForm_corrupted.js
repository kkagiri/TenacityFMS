import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, Label, RequiredRule, NumericRule } from 'devextreme-react/form';
import { Button } from 'devextreme-react';
import DataGrid, {
    Column,
    GroupPanel,
    Grouping,
    Summary,
    GroupItem,
    TotalItem,
    Lookup
} from 'devextreme-react/data-grid';
import { fetchSitebyUserId } from '../../../redux/actions/siteActions';
import { fetchTanks } from '../../../redux/actions/tankActions';
import { fetchTankVolumeHistoryByTankId } from '../../../redux/actions/tankVolumeHistoryActions';
import { createTankTransfer } from '../../../redux/actions/tankStockAction';
import { prepareTankTransferDTO } from '../../../utils/stockDataPreparation';
import { VolumeChangeReasonEnum } from '../../../utils/enums';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import notify from 'devextreme/ui/notify';
import './TankTransferForm.scss';

// Configure notifications to appear at the top
notify.defaultOptions({
  position: {
    my: 'top center',
    at: 'top center',
    of: window,
    offset: '0 20'
  },
  animation: {
    show: {
      type: 'slide',
      duration: 300,
      from: { top: -100, opacity: 0 },
      to: { top: 0, opacity: 1 }
    },
    hide: {
      type: 'slide',
      duration: 300,
      from: { top: 0, opacity: 1 },
      to: { top: -100, opacity: 0 }
    }
  }
});

const TankTransferForm = ({ updateFormData, isLoading, onSubmit, onCancel }) => {
    const dispatch = useDispatch();
    const tanksFromStore = useSelector((state) => state.tank.tanks);
    const sites = useSelector((state) => state.site.sites);
    const tankVolumeHistory = useSelector((state) => {
        return state.tankVolumeHistory.tankVolumeHistory;
    });

    const [filteredSourceTanks, setFilteredSourceTanks] = useState([]);
    const [filteredDestinationTanks, setFilteredDestinationTanks] = useState([]);
    const [loading] = useState(false);
    const [formData, setFormData] = useState({
        sourceSiteId: null,
        sourceTankId: null,
        destinationSiteId: null,
        destinationTankId: null,
        amount: null,
        date: new Date(),
        transferType: 'InterTank', // InterTank, InterSite
        reason: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [showInfoNotice, setShowInfoNotice] = useState(true);

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (!sites || sites.length === 0) {
            dispatch(fetchSitebyUserId());
        }
        dispatch(fetchTanks());
    }, [dispatch, sites]);

    // Notify parent component of form data changes
    useEffect(() => {
        if (updateFormData) {
            updateFormData(formData);
        }
    }, [formData, updateFormData]);

    const fetchTankVolumeHistory = useCallback(() => {
        if (formData.sourceTankId && formData.date) {
            const formattedDate = formatDate(formData.date);
            dispatch(fetchTankVolumeHistoryByTankId(formattedDate, formattedDate, formData.sourceTankId));
        }
    }, [dispatch, formData.sourceTankId, formData.date]);

    useEffect(() => {
        if (formData.sourceTankId && formData.date) {
            fetchTankVolumeHistory();
        }
    }, [formData.sourceTankId, formData.date, fetchTankVolumeHistory]);

    const handleSourceSiteChange = useCallback((e) => {
        const siteId = e.value;
        setFormData(prevData => ({
            ...prevData,
            sourceSiteId: siteId,
            sourceTankId: null
        }));

        const tanksForSite = tanksFromStore.filter(tank => tank.siteId === siteId);
        setFilteredSourceTanks(tanksForSite);
    }, [tanksFromStore]);

    const handleDestinationSiteChange = useCallback((e) => {
        const siteId = e.value;
        setFormData(prevData => ({
            ...prevData,
            destinationSiteId: siteId,
            destinationTankId: null
        }));

        const tanksForSite = tanksFromStore.filter(tank => tank.siteId === siteId);
        setFilteredDestinationTanks(tanksForSite);
    }, [tanksFromStore]);

    const formatTime = (cellInfo) => {
        if (cellInfo.value) {
            const date = new Date(cellInfo.value);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return '';
    };

    const handleSourceTankChange = useCallback((e) => {
        const tankId = e.value;
        setFormData(prevData => ({
            ...prevData,
            sourceTankId: tankId
        }));
    }, []);

    const handleDestinationTankChange = useCallback((e) => {
        const tankId = e.value;
        setFormData(prevData => ({
            ...prevData,
            destinationTankId: tankId
        }));
    }, []);

    const handleDateChange = useCallback((e) => {
        const newDate = e.value;
        setFormData(prevData => ({
            ...prevData,
            date: newDate
        }));
    }, []);

    const handleAmountChange = useCallback((e) => {
        const amount = e.value;
        setFormData(prevData => ({
            ...prevData,
            amount: amount
        }));
    }, []);

    const handleTransferTypeChange = useCallback((e) => {
        const transferType = e.value;
        setFormData(prevData => {
            const updatedData = {
                ...prevData,
                transferType: transferType,
                destinationSiteId: transferType === 'InterTank' ? prevData.sourceSiteId : null,
                destinationTankId: null
            };

            // Update destination tanks based on transfer type
            if (transferType === 'InterTank' && prevData.sourceSiteId) {
                const tanksForSite = tanksFromStore.filter(tank =>
                    tank.siteId === prevData.sourceSiteId && tank.id !== prevData.sourceTankId
                );
                setFilteredDestinationTanks(tanksForSite);
            } else {
                setFilteredDestinationTanks([]);
            }

            return updatedData;
        });
    }, [tanksFromStore]);

    const handleReasonChange = useCallback((e) => {
        const reason = e.value;
        setFormData(prevData => ({
            ...prevData,
            reason: reason
        }));
    }, []);

    const calculateTotalFuelDispensed = (options) => {
        if (options.name === 'TotalFuelDispensed') {
            const dispensingTotal = options.data.reduce((acc, item) => {
                if (item.changeReason === 'Dispensing' || item.changeReason === 'TransferOut') {
                    return acc + Math.abs(item.volumeChange);
                }
                return acc;
            }, 0);
            return dispensingTotal;
        }
    };

    const transferTypeOptions = [
        { id: 'InterTank', name: 'Between Tanks (Same Site)' },
        { id: 'InterSite', name: 'Between Sites' }
    ];

    // Validation logic
    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.sourceSiteId) errors.sourceSiteId = 'Source site is required';
        if (!formData.sourceTankId) errors.sourceTankId = 'Source tank is required';
        if (!formData.destinationSiteId) errors.destinationSiteId = 'Destination site is required';
        if (!formData.destinationTankId) errors.destinationTankId = 'Destination tank is required';
        if (!formData.amount || formData.amount <= 0) errors.amount = 'Valid transfer amount is required';
        if (!formData.date) errors.date = 'Date is required';
        if (formData.sourceTankId === formData.destinationTankId) {
            errors.destinationTankId = 'Destination tank must be different from source tank';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    // Handle form submission
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            notify('Please fix validation errors before submitting', 'error', 3000);
            return;
        }

        setIsSubmitting(true);
        try {
            const preparedData = prepareTankTransferDTO(formData);
            const response = await dispatch(createTankTransfer(preparedData));

            if (response.success) {
                notify(response.message || 'Tank transfer created successfully', 'success', 3000);
                // Close form on success
                if (onCancel) {
                    onCancel();
                }
                if (onSubmit) {
                    onSubmit(formData);
                }
            } else {
                notify(response.message || 'Failed to create tank transfer', 'error', 5000);
            }
        } catch (error) {
            console.error('Error creating tank transfer:', error);
            notify('An unexpected error occurred', 'error', 3000);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, dispatch, onSubmit, onCancel]);

    return (
        <div className="tank-transfer-form tw-h-full tw-flex tw-flex-col">
            <ScrollView className="tw-flex-1">
                <div className="tw-p-6">
                    <div className="tw-mb-6">
                        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-2">
                            <i className="fa-light fa-exchange tw-mr-2 tw-text-blue-600"></i>
                            Tank Transfer Entry
                        </h3>
                        <p className="tw-text-gray-600 tw-text-sm">
                            Record fuel transfer between tanks. Select transfer type, source and destination tanks, and transfer amount.
                        </p>
                    </div>

                    {/* Dismissible Information Notice */}
                    {showInfoNotice && (
                        <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
                            <div className="tw-flex tw-items-start">
                                <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                                <div className="tw-flex-1">
                                    <h4 className="tw-font-medium tw-text-blue-800 tw-mb-1">Transfer Information</h4>
                                    <p className="tw-text-blue-700 tw-text-sm">
                                        Record fuel transfers between tanks to update inventory levels. The transfer amount will be deducted from the source tank and added to the destination tank.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowInfoNotice(false)}
                                    className="tw-ml-3 tw-text-blue-600 hover:tw-text-blue-800 tw-transition-colors"
                                    title="Close information"
                                >
                                    <i className="fa-light fa-times"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="tw-flex tw-justify-center tw-py-8">
                            <LoadIndicator width={'48px'} height={'48px'} visible={true} />
                        </div>
                    )}

                    <Form
                        readOnly={isLoading}
                        formData={formData}
                        showColonAfterLabel={true}
                        labelLocation="top"
                        colCount={2}
                        className="tw-mb-6"
                    >
                        <SimpleItem
                            dataField="date"
                            editorType="dxDateBox"
                            editorOptions={{
                                value: formData.date,
                                max: new Date(),
                                displayFormat: "yyyy-MM-dd HH:mm",
                                type: "datetime",
                                onValueChanged: handleDateChange,
                                width: "100%"
                            }}
                        >
                            <Label text="Transfer Date & Time" />
                            <RequiredRule message="Date is required" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="transferType"
                            editorType="dxSelectBox"
                            editorOptions={{
                                items: transferTypeOptions,
                                displayExpr: 'name',
                                valueExpr: 'id',
                                onValueChanged: handleTransferTypeChange,
                                value: formData.transferType,
                                placeholder: "Select transfer type",
                                width: "100%"
                            }}
                        >
                            <Label text="Transfer Type" />
                            <RequiredRule message="Transfer type is required" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="sourceSiteId"
                            editorType="dxSelectBox"
                            editorOptions={{
                                items: sites || [],
                                displayExpr: 'name',
                                valueExpr: 'id',
                                onValueChanged: handleSourceSiteChange,
                                value: formData.sourceSiteId,
                                placeholder: "Select source site",
                                width: "100%"
                            }}
                        >
                            <Label text="Source Site" />
                            <RequiredRule message="Source site is required" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="sourceTankId"
                            editorType="dxSelectBox"
                            editorOptions={{
                                items: filteredSourceTanks,
                                displayExpr: 'name',
                                valueExpr: 'id',
                                onValueChanged: handleSourceTankChange,
                                value: formData.sourceTankId,
                                disabled: !formData.sourceSiteId,
                                placeholder: "Select source tank",
                                width: "100%"
                            }}
                        >
                            <Label text="Source Tank" />
                            <RequiredRule message="Source tank is required"/>
                        </SimpleItem>

                        <SimpleItem
                            dataField="destinationSiteId"
                            editorType="dxSelectBox"
                            editorOptions={{
                                items: sites || [],
                                displayExpr: 'name',
                                valueExpr: 'id',
                                onValueChanged: handleDestinationSiteChange,
                                value: formData.transferType === 'InterTank' ? formData.sourceSiteId : formData.destinationSiteId,
                                disabled: formData.transferType === 'InterTank',
                                placeholder: "Select destination site",
                                width: "100%"
                            }}
                        >
                            <Label text="Destination Site" />
                            <RequiredRule message="Destination site is required" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="destinationTankId"
                            editorType="dxSelectBox"
                            editorOptions={{
                                items: filteredDestinationTanks,
                                displayExpr: 'name',
                                valueExpr: 'id',
                                onValueChanged: handleDestinationTankChange,
                                value: formData.destinationTankId,
                                disabled: !formData.destinationSiteId,
                                placeholder: "Select destination tank",
                                width: "100%"
                            }}
                        >
                            <Label text="Destination Tank" />
                            <RequiredRule message="Destination tank is required"/>
                        </SimpleItem>

                        <SimpleItem
                            dataField="amount"
                            editorType="dxNumberBox"
                            editorOptions={{
                                showSpinButtons: true,
                                value: formData.amount,
                                onValueChanged: handleAmountChange,
                                placeholder: "Enter transfer amount",
                                width: "100%",
                                format: "#,##0.00",
                                min: 0.01
                            }}
                        >
                            <Label text="Transfer Amount (Liters)" />
                            <RequiredRule message="Transfer amount is required" />
                            <NumericRule message="Must be a valid positive number" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="reason"
                            editorType="dxTextArea"
                            editorOptions={{
                                value: formData.reason,
                                onValueChanged: handleReasonChange,
                                placeholder: "Enter reason for transfer (optional)",
                                width: "100%",
                                height: 80
                            }}
                            colSpan={2}
                        >
                            <Label text="Transfer Reason" />
                        </SimpleItem>
                    </Form>

                    <div className="tw-flex tw-justify-end tw-mt-4">
                        <Button
                            text="Cancel"
                            onClick={onCancel}
                            className="tw-mr-2"
                            disabled={isSubmitting}
                        />
                        <Button
                            text={isSubmitting ? "Submitting..." : "Submit"}
                            onClick={handleSubmit}
                            disabled={isSubmitting || isLoading}
                            className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-md hover:tw-bg-blue-700 transition-all duration-200 ease-in-out"
                        />
                    </div>

                    {formData.sourceTankId && (
                        <div className="tw-mt-6">
                            <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mb-4">
                                <i className="fa-light fa-chart-line tw-mr-2 tw-text-blue-600"></i>
                                Source Tank Volume History
                            </h4>
                            <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4">
                                <DataGrid
                                    key={`${formData.sourceTankId}-${formData.date}`}
                                    dataSource={formData.sourceTankId ? tankVolumeHistory : []}
                                    showBorders={true}
                                    height="400px"
                                    allowColumnReordering={false}
                                    allowColumnResizing={true}
                                    columnAutoWidth={true}
                                    showRowLines={true}
                                    rowAlternationEnabled={true}
                                    noDataText="No volume history available for selected source tank and date"
                                >
                                    <GroupPanel visible={true} allowColumnDragging={false} />
                                    <Grouping autoExpandAll={true} />

                                    <Column
                                        dataField="timestamp"
                                        caption="Time"
                                        dataType="datetime"
                                        cellRender={formatTime}
                                        width={120}
                                    />
                                    <Column
                                        dataField="volumeChange"
                                        caption="Volume Change"
                                        format="#,##0.00"
                                        alignment="right"
                                    />
                                    <Column
                                        dataField="newVolume"
                                        caption="New Volume"
                                        format="#,##0.00"
                                        alignment="right"
                                    />
                                    <Column
                                        dataField="changeReason"
                                        caption="Reason"
                                        groupIndex={0}
                                    >
                                        <Lookup
                                            dataSource={VolumeChangeReasonEnum}
                                            valueExpr="id"
                                            displayExpr="name"
                                        />
                                    </Column>

                                    <Summary>
                                        <GroupItem
                                            column="volumeChange"
                                            summaryType="sum"
                                            displayFormat="Total: {0}"
                                            showInGroupFooter={true}
                                        />
                                        <TotalItem
                                            column="volumeChange"
                                            summaryType="sum"
                                            displayFormat="Grand Total: {0}"
                                        />
                                        <TotalItem
                                            name="TotalFuelDispensed"
                                            displayFormat="Total Fuel Dispensed: {0}"
                                            calculateCustomSummary={calculateTotalFuelDispensed}
                                        />
                                    </Summary>
                                </DataGrid>
                            </div>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="tw-flex tw-justify-end tw-space-x-3 tw-mt-6 tw-pt-6 tw-border-t tw-border-gray-200">
                        {/* Validation Errors Display */}
                        {Object.keys(validationErrors).length > 0 && (
                            <div className="tw-flex-1 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4 tw-mr-4">
                                <div className="tw-flex tw-items-start">
                                    <i className="fa-light fa-exclamation-circle tw-text-red-600 tw-mt-0.5 tw-mr-3"></i>
                                    <div>
                                        <h4 className="tw-font-medium tw-text-red-800 tw-mb-1">Please fix the following errors:</h4>
                                        <ul className="tw-text-red-700 tw-text-sm tw-list-disc tw-list-inside">
                                            {Object.values(validationErrors).map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            text="Cancel"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="tw-min-w-24"
                            stylingMode="outlined"
                        >
                            <i className="fa-light fa-times tw-mr-2"></i>
                            Cancel
                        </Button>
                        <Button
                            text="Save Transfer"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            loading={isSubmitting}
                            className="tw-min-w-32"
                            type="default"
                        >
                            <i className="fa-light fa-save tw-mr-2"></i>
                            Save Transfer
                        </Button>
                    </div>
                </div>
            </ScrollView>
        </div>
    );
};

export default TankTransferForm;
