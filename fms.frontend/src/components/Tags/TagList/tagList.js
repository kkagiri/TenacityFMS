import React from "react";
import {
  DataGrid,
  Column,
  Paging,
  Pager,
  FilterRow,
  Selection,
  Editing,
  Lookup,
  SearchPanel,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";
import { useSelector } from "react-redux";
import "./tagList.scss";

const TagList = ({ tags, onTagSelect, onEditTag }) => {
  const vehicles = useSelector((state) => state.vehicle.vehicles || []);
  const ruleSets = useSelector((state) => state.fuelingRule.ruleSets || []);

  const getVehicleName = (vehicleId) => {
    if (!vehicleId) return "None";
    const vehicle = vehicles.find((v) => v.vehicleId === vehicleId);
    return vehicle
      ? `${vehicle.numberPlate || "No plate"} (${vehicle.hyoungNo || "No ID"})`
      : "None";
  };

  const getRuleSetName = (ruleSetId) => {
    if (!ruleSetId) return "None";
    const ruleSet = ruleSets.find((r) => r.id === ruleSetId);
    return ruleSet ? ruleSet.name : "Unknown";
  };

  const onRowClick = (e) => {
    if (e && e.data) {
      onTagSelect(e.data);
    }
  };

  const renderEditButton = (cellData) => {
    if (!cellData || !cellData.data) return null;

    return (
      <Button
        icon="fa-light fa-edit"
        onClick={() => onEditTag(cellData.data)}
        stylingMode="text"
      />
    );
  };

  const renderRuleInfo = (cellData) => {
    if (!cellData || !cellData.data) return null;

    const ruleSetId = cellData.data.fuelRuleSetId;
    if (!ruleSetId) return <span className="no-rule">No rule assigned</span>;

    const ruleSet = ruleSets.find((r) => r.id === ruleSetId);
    if (!ruleSet) return <span className="unknown-rule">Unknown rule</span>;

    return (
      <div className="rule-info">
        <span className="rule-name">{ruleSet.name}</span>
        {ruleSet.description && (
          <span className="rule-description">{ruleSet.description}</span>
        )}
      </div>
    );
  };

  const renderVehicleInfo = (cellData) => {
    if (!cellData || !cellData.data) return null;

    return <span>{getVehicleName(cellData.data.vehicleId)}</span>;
  };

  return (
    <div className="tag-list-container">
      <DataGrid
        dataSource={tags || []}
        keyExpr="id"
        showBorders={true}
        onRowClick={onRowClick}
        columnAutoWidth={true}
        hoverStateEnabled={true}
        noDataText="No tags available"
      >
        <SearchPanel visible={true} width={240} placeholder="Search tags..." />
        <FilterRow visible={true} />
        <Selection mode="single" />
        <Paging defaultPageSize={10} />
        <Pager
          showPageSizeSelector={true}
          allowedPageSizes={[5, 10, 20, 50]}
          showInfo={true}
        />

        <Column type="buttons" width={60} cellRender={renderEditButton} />
        <Column dataField="name" caption="Tag ID" />
        <Column dataField="isEnabled" caption="Enabled" dataType="boolean" />
        <Column
          dataField="vehicleId"
          caption="Vehicle"
          cellRender={renderVehicleInfo}
        >
          <Lookup
            dataSource={vehicles}
            displayExpr="numberPlate"
            valueExpr="vehicleId"
          />
        </Column>
        <Column
          dataField="fuelRuleSetId"
          caption="Fueling Rule"
          cellRender={renderRuleInfo}
        >
          <Lookup dataSource={ruleSets} displayExpr="name" valueExpr="id" />
        </Column>
      </DataGrid>
    </div>
  );
};

export default TagList;
