import React from 'react';
import DataGrid, {
  Column,
  Paging,
  Scrolling,
  HeaderFilter,
  FilterRow,
  Export
} from 'devextreme-react/data-grid';

const ExcelPreviewGrid = ({ data }) => {
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  // Format number with thousand separators
  const formatNumber = (value) => {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="excel-preview-grid">
      <DataGrid
        dataSource={data}
        showBorders={true}
        showRowLines={true}
        showColumnLines={true}
        rowAlternationEnabled={true}
        hoverStateEnabled={true}
        columnAutoWidth={true}
        wordWrapEnabled={false}
        height={400}
      >
        <Scrolling mode="virtual" rowRenderingMode="virtual" />
        <Paging enabled={false} />
        <HeaderFilter visible={true} />
        <FilterRow visible={true} />
        <Export enabled={true} allowExportSelectedData={true} />

        <Column
          dataField="rowNumber"
          caption="#"
          width={60}
          alignment="center"
          allowFiltering={false}
        />

        <Column
          dataField="tankName"
          caption="Tank Name"
          width={120}
        />

        <Column
          dataField="date"
          caption="Date"
          dataType="date"
          width={120}
          customizeText={(cellInfo) => formatDate(cellInfo.value)}
        />

        <Column
          dataField="opening"
          caption="Opening"
          dataType="number"
          width={100}
          alignment="right"
          customizeText={(cellInfo) => formatNumber(cellInfo.value)}
        />

        <Column
          dataField="dispensing"
          caption="Dispensing"
          dataType="number"
          width={100}
          alignment="right"
          customizeText={(cellInfo) => formatNumber(cellInfo.value)}
        />

        <Column
          dataField="transferIn"
          caption="Transfer IN"
          dataType="number"
          width={110}
          alignment="right"
          customizeText={(cellInfo) => formatNumber(cellInfo.value)}
        />

        <Column
          dataField="transferOut"
          caption="Transfer OUT"
          dataType="number"
          width={110}
          alignment="right"
          customizeText={(cellInfo) => formatNumber(cellInfo.value)}
        />

        <Column
          dataField="delivery"
          caption="Delivery"
          dataType="number"
          width={100}
          alignment="right"
          customizeText={(cellInfo) => formatNumber(cellInfo.value)}
        />

        <Column
          dataField="closing"
          caption="Closing"
          dataType="number"
          width={100}
          alignment="right"
          customizeText={(cellInfo) => formatNumber(cellInfo.value)}
        />

        <Column
          dataField="openingMeter"
          caption="Opening Meter"
          dataType="number"
          width={130}
          alignment="right"
          customizeText={(cellInfo) => formatNumber(cellInfo.value)}
        />

        <Column
          dataField="closingMeter"
          caption="Closing Meter"
          dataType="number"
          width={130}
          alignment="right"
          customizeText={(cellInfo) => formatNumber(cellInfo.value)}
        />

        <Column
          dataField="notes"
          caption="Notes"
          width={200}
        />
      </DataGrid>
    </div>
  );
};

export default ExcelPreviewGrid;
