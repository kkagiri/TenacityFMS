/**
 * File:          DocumentOcrResultDto.cs
 * Purpose:       DTO for OCR extraction results from vehicle document PDFs.
 * Dependencies:  None
 * Last Modified: 2025-07-14
 *
 * Key Properties:
 * - CertificateNumber: Extracted certificate/document number
 * - RegistrationNumber: Extracted vehicle registration for matching
 * - MatchedVehicleId: Resolved vehicle ID from registration lookup
 */
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class DocumentOcrResultDto
{
    public string? CertificateNumber { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? ChassisNumber { get; set; }
    public string? CommencingDate { get; set; }
    public string? ExpiryDate { get; set; }
    public string? IssuedBy { get; set; }
    public string? PolicyNumber { get; set; }
    public string? Tonnage { get; set; }
    public int? MatchedVehicleId { get; set; }
    public string? MatchedVehicleRegistration { get; set; }
    public float ConfidenceScore { get; set; }
    public string? RawExtractedText { get; set; }
    public List<string> Warnings { get; set; } = new();
}
