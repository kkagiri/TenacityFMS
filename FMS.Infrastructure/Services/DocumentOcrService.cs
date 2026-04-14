/**
 * File:          DocumentOcrService.cs
 * Purpose:       OCR extraction from vehicle document PDFs using PdfPig (text layer) and Tesseract (scanned PDFs).
 * Dependencies:  UglyToad.PdfPig, Tesseract, Docnet.Core, IDocumentOcrService
 * Last Modified: 2025-07-14
 *
 * Key Functions:
 * - ExtractInsuranceDataAsync(): Extracts insurance fields from PDF via text layer or OCR fallback
 * - StoreTempFileAsync(): Stores uploaded file to temp directory with GUID token
 * - GetTempFilePath(): Resolves temp file path from token
 * - CleanupTempFile(): Deletes temp file by token
 */
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Application.Features.VehicleDocumentManagement.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Tesseract;
using UglyToad.PdfPig;

namespace FMS.Infrastructure.Services;

public class DocumentOcrService : IDocumentOcrService
{
    private readonly ILogger<DocumentOcrService> _logger;
    private readonly string _tessDataPath;
    private readonly string _tessLanguage;
    private readonly string _tempDirectory;
    private readonly string _debugDirectory;
    private readonly ConcurrentDictionary<string, TempFileInfo> _tempFiles = new();

    public DocumentOcrService(ILogger<DocumentOcrService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _tessDataPath = configuration["Ocr:TessDataPath"] ?? @"C:\tessdata";
        _tessLanguage = configuration["Ocr:Language"] ?? "eng";
        _tempDirectory = Path.Combine(Path.GetTempPath(), "FMS_OCR_Temp");
        _debugDirectory = Path.Combine(_tempDirectory, "debug");

        if (!Directory.Exists(_tempDirectory))
        {
            Directory.CreateDirectory(_tempDirectory);
        }

        if (!Directory.Exists(_debugDirectory))
        {
            Directory.CreateDirectory(_debugDirectory);
        }
    }

    public async Task<DocumentOcrResultDto> ExtractInsuranceDataAsync(IFormFile file)
    {
        var result = new DocumentOcrResultDto();

        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;
            var fileBytes = stream.ToArray();

            var extractedText = string.Empty;
            var isPdf = file.ContentType == "application/pdf" ||
                        Path.GetExtension(file.FileName)?.ToLowerInvariant() == ".pdf";

            if (isPdf)
            {
                extractedText = ExtractTextFromPdfPig(fileBytes);

                if (string.IsNullOrWhiteSpace(extractedText) || extractedText.Length < 50)
                {
                    _logger.LogInformation("PdfPig returned insufficient text ({Length} chars), falling back to Tesseract OCR for {FileName}",
                        extractedText?.Length ?? 0, file.FileName);

                    extractedText = ExtractTextFromPdfWithTesseract(fileBytes, file.FileName);
                }
            }
            else
            {
                extractedText = ExtractTextFromImageWithTesseract(fileBytes);
            }

            result.RawExtractedText = extractedText;

            _logger.LogInformation("OCR text extraction for '{FileName}': {Length} chars extracted (isPdf={IsPdf})",
                file.FileName, extractedText?.Length ?? 0, isPdf);

            if (string.IsNullOrWhiteSpace(extractedText))
            {
                result.Warnings.Add("Could not extract any text from the document");
                result.ConfidenceScore = 0;
                return result;
            }

            ParseInsuranceFields(extractedText, result);
            DeriveInsuranceDates(result);
            CalculateConfidence(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting data from document {FileName}", file.FileName);
            result.Warnings.Add($"Error processing document: {ex.Message}");
            result.ConfidenceScore = 0;
        }

        return result;
    }

    public async Task<string> StoreTempFileAsync(IFormFile file)
    {
        var token = Guid.NewGuid().ToString("N");
        var extension = Path.GetExtension(file.FileName) ?? ".pdf";
        var tempFileName = $"{token}{extension}";
        var tempFilePath = Path.Combine(_tempDirectory, tempFileName);

        using (var stream = new FileStream(tempFilePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        _tempFiles[token] = new TempFileInfo
        {
            FilePath = tempFilePath,
            OriginalFileName = file.FileName,
            ContentType = file.ContentType,
            CreatedAt = DateTime.UtcNow
        };

        return token;
    }

    public string? GetTempFilePath(string fileToken)
    {
        if (_tempFiles.TryGetValue(fileToken, out var info) && File.Exists(info.FilePath))
        {
            return info.FilePath;
        }
        return null;
    }

    public void CleanupTempFile(string fileToken)
    {
        if (_tempFiles.TryRemove(fileToken, out var info))
        {
            try
            {
                if (File.Exists(info.FilePath))
                {
                    File.Delete(info.FilePath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cleanup temp file {FilePath}", info.FilePath);
            }
        }
    }

    private string ExtractTextFromPdfPig(byte[] pdfBytes)
    {
        try
        {
            using var document = PdfDocument.Open(pdfBytes);
            var sb = new StringBuilder();

            foreach (var page in document.GetPages())
            {
                sb.AppendLine(page.Text);
            }

            return sb.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "PdfPig text extraction failed, will try Tesseract");
            return string.Empty;
        }
    }

    private string ExtractTextFromPdfWithTesseract(byte[] pdfBytes, string fileName)
    {
        try
        {
            var sb = new StringBuilder();

            using var docReader = Docnet.Core.DocLib.Instance.GetDocReader(pdfBytes, new Docnet.Core.Models.PageDimensions(1080, 1920));
            using var engine = new TesseractEngine(_tessDataPath, _tessLanguage, EngineMode.Default);
            engine.DefaultPageSegMode = PageSegMode.Auto;

            for (var i = 0; i < docReader.GetPageCount(); i++)
            {
                using var pageReader = docReader.GetPageReader(i);
                var rawBytes = pageReader.GetImage();
                var width = pageReader.GetPageWidth();
                var height = pageReader.GetPageHeight();

                if (rawBytes == null || rawBytes.Length == 0 || width <= 0 || height <= 0)
                    continue;

                var bmpBytes = ConvertRawBytesToBmp(rawBytes, width, height);
                var topBandHeight = Math.Max(1, (int)(height * 0.43));
                var topBandRawBytes = CropRawBytes(rawBytes, width, height, 0, 0, width, topBandHeight);
                var topBandBmpBytes = ConvertRawBytesToBmp(topBandRawBytes, width, topBandHeight);

                if (i == 0)
                {
                    SaveDebugArtifact(fileName, "page-1-full", bmpBytes, "bmp");
                    SaveDebugArtifact(fileName, "page-1-top-band", topBandBmpBytes, "bmp");
                }

                var topBandText = ExtractTextFromBmpWithTesseract(engine, topBandBmpBytes);
                var fullPageText = ExtractTextFromBmpWithTesseract(engine, bmpBytes);

                _logger.LogInformation(
                    "Tesseract OCR for {FileName} page {PageNumber}: top-band={TopBandLength} chars, full-page={FullPageLength} chars",
                    fileName,
                    i + 1,
                    topBandText.Length,
                    fullPageText.Length);

                sb.AppendLine(topBandText);
                sb.AppendLine(fullPageText);
            }

            SaveDebugArtifact(fileName, "combined-ocr", Encoding.UTF8.GetBytes(sb.ToString()), "txt");

            return sb.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Tesseract PDF OCR extraction failed");
            return string.Empty;
        }
    }

    private string ExtractTextFromImageWithTesseract(byte[] imageBytes)
    {
        try
        {
            using var engine = new TesseractEngine(_tessDataPath, _tessLanguage, EngineMode.Default);
            using var pix = Pix.LoadFromMemory(imageBytes);
            using var page = engine.Process(pix);

            return page.GetText();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Tesseract image OCR extraction failed");
            return string.Empty;
        }
    }

    private static string ExtractTextFromBmpWithTesseract(TesseractEngine engine, byte[] bmpBytes)
    {
        using var pix = Pix.LoadFromMemory(bmpBytes);
        using var page = engine.Process(pix);
        return page.GetText() ?? string.Empty;
    }

    private static byte[] CropRawBytes(byte[] rawBytes, int sourceWidth, int sourceHeight, int startX, int startY, int cropWidth, int cropHeight)
    {
        var output = new byte[cropWidth * cropHeight * 4];

        for (var y = 0; y < cropHeight; y++)
        {
            var sourceY = startY + y;
            if (sourceY >= sourceHeight)
            {
                break;
            }

            for (var x = 0; x < cropWidth; x++)
            {
                var sourceX = startX + x;
                if (sourceX >= sourceWidth)
                {
                    break;
                }

                var sourceIndex = ((sourceY * sourceWidth) + sourceX) * 4;
                var targetIndex = ((y * cropWidth) + x) * 4;

                if (sourceIndex + 3 >= rawBytes.Length || targetIndex + 3 >= output.Length)
                {
                    continue;
                }

                output[targetIndex] = rawBytes[sourceIndex];
                output[targetIndex + 1] = rawBytes[sourceIndex + 1];
                output[targetIndex + 2] = rawBytes[sourceIndex + 2];
                output[targetIndex + 3] = rawBytes[sourceIndex + 3];
            }
        }

        return output;
    }

    private void SaveDebugArtifact(string fileName, string suffix, byte[] content, string extension)
    {
        try
        {
            var safeFileName = string.Concat(Path.GetFileNameWithoutExtension(fileName)
                .Select(ch => Path.GetInvalidFileNameChars().Contains(ch) ? '_' : ch));
            var path = Path.Combine(_debugDirectory, $"{DateTime.UtcNow:yyyyMMdd_HHmmssfff}_{safeFileName}_{suffix}.{extension}");
            File.WriteAllBytes(path, content);
            _logger.LogInformation("Saved OCR debug artifact for {FileName}: {Path}", fileName, path);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to save OCR debug artifact for {FileName}", fileName);
        }
    }

    private static byte[] ConvertRawBytesToBmp(byte[] rawBytes, int width, int height)
    {
        var bmpFileHeaderSize = 14;
        var bmpInfoHeaderSize = 40;
        var rowSize = ((width * 3 + 3) / 4) * 4;
        var imageSize = rowSize * height;
        var fileSize = bmpFileHeaderSize + bmpInfoHeaderSize + imageSize;

        using var ms = new MemoryStream(fileSize);
        using var bw = new BinaryWriter(ms);

        // BMP File Header
        bw.Write((byte)'B');
        bw.Write((byte)'M');
        bw.Write(fileSize);
        bw.Write((short)0);
        bw.Write((short)0);
        bw.Write(bmpFileHeaderSize + bmpInfoHeaderSize);

        // BMP Info Header
        bw.Write(bmpInfoHeaderSize);
        bw.Write(width);
        bw.Write(-height); // negative = top-down
        bw.Write((short)1);
        bw.Write((short)24);
        bw.Write(0); // compression
        bw.Write(imageSize);
        bw.Write(0); // x pixels per meter
        bw.Write(0); // y pixels per meter
        bw.Write(0); // colors used
        bw.Write(0); // important colors

        // Convert BGRA to BGR row by row
        for (var y = 0; y < height; y++)
        {
            for (var x = 0; x < width; x++)
            {
                var srcIdx = (y * width + x) * 4;
                if (srcIdx + 2 < rawBytes.Length)
                {
                    bw.Write(rawBytes[srcIdx]);     // B
                    bw.Write(rawBytes[srcIdx + 1]); // G
                    bw.Write(rawBytes[srcIdx + 2]); // R
                }
                else
                {
                    bw.Write((byte)255);
                    bw.Write((byte)255);
                    bw.Write((byte)255);
                }
            }

            // Padding to 4-byte boundary
            var padding = rowSize - width * 3;
            for (var p = 0; p < padding; p++)
            {
                bw.Write((byte)0);
            }
        }

        return ms.ToArray();
    }

    private static void ParseInsuranceFields(string text, DocumentOcrResultDto result)
    {
        // Normalize whitespace for regex matching
        var normalizedText = Regex.Replace(text, @"\s+", " ").Trim();
        var headerText = normalizedText.Length > 450 ? normalizedText[..450] : normalizedText;

        // Certificate Number
        var certMatch = Regex.Match(headerText, @"(?:CERTIFICATE\s+OF\s+INSURANCE|DUPLICATE\s+CERTIFICATE\s+OF\s+INSURANCE|FILE\s+COPY\s+CERTIFICATE\s+OF\s+INSURANCE).*?(?:NO|N0)\s*[:.;]?\s*([A-Z]?\d{6,12})", RegexOptions.IgnoreCase);
        if (!certMatch.Success)
        {
            certMatch = Regex.Match(headerText, @"(?:CERT(?:IFICATE)?\s*(?:NO|NUMBER)|\bNO\b)\s*[:.;]?\s*([A-Z]?\d{6,12})", RegexOptions.IgnoreCase);
        }
        if (certMatch.Success)
        {
            result.CertificateNumber = certMatch.Groups[1].Value.Trim();
        }
        else
        {
            var headerCodeMatch = Regex.Match(headerText, @"\b([A-Z]\d{7,12})\b", RegexOptions.IgnoreCase);
            if (headerCodeMatch.Success)
            {
                result.CertificateNumber = headerCodeMatch.Groups[1].Value.Trim().ToUpperInvariant();
            }
        }

        // Registration Number (Kenyan format: 3 letters + 3 digits + optional letter, e.g., KCP721U)
        var regMatch = Regex.Match(normalizedText, @"(?:REGISTRATION|REG\.?)\s*(?:No|Number|#|MARK)?\s*[.:;]?\s*([A-Z]{2,3}\s*\d{3}\s*[A-Z]?)", RegexOptions.IgnoreCase);
        if (regMatch.Success)
        {
            result.RegistrationNumber = Regex.Replace(regMatch.Groups[1].Value.Trim(), @"\s+", "");
        }
        else
        {
            // Fallback: look for standalone Kenyan plate pattern
            var plateMatch = Regex.Match(normalizedText, @"\b(K[A-Z]{2}\s*\d{3}\s*[A-Z])\b", RegexOptions.IgnoreCase);
            if (plateMatch.Success)
            {
                result.RegistrationNumber = Regex.Replace(plateMatch.Groups[1].Value.Trim(), @"\s+", "");
            }
        }

        // Commencing/Issue Date
        var commencingMatch = Regex.Match(normalizedText, @"(?:COMMENCING|EFFECTIVE|FROM)\s*(?:DATE)?\s*[.:;]?\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})", RegexOptions.IgnoreCase);
        if (commencingMatch.Success)
        {
            result.CommencingDate = NormalizeDate(commencingMatch.Groups[1].Value.Trim());
        }

        // Expiry Date
        var expiryMatch = Regex.Match(normalizedText, @"(?:EXPIR(?:ING|Y)|UNTIL|TO|ENDING)\s*(?:DATE)?\s*[.:;]?\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})", RegexOptions.IgnoreCase);
        if (expiryMatch.Success)
        {
            result.ExpiryDate = NormalizeDate(expiryMatch.Groups[1].Value.Trim());
        }

        // Issued By / Insurance Company
        var gaIssuerMatch = Regex.Match(normalizedText, @"\bGA\s+INSURANCE\s+LIMITED\b", RegexOptions.IgnoreCase);
        if (gaIssuerMatch.Success)
        {
            result.IssuedBy = "GA Insurance Limited";
        }

        var issuedByMatch = Regex.Match(normalizedText, @"(?:ISSUED\s*BY|ISSUING\s*OFFICE|INSURER|INSURANCE\s*(?:COMPANY|CO\.?))\s*[.:;]?\s*([A-Za-z][A-Za-z\s&,.]{3,60}?)(?=\s*(?:SIGNED|PHONE|INTERMEDIARY|P\.?O|ADDRESS|POLICY|CERTIFICATE|COMMERCIAL|$))", RegexOptions.IgnoreCase);
        if (issuedByMatch.Success)
        {
            var issuer = issuedByMatch.Groups[1].Value.Trim().Trim(',', '.', ':', ';');
            if (string.IsNullOrWhiteSpace(result.IssuedBy) || result.IssuedBy.Length < 4)
            {
                result.IssuedBy = issuer;
            }
        }

        if (string.IsNullOrWhiteSpace(result.IssuedBy) || result.IssuedBy.Length < 4)
        {
            // Fallback: look for common Kenyan insurer names
            var insurerMatch = Regex.Match(normalizedText, @"((?:GA|AAR|APA|AIG|CIC|ICEA|JUBILEE|BRITAM|MADISON|HERITAGE|SANLAM|UAP|KENINDIA|DIRECTLINE|PIONEER|TRIDENT|MONARCH|GEMINIA|FIRST\s*ASSURANCE|KENYA\s*ORIENT|PACIS|MAYFAIR|METROPOLITAN\s*CANNON)\s*(?:INSURANCE|ASSURANCE)?(?:\s*(?:LIMITED|LTD|CO\.?))?)", RegexOptions.IgnoreCase);
            if (insurerMatch.Success)
            {
                result.IssuedBy = insurerMatch.Groups[1].Value.Trim();
            }
        }

        // Chassis Number
        var chassisMatch = Regex.Match(normalizedText, @"(?:CHASSIS|VIN)\s*(?:No|Number|#)?\s*[.:;]?\s*([A-Z0-9]{10,17})", RegexOptions.IgnoreCase);
        if (chassisMatch.Success)
        {
            result.ChassisNumber = chassisMatch.Groups[1].Value.Trim();
        }

        // Policy Number
        var policyMatch = Regex.Match(normalizedText, @"(?:POLICY|REF(?:ERENCE)?\s*NUMBER|REF\s*NUMBER)\s*(?:No|Number|#)?\s*[.:;]?\s*([A-Z0-9\-/]{8,})", RegexOptions.IgnoreCase);
        if (policyMatch.Success)
        {
            result.PolicyNumber = policyMatch.Groups[1].Value.Trim();
        }

        // Tonnage
        var tonnageMatch = Regex.Match(normalizedText, @"TONNAGE\s*[.:;]?\s*(\d+(?:\.\d+)?)", RegexOptions.IgnoreCase);
        if (tonnageMatch.Success)
        {
            result.Tonnage = tonnageMatch.Groups[1].Value.Trim();
        }
    }

    private static void DeriveInsuranceDates(DocumentOcrResultDto result)
    {
        if (string.IsNullOrWhiteSpace(result.CommencingDate) &&
            DateTime.TryParseExact(result.ExpiryDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var expiryDate))
        {
            result.CommencingDate = expiryDate.AddYears(-1).ToString("yyyy-MM-dd");
            result.Warnings.Add("Commencing date derived from expiry date minus one year");
        }

        if (string.IsNullOrWhiteSpace(result.ExpiryDate) &&
            DateTime.TryParseExact(result.CommencingDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var commencingDate))
        {
            result.ExpiryDate = commencingDate.AddYears(1).ToString("yyyy-MM-dd");
            result.Warnings.Add("Expiry date derived from commencing date plus one year");
        }
    }

    private static string? NormalizeDate(string dateStr)
    {
        // Try parsing common date formats
        string[] formats = { "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "d-M-yyyy", "dd.MM.yyyy", "d.M.yyyy",
                             "MM/dd/yyyy", "M/d/yyyy" };

        if (DateTime.TryParseExact(dateStr.Replace('.', '/').Replace('-', '/'),
            formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
        {
            return parsed.ToString("yyyy-MM-dd");
        }

        return dateStr;
    }

    private void CalculateConfidence(DocumentOcrResultDto result)
    {
        // Weighted scoring: critical fields worth more
        float score = 0;
        float maxScore = 0;

        // Critical fields (weight 2.0 each)
        var criticalFields = new (string? Value, string Name, float Weight)[]
        {
            (result.RegistrationNumber, "RegistrationNumber", 2.0f),
            (result.ExpiryDate, "ExpiryDate", 2.0f),
            (result.CommencingDate, "CommencingDate", 1.5f),
            (result.IssuedBy, "IssuedBy", 1.5f),
            (result.CertificateNumber, "CertificateNumber", 1.5f),
        };

        // Optional fields (weight 1.0 each)
        var optionalFields = new (string? Value, string Name, float Weight)[]
        {
            (result.PolicyNumber, "PolicyNumber", 1.0f),
            (result.ChassisNumber, "ChassisNumber", 0.5f),
            (result.Tonnage, "Tonnage", 0.5f),
        };

        foreach (var field in criticalFields.Concat(optionalFields))
        {
            maxScore += field.Weight;
            if (!string.IsNullOrEmpty(field.Value))
            {
                score += field.Weight;
                _logger.LogDebug("OCR field '{FieldName}' extracted: '{Value}'", field.Name, field.Value);
            }
        }

        result.ConfidenceScore = maxScore > 0 ? score / maxScore : 0;

        // Log overall extraction summary
        _logger.LogInformation(
            "OCR confidence {Score:P0} — Reg: {Reg}, Cert: {Cert}, From: {From}, To: {To}, Issuer: {Issuer}, Policy: {Policy}, Chassis: {Chassis}",
            result.ConfidenceScore,
            result.RegistrationNumber ?? "(none)",
            result.CertificateNumber ?? "(none)",
            result.CommencingDate ?? "(none)",
            result.ExpiryDate ?? "(none)",
            result.IssuedBy ?? "(none)",
            result.PolicyNumber ?? "(none)",
            result.ChassisNumber ?? "(none)");

        // Log raw text snippet for debugging when confidence is low
        if (result.ConfidenceScore < 0.3f && !string.IsNullOrEmpty(result.RawExtractedText))
        {
            var snippet = result.RawExtractedText.Length > 500
                ? result.RawExtractedText.Substring(0, 500)
                : result.RawExtractedText;
            _logger.LogWarning("Low confidence OCR — raw text snippet: {Snippet}", snippet);
        }

        // Add warnings for missing critical fields
        if (string.IsNullOrEmpty(result.CertificateNumber))
            result.Warnings.Add("Could not extract certificate number");
        if (string.IsNullOrEmpty(result.RegistrationNumber))
            result.Warnings.Add("Could not extract vehicle registration number");
        if (string.IsNullOrEmpty(result.CommencingDate))
            result.Warnings.Add("Could not extract commencing/issue date");
        if (string.IsNullOrEmpty(result.ExpiryDate))
            result.Warnings.Add("Could not extract expiry date");
        if (string.IsNullOrEmpty(result.IssuedBy))
            result.Warnings.Add("Could not extract issuing authority");
    }

    private class TempFileInfo
    {
        public string FilePath { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
