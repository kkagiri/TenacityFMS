/**
 * File: JsReportHtmlTemplates.cs
 * Purpose: Default Handlebars/HTML report templates embedded as static strings.
 * Dependencies: None
 * Last Modified: 2026-02-18
 *
 * Each public static method returns the full HTML template for one report type.
 * Templates use Handlebars syntax ({{field}}, {{#each}}, {{#if}}) compatible
 * with the jsreport Handlebars engine.
 */
namespace FMS.WebClient.Services.Reporting
{
    /// <summary>
    /// Provides default embedded HTML templates for each jsreport report type.
    /// All templates use Handlebars syntax and are written as A4 Chrome-PDF documents.
    /// </summary>
    internal static class JsReportHtmlTemplates
    {
        // â”€â”€â”€ Entry Points (called from JsReportTemplateManager) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        public static string PumpTransaction() => BuildGenericTemplate(
            "Pump Transaction Report", "#0078D4",
            PumpTransactionSummary(), PumpTransactionTable(),
            "No transactions found for the selected criteria.");
        public static string VehicleConsumption() => BuildGenericTemplate(
            "Vehicle Consumption Report", "#4776E6",
            VehicleConsumptionSummary(), VehicleConsumptionTable(),
            "No vehicle consumption data found for the selected criteria.");

        public static string FuelRefill() => BuildGenericTemplate(
            "Fuel Refill Report", "#11998e",
            FuelRefillSummary(), FuelRefillTable(),
            "No fuel refill records found for the selected criteria.");

        public static string FuelDelivery() => BuildGenericTemplate(
            "Fuel Delivery Report", "#ee0979",
            FuelDeliverySummary(), FuelDeliveryTable(),
            "No fuel delivery records found for the selected criteria.");

        public static string DeviceOffline() => BuildGenericTemplate(
            "Device Offline Report", "#dc3545",
            DeviceOfflineSummary(), DeviceOfflineTable(),
            "No offline events found for the selected criteria.");

        public static string PtsDeviceStatus() => BuildGenericTemplate(
            "PTS Device Status Report", "#6f42c1",
            PtsDeviceStatusSummary(), PtsDeviceStatusTable(),
            "No PTS device data found for the selected criteria.");

        public static string TankVolumeHistory() => TankVolumeHistoryHtmlTemplate.Get();

        public static string TransactionHistorySummary() => TransactionHistorySummaryHtmlTemplate.Get();

        public static string IssueTracker() => BuildGenericTemplate(
            "Issue Tracker Report", "#0ea5e9",
            IssueTrackerSummary(), IssueTrackerTable(),
            "No issue tracker data found for the selected criteria.");

        public static string ConsumptionByRefills() => BuildGenericTemplate(
            "Consumption by Refills Report", "#20c997",
            ConsumptionByRefillsSummary(), ConsumptionByRefillsTable(),
            "No consumption data found for the selected criteria.");

        // â”€â”€â”€ Generic Template Builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        private static string BuildGenericTemplate(string title, string color,
            string summarySection, string tableSection, string emptyMessage) => $@"<!DOCTYPE html>
<html>
<head>
    <title>{title}</title>
    <link href=""https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800&display=swap"" rel=""stylesheet""></link>
    <style>
        :root {{
            --primary:       {color};
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
            --danger:        #D13438;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: 'Nunito Sans', 'Segoe UI', Arial, sans-serif;
            background: var(--bg);
            color: var(--text-body);
            font-size: 12px;
            line-height: 1.5;
        }}
        .page {{ max-width: 1100px; margin: 0 auto; padding: 28px 32px 48px; }}

        .report-header {{ display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 18px; margin-bottom: 20px; }}
        .report-title h1 {{ font-size: 20px; font-weight: 800; color: var(--text-strong); letter-spacing: -0.3px; }}
        .report-title p {{ color: var(--text-muted); font-size: 11.5px; margin-top: 2px; }}
        .report-meta {{ text-align: right; font-size: 11px; color: var(--text-muted); }}
        .badge-period {{
            display: inline-block;
            background: var(--primary-light);
            color: var(--primary);
            font-weight: 700;
            font-size: 10.5px;
            padding: 3px 10px;
            border-radius: 20px;
            margin-top: 6px;
        }}

        .filter-summary {{
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 18px;
            font-size: 10.5px;
        }}
        .filter-summary h3 {{ margin: 0 0 8px 0; font-size: 12px; color: var(--text-strong); font-weight: 700; }}
        .filter-summary .filter-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 6px; }}
        .filter-summary .filter-item {{ display: flex; gap: 4px; min-width: 0; }}
        .filter-summary .filter-label {{ font-weight: 700; color: var(--text-body); text-transform: uppercase; font-size: 9px; letter-spacing: 0.3px; }}
        .filter-summary .filter-value {{ color: var(--text-muted); font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}

        .summary-section {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }}
        .summary-card {{
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 14px 16px 12px;
            position: relative;
            overflow: hidden;
            text-align: left;
        }}
        .summary-card::before {{ content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--primary); }}
        .summary-card.card-primary::before {{ background: var(--primary); }}
        .summary-card.card-success::before {{ background: var(--success); }}
        .summary-card.card-warning::before {{ background: var(--danger); }}
        .summary-card.card-info::before    {{ background: var(--dark-header); }}
        .summary-card .value {{ font-size: 22px; font-weight: 800; color: var(--text-strong); line-height: 1.1; margin-bottom: 4px; letter-spacing: -0.4px; }}
        .summary-card .label {{ font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }}

        .table-wrapper {{ background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 24px; }}
        .data-table {{ width: 100%; border-collapse: collapse; font-size: 11px; }}
        .data-table thead th {{
            background: var(--dark-header);
            color: #E5E7EB;
            padding: 10px 12px;
            text-align: left;
            font-weight: 700;
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .data-table tbody td {{ padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text-body); vertical-align: middle; }}
        .data-table tbody tr:last-child td {{ border-bottom: none; }}
        .data-table tbody tr:nth-child(even) td {{ background: #FAFAFA; }}
        .text-right {{ text-align: right; }}
        .text-center {{ text-align: center; }}
        .text-muted {{ color: var(--text-muted); }}
        .text-success {{ color: var(--success); }}
        .text-danger {{ color: var(--danger); }}
        .font-bold {{ font-weight: 700; }}

        .empty-state {{ background: var(--surface); border: 1px solid var(--border); border-radius: 8px; text-align: center; padding: 40px 20px; color: var(--text-muted); }}

        .report-footer {{ margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: var(--text-muted); }}
        .footer-brand {{ display: flex; align-items: center; gap: 8px; }}
        .footer-brand .dot {{ width: 8px; height: 8px; border-radius: 50%; background: var(--primary); }}
        .footer-brand strong {{ color: var(--text-body); }}

        @media print {{
            body {{ background: white; }}
            .page {{ padding: 0; }}
            .summary-section {{ grid-template-columns: repeat(4, 1fr); }}
        }}
    </style>
</head>
<body>
<div class=""page"">
    <div class=""report-header"">
        <div class=""report-title""><h1>{title}</h1><p>{{{{reportTitle}}}}</p></div>
        <div class=""report-meta"">
            <span class=""badge-period"">{{{{dateFrom}}}} &ndash; {{{{dateTo}}}}</span>
        </div>
    </div>
    <div class=""filter-summary"">
        <h3>Report Parameters</h3>
        <div class=""filter-grid"">
            {{{{#if dateFrom}}}}<div class=""filter-item""><span class=""filter-label"">From:</span><span class=""filter-value"">{{{{dateFrom}}}}</span></div>{{{{/if}}}}
            {{{{#if dateTo}}}}<div class=""filter-item""><span class=""filter-label"">To:</span><span class=""filter-value"">{{{{dateTo}}}}</span></div>{{{{/if}}}}
            {{{{#if startDate}}}}<div class=""filter-item""><span class=""filter-label"">Start:</span><span class=""filter-value"">{{{{startDate}}}}</span></div>{{{{/if}}}}
            {{{{#if endDate}}}}<div class=""filter-item""><span class=""filter-label"">End:</span><span class=""filter-value"">{{{{endDate}}}}</span></div>{{{{/if}}}}
            {{{{#if siteName}}}}<div class=""filter-item""><span class=""filter-label"">Site:</span><span class=""filter-value"">{{{{siteName}}}}</span></div>{{{{/if}}}}
            {{{{#if tankName}}}}<div class=""filter-item""><span class=""filter-label"">Tank:</span><span class=""filter-value"">{{{{tankName}}}}</span></div>{{{{/if}}}}
            {{{{#if status}}}}<div class=""filter-item""><span class=""filter-label"">Status:</span><span class=""filter-value"">{{{{status}}}}</span></div>{{{{/if}}}}
        </div>
    </div>
{summarySection}
    <div class=""table-wrapper"">
{tableSection}
    </div>
    {{{{#unless records}}}}{{{{#unless transactions}}}}{{{{#unless data}}}}
    <div class=""empty-state""><p>{emptyMessage}</p></div>
    {{{{/unless}}}}{{{{/unless}}}}{{{{/unless}}}}
    <div class=""report-footer"">
        <div class=""footer-brand""><span class=""dot""></span><span><strong>Hyoung Fleet Management</strong></span></div>
        <div>Report ID: {{{{reportId}}}}</div>
    </div>
</div>
</body>
</html>";

        // â”€â”€â”€ Pump Transaction (standalone template) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        private static string PumpTransactionTemplate() => @"<!DOCTYPE html>
<html>
<head>
    <title>{{reportTitle}} â€“ Hyoung FMS System</title>
    <link href=""https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800&display=swap"" rel=""stylesheet"">
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
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Nunito Sans', 'Segoe UI', Arial, sans-serif;
            background: var(--bg);
            color: var(--text-body);
            font-size: 12px;
            line-height: 1.5;
        }
        .page { max-width: 1100px; margin: 0 auto; padding: 28px 32px 48px; }

        /* Company Bar */
        .company-bar {
            background: #1F2937;
            margin: -28px -32px 0;
            padding: 12px 32px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .company-bar-left { display: flex; align-items: center; gap: 14px; }
        .company-logo { height: 40px; width: auto; object-fit: contain; filter: brightness(0) invert(1); }
        .company-bar-titles { display: flex; flex-direction: column; gap: 1px; }
        .company-main-title { font-size: 15px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.3px; }
        .company-sub-title { font-size: 10.5px; color: #9CA3AF; font-weight: 500; }
        .company-bar-right { font-size: 10.5px; color: #6B7280; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; }

        /* Header */
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-bottom: 18px;
            margin-bottom: 24px;
        }
        .report-title h1 { font-size: 20px; font-weight: 800; color: var(--text-strong); letter-spacing: -0.3px; }
        .report-title p { color: var(--text-muted); font-size: 11.5px; margin-top: 2px; }
        .report-meta { text-align: right; font-size: 11px; color: var(--text-muted); }
        .badge-period {
            display: inline-block;
            background: var(--primary-light);
            color: var(--primary-dark);
            font-weight: 700;
            font-size: 10.5px;
            padding: 3px 10px;
            border-radius: 20px;
            margin-top: 6px;
        }

        /* Summary Cards */
        .summary-section { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .summary-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 18px 20px 16px;
            position: relative;
            overflow: hidden;
        }
        .summary-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--primary); }
        .summary-card.alt::before { background: var(--dark-header); }
        .summary-card.accent::before { background: var(--primary-dark); }
        .card-icon { width: 28px; height: 28px; background: var(--primary-light); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .card-icon svg { fill: var(--primary); }
        .alt .card-icon { background: #F1F3F5; }
        .alt .card-icon svg { fill: var(--dark-header); }
        .accent .card-icon { background: #EBF4FC; }
        .accent .card-icon svg { fill: var(--primary-dark); }
        .card-value { font-size: 24px; font-weight: 800; color: var(--text-strong); letter-spacing: -0.5px; line-height: 1; margin-bottom: 4px; }
        .card-label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Table */
        .table-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
        .table-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border); }
        .table-toolbar-title { font-weight: 700; font-size: 13px; color: var(--text-strong); }
        .table-toolbar-count { font-size: 11px; color: var(--text-muted); background: var(--bg); padding: 3px 10px; border-radius: 20px; border: 1px solid var(--border); font-weight: 600; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .data-table thead th {
            background: var(--dark-header);
            color: #E5E7EB;
            padding: 10px 12px;
            text-align: left;
            font-weight: 700;
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }
        .data-table thead th.text-right { text-align: right; }
        .data-table thead th.text-center { text-align: center; }
        .data-table tbody td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text-body); vertical-align: middle; }
        .data-table tbody tr:last-child td { border-bottom: none; }
        .data-table tbody tr:hover td { background: var(--primary-light); }
        .data-table tbody tr:nth-child(even) td { background: #FAFAFA; }
        .data-table tbody tr:nth-child(even):hover td { background: var(--primary-light); }
        .data-table tfoot td { background: var(--dark-header); color: white; padding: 11px 12px; font-weight: 700; font-size: 11px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Cell Styles */
        .cell-number { font-size: 10px; color: var(--text-muted); font-weight: 600; }
        .cell-datetime .date { font-weight: 600; color: var(--text-strong); display: block; }
        .cell-datetime .time { font-size: 10px; color: var(--text-muted); }
        .cell-pump { font-weight: 600; color: var(--text-strong); }
        .pump-sub { font-size: 10px; color: var(--text-muted); }
        .cell-vehicle .plate {
            display: inline-block;
            background: var(--primary-light);
            color: var(--primary-dark);
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 3px;
            letter-spacing: 0.8px;
        }
        .cell-volume { font-weight: 800; color: var(--success); font-size: 12px; }
        .cell-amount { font-weight: 800; color: var(--text-strong); font-size: 12px; }
        .cell-odo { color: var(--text-muted); font-size: 11px; }
        .cell-consumption { color: var(--primary-dark); font-weight: 700; font-size: 11px; }

        /* Empty State */
        .empty-state { padding: 60px 20px; text-align: center; color: var(--text-muted); }

        /* Page Break */
        .page-break { margin: 40px -32px; border-top: 2px dashed #E5E7EB; position: relative; }
        .page-break span {
            position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
            background: var(--bg); padding: 0 16px;
            font-size: 10px; color: #9CA3AF; font-weight: 600; letter-spacing: 1px;
        }

        /* Footer */
        .report-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 18px; border-top: 1px solid var(--border); font-size: 10.5px; color: var(--text-muted); margin-top: 8px; }
        .footer-brand { display: flex; align-items: center; gap: 8px; }
        .footer-brand .dot { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; }
        .footer-brand strong { color: var(--text-body); font-weight: 700; }
        .footer-right { display: flex; align-items: center; gap: 8px; }
        .footer-sep { color: var(--border); }

        @media print {
            body { background: white; }
            .page { padding: 0; }
            .data-table tbody tr:hover td { background: inherit; }
        }
    </style>
</head>
<body>
<div class=""page"">

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         COMPANY BAR
         logo_src: embedded base64 image
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class=""company-bar"">
        <div class=""company-bar-left"">
            <img src=""data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUEAAAG9CAYAAACLXsRTAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxMAAAsTAQCanBgAAAjUSURBVHhe7d09q51ZGYDhtU8cRMViiqk0I/hR+BtkwCZuC2FABasBsYmFrbVgI1hZBu2msLQQJHOGUfxAf4CihZ04aKMyg4MGOTnbInLy5i1Smb0Wua8LUpwngbzstdeds/MUZwwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+L877Adn88rrPxpjjHFxOI0xxrg+PX6WwuwXr33pZnZOL37i9jh94OOPvvjfs4zN85mZPcvZO7/75ePZGjYPeUZ37t8dFxf39uOUy+Oc1/6V739zfPBj392P4Sxmve+f4mI/ACgRwRxHDltuRM71fgBpIgikiSCQJoJAmgjmOHLYciNyLEZgSwSBNBEE0kQQSBPBHEcOW25EjsUIbIkgkCaCQJoIAmkimOPIYcuNyLEYgS0RBNJEEEgTQSBNBHMcOWy5ETkWI7AlgkCaCAJpIgikiWCOI4ctNyLHYgS2RBBIE0EQTSRBBIE8EcRw5bbkSOxQhsiSCQJoJAmggCaSKY48hhy43IsRiBLREE0kQQSBNBIE0Ecxw5bLkRORYjsCWCQJoIAmkiCKSJYI4jhy03IsdiBLZEEEgTQSBNBIE0Ecxx5LDlRuRYjMCWCAJpIgikiSCQJoI5jhy23IgcixHYOuwHZ3Hn/t1xcXFvP065PM557T/zg2+MD93+1n4MZ/Hm51/aj2abcxFFcF4EgSf4OAykiSCQJoJAmggCaSIIpIkgkCaCQJoIAmkiCKSJIJAmgkCaCAJpIgikiSCQJoJAmggCaSIIpIkgkCaCQJoIAmkiCKSJIJAmgkCaCAJpIgikiSCQJoJAmggCaSIIpIkgkCaCQJoIAmkiCKQd9oOzuHP/7ri4uLcfwzN39eDP46evvrwfn81nf/irMcYYp3E9xhjjsPlG5HmfHW49GD//yvFmtggRpOXhg7fHW6/e3o/P5nh52o9SLo9zmvMUPg4DaSIIpIkgkCaCQJoIAmkiCKSJIJAmgkCaCAJpIgikiSCQJoJAmggCaSIIpIkgkCaCQJoIAmkiCKSJIJAmgkCaCAJpIgikiSCQJoJAmggCaSIIpIkgkCaCQJoIAmkiCKSJIJAmgkCaCAJpIgikiSCQJoJAmggCaSIIpIkgkCaCQJoIAmkiCKSJIJAmgkCaCAJpIgikiSCQJoJAmggCaSIIpIkgkCaCQJoIAmkiCKSJIJAmgkCaCAJpIgikiSCQJoJAmggCaSIIpIkgkCaCQJoIAmkiCKSJIJAmgkCaCAJpIgikiSCQJoJAmggCaSIIpIngLNcP/3Hz63T97jhdv3uW2en6nf2jQNlhPziLO/fvjouLe/txyuXRaz/Dwwdvj7devb0fn83x8rQfpcx63z+F7wSBNBEE0kQQSBNBIE0EgTQRBNJEEEgTQSBNBIE0EQTSRBBIE0EgTQSBNBEE0kQQSBNBIE0EgTQRBNJEEEgTQSBNBIE0EQTSRBBIm/MzQOs/+3ZM/Pmr9df+dPXeuPr3mzdfHy4encPp+vHPA36Wsxc+/MWbedGs9/1TzHmg+kUcE98MXntmmvW+fwofh4E0EQTSRBBIE0EgTQSBNBEE0kQQSBNBIE0EgTQRBNJEEEgTQSBNBIE0EQTSRBBIE0EgTQSBNBEE0kQQSBNBIE0EgTQRBNJEEEgTwVmOP/n6fgScnwjO8vD6I/sRcH4iCKSJIJAmgkCaCAJpIgikiSCQJoJAmggCaSIIpIkgkCaCQJoIAmkiCKSJIJAmgkCaCAJpIgikieAs11fv34+A8xPBWQ4Pr/cj4PxEEEgTQSBNBIE0EQTSRBBIE0EgTQSBNBEE0kQQSBNBIE0EgTQRBNJEEEgTQSBNBIE0EQTSRBBIE8FZrq5e2I+A8xNBIE0EgTQRBNJEEEgTQSBNBIE0EQTSRBBIE0EgTQSBNBEE0kQQSDvsB2dx5/7dcTh9bz9OufrXd8bPvvzt/Zjn2PHytB/lXB7nNOcplnsgeG6J4JIR9HEYSBNBIE0EgTQRBNJEEEgTQSBNBIE0EQTSRBBIE0EgTQSBNBEE0kQQSBNBIE0EgTQRBNJEEEgTQSBNBIE0EQTSRBBIE0EgTQSBNBEE0kQQSBNBIE0EgTQRBNJEEEgTQSBNBIE0EQTSRBBIE0Eg7bAfnMXn3vjtGIePjsPpyb//dDiZmT3z2W++9snxz7/8/Yk/cw7Hy9N+lHN5fPJsFjDngY5v/GmMw8v7MZzFr7/60njvr3/bj585EVwygpM+Dh+WeyGApkkRPPkXEVjCpAgCrEEEgTQRBNImRdBiBFjDpAhajABrmBRBgDWIIJAmgkDapAhajABrmBRBgDVMiqDtMLCGSREEWIMIAmmTImgxAqxhUgQB1jApghYjwBomRRBgDSIIpE2KoMUIsIZJEQRYw6QIWowAa5gUQYA1iCCQNimCFiPAGiZFEGANkyJoMQKsYVIEAdYggkDapAhajABrmBRBgDVMiqDFCLCGSREEWIMIAmmTImgxAqxhUgQB1jApghYjwBomRRBgDSIIpE2KoMUIsIZJEQRYw6QIWowAa5gUQYA1iCCQNimCFiPAGiZFEGANkyJoMQKsYVIEAdYggkDapAhajABrmBRBgDVMiqDFCLCGSREEWIMIAmkiCKRNiqDtMLCGSRG0GAHWMCmCAGsQQSBNBIG0SRG0GAHWMCmCFiPAGiZFEGANIgikiSCQNimCFiPAGiZF0GIEWMOkCAKsQQSBNBEE0iZF0GIEWMOkCFqMAGuYFEGANYggkCaCQNqcBcWnXvv0uLj1vjHGGKfrR89wuHj8/4RmZs9y9sfXfz/GeHgzP5fj5eNnqbo8PjqDhSz3QPDcuvPjP4xx68Uxxhin06NPYYfD9c3vP/+z/4y3vnD7ZgYAAFP9F0xweSsc6RVJAAAAAElFTkSuQmCC"" alt=""H Young Logo"" class=""company-logo"">
            <div class=""company-bar-titles"">
                <span class=""company-main-title"">Hyoung Fleet Management</span>
                <span class=""company-sub-title"">Fleet Management &amp; Fueling Operations</span>
            </div>
        </div>
    </div>

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         REPORT HEADER
         {{reportTitle}}    e.g. ""Pump Transaction Report""
         {{reportSubtitle}} e.g. ""Nairobi Depot â€” All Pumps â€” All Vehicles""
         {{dateFrom}}       e.g. ""01 Feb 2026""
         {{dateTo}}         e.g. ""18 Feb 2026""
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class=""report-header"">
        <div class=""report-title"">
            <h1>{{reportTitle}}</h1>
            <p>{{reportSubtitle}}</p>
        </div>
        <div class=""report-meta"">
            <span class=""badge-period"">{{dateFrom}} &ndash; {{dateTo}}</span>
        </div>
    </div>

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         SUMMARY CARDS  (4 cards)
         {{summary.totalTransactions}}
         {{summary.totalVolume}}
         {{summary.totalAmount}}
         {{summary.uniqueVehicles}}
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class=""summary-section"">
        <div class=""summary-card"">
            <div class=""card-icon"">
                <svg width=""15"" height=""15"" viewBox=""0 0 24 24""><path d=""M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m0 16H5V5h14v14M17 8H7V6h10v2m0 4H7v-2h10v2m-4 4H7v-2h6v2z""/></svg>
            </div>
            <div class=""card-value"">{{summary.totalTransactions}}</div>
            <div class=""card-label"">Total Transactions</div>
        </div>
        <div class=""summary-card accent"">
            <div class=""card-icon"">
                <svg width=""15"" height=""15"" viewBox=""0 0 24 24""><path d=""M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-1 14H9V8h2v8m4 0h-2V8h2v8z""/></svg>
            </div>
            <div class=""card-value"">{{summary.totalVolume}} L</div>
            <div class=""card-label"">Total Volume</div>
        </div>
        <div class=""summary-card alt"">
            <div class=""card-icon"">
                <svg width=""15"" height=""15"" viewBox=""0 0 24 24""><path d=""M7 15h2c0 1.08 1.37 2 3 2s3-.92 3-2c0-1.1-1.04-1.5-3.24-2.03C9.64 12.44 7 11.78 7 9c0-1.79 1.47-3.31 3.5-3.82V3h3v2.18C15.53 5.69 17 7.21 17 9h-2c0-1.08-1.37-2-3-2s-3 .92-3 2c0 1.1 1.04 1.5 3.24 2.03C14.36 11.56 17 12.22 17 15c0 1.79-1.47 3.31-3.5 3.82V21h-3v-2.18C8.47 18.31 7 16.79 7 15z""/></svg>
            </div>
            <div class=""card-value"">{{summary.currency}}{{summary.totalAmount}}</div>
            <div class=""card-label"">Total Amount</div>
        </div>
        <div class=""summary-card"">
            <div class=""card-icon"">
                <svg width=""15"" height=""15"" viewBox=""0 0 24 24""><path d=""M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99M6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16m11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5M5 11l1.5-4.5h11L19 11H5z""/></svg>
            </div>
            <div class=""card-value"">{{summary.uniqueVehicles}}</div>
            <div class=""card-label"">Unique Vehicles</div>
        </div>
    </div>

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         TRANSACTION TABLE
         {{#if transactions}} ... {{/if}}
         Per row:
           {{rowNumber}}          e.g. ""001""
           {{dateTime.date}}      e.g. ""18 Feb 2026""
           {{dateTime.time}}      e.g. ""08:14 AM""
           {{ptsName}}            e.g. ""Nairobi Depot""
           {{pump}}               e.g. ""Pump 01""
           {{vehicleNumberPlate}} e.g. ""KDG 441X""
           {{volume}}             e.g. ""120.50""
           {{consumption}}        e.g. ""14.3""
           {{amount}}             e.g. ""15,665""
           {{odometer}}           e.g. ""84,210""
           {{employeeName}}       e.g. ""James Mwangi""
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    {{#if transactions}}
    <div class=""table-wrapper"">
        <div class=""table-toolbar"">
            <span class=""table-toolbar-title"">Transaction Detail</span>
            <span class=""table-toolbar-count"">{{summary.totalTransactions}} records</span>
        </div>
        <table class=""data-table"">
            <thead>
                <tr>
                    <th class=""text-center"">#</th>
                    <th>Date / Time</th>
                    <th>PTS / Pump</th>
                    <th>Vehicle</th>
                    <th class=""text-right"">Volume (L)</th>
                    <th class=""text-right"">L/100km</th>
                    <th class=""text-right"">Amount ({{summary.currency}})</th>
                    <th class=""text-right"">Odometer (km)</th>
                    <th>Operator</th>
                </tr>
            </thead>
            <tbody>
                {{#each transactions}}
                <tr>
                    <td class=""text-center cell-number"">{{rowNumber}}</td>
                    <td>
                        <div class=""cell-datetime"">
                            <span class=""date"">{{dateTime.date}}</span>
                            <span class=""time"">{{dateTime.time}}</span>
                        </div>
                    </td>
                    <td>
                        <div class=""cell-pump"">{{ptsName}}</div>
                        <div class=""pump-sub"">{{pump}}</div>
                    </td>
                    <td>
                        <div class=""cell-vehicle"">
                            <span class=""plate"">{{vehicleNumberPlate}}</span>
                        </div>
                    </td>
                    <td class=""text-right cell-volume"">{{volume}}</td>
                    <td class=""text-right cell-consumption"">{{consumption}}</td>
                    <td class=""text-right cell-amount"">{{amount}}</td>
                    <td class=""text-right cell-odo"">{{odometer}}</td>
                    <td>{{employeeName}}</td>
                </tr>
                {{/each}}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan=""4"" class=""text-right"">TOTALS</td>
                    <td class=""text-right"">{{summary.totalVolume}} L</td>
                    <td class=""text-right"">{{summary.avgConsumption}} avg</td>
                    <td class=""text-right"">{{summary.currency}}{{summary.totalAmount}}</td>
                    <td colspan=""2""></td>
                </tr>
            </tfoot>
        </table>
    </div>
    {{else}}
    <div class=""table-wrapper"">
        <div class=""empty-state"">
            <p>No transactions found for the selected criteria.</p>
        </div>
    </div>
    {{/if}}

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         PAGE BREAK  (repeat block above/below for multi-page)
         {{pageNumber}}   e.g. ""2""
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <!-- EXAMPLE PAGE BREAK â€” remove comment tags to activate:

    <div class=""page-break""><span>PAGE {{pageNumber}}</span></div>

    <div class=""table-wrapper"">
        <div class=""table-toolbar"">
            <span class=""table-toolbar-title"">Transaction Detail <span style=""color:var(--text-muted);font-weight:400;font-size:11px;"">continued</span></span>
            <span class=""table-toolbar-count"">Records {{pageStart}} â€“ {{pageEnd}} of {{summary.totalTransactions}}</span>
        </div>
        ... repeat table structure above ...
    </div>

    -->

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         FOOTER
         {{generatedAt}}  e.g. ""18 Feb 2026, 09:42 AM""
         {{reportId}}     e.g. ""PTR-20260218-0047""
         {{currentPage}}  e.g. ""1""
         {{totalPages}}   e.g. ""2""
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class=""report-footer"">
        <div class=""footer-brand"">
            <div class=""dot""></div>
            <span><strong>H Young</strong> &mdash; Fleet Management &amp; Fueling Operations</span>
        </div>
        <div class=""footer-right"">
            <span>Generated: {{generatedAt}}</span>
            <span class=""footer-sep"">|</span>
            <span>Report ID: {{reportId}}</span>
            <span class=""footer-sep"">|</span>
            <span>Page {{currentPage}} of {{totalPages}}</span>
        </div>
    </div>

</div>
</body>
</html>";

        // â”€â”€â”€ Summary / Table sections per report type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        private static string PumpTransactionSummary() => @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalTransactions}}</div><div class=""label"">Total Transactions</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.totalVolume}} L</div><div class=""label"">Total Volume</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.currency}}{{summary.totalAmount}}</div><div class=""label"">Total Amount</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.uniqueVehicles}}</div><div class=""label"">Unique Vehicles</div></div>
    </div>{{/if}}";

        private static string PumpTransactionTable() => @"    {{#if transactions}}
    <table class=""data-table"">
        <thead>
            <tr>
                <th class=""text-center"">#</th>
                <th>Date / Time</th>
                <th>PTS / Pump</th>
                <th>Vehicle</th>
                <th class=""text-right"">Volume (L)</th>
                <th class=""text-right"">L/100km</th>
                <th class=""text-right"">Amount ({{summary.currency}})</th>
                <th class=""text-right"">Odometer (km)</th>
                <th>Operator</th>
            </tr>
        </thead>
        <tbody>{{#each transactions}}<tr>
            <td class=""text-center text-muted"">{{rowNumber}}</td>
            <td>{{dateTime.date}} {{dateTime.time}}</td>
            <td>{{ptsName}} {{pump}}</td>
            <td>{{vehicleNumberPlate}}</td>
            <td class=""text-right text-success font-bold"">{{volume}}</td>
            <td class=""text-right font-bold"">{{consumption}}</td>
            <td class=""text-right font-bold"">{{amount}}</td>
            <td class=""text-right"">{{odometer}}</td>
            <td>{{employeeName}}</td>
        </tr>{{/each}}</tbody>
        <tfoot>
            <tr>
                <td colspan=""4"" class=""text-right"">TOTALS</td>
                <td class=""text-right"">{{summary.totalVolume}} L</td>
                <td class=""text-right"">{{summary.avgConsumption}} avg</td>
                <td class=""text-right"">{{summary.currency}}{{summary.totalAmount}}</td>
                <td colspan=""2""></td>
            </tr>
        </tfoot>
    </table>{{/if}}";

        private static string VehicleConsumptionSummary() => @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalVehicles}}</div><div class=""label"">Vehicles</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.totalVolume}} L</div><div class=""label"">Total Volume</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.totalCost}}</div><div class=""label"">Total Cost</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.avgConsumption}}</div><div class=""label"">Avg L/100km</div></div>
    </div>{{/if}}";

        private static string VehicleConsumptionTable() => @"    {{#if records}}
    <table class=""data-table""><thead><tr><th>#</th><th>Vehicle</th><th>Plate</th><th>Type</th><th>Site</th><th class=""text-right"">Volume (L)</th><th class=""text-right"">Distance (km)</th><th class=""text-right"">L/100km</th><th class=""text-right"">Cost</th></tr></thead>
        <tbody>{{#each records}}<tr>
            <td class=""text-center text-muted"">{{rowNumber}}</td><td class=""font-bold"">{{vehicleName}}</td><td>{{numberPlate}}</td><td>{{vehicleType}}</td><td>{{siteName}}</td>
            <td class=""text-right text-success font-bold"">{{volume}}</td><td class=""text-right"">{{distance}}</td><td class=""text-right font-bold"">{{consumption}}</td><td class=""text-right"">{{cost}}</td>
        </tr>{{/each}}</tbody></table>{{/if}}";

        private static string FuelRefillSummary() => @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalRefills}}</div><div class=""label"">Total Refills</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.totalVolume}} L</div><div class=""label"">Total Volume</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.fuelAverage}} {{summary.fuelAverageUnit}}</div><div class=""label"">Fuel Average</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.uniqueVehicles}}</div><div class=""label"">Vehicles</div></div>
    </div>{{/if}}";

        private static string FuelRefillTable() => @"    {{#if records}}
    <table class=""data-table""><thead><tr><th>#</th><th>Date/Time (Local)</th><th>Vehicle</th><th>Site</th><th class=""text-right"">Volume (L)</th><th class=""text-right"">Fuel Average</th></tr></thead>
        <tbody>{{#each records}}<tr>
            <td class=""text-center text-muted"">{{rowNumber}}</td><td>{{dateTime}}</td><td class=""font-bold"">{{vehicleName}}</td><td>{{siteName}}</td>
            <td class=""text-right text-success font-bold"">{{volume}}</td><td class=""text-right"">{{fuelAverage}} {{fuelAverageUnit}}</td>
        </tr>{{/each}}</tbody></table>{{/if}}";

        private static string FuelDeliverySummary() => @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalDeliveries}}</div><div class=""label"">Deliveries</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.totalVolume}} L</div><div class=""label"">Volume Delivered</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.totalCost}}</div><div class=""label"">Total Cost</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.uniqueTanks}}</div><div class=""label"">Tanks</div></div>
    </div>{{/if}}";

        private static string FuelDeliveryTable() => @"    {{#if records}}
    <table class=""data-table""><thead><tr><th>#</th><th>Date</th><th>Supplier</th><th>Tank</th><th>Fuel Grade</th><th class=""text-right"">Volume (L)</th><th class=""text-right"">Cost</th><th>Site</th></tr></thead>
        <tbody>{{#each records}}<tr>
            <td class=""text-center text-muted"">{{rowNumber}}</td><td>{{deliveryDate}}</td><td class=""font-bold"">{{supplierName}}</td><td>{{tankName}}</td><td>{{fuelGradeName}}</td>
            <td class=""text-right text-success font-bold"">{{volume}}</td><td class=""text-right"">{{cost}}</td><td>{{siteName}}</td>
        </tr>{{/each}}</tbody></table>{{/if}}";

        private static string DeviceOfflineSummary() => @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalEvents}}</div><div class=""label"">Offline Events</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.totalDowntime}}</div><div class=""label"">Total Downtime</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.affectedDevices}}</div><div class=""label"">Devices Affected</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.avgDuration}}</div><div class=""label"">Avg Duration</div></div>
    </div>{{/if}}";

        private static string DeviceOfflineTable() => @"    {{#if records}}
    <table class=""data-table""><thead><tr><th>#</th><th>Device</th><th>Site</th><th>Went Offline</th><th>Came Online</th><th class=""text-right"">Duration</th><th>Status</th></tr></thead>
        <tbody>{{#each records}}<tr>
            <td class=""text-center text-muted"">{{rowNumber}}</td><td class=""font-bold"">{{deviceName}}</td><td>{{siteName}}</td><td>{{offlineAt}}</td><td>{{onlineAt}}</td>
            <td class=""text-right font-bold"">{{duration}}</td>
            <td>{{#if isOnline}}<span class=""text-success"">Online</span>{{else}}<span class=""text-danger"">Offline</span>{{/if}}</td>
        </tr>{{/each}}</tbody></table>{{/if}}";

        private static string PtsDeviceStatusSummary() => @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalDevices}}</div><div class=""label"">Total Devices</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.onlineCount}}</div><div class=""label"">Online</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.offlineCount}}</div><div class=""label"">Offline</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.uptimePercent}}%</div><div class=""label"">Uptime</div></div>
    </div>{{/if}}";

        private static string PtsDeviceStatusTable() => @"    {{#if records}}
    <table class=""data-table""><thead><tr><th>#</th><th>Device</th><th>Site</th><th>IP Address</th><th>Status</th><th>Last Seen</th><th class=""text-right"">Uptime %</th><th>Firmware</th></tr></thead>
        <tbody>{{#each records}}<tr>
            <td class=""text-center text-muted"">{{rowNumber}}</td><td class=""font-bold"">{{deviceName}}</td><td>{{siteName}}</td><td class=""text-muted"">{{ipAddress}}</td>
            <td>{{#if isOnline}}<span class=""text-success font-bold"">Online</span>{{else}}<span class=""text-danger font-bold"">Offline</span>{{/if}}</td>
            <td>{{lastSeenAt}}</td><td class=""text-right"">{{uptimePercent}}%</td><td class=""text-muted"">{{firmwareVersion}}</td>
        </tr>{{/each}}</tbody></table>{{/if}}";

        private static string IssueTrackerSummary() => @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalIssues}}</div><div class=""label"">Total Issues</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.openIssues}}</div><div class=""label"">Open</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.closedIssues}}</div><div class=""label"">Closed</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.autoCreatedIssues}}</div><div class=""label"">Auto Created</div></div>
    </div>{{/if}}";

        private static string IssueTrackerTable() => @"    {{#if records}}
    <table class=""data-table""><thead><tr><th>#</th><th>Opened (Local)</th><th>Site</th><th>Vehicle</th><th>Template</th><th>Status</th><th>Category</th><th>Issue</th><th>Assigned To</th><th>Opened By</th></tr></thead>
        <tbody>{{#each records}}<tr>
            <td class=""text-center text-muted"">{{rowNumber}}</td><td>{{openDate}}</td><td>{{siteName}}</td><td class=""font-bold"">{{vehicleName}}</td>
            <td>{{issueTemplateName}}</td><td>{{statusName}}</td><td>{{categoryName}}</td><td>{{problemTitle}}</td><td>{{assignedTo}}</td><td>{{openedBy}}</td>
        </tr>{{/each}}</tbody></table>{{/if}}";

        private static string ConsumptionByRefillsSummary() => @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalVehicles}}</div><div class=""label"">Vehicles</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.totalFuel}} L</div><div class=""label"">Total Fuel</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.totalDistance}} km</div><div class=""label"">Total Distance</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.avgConsumption}}</div><div class=""label"">Avg L/100km</div></div>
    </div>{{/if}}";

        private static string ConsumptionByRefillsTable() => @"    {{#if records}}
    <table class=""data-table""><thead><tr><th>#</th><th>Vehicle</th><th>Plate</th><th>Site</th><th class=""text-right"">Refills</th><th class=""text-right"">Volume (L)</th><th class=""text-right"">Distance (km)</th><th class=""text-right"">L/100km</th></tr></thead>
        <tbody>{{#each records}}<tr>
            <td class=""text-center text-muted"">{{rowNumber}}</td><td class=""font-bold"">{{vehicleName}}</td><td>{{numberPlate}}</td><td>{{siteName}}</td>
            <td class=""text-center"">{{refillCount}}</td><td class=""text-right text-success font-bold"">{{totalVolume}}</td><td class=""text-right"">{{totalDistance}}</td><td class=""text-right font-bold"">{{consumption}}</td>
        </tr>{{/each}}</tbody></table>{{/if}}";
    }
}
