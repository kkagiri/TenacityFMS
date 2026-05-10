/**
 * File: ReportListPage.js
 * Purpose: Unified reports page — toggle between list (DataGrid) and tile views.
 *          Both views use getAllReportSources() as the single source of truth.
 * Dependencies: React, DevExtreme DataGrid, report source registry
 * Last Modified: 2026-03-04
 *
 * Key Components:
 * - ReportListPage: Full-page grid/tile view of all registered report sources
 */

import React, { useMemo, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { filterReportSourcesByPermission, getAllReportSources } from './sources';
import { usePermissions } from '../../hooks/usePermissions';
import { reportsRoutes } from './utils/navigationHelper';
import './ReportListPage.scss';

const CATEGORY_COLORS = {
    'Fuel Management': { bg: '#2563eb', light: '#dbeafe' },
    'Device Management': { bg: '#7c3aed', light: '#ede9fe' },
    'Tank Management': { bg: '#0891b2', light: '#cffafe' },
    'Fleet': { bg: '#059669', light: '#d1fae5' },
    'Financial': { bg: '#d97706', light: '#fef3c7' },
};
const DEFAULT_COLOR = { bg: '#3b82f6', light: '#dbeafe' };

const getCategoryColor = (category) =>
    CATEGORY_COLORS[category] || DEFAULT_COLOR;

const ReportListPage = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const canManageReportSchedules = hasPermission('_Manage_ReportSchedules');
    const [searchParams] = useSearchParams();
    const initialView = searchParams.get('view') === 'gallery' ? 'gallery' : 'list';
    const [viewMode, setViewMode] = useState(initialView);
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const allSources = useMemo(
        () => filterReportSourcesByPermission(getAllReportSources(), hasPermission),
        [hasPermission]
    );
    const categories = useMemo(
        () => [
            { name: 'All', icon: 'fa-light fa-list' },
            ...Array.from(
                new Map(
                    allSources.map((source) => [
                        source.category,
                        {
                            name: source.category,
                            icon: source.categoryIcon || 'fa-light fa-folder',
                        },
                    ])
                ).values()
            ),
        ],
        [allSources]
    );

    const reports = useMemo(() => allSources.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        category: s.category || 'General',
        icon: s.icon || 'fa-light fa-file-chart-column',
        parameterCount: Array.isArray(s.parameters) ? s.parameters.length : 0,
        formats: s.supportedFormats || [],
        formatsStr: (s.supportedFormats || []).join(', ').toUpperCase(),
    })), [allSources]);

    const filtered = useMemo(() => reports.filter((r) => {
        const matchesCat = selectedCategory === 'All' || r.category === selectedCategory;
        const q = searchText.toLowerCase();
        const matchesSearch = !q ||
            r.name.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q);
        return matchesCat && matchesSearch;
    }), [reports, searchText, selectedCategory]);

    const goToEngine = useCallback(
        (sourceId) => navigate(reportsRoutes.engineSource(sourceId)),
        [navigate]
    );

    // ── DataGrid cell renderers ────────────────────────────
    const renderIcon = useCallback((cellInfo) => (
        <div className="tw-flex tw-items-center tw-gap-2">
            <i className={`${cellInfo.data.icon} report-list-page__source-icon tw-text-blue-500`} />
            <span className="tw-font-medium">{cellInfo.data.name}</span>
        </div>
    ), []);

    const renderFormats = useCallback((cellInfo) => {
        if (!cellInfo.data.formats?.length)
            return <span style={{ color: 'var(--fms-text-secondary)' }}>—</span>;
        return (
            <div className="tw-flex tw-gap-1 tw-flex-wrap">
                {cellInfo.data.formats.map((fmt) => (
                    <span key={fmt} className="format-badge tw-px-1.5 tw-py-0.5 tw-rounded tw-text-[10px] tw-font-medium tw-border">
                        {fmt.toUpperCase()}
                    </span>
                ))}
            </div>
        );
    }, []);

    const renderActions = useCallback((cellInfo) => (
        <div className="tw-flex tw-gap-1">
            <Button
                icon="fa-light fa-play"
                hint="Run Report"
                stylingMode="text"
                onClick={() => goToEngine(cellInfo.data.id)}
            />
            {canManageReportSchedules && (
                <Button
                    icon="fa-light fa-calendar-plus"
                    hint="Schedule Report"
                    stylingMode="text"
                    onClick={() => navigate(`${reportsRoutes.scheduling}?source=${encodeURIComponent(cellInfo.data.id)}`)}
                />
            )}
        </div>
    ), [canManageReportSchedules, navigate, goToEngine]);

    // ── Tile renderer ─────────────────────────────────────
    const renderTile = (report) => {
        const color = getCategoryColor(report.category);
        return (
            <div
                key={report.id}
                className="report-tile"
                onClick={() => goToEngine(report.id)}
            >
                <div className="report-tile__header">
                    <span
                        className="report-tile__icon-wrap"
                        style={{ color: color.bg, background: `${color.bg}22` }}
                    >
                        <i className={`${report.icon} report-list-page__tile-icon`} />
                    </span>
                    {report.formats[0] && (
                        <span className="format-badge">{report.formats[0]}</span>
                    )}
                </div>
                <div className="report-tile__body">
                    <h3 className="report-tile__name">{report.name}</h3>
                    <p className="report-tile__desc">{report.description}</p>
                    <div className="report-tile__footer">
                        <span className="report-tile__category">
                            <i className="fa-light fa-folder" />
                            {report.category}
                        </span>
                        <button
                            className="report-tile__open"
                            onClick={(e) => { e.stopPropagation(); goToEngine(report.id); }}
                        >
                            Open
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="report-list-page">
            {/* ── Header ── */}
            <div className="report-list-header tw-rounded-lg tw-border tw-p-5 tw-mb-4" style={{ background: 'var(--fms-surface)', borderColor: 'var(--fms-border)' }}>
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-4 tw-mb-4">
                    <div>
                        <h2 className="tw-text-xl tw-font-semibold tw-m-0 tw-flex tw-items-center tw-gap-2" style={{ color: 'var(--fms-text-primary)' }}>
                            <i className="fa-light fa-list tw-text-blue-500" />
                            Available Reports
                        </h2>
                        <p className="tw-text-sm tw-mt-1" style={{ color: 'var(--fms-text-secondary)' }}>
                            Browse all registered report sources — run, schedule, or view details
                        </p>
                    </div>
                    <div className="view-toggle">
                        <button
                            className={`view-toggle__btn${viewMode === 'list' ? ' is-active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <i className="fa-light fa-list" />
                            <span>List</span>
                        </button>
                        <button
                            className={`view-toggle__btn${viewMode === 'gallery' ? ' is-active' : ''}`}
                            onClick={() => setViewMode('gallery')}
                            title="Gallery View"
                        >
                            <i className="fa-light fa-grid-2" />
                            <span>Tiles</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="tw-flex tw-flex-wrap tw-gap-3 tw-items-center">
                    {/* Search */}
                    <div className="tw-relative tw-flex-1" style={{ minWidth: 200, maxWidth: 360 }}>
                        <i className="fa-light fa-search tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-sm" style={{ color: 'var(--fms-text-secondary)' }} />
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Search reports..."
                            className="tw-w-full tw-pl-8 tw-pr-3 tw-py-1.5 tw-rounded tw-border tw-text-sm tw-outline-none"
                            style={{ background: 'var(--fms-surface-secondary)', borderColor: 'var(--fms-border)', color: 'var(--fms-text-primary)' }}
                        />
                    </div>

                    {/* Category chips */}
                    <div className="tw-flex tw-flex-wrap tw-gap-1.5">
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setSelectedCategory(cat.name)}
                                className="tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-border tw-transition-colors"
                                style={
                                    selectedCategory === cat.name
                                        ? { background: '#3b82f6', color: '#fff', borderColor: '#3b82f6' }
                                        : { background: 'transparent', color: 'var(--fms-text-secondary)', borderColor: 'var(--fms-border)' }
                                }
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <span className="tw-text-xs tw-ml-auto" style={{ color: 'var(--fms-text-secondary)' }}>
                        {filtered.length} report{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* ── List View (DataGrid) ── */}
            {viewMode === 'list' && (
                <DataGrid
                    dataSource={filtered}
                    showBorders={true}
                    columnAutoWidth={true}
                    rowAlternationEnabled={false}
                    keyExpr="id"
                    wordWrapEnabled={true}
                    onRowDblClick={(e) => goToEngine(e.data.id)}
                >
                    <SearchPanel visible={false} />
                    <FilterRow visible={true} />
                    <GroupPanel visible={true} />
                    <Grouping autoExpandAll={true} />
                    <Paging defaultPageSize={20} />
                    <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 50]} showInfo={true} />

                    <Column dataField="name" caption="Report" minWidth={200} cellRender={renderIcon} />
                    <Column dataField="category" caption="Category" width={180} groupIndex={0} />
                    <Column dataField="description" caption="Description" minWidth={200} />
                    <Column dataField="parameterCount" caption="Params" width={80} alignment="center" />
                    <Column dataField="formatsStr" caption="Formats" width={180} cellRender={renderFormats} allowFiltering={false} />
                    <Column caption="Actions" width={100} cellRender={renderActions} alignment="center" allowSorting={false} allowFiltering={false} />
                </DataGrid>
            )}

            {/* ── Gallery / Tile View ── */}
            {viewMode === 'gallery' && (
                filtered.length === 0 ? (
                    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-20" style={{ color: 'var(--fms-text-secondary)' }}>
                        <i className="fa-light fa-search tw-text-5xl tw-mb-4" />
                        <p className="tw-text-base">No reports match your filters</p>
                    </div>
                ) : (
                    <div className="tw-grid tw-gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                        {filtered.map(renderTile)}
                    </div>
                )
            )}
        </div>
    );
};

export default ReportListPage;
