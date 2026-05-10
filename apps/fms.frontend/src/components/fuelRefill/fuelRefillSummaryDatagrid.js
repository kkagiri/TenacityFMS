import React, { useEffect,useState,useCallback  } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {fetchRefillSummary} from '../../redux/actions/refillSummaryActions';
import DataGrid, { FilterRow,Column,SearchPanel, Summary,GroupItem, TotalItem , GroupPanel,HeaderFilter, Grouping,Toolbar, Item as TBItem} from 'devextreme-react/data-grid';
import CheckBox from 'devextreme-react/check-box';
import NumberBox from 'devextreme-react/number-box';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import saveAs from 'file-saver';
import './fuelRefillSummaryDatagrid.css';

import Button from 'devextreme-react/button';

const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
};

const FuelRefillSummaryDatagrid = ({ selectedEndDate, selectedSite }) => {
    const dispatch = useDispatch();
    const RfdataGridRef = React.useRef(null);
    const refillSummary = useSelector(state => state.refillSummary.refillSummary);
    const [autoExpandAll, setAutoExpandAll] = useState(false);

    const [localSummary, setLocalSummary] = useState([]);
    const [summaryType, setSummaryType] = useState('thisMonth');
    const [daysCount, setDaysCount] = useState(30);

    const handleAutoExpandChange = (e) => {
        setAutoExpandAll(e.value);
    };


    useEffect(() => {
        const fetchData = async () => {
            let startDate, endDate = new Date(selectedEndDate);

            if (summaryType === 'thisMonth') {
                startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            } else {
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - daysCount);
            }

            const formattedStartDate = formatDateForAPI(startDate);
            const formattedEndDate = formatDateForAPI(endDate);

            await dispatch(fetchRefillSummary(formattedStartDate, formattedEndDate, selectedSite));
        };

        fetchData();
    }, [dispatch, selectedEndDate, summaryType, daysCount, selectedSite]);

    useEffect(() => {
        if (refillSummary) {
            setLocalSummary(refillSummary);
        }
    }, [refillSummary]);

    const handleSummaryTypeChange = (e) => {
        setSummaryType(e.value ? 'thisMonth' : 'lastXDays');
    };

    const handleDaysCountChange = (e) => {
        setDaysCount(e.value);
    };
    const onExporting = useCallback((e) => {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Fuel Refill Summary');
        exportDataGrid({
            component: RfdataGridRef.current.instance,
            worksheet: worksheet,
            autoFilterEnabled: true
        }).then(() => {
            workbook.xlsx.writeBuffer().then((buffer) => {
                saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'FuelRefillSummary.xlsx');
            });
        });
        e.cancel = true;
    }, []);

    return (
        <div style={{  }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', marginTop:'20px'}}>
                <CheckBox
                    text="This Month"
                    value={summaryType === 'thisMonth'}
                    onValueChanged={handleSummaryTypeChange}
                />
                <CheckBox
                    text="Last X Days"
                    value={summaryType === 'lastXDays'}
                    onValueChanged={(e) => handleSummaryTypeChange({ value: !e.value })}
                    style={{ marginLeft: '20px' }}
                />
                {summaryType === 'lastXDays' && (
                    <NumberBox
                        value={daysCount}
                        min={1}
                        max={365}
                        showSpinButtons={true}
                        onValueChanged={handleDaysCountChange}
                        style={{ marginLeft: '10px', width: '80px' }}
                    />
                )}
            </div>

        <DataGrid
        ref={RfdataGridRef}

                dataSource={localSummary}
                showBorders={true}
                columnAutoWidth={true}
                showColumnLines={true}
                showRowLines={true}
                allowColumnResizing={true}
                showColumnHeaders={true}
            >
                <FilterRow visible={true} />
                <HeaderFilter visible={true} />
                <GroupPanel visible={true} />
                <SearchPanel visible={true} />

                <Grouping autoExpandAll={autoExpandAll} />
                <Toolbar>
                    <TBItem
                        widget="dxButton"
                        options={{
                            icon: 'exportxlsx',
                            text: 'Export to Excel',
                            onClick: onExporting
                        }}
                    />
                </Toolbar>
                <Column dataField="vehicleName" caption="Tenacy No" />
                <Column dataField="vehicleType" caption="Vehicle Type" groupIndex={1} />
                <Column dataField="siteName" caption="Site Name" groupIndex={0} />
                <Column dataField="refillCount" sortOrder="asc" alignment='center'   allowGrouping={false} caption="Refill Count" dataType="number" />
                <Column dataField="totalRefillAmount" alignment='center' allowGrouping={false} caption="Total Volume liters" dataType="number" format="#,##0" />

        <Summary>
          <TotalItem
            column="refillCount"
            summaryType="sum"

          />
          <TotalItem
            column="totalRefillAmount"
            summaryType="sum"
            valueFormat="#,##0"
            displayFormat="Total liters :{0}"

          />
            <GroupItem
                        column="totalRefillAmount"
                        summaryType="sum"
                        valueFormat="#,##0"
                        alignByColumn={true}
                        showInGroupFooter={false}
                         displayFormat="{0}"
                    />
                     <GroupItem
                        column="refillCount"
                        summaryType="sum"
                        alignByColumn={true}
                        showInGroupFooter={false}
                        displayFormat="{0}"

                    />
        </Summary>
      </DataGrid>

      <div className="options">
                <div className="caption">Options</div>
                <div className="option">
                    <CheckBox
                        text="Expand All Groups"
                        value={autoExpandAll}
                        onValueChanged={handleAutoExpandChange}
                    />
                </div>
            </div>
      </div>
    );
}

export default FuelRefillSummaryDatagrid;
