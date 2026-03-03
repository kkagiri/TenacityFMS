/**
 * File:          TankTreeList.js
 * Purpose:       DevExtreme TreeList showing sites as parents and tanks as children.
 *                M365-compatible — flat chrome, no gradient headers.
 * Dependencies:  devextreme-react/tree-list
 * Last Modified: 2026-02-26
 *
 * Props:
 * - dataSource  (array):   Tree rows from useTankData.treeData
 * - onSelect    (func):    Called with selected row data (or null)
 * - loading     (bool):    Show loading indicator
 */
import React, { useCallback } from "react";
import TreeList, {
  Column,
  Selection,
  SearchPanel,
  HeaderFilter,
} from "devextreme-react/tree-list";

/* ── cell renderers ── */
const nameRender = (cellData) => {
  const { data } = cellData;
  const showTankIcon = data.type === "tank";
  const icon =
    data.tankData?.tankType === "MobileTanker"
      ? "fa-light fa-truck-moving"
      : "fa-light fa-gas-pump";
  const iconColor =
    data.tankData?.tankType === "MobileTanker"
      ? "var(--m365-warning, #d67a00)"
      : "var(--m365-success, #107c10)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: showTankIcon ? 8 : 4 }}>
      {showTankIcon && <i className={icon} style={{ color: iconColor, fontSize: 13 }} />}
      <span style={{ fontWeight: 500 }}>{data.name}</span>
      {data.type === "tank" && data.tankData?.tankType === "MobileTanker" && (
        <span className="m365-badge m365-badge--warning" style={{ fontSize: 11 }}>
          Mobile
        </span>
      )}
    </div>
  );
};

const volumeRender = (cellData) => {
  const { data } = cellData;
  if (data.type !== "tank" || !data.volume) return null;
  return (
    <span style={{ fontSize: 13, color: "var(--m365-text-secondary, #605e5c)" }}>
      {data.volume.toLocaleString()} L
    </span>
  );
};

const stockRender = (cellData) => {
  const { data } = cellData;
  if (data.type !== "tank" || data.currentStock === undefined) return null;
  const pct = data.volume > 0 ? ((data.currentStock / data.volume) * 100).toFixed(1) : 0;
  return (
    <div style={{ fontSize: 13 }}>
      <span style={{ color: "var(--m365-text-secondary, #605e5c)" }}>
        {data.currentStock.toLocaleString()} L
      </span>
      <span style={{ fontSize: 11, color: "var(--m365-text-tertiary, #a19f9d)", marginLeft: 4 }}>
        ({pct}%)
      </span>
    </div>
  );
};

const TankTreeList = ({ dataSource, onSelect, loading }) => {
  const handleSelection = useCallback(
    (e) => {
      const row = e.selectedRowsData?.[0] || null;
      onSelect(row);
    },
    [onSelect]
  );

  return (
    <div className="m365-tank-tree">
      <TreeList
        dataSource={dataSource}
        keyExpr="id"
        parentIdExpr="parentId"
        showBorders={false}
        showRowLines={true}
        columnAutoWidth={false}
        wordWrapEnabled={true}
        onSelectionChanged={handleSelection}
        height="100%"
        noDataText={loading ? "Loading…" : "No tanks found"}
      >
        <SearchPanel visible={true} placeholder="Search tanks…" />
        <HeaderFilter visible={false} />
        <Selection mode="single" />
        <Column dataField="name" caption="Name" cellRender={nameRender} width="60%" />
        <Column
          dataField="volume"
          caption="Capacity"
          cellRender={volumeRender}
          width="20%"
          alignment="right"
        />
        <Column
          dataField="currentStock"
          caption="Stock"
          cellRender={stockRender}
          width="20%"
          alignment="right"
        />
      </TreeList>
    </div>
  );
};

export default TankTreeList;
