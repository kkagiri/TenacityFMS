/**
 * File:          CustomerTransactionsPage.js
 * Purpose:       Read-only transaction list for Customer ViewMode users.
 * Dependencies:  React, DevExtreme DataGrid, tankVolumeHistoryService
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - CustomerTransactionsPage(): Loads recent tenant-scoped fuel transaction records.
 */

import React, { useEffect, useMemo, useState } from "react";
import DataGrid, {
    Column,
    FilterRow,
    HeaderFilter,
    Paging,
    SearchPanel,
} from "devextreme-react/data-grid";
import LoadPanel from "devextreme-react/load-panel";
import tankVolumeHistoryService from "../../services/tankVolumeHistoryService";

const getValue = (record, camelKey, pascalKey) => record?.[camelKey] ?? record?.[pascalKey] ?? null;

const CustomerTransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const loadTransactions = async () => {
            setLoading(true);
            setError(null);

            const result = await tankVolumeHistoryService.fetchRecentVehicleTransactions(null, 24 * 30);

            if (!isMounted) {
                return;
            }

            if (result.success) {
                setTransactions(result.data || []);
            } else {
                setError(result.error || "Unable to load transactions.");
            }

            setLoading(false);
        };

        loadTransactions();

        return () => {
            isMounted = false;
        };
    }, []);

    const rows = useMemo(
        () => transactions.map((record, index) => ({
            id: getValue(record, "id", "Id") ?? index,
            timestamp: getValue(record, "timestamp", "Timestamp") ?? getValue(record, "createdOn", "CreatedOn"),
            vehicleName: getValue(record, "vehicleName", "VehicleName") ?? getValue(record, "vehicle", "Vehicle"),
            tankName: getValue(record, "tankName", "TankName"),
            siteName: getValue(record, "siteName", "SiteName"),
            volume: getValue(record, "volumeChange", "VolumeChange") ?? getValue(record, "amount", "Amount"),
            recordedBy: getValue(record, "recordedBy", "RecordedBy"),
            reason: getValue(record, "changeReasonName", "ChangeReasonName") ?? getValue(record, "changeReason", "ChangeReason"),
        })),
        [transactions]
    );

    return (
        <div className="tw-flex tw-flex-col tw-gap-3 tw-p-4">
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <i className="fa-light fa-receipt m365-page-header__icon" />
                    <h2 className="m365-page-header__title">My Transactions</h2>
                </div>
            </div>

            {error && (
                <div className="m365-info-banner m365-info-banner--error">
                    <i className="fa-light fa-circle-exclamation m365-info-banner__icon" />
                    <span className="m365-info-banner__text">{error}</span>
                </div>
            )}

            <div className="tw-bg-white tw-border tw-border-[#edebe9] tw-rounded-lg tw-overflow-hidden">
                <LoadPanel visible={loading} showIndicator showPane text="Loading transactions..." />
                <DataGrid
                    dataSource={rows}
                    keyExpr="id"
                    showBorders={false}
                    rowAlternationEnabled={true}
                    columnAutoWidth={true}
                    allowColumnResizing={true}
                    noDataText="No transactions found"
                >
                    <SearchPanel visible={true} width={240} placeholder="Search transactions..." />
                    <FilterRow visible={true} />
                    <HeaderFilter visible={true} />
                    <Paging defaultPageSize={20} />
                    <Column dataField="timestamp" caption="Date" dataType="datetime" width={170} />
                    <Column dataField="vehicleName" caption="Vehicle" minWidth={160} />
                    <Column dataField="siteName" caption="Site" minWidth={140} />
                    <Column dataField="tankName" caption="Tank" minWidth={140} />
                    <Column dataField="volume" caption="Volume" dataType="number" format={{ type: "fixedPoint", precision: 2 }} width={120} />
                    <Column dataField="reason" caption="Type" width={150} />
                    <Column dataField="recordedBy" caption="Recorded By" minWidth={150} />
                </DataGrid>
            </div>
        </div>
    );
};

export default CustomerTransactionsPage;