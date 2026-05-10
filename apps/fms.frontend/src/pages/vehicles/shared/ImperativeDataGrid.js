/**
 * ImperativeDataGrid - A wrapper that manages DevExtreme DataGrid imperatively
 * to avoid React reconciliation conflicts during sorting operations.
 *
 * This component creates the DataGrid using vanilla DevExtreme API and only
 * updates it when data changes, never allowing React to dispose/recreate it.
 */

import React, { useEffect, useRef } from 'react';
import DataGrid from 'devextreme/ui/data_grid';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';

const ImperativeDataGrid = ({
  data,
  onRowClick,
  selectedRowKeys,
  onSelectionChanged,
  columns
}) => {
  const containerRef = useRef(null);
  const gridInstanceRef = useRef(null);
  const dataSourceRef = useRef(null);

  // Initialize DataGrid imperatively on mount
  useEffect(() => {
    if (!containerRef.current || gridInstanceRef.current) return;

    console.log('🚀 Creating DataGrid imperatively');

    // Create DataSource
    dataSourceRef.current = new DataSource({
      store: new ArrayStore({
        key: 'rowKey',
        data: data || []
      }),
      reshapeOnPush: true
    });

    // Create DataGrid instance
    gridInstanceRef.current = new DataGrid(containerRef.current, {
      dataSource: dataSourceRef.current,
      keyExpr: 'rowKey',
      showBorders: true,
      showRowLines: true,
      showColumnLines: true,
      allowColumnReordering: true,
      allowColumnResizing: true,
      columnAutoWidth: true,
      repaintChangesOnly: true,
      renderAsync: true,
      twoWayBindingEnabled: false,
      remoteOperations: false,
      height: 500,
      noDataText: 'No consumption data available',
      selection: {
        mode: 'multiple',
        showCheckBoxesMode: 'always',
        selectAllMode: 'allPages'
      },
      export: {
        enabled: true,
        fileName: 'vehicle-consumption-history'
      },
      pager: {
        visible: true,
        showPageSizeSelector: true,
        allowedPageSizes: [10, 25, 50, 100, 200],
        showInfo: true,
        showNavigationButtons: true
      },
      paging: {
        pageSize: 50
      },
      filterRow: {
        visible: true
      },
      searchPanel: {
        visible: true,
        width: 240,
        placeholder: 'Search...'
      },
      columns: columns || [],
      onRowClick: (e) => {
        if (onRowClick) onRowClick(e);
      },
      onSelectionChanged: (e) => {
        if (onSelectionChanged) onSelectionChanged(e);
      },
      onCellPrepared: (e) => {
        // Handle custom cell rendering for color coding
        if (e.rowType === 'data') {
          if (e.column.dataField === 'fuelLost' && e.value > 0) {
            e.cellElement.classList.add('tw-text-red-600', 'tw-font-semibold');
          }
          if (e.column.dataField === 'excessFuel' && e.value > 0) {
            e.cellElement.classList.add('tw-text-green-600', 'tw-font-semibold');
          }
        }
      },
      onContentReady: (e) => {
        console.log('📊 Imperative DataGrid content ready', {
          rowCount: e.component.totalCount()
        });
      },
      onDisposing: () => {
        console.log('❌ Imperative DataGrid disposing - THIS SHOULD NOT HAPPEN');
      }
    });

    // Cleanup on unmount ONLY
    return () => {
      console.log('🗑️ Cleaning up imperative DataGrid');
      if (gridInstanceRef.current) {
        gridInstanceRef.current.dispose();
        gridInstanceRef.current = null;
      }
      if (dataSourceRef.current) {
        dataSourceRef.current.dispose();
        dataSourceRef.current = null;
      }
    };
  }, []); // Empty deps - only run once on mount

  // Update data when it changes
  useEffect(() => {
    if (!gridInstanceRef.current || !dataSourceRef.current) {
      console.log('⚠️ Grid not ready for data update');
      return;
    }

    console.log('🔄 Updating DataGrid data', {
      length: data?.length || 0,
      firstRow: data?.[0]?.date,
      lastRow: data?.[data.length - 1]?.date
    });

    // Update the store data
    const store = dataSourceRef.current.store();
    store._array = data || []; // Direct internal update

    // Reload the DataGrid
    dataSourceRef.current.reload().then(() => {
      console.log('✅ DataGrid reloaded successfully');
    });
  }, [data]);

  // Update selected keys when they change
  useEffect(() => {
    if (!gridInstanceRef.current) return;

    const currentSelection = gridInstanceRef.current.getSelectedRowKeys();
    const newSelection = selectedRowKeys || [];

    // Only update if selection actually changed
    if (JSON.stringify(currentSelection) !== JSON.stringify(newSelection)) {
      gridInstanceRef.current.selectRows(newSelection, false);
    }
  }, [selectedRowKeys]);

  return (
    <div
      ref={containerRef}
      className="dx-viewport"
      style={{ width: '100%', minHeight: '500px' }}
    />
  );
};

export default React.memo(ImperativeDataGrid, (prevProps, nextProps) => {
  // Only re-render if data reference changes
  const shouldNotUpdate = prevProps.data === nextProps.data &&
         prevProps.selectedRowKeys === nextProps.selectedRowKeys;

  console.log('🔍 ImperativeDataGrid memo check:', {
    prevDataLength: prevProps.data?.length,
    nextDataLength: nextProps.data?.length,
    dataRefEqual: prevProps.data === nextProps.data,
    selectedKeysEqual: prevProps.selectedRowKeys === nextProps.selectedRowKeys,
    shouldNotUpdate
  });

  return shouldNotUpdate;
});
