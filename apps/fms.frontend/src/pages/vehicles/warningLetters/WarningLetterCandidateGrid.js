/**
 * File:          WarningLetterCandidateGrid.js
 * Purpose:       Renders warning letter candidates in a searchable grid for step 2 of the warning letter wizard.
 * Dependencies:  React, DevExtreme DataGrid
 * Last Modified: 2026-04-14
 *
 * Key Functions:
 * - WarningLetterCandidateGrid(): shows candidates with search, metric columns, and select actions.
 */
import React from "react";
import DataGrid, {
    Column,
    FilterRow,
    HeaderFilter,
    Pager,
    Paging,
    SearchPanel,
} from "devextreme-react/data-grid";

const getCandidateId = (candidate = {}) =>
    candidate?.consumptionId ?? candidate?.ConsumptionId ?? `${candidate?.vehicleId ?? candidate?.VehicleId ?? "vehicle"}-${candidate?.metricDate ?? candidate?.MetricDate ?? "date"}`;

const getCandidateMetricDate = (candidate = {}) =>
    candidate?.metricDate ?? candidate?.MetricDate ?? null;

const getExistingLetterDate = (candidate = {}) =>
    candidate?.existingLetterDate ?? candidate?.ExistingLetterDate ?? null;

const hasExistingLetter = (candidate = {}) =>
    Boolean(candidate?.hasExistingLetter ?? candidate?.HasExistingLetter ?? false);

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatMetricValue = (value, unit) => {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return "-";
    }

    return `${numericValue.toFixed(2)} ${unit}`;
};

const WarningLetterCandidateGrid = ({
    candidates,
    metricLabels,
    onSelectCandidate,
}) => {
    const renderStatus = ({ data }) => {
        if (!hasExistingLetter(data)) {
            return <span className="warning-letter-candidate-grid__status warning-letter-candidate-grid__status--available">Available</span>;
        }

        const existingLetterDate = getExistingLetterDate(data);
        const label = existingLetterDate
            ? `Already issued on ${formatDate(existingLetterDate)}`
            : "Already issued";

        return <span className="warning-letter-candidate-grid__status warning-letter-candidate-grid__status--blocked">{label}</span>;
    };

    const renderViolationDate = ({ data }) => formatDate(getCandidateMetricDate(data));

    const renderActualValue = ({ data }) => formatMetricValue(data?.actualValue ?? data?.ActualValue, metricLabels.actualUnit);

    const renderExcessValue = ({ data }) => formatMetricValue(data?.excessValue ?? data?.ExcessValue, metricLabels.excessUnit);

    const renderSummary = ({ data }) => (
        <div className="warning-letter-candidate-grid__summary" title={data?.violationSummary || data?.ViolationSummary || ""}>
            {data?.violationSummary || data?.ViolationSummary || "-"}
        </div>
    );

    const renderAction = ({ data }) => {
        const blocked = hasExistingLetter(data);

        return (
            <button
                type="button"
                className="m365-btn m365-btn--primary warning-letter-candidate-grid__select-button"
                disabled={blocked}
                onClick={(event) => {
                    event.stopPropagation();
                    if (!blocked) {
                        onSelectCandidate(data);
                    }
                }}
            >
                {blocked ? "Issued" : "Select"}
            </button>
        );
    };

    return (
        <div className="warning-letter-candidate-grid">
            <DataGrid
                dataSource={candidates}
                keyExpr={getCandidateId}
                showBorders={false}
                rowAlternationEnabled={true}
                hoverStateEnabled={true}
                columnAutoWidth={true}
                allowColumnResizing={true}
                noDataText="No warning letter candidates found"
                onRowClick={(event) => {
                    if (!hasExistingLetter(event.data)) {
                        onSelectCandidate(event.data);
                    }
                }}
            >
                <SearchPanel visible={true} width={280} placeholder="Search candidates" />
                <HeaderFilter visible={true} />
                <FilterRow visible={true} />
                <Paging defaultPageSize={10} />
                <Pager
                    visible={true}
                    showNavigationButtons={true}
                    showPageSizeSelector={true}
                    allowedPageSizes={[10, 20, 50]}
                    displayMode="compact"
                />
                <Column caption="Status" width={180} allowSorting={false} allowFiltering={false} cellRender={renderStatus} />
                <Column dataField="vehicleCode" caption="Vehicle" minWidth={120} />
                <Column dataField="numberPlate" caption="Number Plate" minWidth={120} />
                <Column dataField="employeeName" caption="Employee" minWidth={180} />
                <Column caption="Violated Date" width={130} cellRender={renderViolationDate} sortOrder="desc" />
                <Column caption={metricLabels.actualLabel} minWidth={150} alignment="right" cellRender={renderActualValue} />
                <Column caption={metricLabels.excessLabel} minWidth={140} alignment="right" cellRender={renderExcessValue} />
                <Column dataField="siteName" caption="Site" minWidth={140} />
                <Column caption="Action" width={110} allowSorting={false} allowFiltering={false} cellRender={renderAction} />
            </DataGrid>
        </div>
    );
};

export default WarningLetterCandidateGrid;