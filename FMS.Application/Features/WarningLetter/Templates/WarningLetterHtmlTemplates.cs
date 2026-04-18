/**
 * File: WarningLetterHtmlTemplates.cs
 * Purpose: Provides the warning letter jsreport Handlebars template and the supporting email body builder.
 * Dependencies: System.Text, System.Net
 * Last Modified: 2026-04-14
 */
using System.Net;
using System.Text;

namespace FMS.Application.Features.WarningLetter.Templates;

public static class WarningLetterHtmlTemplates
{
    public sealed class WarningLetterTemplateModel
    {
        public string CompanyName { get; init; } = string.Empty;
        public string? LogoDataUri { get; init; }
        public bool IsExcessFuelConsumption { get; init; }
        public bool IsExcessiveSpeed { get; init; }
        public bool IsExcessiveIdling { get; init; }
        public string WarningCountLabel { get; init; } = "1st";
        public bool IsLastWarning { get; init; }
        public bool HideWarningCountInSubject { get; init; }
        public string ReferenceNumber { get; init; } = string.Empty;
        public string LetterDate { get; init; } = string.Empty;
        public string EmployeeName { get; init; } = string.Empty;
        public string EmployeeWorkNo { get; init; } = "N/A";
        public string Position { get; init; } = "N/A";
        public string VehicleHyoungNo { get; init; } = string.Empty;
        public string NumberPlate { get; init; } = "N/A";
        public string VehicleType { get; init; } = "N/A";
        public string SiteName { get; init; } = string.Empty;
        public string AffectedDate { get; init; } = string.Empty;
        public string ViolationTitle { get; init; } = string.Empty;
        public string ViolationSummary { get; init; } = string.Empty;
        public string ExpectedLabel { get; init; } = string.Empty;
        public string ExpectedValue { get; init; } = "N/A";
        public string ActualLabel { get; init; } = string.Empty;
        public string ActualValue { get; init; } = "N/A";
        public string ExcessLabel { get; init; } = string.Empty;
        public string ExcessValue { get; init; } = "N/A";
        public string? FuelPrice { get; init; }
        public string? ExcessCost { get; init; }
        public string RemedialInstruction { get; init; } = string.Empty;
        public string ConsequenceWarning { get; init; } = string.Empty;
        public string IssuedByName { get; init; } = string.Empty;
        public string IssuedByTitle { get; init; } = "Fleet Manager";
        public string? Notes { get; init; }
        public string GeneratedBy { get; init; } = "System";
        public string GeneratedDate { get; init; } = string.Empty;
        public string? QrCodeDataUri { get; init; }
    }

    public static string GetTemplate()
    {
        return @"<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"" />
    <title>{{ViolationTitle}} - Warning Letter</title>
    <style>
        @page { size: A4; margin: 11mm 13mm 12mm 13mm; }
        body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; padding: 0; line-height: 1.2; font-size: 10.2pt; }

        /* Letterhead */
        .letterhead { border-top: 1px solid #7d89a6; padding: 12px 0 10px; margin: 10px 0 8px; }
        .letterhead-table { width: 100%; border-collapse: collapse; }
        .letterhead-table td { vertical-align: top; padding: 0 4px; }
        .lh-brand { width: 62%; text-align: left; vertical-align: middle; }
        .lh-disciplines { width: 38%; font-size: 6.8pt; line-height: 1.08; color: #6a6a6a; text-align: right; }
        .lh-contact { width: 62%; font-size: 6.8pt; line-height: 1.12; color: #4e596c; padding-top: 8px; padding-bottom: 4px; }
        .lh-office { width: 38%; font-size: 6.8pt; line-height: 1.12; color: #4e596c; text-align: right; padding-top: 8px; padding-bottom: 4px; }
        .brand-wrap { display: inline-flex; flex-wrap: nowrap; align-items: center; justify-content: flex-start; gap: 4px; padding-top: 2px; white-space: nowrap; }
        .brand-logo { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; flex: 0 0 42px; }
        .brand-logo img { display: block; max-width: 38px; max-height: 38px; object-fit: contain; }
        .company-name { font-family: 'Bookman Old Style', 'Times New Roman', serif; font-size: 40px; font-weight: 700; color: #0047B9; letter-spacing: 0.5px; line-height: 0.84; text-transform: uppercase; white-space: nowrap; }
        .company-side { text-align: left; color: #7d7d7d; line-height: 0.96; padding-top: 2px; white-space: nowrap; }
        .company-side-top { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; font-weight: 700; text-transform: uppercase; }
        .company-side-bottom { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
        .lh-label { font-weight: 700; text-transform: uppercase; }

        /* Secondary header row */
        .header-primary-row td { padding-bottom: 8px; }
        .header-divider-row td { padding: 0 4px 6px; }
        .header-divider-line { border-top: 1px solid #7d89a6; height: 0; }
        .header-secondary-row td { padding-top: 8px; padding-bottom: 4px; }
        .hy-mark { display: inline-block; font-size: 34px; line-height: 0.78; font-weight: 700; color: #84a9c9; letter-spacing: -3px; }

        /* Ref / Date row */
        .ref-row { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 8.8pt; color: #6d6d6d; }
        .ref-row td { padding: 2px 0; }
        .ref-row .label { font-weight: 700; width: 78px; }

        .project-line { text-align: center; font-size: 10.5pt; font-weight: 700; color: #7a7a7a; margin: 3px 0 5px; text-transform: uppercase; }
        .divider { border-top: 1px solid #8f8f8f; margin: 0 0 8px; }

        /* Letter body */
        .recipient { margin-bottom: 6px; }
        .recipient div { margin-bottom: 6px; font-size: 9.9pt; }
        .recipient strong { display: inline-block; min-width: 62px; }
        .subject { font-weight: 700; text-transform: uppercase; margin: 8px 0 5px; font-size: 10.3pt; padding-bottom: 3px; border-bottom: 1px solid #8f8f8f; }
        p { margin: 0 0 8px; text-align: justify; }
        .compact-gap { margin-bottom: 4px; }

        /* Signature */
        .sign-off { margin-top: 14px; padding-top: 4px; }
        .sign-off .company-line { font-weight: 700; text-transform: uppercase; margin-bottom: 28px; }
        .sign-off .name { font-weight: 700; display: block; }
        .sign-off .title { font-weight: 700; text-transform: uppercase; text-decoration: underline; }
        .ack { margin-top: 14px; padding: 10px 0 8px; border-top: 1px solid #8f8f8f; font-size: 8.8pt; }
        .ack p { margin: 0; text-align: left; line-height: 1.45; }
        .ack-line { border-bottom: 1px dotted #000; display: inline-block; min-width: 160px; margin: 0 8px 0 4px; }

        /* Footer */
        .doc-footer { margin-top: 36px; padding-top: 10px; font-size: 7.3pt; color: #7a7a7a; position: relative; top: 24px; }
        .doc-footer__table { width: 100%; border-collapse: collapse; }
        .doc-footer__table td { vertical-align: bottom; }
        .doc-footer__spacer { width: 88px; }
        .doc-footer__directors { text-align: center; }
        .doc-footer__qr-cell { width: 88px; text-align: right; }
        .doc-footer__qr { text-align: right; }
        .doc-footer__qr img { width: 72px; height: 72px; }
        .doc-footer__qr-label { font-size: 6pt; color: #999; margin-top: 2px; text-align: center; }
    </style>
</head>
<body data-skip-fms-letterhead=""true"">
    <div class=""letterhead"">
        <table class=""letterhead-table"">
            <tr class=""header-primary-row"">
                <td class=""lh-brand"">
                    <div class=""brand-wrap"">
                        <div class=""brand-logo"">{{#if LogoDataUri}}<img src=""{{LogoDataUri}}"" alt=""H Young logo"" />{{else}}<span class=""hy-mark"">HY</span>{{/if}}</div>
                        <div class=""company-name"">HYOUNG</div>
                        <div class=""company-side"">
                            <div class=""company-side-top"">&amp; Co</div>
                            <div class=""company-side-bottom"">(EA) Ltd.</div>
                        </div>
                    </div>
                </td>
                <td class=""lh-disciplines"">
                    <div>Road Contractors</div>
                    <div>Civil Engineers</div>
                    <div>Mechanical Engineers</div>
                    <div>Piping and Process</div>
                    <div>Structural Steel</div>
                </td>
            </tr>
            <tr class=""header-divider-row"">
                <td colspan=""2""><div class=""header-divider-line""></div></td>
            </tr>
            <tr class=""header-secondary-row"">
                <td class=""lh-contact"">
                    <div>P.O Box 30118-0100 GPO,</div>
                    <div>NAIROBI, KENYA</div>
                    <div>TEL: +254 20 6688000,</div>
                    <div>FAX: 531056/530151</div>
                    <div>E-mail: hyoung@hyoung.co.ke</div>
                    <div>Website: www.hyoung.com</div>
                </td>
                <td class=""lh-office"">
                    <div class=""lh-label"">HEAD OFFICE &amp; WORKS</div>
                    <div>FUNZI ROAD</div>
                    <div>INDUSTRIAL AREA</div>
                    <div>NAIROBI</div>
                </td>
            </tr>
        </table>
    </div>

    <table class=""ref-row"">
        <tr>
            <td class=""label"">Our Ref:</td>
            <td>{{ReferenceNumber}}</td>
        </tr>
        <tr>
            <td class=""label"">Your Ref:</td>
            <td></td>
        </tr>
        <tr>
            <td class=""label"">Date:</td>
            <td>{{LetterDate}}</td>
        </tr>
    </table>

    <div class=""project-line"">{{SiteName}} PROJECT</div>
    <div class=""divider""></div>

    <div class=""recipient"">
        <div><strong>TO:</strong> {{EmployeeName}}</div>
        <div><strong>W/NO:</strong> {{EmployeeWorkNo}}</div>
        <div><strong>TRADE:</strong> {{Position}}</div>
    </div>

    <div class=""subject"">SUBJECT: {{#if HideWarningCountInSubject}}WARNING LETTER{{else}}{{#if IsLastWarning}}LAST WARNING LETTER{{else}}{{WarningCountLabel}} WARNING LETTER{{/if}}{{/if}} &ndash; {{ViolationTitle}}</div>

    <p class=""compact-gap"">Dear Sir,</p>

    {{#if IsExcessFuelConsumption}}<p>It has come to the attention of management that there is an over-consumption of fuel in <strong>{{VehicleHyoungNo}}</strong> that is entrusted to you. Please note that any misuse of fuel except for the normal fuel consumption, constitutes a breach of trust and by doing so, you cause irreversible damage and loss to the Company.</p>{{/if}}

    {{#if IsExcessiveSpeed}}<p>It has come to the attention of management that there is excessive speeding in <strong>{{VehicleHyoungNo}}</strong> that is entrusted to you. Please note that failure to observe approved speed limits constitutes a breach of trust and by doing so, you expose the Company to loss, damage, and unnecessary risk.</p>{{/if}}

    {{#if IsExcessiveIdling}}<p>It has come to the attention of management that there is excessive idling in <strong>{{VehicleHyoungNo}}</strong> that is entrusted to you. Please note that unnecessary idling outside normal operational requirements constitutes a breach of trust and by doing so, you cause avoidable loss and damage to the Company.</p>{{/if}}

    <p>The average <strong>{{ExpectedLabel}}</strong> is <strong>{{ExpectedValue}}</strong>. This average was established after rigorous tests by qualified Engineers and Managers.</p>

    {{#if IsExcessFuelConsumption}}<p>It was noted that on <strong>{{AffectedDate}}</strong>, while driving <strong>{{VehicleHyoungNo}}</strong> that is entrusted to you there was <strong>{{ActualLabel}}</strong> of <strong>{{ActualValue}}</strong>, resulting in <strong>{{ExcessLabel}}</strong> of <strong>{{ExcessValue}}</strong>.</p>{{/if}}

    {{#if IsExcessiveSpeed}}<p>It was noted that on <strong>{{AffectedDate}}</strong>, while driving <strong>{{VehicleHyoungNo}}</strong> that is entrusted to you there was <strong>{{ActualLabel}}</strong> of <strong>{{ActualValue}}</strong>, resulting in <strong>{{ExcessLabel}}</strong> of <strong>{{ExcessValue}}</strong>.</p>{{/if}}

    {{#if IsExcessiveIdling}}<p>It was noted that on <strong>{{AffectedDate}}</strong>, while operating <strong>{{VehicleHyoungNo}}</strong> that is entrusted to you there was <strong>{{ActualLabel}}</strong> of <strong>{{ActualValue}}</strong>, resulting in <strong>{{ExcessLabel}}</strong> of <strong>{{ExcessValue}}</strong>.</p>{{/if}}

    {{#if ExcessCost}}<p>{{#if FuelPrice}}(Calculated at the rate of {{FuelPrice}} per litre){{/if}} <strong>{{ExcessCost}}</strong> is hereby debited to you and will be imputed from your forthcoming salary.</p>{{/if}}

    {{#if RemedialInstruction}}<p>{{RemedialInstruction}}</p>{{/if}}

    <p>Please be advised that any other incidents of the above nature will result in more severe disciplinary action.</p>

    {{#if ConsequenceWarning}}<p>{{ConsequenceWarning}}</p>{{/if}}

    {{#if Notes}}<p><em>Additional Notes:</em> {{Notes}}</p>{{/if}}

    <div class=""sign-off"">
        <div class=""company-line"">FOR: {{CompanyName}}</div>
        <div class=""name"">{{IssuedByName}}</div>
        <div class=""title"">{{IssuedByTitle}}</div>
    </div>

    <div class=""ack"">
        <p>I, <span class=""ack-line"">&nbsp;</span> of Work Number <span class=""ack-line"">&nbsp;</span> agree to the terms and conditions of this letter herein.</p>
    </div>

    <div class=""doc-footer"">
        <table class=""doc-footer__table"">
            <tr>
                <td class=""doc-footer__spacer""></td>
                <td class=""doc-footer__directors"">DIRECTORS: J. SCHWARTZMAN (CEO/CHAIRMAN), H SCHWARTZMAN</td>
                <td class=""doc-footer__qr-cell"">
                    {{#if QrCodeDataUri}}
                    <div class=""doc-footer__qr"">
                        <img src=""{{QrCodeDataUri}}"" alt=""QR Code"" />
                        <div class=""doc-footer__qr-label"">{{ReferenceNumber}}</div>
                    </div>
                    {{/if}}
                </td>
            </tr>
        </table>
    </div>
</body>
</html>";
    }

    public static string BuildEmailBody(WarningLetterTemplateModel model)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<html><body style='font-family:Segoe UI,Arial,sans-serif;color:#201f1e;'>");
        sb.AppendLine($"<p>Please find attached the formal warning letter regarding <strong>{Encode(model.ViolationTitle)}</strong>.</p>");
        sb.AppendLine("<table style='border-collapse:collapse;'>");
        sb.AppendLine($"<tr><td style='padding:4px 12px 4px 0;'><strong>Employee</strong></td><td style='padding:4px 0;'>{Encode(model.EmployeeName)}</td></tr>");
        sb.AppendLine($"<tr><td style='padding:4px 12px 4px 0;'><strong>Vehicle</strong></td><td style='padding:4px 0;'>{Encode(model.VehicleHyoungNo)} / {Encode(model.NumberPlate)}</td></tr>");
        sb.AppendLine($"<tr><td style='padding:4px 12px 4px 0;'><strong>Affected Date</strong></td><td style='padding:4px 0;'>{Encode(model.AffectedDate)}</td></tr>");
        sb.AppendLine($"<tr><td style='padding:4px 12px 4px 0;'><strong>Site</strong></td><td style='padding:4px 0;'>{Encode(model.SiteName)}</td></tr>");
        sb.AppendLine("</table>");
        sb.AppendLine("<p>Please review the attached letter and acknowledge receipt through the normal disciplinary process.</p>");
        sb.AppendLine("<p>Regards,<br />Fleet Compliance Office</p>");
        sb.AppendLine("</body></html>");
        return sb.ToString();
    }

    private static string Encode(string value)
    {
        return WebUtility.HtmlEncode(value ?? string.Empty);
    }
}