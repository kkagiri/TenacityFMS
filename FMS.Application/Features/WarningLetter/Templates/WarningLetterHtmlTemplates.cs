/**
 * File: WarningLetterHtmlTemplates.cs
 * Purpose: Builds HTML templates and email bodies for warning letters.
 * Dependencies: System.Text, System.Net
 * Last Modified: 2026-04-06
 */
using System.Net;
using System.Text;

namespace FMS.Application.Features.WarningLetter.Templates;

public static class WarningLetterHtmlTemplates
{
    public sealed class WarningLetterTemplateModel
    {
        public string CompanyName { get; init; } = string.Empty;
        public string ReferenceNumber { get; init; } = string.Empty;
        public string LetterDate { get; init; } = string.Empty;
        public string EmployeeName { get; init; } = string.Empty;
        public string EmployeeWorkNo { get; init; } = "N/A";
        public string Trade { get; init; } = "N/A";
        public string VehicleHyoungNo { get; init; } = string.Empty;
        public string NumberPlate { get; init; } = "N/A";
        public string VehicleType { get; init; } = "N/A";
        public string SiteName { get; init; } = string.Empty;
        public string PeriodStart { get; init; } = string.Empty;
        public string PeriodEnd { get; init; } = string.Empty;
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
    }

    public static string Render(WarningLetterTemplateModel model)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html><head><meta charset='utf-8' />");
        sb.AppendLine("<style>");
        sb.AppendLine("body { font-family: 'Segoe UI', Arial, sans-serif; color: #201f1e; margin: 0; padding: 24px; line-height: 1.5; font-size: 14px; }");
        sb.AppendLine(".letterhead { border-bottom: 2px solid #0078d4; padding-bottom: 12px; margin-bottom: 24px; }");
        sb.AppendLine(".company-name { font-size: 24px; font-weight: 700; color: #0078d4; margin-bottom: 4px; }");
        sb.AppendLine(".company-sub { font-size: 12px; color: #605e5c; }");
        sb.AppendLine(".title { text-align: center; color: #d13438; font-weight: 700; font-size: 22px; margin: 16px 0 20px; text-decoration: underline; }");
        sb.AppendLine(".meta { margin-bottom: 18px; }");
        sb.AppendLine(".subject { font-weight: 700; margin: 18px 0 12px; }");
        sb.AppendLine("table { width: 100%; border-collapse: collapse; margin: 16px 0; }");
        sb.AppendLine("th, td { border: 1px solid #c8c6c4; padding: 8px 10px; text-align: left; }");
        sb.AppendLine("th { background: #f3f2f1; font-weight: 600; }");
        sb.AppendLine(".signature-grid { width: 100%; margin-top: 34px; }");
        sb.AppendLine(".signature-cell { width: 48%; display: inline-block; vertical-align: top; }");
        sb.AppendLine(".line { border-top: 1px solid #605e5c; margin-top: 42px; padding-top: 6px; }");
        sb.AppendLine(".footer { margin-top: 28px; font-size: 11px; color: #605e5c; text-align: center; }");
        sb.AppendLine("</style></head><body>");
        sb.AppendLine("<div class='letterhead'>");
        sb.AppendLine($"<div class='company-name'>{Encode(model.CompanyName)}</div>");
        sb.AppendLine($"<div class='company-sub'>Fleet Compliance Office | Site: {Encode(model.SiteName)}</div>");
        sb.AppendLine("</div>");
        sb.AppendLine("<div class='title'>WARNING LETTER</div>");
        sb.AppendLine("<div class='meta'>");
        sb.AppendLine($"<div><strong>Date:</strong> {Encode(model.LetterDate)}</div>");
        sb.AppendLine($"<div><strong>Reference:</strong> {Encode(model.ReferenceNumber)}</div>");
        sb.AppendLine("</div>");
        sb.AppendLine($"<div><strong>To:</strong> {Encode(model.EmployeeName)}</div>");
        sb.AppendLine($"<div><strong>Work No:</strong> {Encode(model.EmployeeWorkNo)}</div>");
        sb.AppendLine($"<div><strong>Trade:</strong> {Encode(model.Trade)}</div>");
        sb.AppendLine($"<div><strong>Vehicle:</strong> {Encode(model.VehicleHyoungNo)} / {Encode(model.NumberPlate)} ({Encode(model.VehicleType)})</div>");
        sb.AppendLine($"<div class='subject'>RE: WARNING - {Encode(model.ViolationTitle)}</div>");
        sb.AppendLine($"<p>This letter serves as a formal warning regarding the above matter observed between {Encode(model.PeriodStart)} and {Encode(model.PeriodEnd)} at {Encode(model.SiteName)}. {Encode(model.ViolationSummary)}</p>");
        sb.AppendLine("<table>");
        sb.AppendLine("<tr><th>Metric</th><th>Value</th></tr>");
        sb.AppendLine($"<tr><td>{Encode(model.ExpectedLabel)}</td><td>{Encode(model.ExpectedValue)}</td></tr>");
        sb.AppendLine($"<tr><td>{Encode(model.ActualLabel)}</td><td>{Encode(model.ActualValue)}</td></tr>");
        sb.AppendLine($"<tr><td>{Encode(model.ExcessLabel)}</td><td>{Encode(model.ExcessValue)}</td></tr>");
        if (!string.IsNullOrWhiteSpace(model.FuelPrice))
        {
            sb.AppendLine($"<tr><td>Fuel Price</td><td>{Encode(model.FuelPrice!)}</td></tr>");
        }
        if (!string.IsNullOrWhiteSpace(model.ExcessCost))
        {
            sb.AppendLine($"<tr><td>Excess Cost</td><td>{Encode(model.ExcessCost!)}</td></tr>");
        }
        sb.AppendLine("</table>");
        sb.AppendLine($"<p>{Encode(model.RemedialInstruction)}</p>");
        sb.AppendLine($"<p><strong>Consequences:</strong> {Encode(model.ConsequenceWarning)}</p>");
        if (!string.IsNullOrWhiteSpace(model.Notes))
        {
            sb.AppendLine($"<p><strong>Additional Notes:</strong> {Encode(model.Notes!)}</p>");
        }
        sb.AppendLine("<div class='signature-grid'>");
        sb.AppendLine("<div class='signature-cell'>");
        sb.AppendLine("<div class='line'>Issued By</div>");
        sb.AppendLine($"<div><strong>{Encode(model.IssuedByName)}</strong></div>");
        sb.AppendLine($"<div>{Encode(model.IssuedByTitle)}</div>");
        sb.AppendLine("</div>");
        sb.AppendLine("<div class='signature-cell' style='float:right;'>");
        sb.AppendLine("<div class='line'>Employee Acknowledgement</div>");
        sb.AppendLine($"<div><strong>{Encode(model.EmployeeName)}</strong></div>");
        sb.AppendLine("<div>Signature / Date</div>");
        sb.AppendLine("</div>");
        sb.AppendLine("</div>");
        sb.AppendLine("<div class='footer'>This is a computer-generated letter.</div>");
        sb.AppendLine("</body></html>");
        return sb.ToString();
    }

    public static string BuildEmailBody(WarningLetterTemplateModel model)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<html><body style='font-family:Segoe UI,Arial,sans-serif;color:#201f1e;'>");
        sb.AppendLine($"<p>Please find attached a warning letter regarding <strong>{Encode(model.ViolationTitle)}</strong>.</p>");
        sb.AppendLine("<table style='border-collapse:collapse;'>");
        sb.AppendLine($"<tr><td style='padding:4px 12px 4px 0;'><strong>Employee</strong></td><td style='padding:4px 0;'>{Encode(model.EmployeeName)}</td></tr>");
        sb.AppendLine($"<tr><td style='padding:4px 12px 4px 0;'><strong>Vehicle</strong></td><td style='padding:4px 0;'>{Encode(model.VehicleHyoungNo)} / {Encode(model.NumberPlate)}</td></tr>");
        sb.AppendLine($"<tr><td style='padding:4px 12px 4px 0;'><strong>Period</strong></td><td style='padding:4px 0;'>{Encode(model.PeriodStart)} to {Encode(model.PeriodEnd)}</td></tr>");
        sb.AppendLine($"<tr><td style='padding:4px 12px 4px 0;'><strong>Site</strong></td><td style='padding:4px 0;'>{Encode(model.SiteName)}</td></tr>");
        sb.AppendLine("</table>");
        sb.AppendLine("<p>Review the attached letter and acknowledge receipt through the normal disciplinary process.</p>");
        sb.AppendLine("<p>Regards,<br />Fleet Compliance Office</p>");
        sb.AppendLine("</body></html>");
        return sb.ToString();
    }

    private static string Encode(string value)
    {
        return WebUtility.HtmlEncode(value ?? string.Empty);
    }
}