/**
 * File: DashboardIssueGrid.js
 * Purpose: Fluent-style Issue Lists card with tab buttons + DevExtreme DataGrid
 * Dependencies: DevExtreme DataGrid
 * Last Modified: 2026-02-23
 *
 * Key Components:
 * - DashboardIssueGrid: tab-switched DataGrid matching Fluent design
 */
import React from 'react';
import {
    DataGrid,
    Column,
    Paging,
    Pager,
    FilterRow,
    HeaderFilter,
    Sorting,
    Scrolling,
    Selection,
    Summary,
    TotalItem,
} from 'devextreme-react/data-grid';

/* ─────────────────────────────────────────
   Priority badge
───────────────────────────────────────── */
const PriorityBadge = ({ value }) => {
    const map = {
        Critical: 'fms-badge fms-badge--red',
        High: 'fms-badge fms-badge--orange',
        Medium: 'fms-badge fms-badge--yellow',
        Low: 'fms-badge fms-badge--green',
    };
    return <span className={map[value] || 'fms-badge fms-badge--gray'}>{value || 'N/A'}</span>;
};

/* ─────────────────────────────────────────
   Status badge
───────────────────────────────────────── */
const StatusBadge = ({ value }) => {
    const map = {
        Open: 'fms-badge fms-badge--blue',
        'In Progress': 'fms-badge fms-badge--yellow',
        Resolved: 'fms-badge fms-badge--green',
        Closed: 'fms-badge fms-badge--gray',
        Completed: 'fms-badge fms-badge--green',
    };
    return <span className={map[value] || 'fms-badge fms-badge--gray'}>{value || 'N/A'}</span>;
};

/* ─────────────────────────────────────────
   Main component
───────────────────────────────────────── */
const DashboardIssueGrid = ({
    selectedTab,
    setSelectedTab,
    tabConfig,
    getTabDataSource,
    navigate,
}) => {
    const renderPriority = (cell) => <PriorityBadge value={cell.value} />;
    const renderStatus = (cell) => <StatusBadge value={cell.value} />;

    const handleRowClick = (e) => {
        if (e.data?.id) {
            navigate(`/issue-tracker/details/${e.data.id}`);
        }
    };

    return (
        <div className="fms-card tw-mt-1">
            {/* Tab bar header */}
            <div className="fms-card__hd fms-card__hd--with-tabs">
                <span className="fms-card__title">
                    <i className="fa-light fa-list-ul"></i>
                    Issue Lists
                </span>
                <div className="fms-tab-btn-group">
                    {tabConfig.map((tab) => (
                        <button
                            key={tab.id}
                            className={`fms-tab-btn ${selectedTab === tab.id ? 'fms-tab-btn--active' : ''}`}
                            onClick={() => setSelectedTab(tab.id)}
                        >
                            <i className={tab.icon}></i>
                            {tab.label}
                            <span className="fms-tab-btn__cnt">{tab.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* DataGrid */}
            <DataGrid
                dataSource={getTabDataSource()}
                keyExpr="id"
                showBorders={false}
                showColumnLines={true}
                showRowLines={true}
                allowColumnResizing={true}
                columnAutoWidth={true}
                rowAlternationEnabled={true}
                height={380}
                onRowClick={handleRowClick}
            >
                <FilterRow visible={true} />
                <HeaderFilter visible={true} />
                <Sorting mode="multiple" />
                <Scrolling mode="virtual" />
                <Selection mode="multiple" />
                <Paging enabled={true} defaultPageSize={20} />
                <Pager
                    visible={true}
                    allowedPageSizes={[10, 20, 50]}
                    displayMode="full"
                    showPageSizeSelector={true}
                    showInfo={true}
                    showNavigationButtons={true}
                />

                <Column dataField="id" caption="ID" width={70} defaultSortOrder="desc" />
                <Column dataField="problemTitle" caption="Title" minWidth={200} />
                <Column
                    dataField="priorityName"
                    caption="Priority"
                    width={100}
                    cellRender={renderPriority}
                />
                <Column
                    dataField="statusName"
                    caption="Status"
                    width={120}
                    cellRender={renderStatus}
                />
                <Column dataField="categoryName" caption="Category" width={130} />
                <Column
                    dataField="vehicleNumber"
                    caption="Vehicle"
                    width={110}
                    visible={selectedTab === 'assigned' || selectedTab === 'closed'}
                />
                <Column
                    dataField="siteName"
                    caption="Site"
                    width={140}
                    visible={selectedTab === 'assigned'}
                />
                <Column
                    dataField="assignToUserName"
                    caption="Assigned To"
                    width={140}
                    visible={selectedTab === 'opened'}
                />
                <Column
                    dataField="openbyUserName"
                    caption="Opened By"
                    width={140}
                    visible={selectedTab === 'closed'}
                />
                <Column
                    dataField="openDate"
                    caption="Opened"
                    width={100}
                    dataType="date"
                    format="shortDate"
                />
                <Column
                    dataField="dueDate"
                    caption="Due Date"
                    width={100}
                    dataType="date"
                    format="shortDate"
                    visible={selectedTab === 'assigned'}
                />
                <Column
                    dataField="closingDate"
                    caption="Closed"
                    width={100}
                    dataType="date"
                    format="shortDate"
                    visible={selectedTab === 'opened' || selectedTab === 'closed'}
                />

                <Summary>
                    <TotalItem column="id" summaryType="count" displayFormat="Total: {0}" />
                </Summary>
            </DataGrid>
        </div>
    );
};

export default DashboardIssueGrid;
