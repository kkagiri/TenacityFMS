import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Paging, FilterRow, HeaderFilter, LoadPanel, Selection, Export, ColumnChooser, StateStoring, Toolbar, Item as TItems } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { Form } from 'devextreme-react/form';
import ScrollView from 'devextreme-react/scroll-view';
import notify from 'devextreme/ui/notify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logoTenacy from '../../assets/logoTenacity.png';
import {
    fetchPumpTransactions
} from '../../redux/actions/consumptionActions';
import './PumpTransactionPopup.scss';

const PumpTransactionPopup = ({
    isVisible,
    onClose,
    title = "Pump Transactions",
    ptsId = null,
    vehicleId = null,
    tankId = null,
    initialDateRange = null,
    width = "90%",
    height = "80%"
}) => {
    const dispatch = useDispatch();
    const {
        pumpTransactions,
        pumpTransactionsLoading,
        pumpTransactionsError
    } = useSelector(state => state.consumption);

    // Get current user from auth state
    const { user } = useSelector(state => state.auth);

    // Check if mobile device
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const isInitialLoad = useRef(true);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Filter panel state
    const [filterPanelVisible, setFilterPanelVisible] = useState(false);

    // Column selection popup state
    const [columnSelectionVisible, setColumnSelectionVisible] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState({
        ptsId: true,
        vehicleName: true,
        tankName: true,
        pump: true,
        nozzle: true,
        tag: true,
        volume: true,
        price: true,
        amount: true,
        dateTime: true,
        hasBeenProcessed: true
    });
    const [filterValues, setFilterValues] = useState({
        vehicleId: vehicleId || null,
        tankId: tankId || null,
        ptsId: ptsId || '',
        startDate: initialDateRange?.[0] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: initialDateRange?.[1] || new Date(),
        processedOnly: null
    });

    // Update filter values when props change
    useEffect(() => {
        setFilterValues(prev => ({
            ...prev,
            vehicleId: vehicleId || prev.vehicleId,
            tankId: tankId || prev.tankId,
            ptsId: ptsId || prev.ptsId,
            ...(initialDateRange && initialDateRange.length >= 2 ? {
                startDate: initialDateRange[0],
                endDate: initialDateRange[1]
            } : {})
        }));
    }, [vehicleId, tankId, ptsId, initialDateRange]);

    // Apply filters
    const handleApplyFilters = useCallback(async () => {
        try {
            // Clean filter values - remove null/empty values
            const cleanFilters = Object.entries(filterValues).reduce((acc, [key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    acc[key] = value;
                }
                return acc;
            }, {});

            await dispatch(fetchPumpTransactions(cleanFilters));
            setFilterPanelVisible(false);

            notify({
                message: 'Filters applied successfully',
                type: 'success',
                displayTime: 2000
            });
        } catch (error) {
            notify({
                message: 'Error applying filters: ' + (error.message || 'Unknown error'),
                type: 'error',
                displayTime: 4000
            });
        }
    }, [dispatch, filterValues]);

    // Quick filter helper functions (only updates state, doesn't apply)
    const setQuickFilter = useCallback((filterUpdate) => {
        setFilterValues(prev => ({ ...prev, ...filterUpdate }));
    }, []);

    // Load data when popup opens or filters change
    useEffect(() => {
        if (isVisible) {
            // Only auto-load on initial open, not on filter value changes
            if (isInitialLoad.current) {
                handleApplyFilters();
                isInitialLoad.current = false;
            }
        } else {
            // Reset for next open
            isInitialLoad.current = true;
        }
    }, [isVisible, handleApplyFilters]);

    // DataGrid columns configuration
    const columns = useMemo(() => [
        {
            dataField: 'ptsId',
            caption: 'PTS ID',
            width: 100,
            allowHiding: false
        },

        {
            dataField: 'vehicleName',
            caption: 'Vehicle Name',
            width: 140,
            cellRender: (data) => {
                const vehicleName = data.value || data.data.vehicleNumberPlate || 'N/A';
                return (
                    <div className="tw-flex tw-flex-col">
                        <span className="tw-font-medium">{vehicleName}</span>
                        {data.data.vehicleNumberPlate && data.value && (
                            <span className="tw-text-xs tw-text-gray-500">
                                {data.data.vehicleNumberPlate}
                            </span>
                        )}
                    </div>
                );
            }
        },

        {
            dataField: 'tankName',
            caption: 'Tank Name',
            width: 120
        },
        {
            dataField: 'pump',
            caption: 'Pump ID',
            width: 100
        },
        {
            dataField: 'nozzle',
            caption: 'Nozzle',
            width: 80
        },
        {
            dataField: 'tag',
            caption: 'Tag',
            width: 100
        },
        {
            dataField: 'volume',
            caption: 'Volume (L)',
            width: 130,
            allowHiding: false,
            dataType: 'number',
            format: { type: 'fixedPoint', precision: 2 },
            alignment: 'right'
        },
        {
            dataField: 'price',
            caption: 'Price',
            width: 100,
            dataType: 'number',
            format: { type: 'currency', precision: 3 },
            alignment: 'right'
        },
        {
            dataField: 'amount',
            caption: 'Amount',
            width: 120,

            dataType: 'number',
            format: { type: 'currency', precision: 2 },
            alignment: 'right'
        },
        {
            dataField: 'dateTime',
            caption: 'Date/Time',
            width: 160,
            dataType: 'datetime',
            format: 'dd/MM/yyyy HH:mm:ss'
        },
        {
            dataField: 'dateTimeStart',
            caption: 'Start Time',
            width: 160,
            dataType: 'datetime',
            format: 'dd/MM/yyyy HH:mm:ss'
        },
        {
            dataField: 'hasBeenProcessed',
            caption: 'Status',
            width: 120,
            cellRender: (data) => (
                <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${
                    data.value
                        ? 'tw-bg-green-100 tw-text-green-800'
                        : 'tw-bg-yellow-100 tw-text-yellow-800'
                }`}>
                    {data.value ? 'Processed' : 'Pending'}
                </span>
            )
        }
    ], []);

    // Filter form items configuration
    const filterFormItems = useMemo(() => [
        {
            dataField: 'startDate',
            editorType: 'dxDateBox',
            label: { text: 'Start Date' },
            editorOptions: {
                type: 'datetime',
                displayFormat: 'dd/MM/yyyy HH:mm',
                showClearButton: true,
                width: '100%'
            }
        },
        {
            dataField: 'endDate',
            editorType: 'dxDateBox',
            label: { text: 'End Date' },
            editorOptions: {
                type: 'datetime',
                displayFormat: 'dd/MM/yyyy HH:mm',
                showClearButton: true,
                width: '100%'
            }
        },
        {
            dataField: 'ptsId',
            editorType: 'dxTextBox',
            label: {
                text: ptsId ? 'PTS ID (Fixed)' : 'PTS ID',
                showColonAfterLabel: false
            },
            editorOptions: {
                placeholder: ptsId ? 'Viewing transactions for this PTS ID' : 'Enter PTS ID',
                showClearButton: !ptsId, // Don't show clear button if PTS ID is provided as prop
                width: '100%',
                disabled: !!ptsId, // Disable if ptsId is provided as prop
                readOnly: !!ptsId,
                stylingMode: ptsId ? 'outlined' : 'underlined'
            }
        },
        {
            dataField: 'vehicleId',
            editorType: 'dxTextBox',
            label: {
                text: vehicleId ? 'Vehicle ID (Fixed)' : 'Vehicle ID',
                showColonAfterLabel: false
            },
            editorOptions: {
                placeholder: vehicleId ? 'Viewing transactions for this Vehicle' : 'Enter Vehicle ID',
                showClearButton: !vehicleId,
                width: '100%',
                disabled: !!vehicleId,
                readOnly: !!vehicleId,
                stylingMode: vehicleId ? 'outlined' : 'underlined'
            }
        },
        {
            dataField: 'tankId',
            editorType: 'dxTextBox',
            label: {
                text: tankId ? 'Tank ID (Fixed)' : 'Tank ID',
                showColonAfterLabel: false
            },
            editorOptions: {
                placeholder: tankId ? 'Viewing transactions for this Tank' : 'Enter Tank ID',
                showClearButton: !tankId,
                width: '100%',
                disabled: !!tankId,
                readOnly: !!tankId,
                stylingMode: tankId ? 'outlined' : 'underlined'
            }
        },
        {
            dataField: 'processedOnly',
            editorType: 'dxSelectBox',
            label: { text: 'Processing Status' },
            editorOptions: {
                dataSource: [
                    { value: null, text: 'All' },
                    { value: true, text: 'Processed Only' },
                    { value: false, text: 'Unprocessed Only' }
                ],
                valueExpr: 'value',
                displayExpr: 'text',
                placeholder: 'Select status filter',
                showClearButton: true,
                width: '100%'
            }
        }
    ], [ptsId, vehicleId, tankId]);

    // Reset filters
    const handleResetFilters = useCallback(() => {
        const defaultFilters = {
            vehicleId: vehicleId || null,
            tankId: tankId || null,
            ptsId: ptsId || '',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            processedOnly: null
        };
        setFilterValues(defaultFilters);
    }, [vehicleId, tankId, ptsId]);

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        if (!pumpTransactions || pumpTransactions.length === 0) {
            return { count: 0, totalVolume: 0, totalAmount: 0, processedCount: 0, pendingCount: 0 };
        }

        return pumpTransactions.reduce((acc, transaction) => {
            acc.count++;
            acc.totalVolume += transaction.volume || 0;
            acc.totalAmount += transaction.amount || 0;
            if (transaction.hasBeenProcessed) {
                acc.processedCount++;
            } else {
                acc.pendingCount++;
            }
            return acc;
        }, { count: 0, totalVolume: 0, totalAmount: 0, processedCount: 0, pendingCount: 0 });
    }, [pumpTransactions]);

    // PDF Export function with professional formatting
    const onExportToPDF = useCallback(() => {
        try {
            notify('Preparing professional PDF report...', 'info', 2000);

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Set up document properties
            doc.setProperties({
                title: 'Tenacy & co FMS - Pump Transactions Report',
                subject: 'Pump Transactions Report',
                author: user?.userName || user?.email || 'FMS User',
                creator: 'Tenacy Fuel Management System'
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Convert logo to base64 and add to PDF
            const addLogoAndHeader = () => {
                try {
                    // Create a temporary canvas to convert the logo
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        const logoDataUrl = canvas.toDataURL('image/png');

                        // Add logo (left side)
                        doc.addImage(logoDataUrl, 'PNG', 15, 8, 25, 15);
                    };
                    img.src = logoTenacy;
                } catch (logoError) {
                    console.warn('Could not load logo:', logoError);
                }

                // Company name and system title (left side, next to logo)
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 51, 153); // Blue color
                doc.text('Tenacy FMS LTD', 45, 15);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(70, 70, 70);
                doc.text('Fuel Management System', 45, 20);

                // Report title (center)
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('Pump Transactions Report', pageWidth / 2, 15, { align: 'center' });



                // Generation info (right side)
                const now = new Date();
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 100, 100);
                doc.text(`Generated on: ${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB')}`, pageWidth - 15, 30, { align: 'right' });
                doc.text(`Generated by: ${user?.userName || user?.email || 'System User'}`, pageWidth - 15, 35, { align: 'right' });

                // Solid line under header
                doc.setLineWidth(0.3);
                doc.setDrawColor(0, 0, 0);
                doc.line(15, 25, pageWidth - 15, 25);

            };

            addLogoAndHeader();

            let yPos = 45;

            // Applied Filters Section
            const filterInfo = [];
            if (filterValues.ptsId) filterInfo.push(`PTS ID: ${filterValues.ptsId}`);
            if (filterValues.vehicleId) filterInfo.push(`Vehicle ID: ${filterValues.vehicleId}`);
            if (filterValues.tankId) filterInfo.push(`Tank ID: ${filterValues.tankId}`);
            if (filterValues.startDate || filterValues.endDate) {
                const start = filterValues.startDate ? new Date(filterValues.startDate).toLocaleDateString('en-GB') : 'N/A';
                const end = filterValues.endDate ? new Date(filterValues.endDate).toLocaleDateString('en-GB') : 'N/A';
                filterInfo.push(`Date Range: ${start} to ${end}`);
            }
            if (filterValues.processedOnly !== null) {
                filterInfo.push(`Status: ${filterValues.processedOnly ? 'Processed Only' : 'Unprocessed Only'}`);
            }

            if (filterInfo.length > 0) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('Applied Filters:', 15, yPos);
                yPos += 5;

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60, 60, 60);
                filterInfo.forEach(info => {
                    doc.text(`• ${info}`, 20, yPos);
                    yPos += 4;
                });
                yPos += 5;
            }

            // Summary Statistics Section


            const summaryData = [
                ['Total Transactions', summaryStats.count.toString()],
                ['Total Volume', `${summaryStats.totalVolume.toFixed(2)} L`],
                ['Total Amount', `KES ${summaryStats.totalAmount.toFixed(2)}`],
            ];

            // Check if autoTable is available
            if (typeof doc.autoTable === 'function') {
                doc.autoTable({
                    startY: yPos,
                    body: summaryData,
                    columns: [
                        { header: 'Metric', dataKey: 0 },
                        { header: 'Value', dataKey: 1 }
                    ],
                    styles: {
                        fontSize: 9,
                        cellPadding: 2
                    },
                    headStyles: {
                        fillColor: [66, 139, 202],
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    margin: { left: 20, right: 20 },
                    tableWidth: 80
                });

                // Prepare transaction data for the table
                const tableData = (pumpTransactions || []).map(transaction => [
                    transaction.ptsId || '',
                    transaction.vehicleId || '',
                    transaction.vehicleName || transaction.vehicleNumberPlate || 'N/A',
                    transaction.tankName || '',
                    transaction.pump || '',
                    transaction.nozzle || '',
                    transaction.tag || '',
                    (transaction.volume || 0).toFixed(2),
                    `$${(transaction.price || 0).toFixed(3)}`,
                    `$${(transaction.amount || 0).toFixed(2)}`,
                    transaction.dateTime ? new Date(transaction.dateTime).toLocaleString() : '',
                    transaction.hasBeenProcessed ? 'Processed' : 'Pending'
                ]);

                // Add transactions table
                const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : yPos + 40;

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Transaction Details', 20, finalY);

                doc.autoTable({
                    startY: finalY + 5,
                    head: [[
                        'PTS ID', 'Vehicle ID', 'Vehicle Name', 'Tank', 'Pump',
                        'Nozzle', 'Tag', 'Volume (L)', 'Price', 'Amount', 'Date/Time', 'Status'
                    ]],
                    body: tableData,
                    styles: {
                        fontSize: 8,
                        cellPadding: 1.5,
                        overflow: 'linebreak',
                        halign: 'left'
                    },
                    headStyles: {
                        fillColor: [66, 139, 202],
                        textColor: 255,
                        fontStyle: 'bold',
                        fontSize: 9
                    },
                    columnStyles: {
                        7: { halign: 'right' }, // Volume
                        8: { halign: 'right' }, // Price
                        9: { halign: 'right' }, // Amount
                        11: { halign: 'center' } // Status
                    },
                    alternateRowStyles: {
                        fillColor: [245, 245, 245]
                    },
                    margin: { left: 10, right: 10 },
                    didDrawPage: (data) => {
                        // Professional footer with page numbers
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'normal');
                        const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
                        const totalPages = doc.internal.getNumberOfPages();

                        // Draw footer line
                        doc.setLineWidth(0.5);
                        doc.line(10, pageHeight - 20, pageWidth - 10, pageHeight - 20);

                        // Page numbers (right aligned)
                        doc.text(
                            `Page ${pageNumber} of ${totalPages}`,
                            pageWidth - 30,
                            pageHeight - 10
                        );

                        // Company info (left aligned)
                        doc.text(
                            'Tenacy Fuel Management System',
                            15,
                            pageHeight - 10
                        );
                    }
                });
            } else {
                // Fallback: Manual text-based table if autoTable is not available
                doc.setFontSize(12);
                doc.text('Summary Statistics:', 20, yPos);
                yPos += 10;
                summaryData.forEach(([metric, value]) => {
                    doc.text(`${metric}: ${value}`, 25, yPos);
                    yPos += 5;
                });

                yPos += 10;
                doc.text('Transaction Details:', 20, yPos);
                yPos += 10;
                doc.text('Note: Detailed transaction table requires autoTable plugin. Please ensure jspdf-autotable is properly installed.', 25, yPos);
            }

            // Generate filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `TenacyFMS_Pump_Transactions_${timestamp}.pdf`;

            // Save the PDF
            doc.save(filename);

            notify({
                message: 'PDF export completed successfully',
                type: 'success',
                displayTime: 3000
            });

        } catch (error) {
            console.error('PDF export error:', error);
            notify({
                message: 'PDF export failed: ' + (error.message || 'Unknown error'),
                type: 'error',
                displayTime: 5000
            });
        }
    }, [filterValues, summaryStats, pumpTransactions, user]);

    // Function to open column selection popup
    const onOpenColumnSelection = useCallback(() => {
        setColumnSelectionVisible(true);
    }, []);

    // Function to handle column selection changes
    const handleColumnChange = useCallback((field, value) => {
        setSelectedColumns(prev => ({ ...prev, [field]: value }));
    }, []);

    // Function to generate PDF with selected columns
    const generatePDFWithColumns = useCallback(() => {
        setColumnSelectionVisible(false);
        // Call the existing PDF function with selected columns
        onExportToPDF();
    }, [onExportToPDF]);

    // Handle popup close
    const handleClose = useCallback(() => {
        setFilterPanelVisible(false);
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    return (
        <Popup
            visible={isVisible}
            onHiding={handleClose}
            dragEnabled={!isMobile}
            hideOnOutsideClick={false}
            showCloseButton={true}
            showTitle={true}
            title={title}
            width={isMobile ? "100%" : width}
            height={isMobile ? "100%" : height}
            position={{ my: 'center', at: 'center', of: window }}
            className="pump-transaction-popup"
            animation={null}
        >
            {isMobile ? (
                <ScrollView className="pump-transaction-popup-content">
                    {/* Header with summary and actions */}
                    <div className="tw-flex tw-flex-col tw-gap-3 tw-mb-4 tw-pb-4 tw-border-b tw-border-gray-200">
                        <div className="tw-flex tw-flex-col tw-gap-2 tw-text-sm">
                            <div className="tw-text-gray-600">
                                <span className="tw-font-medium">Total:</span> {summaryStats.count} transactions
                            </div>
                            <div className="tw-text-gray-600">
                                <span className="tw-font-medium">Volume:</span> {summaryStats.totalVolume.toFixed(2)} L
                            </div>
                            <div className="tw-text-gray-600">
                                <span className="tw-font-medium">Amount:</span> KES {summaryStats.totalAmount.toFixed(2)}
                            </div>
                            <div className="tw-text-green-600">
                                <span className="tw-font-medium">Processed:</span> {summaryStats.processedCount}
                            </div>
                            <div className="tw-text-yellow-600">
                                <span className="tw-font-medium">Pending:</span> {summaryStats.pendingCount}
                            </div>
                        </div>
                        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                            <Button
                                text="Filters"
                                icon="filter"
                                type="normal"
                                stylingMode="outlined"
                                onClick={() => setFilterPanelVisible(true)}
                            />
                            <Button
                                text="Refresh"
                                icon="refresh"
                                type="normal"
                                stylingMode="outlined"
                                onClick={handleApplyFilters}
                            />
                            <Button
                                text="Export PDF"
                                icon="fa-light fa-file-pdf"
                                type="normal"
                                stylingMode="outlined"
                                onClick={onOpenColumnSelection}
                                className="tw-col-span-2"
                            />
                        </div>
                    </div>

                    {/* Error display */}
                    {pumpTransactionsError && (
                        <div className="tw-mb-4 tw-p-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg">
                            <div className="tw-flex tw-items-center">
                                <i className="fa-light fa-triangle-exclamation tw-text-red-500 tw-mr-2"></i>
                                <span className="tw-text-red-700 tw-font-medium">Error loading transactions:</span>
                            </div>
                            <div className="tw-text-red-600 tw-mt-1">{pumpTransactionsError}</div>
                        </div>
                    )}

                    {/* DataGrid */}
                    <div className="tw-mt-4">
                        <DataGrid
                            dataSource={pumpTransactions || []}
                            showBorders={true}
                            columnAutoWidth={true}
                            rowAlternationEnabled={true}
                            columnHidingEnabled={true}
                            allowColumnReordering={true}
                            allowColumnResizing={true}
                            width="100%"
                            height="300px"
                            columns={columns}
                            noDataText="No pump transactions found. Use filters to search for transactions."
                        >
                            <FilterRow visible={true} />
                            <HeaderFilter visible={true} />
                            <LoadPanel enabled={pumpTransactionsLoading} />
                            <Paging defaultPageSize={10} />
                            <Selection mode="multiple" />
                            <Export enabled={true} />
                            <ColumnChooser enabled={true} />
                            <StateStoring
                                enabled={true}
                                type="localStorage"
                                storageKey="pumpTransactionPopupDataGrid"
                            />
                        </DataGrid>
                    </div>
                </ScrollView>
            ) : (
                <ScrollView className="pump-transaction-popup-content">
                    {/* Header with summary and actions */}
                    <div className="tw-flex tw-justify-between tw-items-center tw-mb-4 tw-pb-4 tw-border-b tw-border-gray-200">
                        <div className="tw-flex tw-gap-6 tw-text-sm">
                            <div className="tw-text-gray-600">
                                <span className="tw-font-medium">Total:</span> {summaryStats.count} transactions
                            </div>
                            <div className="tw-text-gray-600">
                                <span className="tw-font-medium">Volume:</span> {summaryStats.totalVolume.toFixed(2)} L
                            </div>
                            <div className="tw-text-gray-600">
                                <span className="tw-font-medium">Amount:</span> KES {summaryStats.totalAmount.toFixed(2)}
                            </div>
                            <div className="tw-text-green-600">
                                <span className="tw-font-medium">Processed:</span> {summaryStats.processedCount}
                            </div>
                            <div className="tw-text-yellow-600">
                                <span className="tw-font-medium">Pending:</span> {summaryStats.pendingCount}
                            </div>
                        </div>
                        <div className="tw-flex tw-gap-2">
                            <Button
                                text="Filters"
                                icon="filter"
                                type="normal"
                                stylingMode="outlined"
                                onClick={() => setFilterPanelVisible(true)}
                            />
                            <Button
                                text="Refresh"
                                icon="refresh"
                                type="normal"
                                stylingMode="outlined"
                                onClick={handleApplyFilters}
                            />
                        </div>
                    </div>

                    {/* Error display */}
                    {pumpTransactionsError && (
                        <div className="tw-mb-4 tw-p-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg">
                            <div className="tw-flex tw-items-center">
                                <i className="fa-light fa-triangle-exclamation tw-text-red-500 tw-mr-2"></i>
                                <span className="tw-text-red-700 tw-font-medium">Error loading transactions:</span>
                            </div>
                            <div className="tw-text-red-600 tw-mt-1">{pumpTransactionsError}</div>
                        </div>
                    )}

                    {/* DataGrid with Toolbar */}
                    <div className="tw-mt-4">
                        <DataGrid
                            dataSource={pumpTransactions || []}
                            showBorders={true}
                            columnAutoWidth={true}
                            rowAlternationEnabled={true}
                            columnHidingEnabled={true}
                            allowColumnReordering={true}
                            allowColumnResizing={true}
                            width="100%"
                            height="500px"
                            columns={columns}
                            noDataText="No pump transactions found. Use filters to search for transactions."
                        >
                            <FilterRow visible={true} />
                            <HeaderFilter visible={true} />
                            <LoadPanel enabled={pumpTransactionsLoading} />
                            <Paging defaultPageSize={30} />
                            <Selection mode="multiple" />
                            <Export enabled={true} />
                            <ColumnChooser enabled={true} />
                            <StateStoring
                                enabled={true}
                                type="localStorage"
                                storageKey="pumpTransactionPopupDataGrid"
                            />

                            <Toolbar>
                                <TItems name="exportButton" location="after" />
                                <TItems name="columnChooserButton" location="after" />
                                <TItems
                                    location="after"
                                    widget="dxButton"
                                    options={{
                                        icon: 'fa-light fa-file-pdf',
                                        text: 'Export PDF',
                                        stylingMode: 'text',
                                        onClick: onOpenColumnSelection
                                    }}
                                />

                            </Toolbar>
                        </DataGrid>
                    </div>
                </ScrollView>
            )}

            {/* Filter Panel Popup */}
            <Popup
                visible={filterPanelVisible}
                onHiding={() => setFilterPanelVisible(false)}
                dragEnabled={false}
                hideOnOutsideClick={true}
                showCloseButton={true}
                showTitle={true}
                title="Pump Transaction Filters"
                width={isMobile ? "95%" : "auto"}
                height={isMobile ? "90%" : "auto"}
                position={{ my: 'center', at: 'center', of: window }}
                animation={null}
            >
                <ScrollView className={isMobile ? "tw-p-4 tw-min-w-full filter-panel-mobile" : "tw-p-6 tw-min-w-96"}>
                    {/* Quick Filter Buttons */}
                    <div className="tw-mb-6 tw-pb-4 tw-border-b tw-border-gray-200">
                        <div className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-3">Quick Filters:</div>
                        <div className={isMobile ? "tw-grid tw-grid-cols-2 tw-gap-2" : "tw-flex tw-flex-wrap tw-gap-2"}>
                            <Button
                                text="Last 7 Days"
                                type="normal"
                                stylingMode="outlined"
                                onClick={() => {
                                    const endDate = new Date();
                                    const startDate = new Date();
                                    startDate.setDate(startDate.getDate() - 7);
                                    setQuickFilter({ startDate, endDate });
                                }}
                            />
                            <Button
                                text="Last 30 Days"
                                type="normal"
                                stylingMode="outlined"
                                onClick={() => {
                                    const endDate = new Date();
                                    const startDate = new Date();
                                    startDate.setDate(startDate.getDate() - 30);
                                    setQuickFilter({ startDate, endDate });
                                }}
                            />
                            <Button
                                text="Unprocessed"
                                type="normal"
                                stylingMode="outlined"
                                onClick={() => {
                                    setQuickFilter({ processedOnly: false });
                                }}
                            />
                            <Button
                                text="Today"
                                type="normal"
                                stylingMode="outlined"
                                onClick={() => {
                                    const today = new Date();
                                    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
                                    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
                                    setQuickFilter({ startDate: startOfDay, endDate: endOfDay });
                                }}
                            />
                        </div>
                    </div>

                    <Form
                        formData={filterValues}
                        onFieldDataChanged={(e) => {
                            setFilterValues(prev => ({
                                ...prev,
                                [e.dataField]: e.value
                            }));
                        }}
                        items={filterFormItems}
                        labelLocation="top"
                        colCount={1}
                        showColonAfterLabel={false}
                    />

                    <div className={isMobile ? "tw-grid tw-grid-cols-2 tw-gap-2 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200" : "tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200"}>
                        <Button
                            text="Reset"
                            type="normal"
                            onClick={handleResetFilters}
                        />
                        <Button
                            text="Cancel"
                            type="normal"
                            onClick={() => setFilterPanelVisible(false)}
                        />
                        <Button
                            text="Apply"
                            type="default"
                            onClick={handleApplyFilters}
                            className={isMobile ? "tw-col-span-2" : ""}
                        />
                    </div>
                </ScrollView>
            </Popup>

            {/* Column Selection Popup */}
            <Popup
                visible={columnSelectionVisible}
                onHiding={() => setColumnSelectionVisible(false)}
                dragEnabled={false}
                hideOnOutsideClick={true}
                showCloseButton={true}
                showTitle={true}
                title="Select Columns for PDF Export"
                width={isMobile ? "95%" : "auto"}
                height={isMobile ? "90%" : "auto"}
                position={{ my: 'center', at: 'center', of: window }}
                animation={null}
            >
                <ScrollView className={isMobile ? "tw-p-4 tw-min-w-full" : "tw-p-6 tw-min-w-96"}>
                    <div className="tw-mb-4">
                        <div className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-3">
                            Select the columns you want to include in the PDF report:
                        </div>
                        <div className="tw-text-xs tw-text-gray-500 tw-mb-4">
                            Note: Reports are limited to 50 transactions maximum{!isMobile && ". Amounts are displayed in KES (Kenyan Shillings)"}.
                        </div>
                    </div>

                    <div className={isMobile ? "tw-space-y-3" : "tw-grid tw-grid-cols-2 tw-gap-3"}>
                        <div className={isMobile ? "tw-flex tw-items-center tw-justify-between" : "tw-flex tw-items-center tw-space-x-2"}>
                            {!isMobile && (
                                <input
                                    type="checkbox"
                                    id="col-ptsId"
                                    checked={selectedColumns.ptsId}
                                    onChange={(e) => handleColumnChange('ptsId', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                            <label htmlFor="col-ptsId" className="tw-text-sm tw-font-medium">PTS ID</label>
                            {isMobile && (
                                <input
                                    type="checkbox"
                                    checked={selectedColumns.ptsId}
                                    onChange={(e) => handleColumnChange('ptsId', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                        </div>
                        <div className={isMobile ? "tw-flex tw-items-center tw-justify-between" : "tw-flex tw-items-center tw-space-x-2"}>
                            {!isMobile && (
                                <input
                                    type="checkbox"
                                    id="col-vehicleName"
                                    checked={selectedColumns.vehicleName}
                                    onChange={(e) => handleColumnChange('vehicleName', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                            <label htmlFor="col-vehicleName" className="tw-text-sm tw-font-medium">Vehicle Name</label>
                            {isMobile && (
                                <input
                                    type="checkbox"
                                    checked={selectedColumns.vehicleName}
                                    onChange={(e) => handleColumnChange('vehicleName', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                        </div>
                        <div className={isMobile ? "tw-flex tw-items-center tw-justify-between" : "tw-flex tw-items-center tw-space-x-2"}>
                            {!isMobile && (
                                <input
                                    type="checkbox"
                                    id="col-tankName"
                                    checked={selectedColumns.tankName}
                                    onChange={(e) => handleColumnChange('tankName', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                            <label htmlFor="col-tankName" className="tw-text-sm tw-font-medium">Tank Name</label>
                            {isMobile && (
                                <input
                                    type="checkbox"
                                    checked={selectedColumns.tankName}
                                    onChange={(e) => handleColumnChange('tankName', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                        </div>
                        <div className={isMobile ? "tw-flex tw-items-center tw-justify-between" : "tw-flex tw-items-center tw-space-x-2"}>
                            {!isMobile && (
                                <input
                                    type="checkbox"
                                    id="col-pump"
                                    checked={selectedColumns.pump}
                                    onChange={(e) => handleColumnChange('pump', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                            <label htmlFor="col-pump" className="tw-text-sm tw-font-medium">Pump ID</label>
                            {isMobile && (
                                <input
                                    type="checkbox"
                                    checked={selectedColumns.pump}
                                    onChange={(e) => handleColumnChange('pump', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                        </div>
                        <div className={isMobile ? "tw-flex tw-items-center tw-justify-between" : "tw-flex tw-items-center tw-space-x-2"}>
                            {!isMobile && (
                                <input
                                    type="checkbox"
                                    id="col-nozzle"
                                    checked={selectedColumns.nozzle}
                                    onChange={(e) => handleColumnChange('nozzle', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                            <label htmlFor="col-nozzle" className="tw-text-sm tw-font-medium">Nozzle</label>
                            {isMobile && (
                                <input
                                    type="checkbox"
                                    checked={selectedColumns.nozzle}
                                    onChange={(e) => handleColumnChange('nozzle', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                        </div>
                        <div className={isMobile ? "tw-flex tw-items-center tw-justify-between" : "tw-flex tw-items-center tw-space-x-2"}>
                            {!isMobile && (
                                <input
                                    type="checkbox"
                                    id="col-tag"
                                    checked={selectedColumns.tag}
                                    onChange={(e) => handleColumnChange('tag', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                            <label htmlFor="col-tag" className="tw-text-sm tw-font-medium">Tag</label>
                            {isMobile && (
                                <input
                                    type="checkbox"
                                    checked={selectedColumns.tag}
                                    onChange={(e) => handleColumnChange('tag', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                        </div>
                        <div className={isMobile ? "tw-flex tw-items-center tw-justify-between" : "tw-flex tw-items-center tw-space-x-2"}>
                            {!isMobile && (
                                <input
                                    type="checkbox"
                                    id="col-volume"
                                    checked={selectedColumns.volume}
                                    onChange={(e) => handleColumnChange('volume', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                            <label htmlFor="col-volume" className="tw-text-sm tw-font-medium">Volume (L)</label>
                            {isMobile && (
                                <input
                                    type="checkbox"
                                    checked={selectedColumns.volume}
                                    onChange={(e) => handleColumnChange('volume', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                        </div>
                        <div className={isMobile ? "tw-flex tw-items-center tw-justify-between" : "tw-flex tw-items-center tw-space-x-2"}>
                            {!isMobile && (
                                <input
                                    type="checkbox"
                                    id="col-price"
                                    checked={selectedColumns.price}
                                    onChange={(e) => handleColumnChange('price', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                            <label htmlFor="col-price" className="tw-text-sm tw-font-medium">Price (KES)</label>
                            {isMobile && (
                                <input
                                    type="checkbox"
                                    checked={selectedColumns.price}
                                    onChange={(e) => handleColumnChange('price', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                        </div>
                        <div className={isMobile ? "tw-flex tw-items-center tw-justify-between" : "tw-flex tw-items-center tw-space-x-2"}>
                            {!isMobile && (
                                <input
                                    type="checkbox"
                                    id="col-amount"
                                    checked={selectedColumns.amount}
                                    onChange={(e) => handleColumnChange('amount', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                            <label htmlFor="col-amount" className="tw-text-sm tw-font-medium">Amount (KES)</label>
                            {isMobile && (
                                <input
                                    type="checkbox"
                                    checked={selectedColumns.amount}
                                    onChange={(e) => handleColumnChange('amount', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                        </div>
                        <div className={isMobile ? "tw-flex tw-items-center tw-justify-between" : "tw-flex tw-items-center tw-space-x-2"}>
                            {!isMobile && (
                                <input
                                    type="checkbox"
                                    id="col-dateTime"
                                    checked={selectedColumns.dateTime}
                                    onChange={(e) => handleColumnChange('dateTime', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                            <label htmlFor="col-dateTime" className="tw-text-sm tw-font-medium">Date/Time</label>
                            {isMobile && (
                                <input
                                    type="checkbox"
                                    checked={selectedColumns.dateTime}
                                    onChange={(e) => handleColumnChange('dateTime', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                        </div>
                        <div className={isMobile ? "tw-flex tw-items-center tw-justify-between" : "tw-flex tw-items-center tw-space-x-2"}>
                            {!isMobile && (
                                <input
                                    type="checkbox"
                                    id="col-status"
                                    checked={selectedColumns.hasBeenProcessed}
                                    onChange={(e) => handleColumnChange('hasBeenProcessed', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                            <label htmlFor="col-status" className="tw-text-sm tw-font-medium">Status</label>
                            {isMobile && (
                                <input
                                    type="checkbox"
                                    checked={selectedColumns.hasBeenProcessed}
                                    onChange={(e) => handleColumnChange('hasBeenProcessed', e.target.checked)}
                                    className="tw-rounded tw-border-gray-300"
                                />
                            )}
                        </div>
                    </div>

                    <div className={isMobile ? "tw-grid tw-grid-cols-2 tw-gap-2 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200" : "tw-flex tw-justify-between tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200"}>
                        <Button
                            text="Select All"
                            type="normal"
                            onClick={() => {
                                const allSelected = {
                                    ptsId: true,
                                    vehicleName: true,
                                    tankName: true,
                                    pump: true,
                                    nozzle: true,
                                    tag: true,
                                    volume: true,
                                    price: true,
                                    amount: true,
                                    dateTime: true,
                                    hasBeenProcessed: true
                                };
                                setSelectedColumns(allSelected);
                            }}
                            className={isMobile ? "tw-col-span-2" : ""}
                        />
                        {!isMobile && <div className="tw-flex-1"></div>}
                        <Button
                            text="Cancel"
                            type="normal"
                            onClick={() => setColumnSelectionVisible(false)}
                        />
                        <Button
                            text="Generate PDF"
                            type="default"
                            onClick={generatePDFWithColumns}
                        />
                    </div>
                </ScrollView>
            </Popup>
        </Popup>
    );
};

export default PumpTransactionPopup;
