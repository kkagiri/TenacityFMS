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
import { createClosingStock } from '../../../redux/actions/ClosingStockActions';
import { prepareOpeningClosingStockParams } from '../../../utils/stockDataPreparation';
import { VolumeChangeReasonEnum } from '../../../utils/enums';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import notify from 'devextreme/ui/notify';
import './ClosingStockForm.scss';

const ClosingStockForm = ({ updateFormData, isLoading, onSubmit, onCancel }) => {
    const dispatch = useDispatch();
    const tanksFromStore = useSelector((state) => state.tank.tanks);
    const sites = useSelector((state) => state.site.sites);
    const tankVolumeHistory = useSelector((state) => {
        return state.tankVolumeHistory.tankVolumeHistory;
    });

    const [filteredTanks, setFilteredTanks] = useState([]);
    const [loading] = useState(false);
    const [formData, setFormData] = useState({
        siteId: null,
        tankId: null,
        amount: null,
        date: new Date()
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [showInfoNotice, setShowInfoNotice] = useState(true);

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

    const handleSiteChange = useCallback((e) => {
        const siteId = e.value;
        const updatedData = {
            ...formData,
            siteId: siteId,
            tankId: null
        };
        setFormData(updatedData);

        const tanksForSite = tanksFromStore.filter(tank => tank.siteId === siteId);
        setFilteredTanks(tanksForSite);
    }, [tanksFromStore, formData]);

    const handleTankChange = useCallback((e) => {
        const tankId = e.value;
        const updatedData = {
            ...formData,
            tankId: tankId
        };
        setFormData(updatedData);

        if (tankId) {
            dispatch(fetchTankVolumeHistoryByTankId(tankId));
        }
    }, [formData, dispatch]);

    const handleDateChange = useCallback((e) => {
        const newDate = e.value;
        const updatedData = {
            ...formData,
            date: newDate
        };
        setFormData(updatedData);
    }, [formData]);

    const handleAmountChange = useCallback((e) => {
        const amount = e.value;
        const updatedData = {
            ...formData,
            amount: amount
        };
        setFormData(updatedData);
    }, [formData]);

    // Validation logic
    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.siteId) errors.siteId = 'Site is required';
        if (!formData.tankId) errors.tankId = 'Tank is required';
        if (!formData.amount || formData.amount <= 0) errors.amount = 'Valid closing stock amount is required';
        if (!formData.date) errors.date = 'Date is required';

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    // Handle form submission
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const params = prepareOpeningClosingStockParams(formData);
            const response = await dispatch(createClosingStock(params));

            if (response.success) {
                notify(response.message || 'Closing stock created successfully', 'success', 3000);
                if (onSubmit) {
                    onSubmit(formData);
                }
            } else {
                notify(response.message || 'Failed to create closing stock', 'error', 5000);
            }
        } catch (error) {
            console.error('Error creating closing stock:', error);
            notify('An unexpected error occurred', 'error', 3000);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, dispatch, onSubmit]);

    return (
        <div className="closing-stock-form tw-h-full tw-flex">
            {/* Main Form Area */}
            <div className="tw-flex-1 tw-p-6 tw-overflow-auto">
                <div className="tw-mb-6">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-2">
                        <i className="fa-light fa-lock tw-mr-2 tw-text-blue-600"></i>
                        Closing Stock Entry
                    </h3>
                    <p className="tw-text-gray-600 tw-text-sm">
                        Record the closing stock amount for the selected tank and date.
                    </p>
                </div>

                {/* Dismissible Information Notice */}
                {showInfoNotice && (
                    <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
                        <div className="tw-flex tw-items-start">
                            <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                            <div className="tw-flex-1">
                                <h4 className="tw-font-medium tw-text-blue-800 tw-mb-1">Closing Stock Information</h4>
                                <p className="tw-text-blue-700 tw-text-sm">
                                    Closing stock represents the fuel quantity available in the tank at the end of the specified date and time.
                                    This value will be used for reconciliation and stock calculations.
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
                        <Label text="Date & Time" />
                        <RequiredRule message="Date is required" />
                    </SimpleItem>

                    <SimpleItem
                        dataField="siteId"
                        editorType="dxSelectBox"
                        editorOptions={{
                            items: sites || [],
                            displayExpr: 'name',
                            valueExpr: 'id',
                            onValueChanged: handleSiteChange,
                            value: formData.siteId,
                            placeholder: "Select a site",
                            width: "100%"
                        }}
                    >
                        <Label text="Site" />
                        <RequiredRule message="Site is required" />
                    </SimpleItem>

                    <SimpleItem
                        dataField="tankId"
                        editorType="dxSelectBox"
                        editorOptions={{
                            items: filteredTanks,
                            displayExpr: 'name',
                            valueExpr: 'id',
                            onValueChanged: handleTankChange,
                            value: formData.tankId,
                            disabled: !formData.siteId,
                            placeholder: "Select a tank",
                            width: "100%"
                        }}
                    >
                        <Label text="Tank" />
                        <RequiredRule message="Tank is required" />
                    </SimpleItem>

                    <SimpleItem
                        dataField="amount"
                        editorType="dxNumberBox"
                        editorOptions={{
                            showSpinButtons: true,
                            value: formData.amount,
                            onValueChanged: handleAmountChange,
                            placeholder: "Enter closing stock amount",
                            width: "100%",
                            format: "#,##0.00"
                        }}
                    >
                        <Label text="Closing Stock Amount (Liters)" />
                        <RequiredRule message="Amount is required" />
                        <NumericRule message="Must be a valid number" />
                    </SimpleItem>
                </Form>

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
                        text="Save"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        className="tw-min-w-32"
                        type="default"
                    >
                        <i className="fa-light fa-save tw-mr-2"></i>
                        Save
                    </Button>
                </div>
            </div>

            {/* Sidebar for Tank Volume History */}
            <div className="tw-w-96 tw-bg-white tw-border-l tw-border-gray-200">
                <div className="tw-p-4 tw-border-b tw-border-gray-200">
                    <h4 className="tw-font-semibold tw-text-gray-800">
                        <i className="fa-light fa-history tw-mr-2 tw-text-blue-600"></i>
                        Tank Volume History
                    </h4>
                    <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                        Recent volume changes for selected tank
                    </p>
                </div>
                <ScrollView className="tw-h-full">
                    <div className="tw-p-4">
                        {formData.tankId ? (
                            tankVolumeHistory && tankVolumeHistory.length > 0 ? (
                                <DataGrid
                                    dataSource={tankVolumeHistory}
                                    showBorders={true}
                                    columnAutoWidth={true}
                                    height="600px"
                                    columnResizingMode="widget"
                                    allowColumnResizing={true}
                                    className="tw-text-sm"
                                >
                                    <GroupPanel visible={false} />
                                    <Grouping autoExpandAll={false} />

                                    <Column
                                        dataField="dateTime"
                                        caption="Date/Time"
                                        dataType="datetime"
                                        format="dd/MM/yyyy HH:mm"
                                        width="120"
                                    />
                                    <Column
                                        dataField="volumeBefore"
                                        caption="Before"
                                        dataType="number"
                                        format="#,##0.00"
                                        width="70"
                                    />
                                    <Column
                                        dataField="volumeAfter"
                                        caption="After"
                                        dataType="number"
                                        format="#,##0.00"
                                        width="70"
                                    />
                                    <Column
                                        dataField="changeAmount"
                                        caption="Change"
                                        dataType="number"
                                        format="#,##0.00"
                                        width="70"
                                        cellRender={(cellData) => (
                                            <span className={cellData.value >= 0 ? 'tw-text-green-600' : 'tw-text-red-600'}>
                                                {cellData.value >= 0 ? '+' : ''}{cellData.value?.toFixed(2)}
                                            </span>
                                        )}
                                    />
                                    <Column
                                        dataField="reason"
                                        caption="Reason"
                                        width="100"
                                    >
                                        <Lookup
                                            dataSource={Object.entries(VolumeChangeReasonEnum).map(([key, value]) => ({
                                                id: value,
                                                name: key
                                            }))}
                                            valueExpr="id"
                                            displayExpr="name"
                                        />
                                    </Column>

                                    <Summary>
                                        <GroupItem
                                            column="changeAmount"
                                            summaryType="sum"
                                            displayFormat="Total: {0}"
                                            valueFormat="#,##0.00"
                                        />
                                        <TotalItem
                                            column="changeAmount"
                                            summaryType="sum"
                                            displayFormat="Grand Total: {0}"
                                            valueFormat="#,##0.00"
                                        />
                                    </Summary>
                                </DataGrid>
                            ) : (
                                <div className="tw-text-center tw-py-8">
                                    <i className="fa-light fa-inbox tw-text-gray-400 tw-text-3xl tw-mb-3"></i>
                                    <p className="tw-text-gray-500">No volume history available for this tank</p>
                                </div>
                            )
                        ) : (
                            <div className="tw-text-center tw-py-8">
                                <i className="fa-light fa-tank tw-text-gray-400 tw-text-3xl tw-mb-3"></i>
                                <p className="tw-text-gray-500">Select a tank to view volume history</p>
                            </div>
                        )}
                    </div>
                </ScrollView>
            </div>
        </div>
    );
};

export default ClosingStockForm;
