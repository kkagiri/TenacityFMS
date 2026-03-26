/**
 * File: VehicleDocumentComplianceEvent.cs
 * Purpose: Event emitted when a vehicle compliance document is expiring soon or has expired.
 * Dependencies: FMSEvent base class.
 * Last Modified: 2026-03-25
 *
 * Key Properties:
 * - VehicleId, VehicleNo, VehicleTypeId: scope resolution for compliance expressions
 * - DocumentId, DocumentTypeName, ComplianceCategoryName: document identity and classification
 * - DocumentFileUrl: optional download link rendered into the email body
 */

using System;
using System.Collections.Generic;
using System.Net;
using System.Text;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted by the vehicle document expiry notifier for due-soon and expired compliance records.
    /// </summary>
    public class VehicleDocumentComplianceEvent : FMSEvent
    {
        public const string EventTypeName = "VehicleDocumentCompliance";

        public string SubType { get; set; } = string.Empty;
        public string SourceComponent { get; set; } = "VehicleDocumentNotifier";
        public string ReferenceType { get; set; } = "VehicleDocument";
        public Guid DocumentId { get; set; }
        public int VehicleId { get; set; }
        public string VehicleNo { get; set; } = string.Empty;
        public int? VehicleTypeId { get; set; }
        public string VehicleTypeName { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public string DocumentTypeName { get; set; } = string.Empty;
        public string ComplianceCategoryName { get; set; } = string.Empty;
        public string DocumentNumber { get; set; } = string.Empty;
        public string IssuingAuthority { get; set; } = string.Empty;
        public string DocumentFileName { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
        public int DaysUntilExpiry { get; set; }
        public int AlertLeadDays { get; set; }
        public string DocumentFileUrl { get; set; } = string.Empty;

        public VehicleDocumentComplianceEvent()
        {
            EventType = EventTypeName;
            EventCategory = "SystemMaintenance";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();
            vars["SubType"] = SubType;
            vars["SourceComponent"] = SourceComponent;
            vars["ReferenceType"] = ReferenceType;
            vars["DocumentId"] = DocumentId.ToString();
            vars["VehicleId"] = VehicleId.ToString();
            vars["VehicleNo"] = VehicleNo;
            vars["VehicleTypeId"] = VehicleTypeId?.ToString() ?? string.Empty;
            vars["VehicleTypeName"] = VehicleTypeName;
            vars["SiteName"] = SiteName;
            vars["DocumentTypeName"] = DocumentTypeName;
            vars["ComplianceCategoryName"] = ComplianceCategoryName;
            vars["DocumentNumber"] = DocumentNumber;
            vars["IssuingAuthority"] = IssuingAuthority;
            vars["DocumentFileName"] = DocumentFileName;
            vars["ExpiryDate"] = ExpiryDate.ToString("yyyy-MM-dd");
            vars["DaysUntilExpiry"] = DaysUntilExpiry.ToString();
            vars["AlertLeadDays"] = AlertLeadDays.ToString();
            vars["DocumentFileUrl"] = DocumentFileUrl;
            vars["HasDocumentLink"] = string.IsNullOrWhiteSpace(DocumentFileUrl) ? "False" : "True";
            return vars;
        }

        public override IReadOnlyCollection<FileAttachmentMetadata> GetFileAttachmentMetadata()
        {
            if (string.IsNullOrWhiteSpace(DocumentFileUrl))
            {
                return Array.Empty<FileAttachmentMetadata>();
            }

            return new[]
            {
                new FileAttachmentMetadata
                {
                    FilePath = DocumentFileUrl,
                    FileName = string.IsNullOrWhiteSpace(DocumentFileName)
                        ? $"vehicle-document-{DocumentId:N}"
                        : DocumentFileName
                }
            };
        }

        public override string? GetCustomEmailBodyHtml()
        {
            var title = SubType.Equals("VehicleDocumentExpired", StringComparison.OrdinalIgnoreCase)
                ? "Vehicle Document Expired"
                : "Vehicle Document Expiring Soon";
            var accentColor = SubType.Equals("VehicleDocumentExpired", StringComparison.OrdinalIgnoreCase)
                ? "#d83b01"
                : "#005fb8";
            var urgencyText = DaysUntilExpiry switch
            {
                < 0 => $"Expired {-DaysUntilExpiry} day(s) ago",
                0 => "Expires today",
                1 => "Expires in 1 day",
                _ => $"Expires in {DaysUntilExpiry} days"
            };

            var safeTitle = WebUtility.HtmlEncode(title);
            var safeMessage = WebUtility.HtmlEncode(Message);
            var safeVehicleNo = WebUtility.HtmlEncode(VehicleNo);
            var safeVehicleType = WebUtility.HtmlEncode(VehicleTypeName);
            var safeSite = WebUtility.HtmlEncode(SiteName);
            var safeCategory = WebUtility.HtmlEncode(ComplianceCategoryName);
            var safeDocType = WebUtility.HtmlEncode(DocumentTypeName);
            var safeDocNumber = WebUtility.HtmlEncode(DocumentNumber);
            var safeAuthority = WebUtility.HtmlEncode(IssuingAuthority);
            var safeExpiry = WebUtility.HtmlEncode(ExpiryDate.ToString("dd MMM yyyy"));
            var safeUrgency = WebUtility.HtmlEncode(urgencyText);
            var safeLink = WebUtility.HtmlEncode(DocumentFileUrl);

            var html = new StringBuilder();
            html.Append("<div style=\"margin:0;padding:24px;background:#f3f2f1;font-family:Segoe UI,Arial,sans-serif;color:#323130;\">");
            html.Append("<div style=\"max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #edebe9;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.06);\">");
            html.Append($"<div style=\"padding:20px 24px;background:{accentColor};color:#ffffff;\">");
            html.Append("<div style=\"font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;\">Vehicle Compliance Event</div>");
            html.Append($"<h1 style=\"margin:8px 0 0;font-size:24px;line-height:1.2;font-weight:600;\">{safeTitle}</h1>");
            html.Append("</div>");
            html.Append("<div style=\"padding:24px;\">");
            html.Append($"<p style=\"margin:0 0 16px;font-size:15px;line-height:1.6;color:#323130;\">{safeMessage}</p>");
            html.Append("<div style=\"display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:20px;\">");
            html.Append($"<div style=\"padding:14px;border-radius:12px;background:#faf9f8;border:1px solid #edebe9;\"><div style=\"font-size:12px;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;\">Vehicle</div><div style=\"margin-top:6px;font-size:16px;font-weight:600;color:#201f1e;\">{safeVehicleNo}</div><div style=\"margin-top:4px;font-size:13px;color:#605e5c;\">{safeVehicleType}</div></div>");
            html.Append($"<div style=\"padding:14px;border-radius:12px;background:#faf9f8;border:1px solid #edebe9;\"><div style=\"font-size:12px;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;\">Compliance</div><div style=\"margin-top:6px;font-size:16px;font-weight:600;color:#201f1e;\">{safeCategory}</div><div style=\"margin-top:4px;font-size:13px;color:#605e5c;\">{safeDocType}</div></div>");
            html.Append($"<div style=\"padding:14px;border-radius:12px;background:#faf9f8;border:1px solid #edebe9;\"><div style=\"font-size:12px;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;\">Expiry</div><div style=\"margin-top:6px;font-size:16px;font-weight:600;color:#201f1e;\">{safeExpiry}</div><div style=\"margin-top:4px;font-size:13px;color:#605e5c;\">{safeUrgency}</div></div>");
            html.Append($"<div style=\"padding:14px;border-radius:12px;background:#faf9f8;border:1px solid #edebe9;\"><div style=\"font-size:12px;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;\">Scope</div><div style=\"margin-top:6px;font-size:16px;font-weight:600;color:#201f1e;\">{safeSite}</div><div style=\"margin-top:4px;font-size:13px;color:#605e5c;\">Authority: {safeAuthority}</div></div>");
            html.Append("</div>");
            html.Append("<div style=\"padding:16px 18px;border-radius:12px;background:#f8f9fb;border:1px solid #edebe9;margin-bottom:20px;\">");
            html.Append("<div style=\"font-size:12px;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:10px;\">Document details</div>");
            html.Append($"<div style=\"font-size:14px;line-height:1.7;color:#323130;\"><strong>Document number:</strong> {safeDocNumber}<br /><strong>Alert lead days:</strong> {AlertLeadDays}<br /><strong>Reference:</strong> {DocumentId}</div>");
            html.Append("</div>");

            if (!string.IsNullOrWhiteSpace(DocumentFileUrl))
            {
                html.Append($"<a href=\"{safeLink}\" style=\"display:inline-block;padding:12px 18px;border-radius:10px;background:{accentColor};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;\">Download document</a>");
                html.Append("<div style=\"margin-top:10px;font-size:12px;color:#605e5c;\">If the button does not open directly, copy the document link into your browser after signing in.</div>");
            }

            html.Append("</div></div></div>");
            return html.ToString();
        }
    }
}