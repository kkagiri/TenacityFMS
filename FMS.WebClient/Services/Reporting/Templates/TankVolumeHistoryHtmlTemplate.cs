/**
 * File: TankVolumeHistoryHtmlTemplate.cs
 * Purpose: Handlebars/HTML template for the Tank Volume History report.
 *          Extracted from JsReportHtmlTemplates.cs for maintainability.
 * Dependencies: None
 * Last Modified: 2026-02-02
 *
 * Key Sections:
 * - Company bar with embedded logo
 * - Report header with date range badge
 * - Summary cards with sparkline trends (5-day)
 * - Tank summary per site (opening/closing/expected/variance)
 * - Transaction detail table with site dividers and group headers
 * - Footer with generation metadata
 */
namespace FMS.WebClient.Services.Reporting
{
    /// <summary>
    /// Tank Volume History report template  a self-contained Handlebars/HTML document
    /// with sparklines, tank summaries, and transaction detail tables.
    /// </summary>
    internal static class TankVolumeHistoryHtmlTemplate
    {
        public static string Get() => @"<!DOCTYPE html>
<html>
<head>
    <meta charset=""UTF-8"">
    <title>{{reportTitle}} - Hyoung FMS System</title>
    <link href=""https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800;900&display=swap"" rel=""stylesheet"">
    <script src=""https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js""></script>
    <style>
        :root {
            --primary:       #0078D4;
            --primary-dark:  #005A9E;
            --primary-light: #EBF4FC;
            --surface:       #FFFFFF;
            --bg:            #F3F4F6;
            --border:        #E5E7EB;
            --text-strong:   #111827;
            --text-body:     #374151;
            --text-muted:    #6B7280;
            --dark-header:   #1F2937;
            --success:       #107C10;
            --danger:        #DC3545;
            --warning:       #D97706;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Nunito Sans', 'Segoe UI', Arial, sans-serif;
            background: var(--bg);
            color: var(--text-body);
            font-size: 12px;
            line-height: 1.5;
        }
        .page { max-width: 1200px; margin: 0 auto; padding: 28px 32px 48px; }

        /* â”€â”€ Column widths for 10-column transaction table â”€â”€ */
        .data-table th:nth-child(1),
        .data-table td:nth-child(1) { width: 3%; }        /* # */
        .data-table th:nth-child(2),
        .data-table td:nth-child(2) { width: 11%; }       /* Timestamp */
        .data-table th:nth-child(3),
        .data-table td:nth-child(3) { width: 10%; }       /* Site */
        .data-table th:nth-child(4),
        .data-table td:nth-child(4) { width: 10%; }       /* Tank */
        .data-table th:nth-child(5),
        .data-table td:nth-child(5) { width: 10%; }       /* Vehicle */
        .data-table th:nth-child(6),
        .data-table td:nth-child(6) { width: 11%; }       /* Type */
        .data-table th:nth-child(7),
        .data-table td:nth-child(7) { width: 10%; }       /* Vol. Change */
        .data-table th:nth-child(8),
        .data-table td:nth-child(8) { width: 10%; }       /* Balance After */
        .data-table th:nth-child(9),
        .data-table td:nth-child(9) { width: 10%; }       /* Operator */
        .data-table th:nth-child(10),
        .data-table td:nth-child(10) { width: 15%; min-width: 100px; }  /* Notes */

        /* â”€â”€ Company Bar â”€â”€ */
        .company-bar {
            background: #1F2937;
            margin: -28px -32px 0;
            padding: 14px 32px 16px;
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 30px;
        }
        .company-bar-left { display: flex; align-items: center; gap: 14px; min-height: 40px; }
        .company-logo { height: 40px; width: auto; object-fit: contain; filter: brightness(0) invert(1); }
        .company-bar-titles { display: flex; flex-direction: column; gap: 1px; }
        .company-main-title { font-size: 15px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.3px; }
        .company-sub-title  { font-size: 10.5px; color: #9CA3AF; font-weight: 500; }
        .company-bar-right  { font-size: 10.5px; color: #6B7280; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; }

        /* â”€â”€ Report Header â”€â”€ */
        .report-header {
            display: flex; justify-content: space-between; align-items: flex-end;
            padding-top: 4px; padding-bottom: 18px; margin-bottom: 24px;
            border-bottom: 2px solid var(--border);
        }
        .report-title h1 { font-size: 20px; font-weight: 800; color: var(--text-strong); letter-spacing: -0.3px; }
        .report-title p  { color: var(--text-muted); font-size: 11.5px; margin-top: 2px; }
        .report-meta     { text-align: right; font-size: 11px; color: var(--text-muted); }
        .badge-period {
            display: inline-block;
            background: var(--primary-light); color: var(--primary-dark);
            font-weight: 700; font-size: 10.5px;
            padding: 3px 10px; border-radius: 20px; margin-top: 6px;
        }

        /* â”€â”€ Summary Cards â”€â”€ */
        .summary-section { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
        .summary-card {
            background: var(--surface); border: 1px solid var(--border);
            border-radius: 8px; padding: 18px 20px 16px;
            position: relative; overflow: hidden;
        }
        .summary-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--primary); }
        .summary-card.alt::before    { background: var(--dark-header); }
        .summary-card.accent::before { background: var(--primary-dark); }
        .summary-card.danger::before { background: var(--danger); }
        .card-icon { width: 26px; height: 26px; background: var(--primary-light); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .card-icon svg { fill: var(--primary); }
        .alt    .card-icon { background: #F1F3F5; }
        .alt    .card-icon svg { fill: var(--dark-header); }
        .accent .card-icon { background: #EBF4FC; }
        .accent .card-icon svg { fill: var(--primary-dark); }
        .danger .card-icon { background: #FEF2F2; }
        .danger .card-icon svg { fill: var(--danger); }
        .warning .card-icon { background: #FFFBEB; }
        .warning .card-icon svg { fill: var(--warning); }
        .card-value { font-size: 22px; font-weight: 800; color: var(--text-strong); letter-spacing: -0.5px; line-height: 1; margin-bottom: 4px; }
        .card-value.positive { color: var(--success); }
        .card-value.negative { color: var(--danger); }
        .card-label { font-size: 10px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Section Label */
        .section-label {
            display: flex; align-items: center; gap: 10px;
            margin-bottom: 14px; margin-top: 4px;
        }
        .section-label h2 {
            font-size: 13px; font-weight: 800; color: var(--text-strong);
            text-transform: uppercase; letter-spacing: 0.8px; white-space: nowrap;
        }
        .section-label::after {
            content: ''; flex: 1; height: 1px; background: var(--border);
        }

        /* Analytics Grid */
        .analytics-grid {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
        }
        .chart-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
        }
        .chart-card-header {
            padding: 12px 16px 10px;
            border-bottom: 1px solid var(--border);
            display: flex; align-items: center; justify-content: space-between;
        }
        .chart-card-title {
            font-size: 11.5px; font-weight: 800; color: var(--text-strong);
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .chart-card-sub {
            font-size: 10px; color: var(--text-muted); margin-top: 1px;
        }
        .chart-card-body {
            padding: 16px;
            position: relative;
        }

        /* KPI strip */
        .kpi-strip {
            display: grid; grid-template-columns: repeat(4, 1fr);
            gap: 0;
            border-top: 1px solid var(--border);
        }
        .kpi-item {
            padding: 10px 16px;
            border-right: 1px solid var(--border);
        }
        .kpi-item:last-child { border-right: none; }
        .kpi-label { font-size: 9px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .kpi-value { font-size: 15px; font-weight: 800; color: var(--text-strong); line-height: 1.2; margin-top: 2px; }
        .kpi-value.good  { color: var(--success); }
        .kpi-value.warn  { color: var(--warning); }
        .kpi-value.bad   { color: var(--danger); }
        .kpi-note { font-size: 9px; color: var(--text-muted); margin-top: 1px; }

        /* Page-break label */
        .page-break-label {
            margin: 32px -32px; padding: 0;
            border-top: 2px dashed var(--border);
            position: relative; text-align: center;
        }
        .page-break-label span {
            position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
            background: var(--bg); padding: 0 16px;
            font-size: 10px; color: #9CA3AF; font-weight: 700; letter-spacing: 1px;
            text-transform: uppercase; white-space: nowrap;
        }

        /* â”€â”€ Tank Summary â”€â”€ */
        .tank-summary-section {
            margin-bottom: 24px; background: var(--surface);
            border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
        }
        .tank-summary-header {
            display: flex; align-items: center; gap: 12px;
            padding: 8px 16px; border-bottom: 1px solid var(--border); background: #FAFAFA;
        }
        .tank-summary-title { font-size: 12px; font-weight: 800; color: var(--text-strong); }
        .tank-summary-sub   { font-size: 10.5px; color: var(--text-muted); }

        .tank-block { border-bottom: 1px solid var(--border); }
        .tank-block:last-child { border-bottom: none; }
        .tank-block:nth-child(even) { background: #FAFAFA; }

        .tank-row-identity {
            display: flex; align-items: center; gap: 8px;
            padding: 7px 16px; border-bottom: 1px solid var(--border);
        }
        .tank-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: var(--primary); }
        .tank-identity-name { font-size: 11px; font-weight: 800; color: var(--text-strong); white-space: nowrap; }
        .tank-fuel-type {
            font-size: 9px; font-weight: 700; color: var(--text-muted);
            background: var(--bg); border: 1px solid var(--border);
            padding: 1px 5px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.3px;
        }
        .tank-balance-inline {
            margin-left: auto; display: flex; align-items: center; gap: 6px;
            font-size: 10px; white-space: nowrap;
        }
        .bal-label { color: var(--text-muted); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
        .bal-value { font-weight: 700; color: var(--text-strong); font-size: 11px; }
        .bal-value.highlight { color: var(--primary); }
        .bal-value.expected  { color: var(--success); font-size: 11px; }
        .bal-value.expected.mismatch { color: var(--warning); }
        .bal-value.variance { font-weight: 800; font-size: 11px; }
        .bal-value.variance.loss { color: var(--danger); }
        .bal-value.variance.gain { color: var(--success); }
        .bal-sep { width: 1px; height: 14px; background: var(--border); display: inline-block; margin: 0 2px; vertical-align: middle; }

        .tank-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
        .tank-type-card {
            display: flex; align-items: center; gap: 10px;
            padding: 7px 16px; border-right: 1px solid var(--border);
        }
        .tank-type-card:last-child { border-right: none; }
        .ttc-value { font-size: 13px; font-weight: 800; color: var(--text-strong); line-height: 1; white-space: nowrap; flex-shrink: 0; }
        .ttc-meta  { display: flex; flex-direction: column; gap: 0; min-width: 0; }
        .ttc-label { font-size: 9.5px; font-weight: 700; color: var(--text-body); text-transform: uppercase; letter-spacing: 0.3px; }
        .ttc-sub   { font-size: 9px; color: var(--text-muted); font-style: italic; }
        .ttc-count { font-size: 9px; color: var(--text-muted); }
        .ttc-last2 {
            margin-top: 2px; display: flex; align-items: flex-end; gap: 4px;
            font-size: 8px;
        }
        .ttc-last2-day {
            display: flex; flex-direction: column; line-height: 1.1;
        }
        .ttc-last2-label { font-size: 7px; color: var(--text-muted); font-weight: 600; }
        .ttc-last2-value { font-size: 8px; color: var(--text-strong); font-weight: 800; }
        .ttc-last2-sep { color: var(--text-muted); font-size: 8px; font-weight: 700; }

        /* â”€â”€ Table â”€â”€ */
        .table-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
        .table-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border); }
        .table-toolbar-title { font-weight: 700; font-size: 13px; color: var(--text-strong); }
        .table-toolbar-count { font-size: 11px; color: var(--text-muted); background: var(--bg); padding: 3px 10px; border-radius: 20px; border: 1px solid var(--border); font-weight: 600; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .data-table thead th {
            background: var(--dark-header); color: #E5E7EB;
            padding: 10px 12px; text-align: left;
            font-weight: 700; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .data-table thead th.text-right  { text-align: right; }
        .data-table thead th.text-center { text-align: center; }
        .data-table tbody td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text-body); vertical-align: middle; }
        .data-table tbody tr:last-child td { border-bottom: none; }
        .data-table tbody tr:hover td { background: var(--primary-light); }
        .data-table tbody tr:nth-child(even) td { background: #FAFAFA; }
        .data-table tbody tr:nth-child(even):hover td { background: var(--primary-light); }
        .data-table tbody tr.group-row td {
            background: #F8FAFC; font-weight: 700; font-size: 11px;
            color: var(--text-strong); padding: 8px 12px; border-bottom: 1px solid var(--border);
        }
        .data-table tbody tr.group-row:hover td { background: #F0F4FA; }
        .data-table tbody tr.site-divider-row td {
            background: #1F2937; color: #E5E7EB;
            padding: 8px 14px; font-weight: 800; font-size: 10.5px;
            letter-spacing: 0.8px; text-transform: uppercase; border-bottom: none;
        }
        .data-table tbody tr.subtotal-row td {
            background: #FFF8E1; font-weight: 700; color: #92400E;
            border-top: 1px solid #FDE68A; border-bottom: 2px solid #FDE68A;
        }
        .data-table tfoot td { background: var(--dark-header); color: white; padding: 11px 12px; font-weight: 700; font-size: 11px; }
        .text-right  { text-align: right; }
        .text-center { text-align: center; }

        /* Cell styles */
        .cell-number    { font-size: 10px; color: var(--text-muted); font-weight: 600; }
        .cell-timestamp .date { font-weight: 600; color: var(--text-strong); display: block; }
        .cell-timestamp .time { font-size: 10px; color: var(--text-muted); }
        .cell-tank      { font-weight: 600; color: var(--text-strong); }
        .cell-plate {
            display: inline-block; background: var(--primary-light); color: var(--primary-dark);
            font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 3px; letter-spacing: 0.8px;
        }
        .cell-positive  { font-weight: 800; color: var(--success); font-size: 12px; }
        .cell-negative  { font-weight: 800; color: var(--danger);  font-size: 12px; }
        .cell-balance   { font-weight: 700; color: var(--text-strong); }
        .cell-muted     { color: var(--text-muted); font-size: 11px; }

        /* Type badges
           Maps to VolumeChangeReasonEnum:
           type-dispense  â†’ Dispensing, AutomatedDispensing
           type-refill    â†’ Delivery, InTankDelivery
           type-transfer  â†’ TransferIn, TransferOut
           type-adjust    â†’ Adjustment, Reconciliation, AutomatedReconciliation
        */
        .type-badge {
            display: inline-block; font-size: 9.5px; font-weight: 700;
            padding: 2px 8px; border-radius: 3px; letter-spacing: 0.3px; text-transform: uppercase;
        }
        .type-dispense { background: #FEF2F2; color: #991B1B; }
        .type-refill   { background: #F0FDF4; color: #166534; }
        .type-transfer { background: #EEF2FF; color: #3730A3; }
        .type-adjust   { background: #FFF7ED; color: #92400E; }

        /* Page Break */
        .page-break { margin: 40px -32px; border-top: 2px dashed #E5E7EB; position: relative; }
        .page-break span {
            position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
            background: var(--bg); padding: 0 16px;
            font-size: 10px; color: #9CA3AF; font-weight: 600; letter-spacing: 1px;
        }



        /* â”€â”€ Site Summary (inline in header) â”€â”€ */
        .site-avg-consumption {
            margin-left: auto;
            display: flex; align-items: baseline; gap: 4px;
            font-size: 10px;
        }
        .site-avg-label {
            color: var(--text-muted); font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.3px; font-size: 9px;
        }
        .site-avg-value {
            font-weight: 800; color: var(--text-strong); font-size: 12px;
        }
        .site-avg-unit {
            color: var(--text-muted); font-size: 9px; font-weight: 600;
        }


        /* Footer */
        .report-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 18px; border-top: 1px solid var(--border); font-size: 10.5px; color: var(--text-muted); margin-top: 8px; }
        .footer-brand  { display: flex; align-items: center; gap: 8px; }
        .footer-brand .dot { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; }
        .footer-brand strong { color: var(--text-body); font-weight: 700; }
        .footer-right  { display: flex; align-items: center; gap: 8px; }
        .footer-sep    { color: var(--border); }

        @media print {
            @page { size: A4 landscape; margin: 10mm; }
            body { background: white; }
            .page { max-width: none; padding: 0; }
            /* Hide in-body company bar */
            .company-bar { display: none !important; }
            .page-break-label { page-break-after: always; }
            .table-wrapper { page-break-before: auto; }
            .data-table { font-size: 10px; }
            .data-table thead th { padding: 6px 8px; font-size: 9.5px; }
            .data-table tbody td { padding: 6px 8px; }
            .data-table tbody tr:hover td { background: inherit; }
            .summary-section { grid-template-columns: repeat(5, 1fr); }
        }
    </style>
</head>
<body>
<div class=""page"">

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         COMPANY BAR (static â€” logo embedded)
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class=""company-bar"">
        <div class=""company-bar-left"">
            <img src=""data:image/png;base64,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"" alt=""H Young Logo"" class=""company-logo"">
            <div class=""company-bar-titles"">
                <span class=""company-main-title"">Hyoung Fleet Management</span>
                <span class=""company-sub-title"">Fleet Management &amp; Fueling Operations</span>
            </div>
        </div>
    </div>

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         REPORT HEADER
         {{reportTitle}}     e.g. ""Fuel Transaction Ledger""
         {{reportSubtitle}}  e.g. ""All Tanks â€” All Transaction Types""
         {{createdBy}}       e.g. ""John Kamau""
         {{dateFrom}}        e.g. ""01 Nov 2025""
         {{dateTo}}          e.g. ""24 Nov 2025""
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class=""report-header"">
        <div class=""report-title"">
            <h1>{{reportTitle}}</h1>
            <p>{{reportSubtitle}} &mdash; Created by: {{createdBy}}</p>
        </div>
        <div class=""report-meta"">
            <span class=""badge-period"">{{dateFrom}} &ndash; {{dateTo}}</span>
        </div>
    </div>

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         SUMMARY CARDS
         {{summary.totalTransactions}}
         {{summary.totalDispensed}}     (Dispensing + AutoDispense)
         {{summary.totalTransfer}}      (TransferIn + TransferOut)
         {{summary.totalDelivery}}      (Delivery + GPSRefill + InTankDelivery)
         {{summary.totalVariance.formatted}}  (Actual Closing âˆ’ Expected, per tank sum)
         {{summary.totalVariance.isNegative}} true if total variance is a loss
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class=""summary-section"">
        <div class=""summary-card accent"">
            <div class=""card-icon"">
                <svg width=""15"" height=""15"" viewBox=""0 0 24 24""><path d=""M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m0 16H5V5h14v14M17 8H7V6h10v2m0 4H7v-2h10v2m-4 4H7v-2h6v2z""/></svg>
            </div>
            <div class=""card-value"">{{summary.totalTransactions}}</div>
            <div class=""card-label"">Total Transactions</div>
        </div>
        <div class=""summary-card danger"">
            <div class=""card-icon"">
                <svg width=""15"" height=""15"" viewBox=""0 0 24 24""><path d=""M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A6.92 6.92 0 0 1 19 12c0 3.87-3.13 7-7 7A7 7 0 0 1 5 12c0-2.28 1.09-4.3 2.79-5.61L6.37 5C4.33 6.74 3 9.21 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.79-1.33-5.26-3.17-6.83z""/></svg>
            </div>
            <div class=""card-value negative"">-{{summary.totalDispensed}} L</div>
            <div class=""card-label"">Total Dispensed</div>
        </div>
        <div class=""summary-card alt"">
            <div class=""card-icon"">
                <svg width=""15"" height=""15"" viewBox=""0 0 24 24""><path d=""M17 8C8 10 5.9 16.17 3.82 21L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 4-2 8-2s4 2 8 2v-2c-4 0-4-2-8-2c-1.13 0-1.9.16-2.53.33C14.28 12.06 16 10 21 9l-4-1z""/></svg>
            </div>
            <div class=""card-value"">{{summary.totalTransfer}} L</div>
            <div class=""card-label"">Total Transfer</div>
        </div>
        <div class=""summary-card"">
            <div class=""card-icon"">
                <svg width=""15"" height=""15"" viewBox=""0 0 24 24""><path d=""M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-1 14H9V8h2v8m4 0h-2V8h2v8z""/></svg>
            </div>
            <div class=""card-value positive"">+{{summary.totalDelivery}} L</div>
            <div class=""card-label"">Total Delivery</div>
        </div>
        <div class=""summary-card {{#if summary.totalVariance.isNegative}}danger{{else}}warning{{/if}}"">
            <div class=""card-icon"">
                <svg width=""15"" height=""15"" viewBox=""0 0 24 24""><path d=""M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z""/></svg>
            </div>
            <div class=""card-value {{#if summary.totalVariance.isNegative}}negative{{/if}}"">{{summary.totalVariance.formatted}} L</div>
            <div class=""card-label"">Total Variance</div>
        </div>
    </div>

    <!-- Analytics Charts -->
    {{#if analytics}}
    <div class=""section-label""><h2>Performance Analytics</h2></div>
    <div class=""analytics-grid"">
        <!-- 7-Day Dispensing -->
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div class=""chart-card-title"">7-Day Dispensing Volume</div>
                <div class=""chart-card-sub"">Daily litres dispensed (bar) &amp; running average (line)</div>
            </div>
            <div class=""chart-card-body""><canvas id=""dailyDispensingChart""></canvas></div>
            <div class=""kpi-strip"">
                <div class=""kpi-item""><div class=""kpi-label"">7-Day Total</div><div class=""kpi-value"">{{analytics.kpis.sevenDayTotal}}</div></div>
                <div class=""kpi-item""><div class=""kpi-label"">Daily Average</div><div class=""kpi-value"">{{analytics.kpis.dailyAverage}}</div></div>
                <div class=""kpi-item""><div class=""kpi-label"">Peak Day</div><div class=""kpi-value"">{{analytics.kpis.peakDayLabel}}</div><div class=""kpi-note"">{{analytics.kpis.peakDayVolume}} L</div></div>
                <div class=""kpi-item""><div class=""kpi-label"">Lowest Day</div><div class=""kpi-value"">{{analytics.kpis.lowestDayLabel}}</div><div class=""kpi-note"">{{analytics.kpis.lowestDayVolume}} L</div></div>
            </div>
        </div>
        <!-- Vehicle Type -->
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div class=""chart-card-title"">Consumption by Vehicle Type</div>
                <div class=""chart-card-sub"">Dispensed litres grouped by vehicle classification</div>
            </div>
            <div class=""chart-card-body""><canvas id=""vehicleTypeChart""></canvas></div>
            <div class=""kpi-strip"">
                <div class=""kpi-item""><div class=""kpi-label"">Avg / Fill</div><div class=""kpi-value"">{{analytics.kpis.avgPerVehicleFill}} L</div></div>
                <div class=""kpi-item""><div class=""kpi-label"">Active Vehicles</div><div class=""kpi-value"">{{analytics.kpis.fleetActiveCount}}</div></div>
            </div>
        </div>
    </div>
    {{/if}}

    <div class=""page-break-label""><span>Page 1 &mdash; Summary &amp; Analytics</span></div>

    <div class=""section-label""><h2>Tank Balances &amp; Activity</h2></div>

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         TANK SUMMARY
         Per tank: {{#each tanks}}
           {{tankName}}          e.g. ""Tank A1""
           {{fuelType}}          e.g. ""Diesel""
           {{openingBalance}}    e.g. ""12,400""
           {{closingBalance}}    e.g. ""16,734""
           {{expectedClosing}}   e.g. ""16,819""
           {{expectedMatch}}     true/false
           {{variance.value}}       e.g. ""-140.97""
           {{variance.formatted}}   e.g. ""-140.97""
           {{variance.isNegative}}  true if loss/shortage
           {{variance.percentage}}  e.g. ""-6.2""
           Grouped activity:
           {{dispensing.total}}  Dispensing + AutomatedDispensing net
           {{dispensing.count}}
           {{delivery.total}}    Delivery + InTankDelivery net
           {{delivery.count}}
           {{transfer.total}}    TransferIn + TransferOut net
           {{transfer.count}}
         {{/each}}
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    {{#each siteGroups}}
    <div class=""tank-summary-section"">
        <div class=""tank-summary-header"">
            <span class=""tank-summary-title"">{{siteName}}</span>
            <span class=""tank-summary-sub"">Balance &amp; activity by tank &mdash; {{../dateFrom}} to {{../dateTo}}</span>
            {{#if siteSummary}}
            <div class=""site-avg-consumption"">
                <span class=""site-avg-label"">AVG DAILY CONSUMPTION</span>
                <span class=""site-avg-value"">{{siteSummary.avgDailyConsumption}}</span>
                <span class=""site-avg-unit"">L/day</span>
            </div>
            {{/if}}
        </div>

        {{#each tanks}}
        <div class=""tank-block"">
            <div class=""tank-row-identity"">
                <span class=""tank-dot""></span>
                <span class=""tank-identity-name"">{{tankName}}</span>
                <span class=""tank-fuel-type"">{{fuelType}}</span>
                <div class=""tank-balance-inline"">
                    <span class=""bal-label"">Opening</span>
                    <span class=""bal-value"">{{openingBalance}} L</span>
                    <span class=""bal-sep""></span>
                    <span class=""bal-label"">Closing</span>
                    <span class=""bal-value highlight"">{{closingBalance}} L</span>
                    <span class=""bal-sep""></span>
                    <span class=""bal-label"">Expected</span>
                    {{#unless expectedMatch}}<span class=""bal-value expected mismatch"">{{else}}<span class=""bal-value expected"">{{/unless}}
                        {{#if expectedMatch}}&#10003;{{else}}&#9651;{{/if}} {{expectedClosing}} L
                    </span>
                    <span class=""bal-sep""></span>
                    <span class=""bal-label"">Variance</span>
                    <span class=""bal-value variance {{#if variance.isNegative}}loss{{else}}gain{{/if}}"">{{variance.formatted}} L ({{variance.percentage}}%)</span>
                </div>
            </div>
            <div class=""tank-type-grid"">
                <div class=""tank-type-card"">
                    <div class=""ttc-value"">{{dispensing.total}} L</div>
                    <div class=""ttc-meta"">
                        <span class=""ttc-label"">Dispensing</span>
                        <span class=""ttc-sub"">Dispensing + Auto</span>
                        <span class=""ttc-count"">{{dispensing.count}} txn</span>
                        {{#if dispensing.last2Days}}
                        <div class=""ttc-last2"">
                            {{#each dispensing.last2Days}}
                            <div class=""ttc-last2-day"">
                                <span class=""ttc-last2-label"">{{label}}</span>
                                <span class=""ttc-last2-value"">{{formatted}} L</span>
                            </div>
                            {{#unless @last}}<span class=""ttc-last2-sep"">|</span>{{/unless}}
                            {{/each}}
                        </div>
                        {{/if}}
                    </div>
                </div>
                <div class=""tank-type-card"">
                    <div class=""ttc-value"">{{delivery.total}} L</div>
                    <div class=""ttc-meta"">
                        <span class=""ttc-label"">Delivery</span>
                        <span class=""ttc-sub"">Delivery + In-Tank</span>
                        <span class=""ttc-count"">{{delivery.count}} txn</span>
                    </div>
                </div>
                <div class=""tank-type-card"">
                    <div class=""ttc-value"">{{transfer.total}} L</div>
                    <div class=""ttc-meta"">
                        <span class=""ttc-label"">Transfer</span>
                        <span class=""ttc-sub"">In / Out</span>
                        <span class=""ttc-count"">{{transfer.count}} txn</span>
                    </div>
                </div>
            </div>
        </div>
        {{/each}}
    </div>
    {{/each}}

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         TRANSACTION TABLE
            Conditional section: transactions
            Per row (for each transaction):
           {{rowNumber}}           e.g. ""001""
           {{timestamp.date}}      e.g. ""24 Nov 2025""
           {{timestamp.time}}      e.g. ""07:02 AM""
           {{tankName}}            e.g. ""Tank A1""
           {{vehiclePlate}}        e.g. ""KDG 441X""  (or ""â€”"" for non-vehicle)
           {{changeReason}}        VolumeChangeReasonEnum value (see badge mapping below)
           {{changeReasonLabel}}   Display label e.g. ""Dispense"", ""Auto Dispense"", ""In-Tank Delivery""
           {{changeReasonClass}}   CSS class: type-dispense | type-refill | type-transfer | type-adjust
           {{volumeChange}}        e.g. ""-120.50"" (negative=dispensing, positive=delivery)
           {{balanceAfter}}        e.g. ""12,279.50""
           {{operatorName}}        e.g. ""James Mwangi"" or ""â€” (Auto)""
           {{notes}}               e.g. ""Supplier: KenolKobil""

         VolumeChangeReasonEnum â†’ badge class mapping:
           Dispensing             â†’ type-dispense  ""Dispense""
           AutomatedDispensing    â†’ type-dispense  ""Auto Dispense""
           Delivery               â†’ type-refill    ""Delivery""
           InTankDelivery         â†’ type-refill    ""In-Tank Delivery""
           TransferIn             â†’ type-transfer  ""Transfer In""
           TransferOut            â†’ type-transfer  ""Transfer Out""
           Adjustment             â†’ type-adjust    ""Adjustment""
           Reconciliation         â†’ type-adjust    ""Reconciliation""
           AutomatedReconciliationâ†’ type-adjust    ""Auto Reconciliation""
           OpeningStock           â†’ type-adjust    ""Opening Stock""
           ClosingStock           â†’ type-adjust    ""Closing Stock""
                 End row loop
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    {{#if siteGroups}}
    <div class=""table-wrapper"">
        <div class=""table-toolbar"">
            <span class=""table-toolbar-title"">Transaction Detail</span>
            <span class=""table-toolbar-count"">{{summary.totalTransactions}} records</span>
        </div>
        <table class=""data-table"">
            <thead>
                <tr>
                    <th class=""text-center"">#</th>
                    <th>Timestamp</th>
                    <th>Site</th>
                    <th>Tank</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th class=""text-right"">Vol. Change (L)</th>
                    <th class=""text-right"">Balance After (L)</th>
                    <th>Operator</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                {{#each siteGroups}}
                <!-- Site divider -->
                <tr class=""site-divider-row"">
                    <td colspan=""10"">&#9660;&nbsp; {{siteName}}</td>
                </tr>
                {{#each transactionGroups}}
                <!-- Group header -->
                <tr class=""group-row"">
                    <td colspan=""10"">&#9658;&nbsp; {{groupName}} &mdash; {{fuelType}}
                        &nbsp;<span style=""font-weight:400;color:var(--text-muted);font-size:10px;"">| Opening Balance: {{openingBalance}} L</span>
                    </td>
                </tr>
                {{#each rows}}
                <tr>
                    <td class=""text-center cell-number"">{{rowNumber}}</td>
                    <td>
                        <div class=""cell-timestamp"">
                            <span class=""date"">{{timestamp.date}}</span>
                            <span class=""time"">{{timestamp.time}}</span>
                        </div>
                    </td>
                    <td class=""cell-muted"">{{siteName}}</td>
                    <td class=""cell-tank"">{{tankName}}</td>
                    <td><span class=""cell-plate"">{{vehiclePlate}}</span></td>
                    <td><span class=""type-badge {{changeReasonClass}}"">{{changeReasonLabel}}</span></td>
                    {{#if isPositive}}<td class=""text-right cell-positive"">{{else}}<td class=""text-right cell-negative"">{{/if}}{{volumeChange}}</td>
                    <td class=""text-right cell-balance"">{{balanceAfter}}</td>
                    <td>{{operatorName}}</td>
                    <td class=""cell-muted"">{{notes}}</td>
                </tr>
                {{/each}}
                {{/each}}
                {{/each}}
            </tbody>
        </table>
    </div>
    {{else}}
    <div class=""table-wrapper"">
        <div style=""padding:60px 20px;text-align:center;color:var(--text-muted);"">
            <p>No transactions found for the selected criteria.</p>
        </div>
    </div>
    {{/if}}

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         PAGE BREAK â€” repeat table block below for page 2+
         Uncomment and duplicate for multi-page output.

    <div class=""page-break""><span>PAGE {{pageNumber}}</span></div>

    <div class=""table-wrapper"">
        <div class=""table-toolbar"">
            <span class=""table-toolbar-title"">Transaction Detail
                <span style=""color:var(--text-muted);font-weight:400;font-size:11px;"">continued</span>
            </span>
            <span class=""table-toolbar-count"">Records {{pageStart}} â€“ {{pageEnd}} of {{summary.totalTransactions}}</span>
        </div>
        <table class=""data-table"">
            <thead> ... repeat headers ... </thead>
            <tbody> ... repeat rows ... </tbody>
            <tfoot>
                <tr>
                    <td colspan=""4"" class=""text-right"">PAGE {{pageNumber}} SUBTOTALS ({{pageCount}} transactions)</td>
                    <td></td>
                    <td class=""text-right"">{{pageNetChange}} L net</td>
                    <td class=""text-right"">â€”</td>
                    <td colspan=""2""></td>
                </tr>
            </tfoot>
        </table>
    </div>

    <div class=""report-footer""> ... repeat footer with Page X of Y ... </div>
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         FOOTER
         {{generatedAt}}   e.g. ""24 Nov 2025, 14:37:05""
         {{createdBy}}     e.g. ""John Kamau""
         {{currentPage}}   e.g. ""1""
         {{totalPages}}    e.g. ""2""
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class=""report-footer"">
        <div class=""footer-brand"">
            <div class=""dot""></div>
            <span><strong>H Young</strong> &mdash; Fleet Management &amp; Fueling Operations</span>
        </div>
        <div class=""footer-right"">
            <span>Generated: {{generatedAt}}</span>
            <span class=""footer-sep"">|</span>
            <span>Created by: {{createdBy}}</span>
            <span class=""footer-sep"">|</span>
            <span>Page {{currentPage}} of {{totalPages}}</span>
        </div>
    </div>

</div>

<script>
if (typeof Chart !== 'undefined') {
    var PRIMARY = '#0078D4', SUCCESS = '#107C10', DANGER = '#D13438', WARNING = '#FFB900', BORDER = '#F3F4F6';
    Chart.defaults.font.family = 'Nunito Sans, system-ui, sans-serif';
    Chart.defaults.font.size = 10;
    Chart.defaults.color = '#6B7280';

    var cd = {{{analyticsJson}}};

    // 1. 7-Day Dispensing (bar + line)
    if (cd.dailyDispensing && cd.dailyDispensing.labels.length > 0) {
        var ddTotal = cd.dailyDispensing.data.reduce(function(a,b){return a+b;},0);
        var ddAvg = ddTotal / cd.dailyDispensing.data.length;
        var ddAvgArr = cd.dailyDispensing.data.map(function(){return Math.round(ddAvg);});
        new Chart(document.getElementById('dailyDispensingChart'), {
            type: 'bar',
            data: {
                labels: cd.dailyDispensing.labels,
                datasets: [{
                    label: 'Dispensed',
                    data: cd.dailyDispensing.data,
                    backgroundColor: 'rgba(0,120,212,0.7)',
                    borderRadius: 4,
                    barPercentage: 0.6,
                    order: 2
                },{
                    label: 'Avg',
                    data: ddAvgArr,
                    type: 'line',
                    borderColor: DANGER,
                    borderWidth: 1.8,
                    borderDash: [5,3],
                    pointRadius: 0,
                    fill: false,
                    order: 1
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: {
                    callbacks: { label: function(ctx) { return ' ' + ctx.parsed.y.toLocaleString() + ' L'; } }
                }},
                scales: {
                    x: { grid: { display: false }, ticks: { maxRotation: 0 } },
                    y: { grid: { color: BORDER }, ticks: { callback: function(v) { return (v/1000).toFixed(1)+'k'; } } }
                }
            },
            plugins: [{
                id: 'barValues',
                afterDatasetsDraw: function(chart) {
                    var meta = chart.getDatasetMeta(0);
                    var ctx2 = chart.ctx;
                    meta.data.forEach(function(bar, i) {
                        var val = chart.data.datasets[0].data[i];
                        if (val > 0) {
                            ctx2.save();
                            ctx2.font = '700 8px Nunito Sans, sans-serif';
                            ctx2.fillStyle = '#374151';
                            ctx2.textAlign = 'center';
                            ctx2.textBaseline = 'bottom';
                            ctx2.fillText(val.toLocaleString(), bar.x, bar.y - 4);
                            ctx2.restore();
                        }
                    });
                }
            }]
        });
    }

    // 2. Vehicle Type Consumption
    if (cd.vehicleTypeConsumption && cd.vehicleTypeConsumption.labels.length > 0) {
        var vtColors = [PRIMARY, SUCCESS, WARNING, '#7C3AED', DANGER, '#0EA5E9', '#9CA3AF'];

        var vtPairs = cd.vehicleTypeConsumption.labels.map(function(label, index) {
            return {
                label: label,
                value: cd.vehicleTypeConsumption.data[index] || 0
            };
        });

        vtPairs.sort(function(a, b) { return b.value - a.value; });

        var vtTop = vtPairs.slice(0, 6);
        var vtOthersTotal = vtPairs.slice(6).reduce(function(sum, item) { return sum + item.value; }, 0);
        if (vtOthersTotal > 0) {
            vtTop.push({ label: 'Others', value: vtOthersTotal });
        }

        var vtLabels = vtTop.map(function(item) { return item.label; });
        var vtData = vtTop.map(function(item) { return item.value; });
        var vtTotal = vtData.reduce(function(sum, value) { return sum + value; }, 0);

        new Chart(document.getElementById('vehicleTypeChart'), {
            type: 'bar',
            data: {
                labels: vtLabels,
                datasets: [{
                    label: 'Litres Dispensed',
                    data: vtData,
                    backgroundColor: vtColors.slice(0, vtLabels.length),
                    borderRadius: 4,
                    barPercentage: 0.6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                var pct = vtTotal > 0 ? ((ctx.parsed.x / vtTotal) * 100).toFixed(1) : '0.0';
                                return ' ' + ctx.parsed.x.toLocaleString() + ' L  (' + pct + '%)';
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { color: BORDER }, ticks: { callback: function(v) { return (v/1000)+'k L'; } } },
                    y: { grid: { display: false }, ticks: { font: { size: 10, weight: '700' } } }
                }
            },
            plugins: [{
                id: 'pctLabels',
                afterDatasetsDraw: function(chart) {
                    var ctx2 = chart.ctx;
                    chart.data.datasets.forEach(function(dataset, di) {
                        chart.getDatasetMeta(di).data.forEach(function(bar, i) {
                            var val = dataset.data[i];
                            var pct = vtTotal > 0 ? ((val / vtTotal) * 100).toFixed(1) : '0.0';
                            ctx2.save();
                            ctx2.font = '700 9px Nunito Sans, sans-serif';
                            ctx2.fillStyle = '#6B7280';
                            ctx2.textAlign = 'left';
                            ctx2.textBaseline = 'middle';
                            ctx2.fillText(pct + '%', bar.x + 6, bar.y);
                            ctx2.restore();
                        });
                    });
                }
            }]
        });
    }
}
</script>
</body>
</html>";
    }
}
