/**
 * File: ReportListPage.js
 * Purpose: Displays a searchable, filterable DataGrid of all available report
 *          sources. Each row provides Run, Schedule, and View Details actions.
 * Dependencies: React, DevExtreme DataGrid, report source registry
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - ReportListPage: Full-page grid view of registered report sources
 */

import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataGrid, {
    Column,
    Paging,
    Pager,
    SearchPanel,
    FilterRow,
    Grouping,
    GroupPanel,
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { getAllReportSources } from './sources';
import { reportsRoutes } from './utils/navigationHelper';

const ReportListPage = () => {
    const navigate = useNavigate();

    const reports = useMemo(() => {
        const sources = getAllReportSources();
        return sources.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description || '',
            category: s.category || 'General',
            icon: s.icon || 'fa-light fa-file-chart-column',
            parameterCount: Array.isArray(s.parameters) ? s.parameters.length : 0,
            formats: (s.supportedFormats || []).join(', ').toUpperCase(),
        }));
    }, []);

    const renderIcon = useCallback((cellInfo) => {
        return (
            <div className="tw-flex tw-items-center tw-gap-2">
                <i className={`${cellInfo.data.icon} tw-text-blue-500`}></i>
                <span className="tw-font-medium">{cellInfo.data.name}</span>
            </div>
        );
    }, []);

    const renderFormats = useCallback((cellInfo) => {
        const fmts = cellInfo.data.formats;
        if (!fmts) return <span className="tw-text-gray-400">—</span>;
        return (
            <div className="tw-flex tw-gap-1 tw-flex-wrap">
                {fmts.split(', ').map((fmt) => (
                    <span
                        key={fmt}
                        className="tw-px-1.5 tw-py-0.5 tw-bg-gray-100 tw-text-gray-600 tw-rounded tw-text-[10px] tw-font-medium"
                    >
                        {fmt}
                    </span>
                ))}
            </div>
        );
    }, []);

    const renderActions = useCallback(
        (cellInfo) => {
            const sourceId = cellInfo.data.id;
            return (
                <div className="tw-flex tw-gap-1">
                    <Button
                        icon="fa-light fa-play"
                        hint="Run Report"
                        stylingMode="text"
                        onClick={() => navigate(reportsRoutes.engineSource(sourceId))}
                    />
                    <Button
                        icon="fa-light fa-calendar-plus"
                        hint="Schedule Report"
                        stylingMode="text"
                        onClick={() =>
                            navigate(`${reportsRoutes.scheduling}?source=${encodeURIComponent(sourceId)}`)
                        }
                    />
                </div>
            );
        },
        [navigate]
    );

    return (
        <div className="report-list-page">
            {/* Header */}
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
                <div>
                    <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-m-0">
                        <i className="fa-light fa-list tw-mr-2 tw-text-blue-600"></i>
                        Available Reports
                    </h2>
                    <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                        Browse all registered report sources — run, schedule, or view details
                    </p>
                </div>
                <div className="tw-flex tw-gap-2">
                    <Button
                        icon="fa-light fa-th-large"
                        text="Gallery View"
                        stylingMode="outlined"
                        onClick={() => navigate(reportsRoutes.gallery)}
                    />
                </div>
            </div>

            {/* Grid */}
            <DataGrid
                dataSource={reports}
                showBorders={true}
                columnAutoWidth={true}
                rowAlternationEnabled={true}
                keyExpr="id"
                wordWrapEnabled={true}
                onRowDblClick={(e) => navigate(reportsRoutes.engineSource(e.data.id))}
            >
                <SearchPanel visible={true} width={280} placeholder="Search reports..." />
                <FilterRow visible={true} />
                <GroupPanel visible={true} />
                <Grouping autoExpandAll={true} />
                <Paging defaultPageSize={20} />
                <Pager
                    showPageSizeSelector={true}
                    allowedPageSizes={[10, 20, 50]}
                    showInfo={true}
                />

                <Column
                    dataField="name"
                    caption="Report"
                    minWidth={250}
                    cellRender={renderIcon}
                />
                <Column dataField="category" caption="Category" width={160} groupIndex={0} />
                <Column dataField="description" caption="Description" minWidth={200} />
                <Column
                    dataField="parameterCount"
                    caption="Params"
                    width={80}
                    alignment="center"
                />
                <Column
                    dataField="formats"
                    caption="Formats"
                    width={160}
                    cellRender={renderFormats}
                    allowFiltering={false}
                />
                <Column
                    caption="Actions"
                    width={100}
                    cellRender={renderActions}
                    alignment="center"
                    allowSorting={false}
                    allowFiltering={false}
                />
            </DataGrid>
        </div>
    );
};

export default ReportListPage;
