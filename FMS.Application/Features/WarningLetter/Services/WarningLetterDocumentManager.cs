/**
 * File: WarningLetterDocumentManager.cs
 * Purpose: Encapsulates warning-letter document storage, PDF retrieval helpers, and QR validation.
 * Dependencies: Docnet, ZXing, SystemConfigurationService, IFormFile
 * Last Modified: 2026-04-21
 *
 * Key Functions:
 * - SavePdfToDiskAsync(): Persists generated warning letter PDFs to the configured storage path.
 * - SaveUploadedDocumentToDiskAsync(): Stores approved-letter and signed-copy uploads.
 * - ValidateUploadedDocumentQrAsync(): Verifies uploaded PDFs belong to the current warning letter.
 */
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Docnet.Core;
using Docnet.Core.Models;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Services.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using ZXing;
using ZXing.Common;
using WarningLetterEntity = FMS.Domain.Entities.Features.WarningLetterManagement.WarningLetter;

namespace FMS.Application.Features.WarningLetter.Services;

internal sealed class WarningLetterDocumentManager
{
    private const string PdfStoragePathConfigKey = "WarningLetter:PdfStoragePath";
    private const string DefaultPdfStoragePath = @"C:\FMSData\reports\warning-letters";
    private const string DefaultUploadedDocumentStoragePath = @"C:\FMSData\uploads\warning-letters";
    private const string UploadedDocumentRelativeRoot = "warning-letters";

    private readonly ISystemConfigurationService _systemConfigurationService;
    private readonly ILogger _logger;

    public WarningLetterDocumentManager(ISystemConfigurationService systemConfigurationService, ILogger logger)
    {
        _systemConfigurationService = systemConfigurationService;
        _logger = logger;
    }

    public async Task<string> SavePdfToDiskAsync(WarningLetterEntity warningLetter, byte[] pdfBytes, string fileName, CancellationToken cancellationToken)
    {
        var configuredBasePath = await _systemConfigurationService.GetConfigurationValueAsync(PdfStoragePathConfigKey, cancellationToken);
        var basePath = string.IsNullOrWhiteSpace(configuredBasePath) ? DefaultPdfStoragePath : configuredBasePath.Trim();
        var yearPath = Path.Combine(basePath, warningLetter.LetterDate.Year.ToString());

        Directory.CreateDirectory(yearPath);
        var fullPath = Path.Combine(yearPath, fileName);
        await File.WriteAllBytesAsync(fullPath, pdfBytes, cancellationToken);
        return fullPath;
    }

    public async Task<string> SaveUploadedDocumentToDiskAsync(string relativeDirectory, string storedFileName, IFormFile file, CancellationToken cancellationToken)
    {
        var warningLetterDirectory = Path.Combine(DefaultUploadedDocumentStoragePath, relativeDirectory);
        Directory.CreateDirectory(warningLetterDirectory);

        var fullPath = Path.Combine(warningLetterDirectory, storedFileName);
        await using var stream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await file.CopyToAsync(stream, cancellationToken);
        return Path.Combine(UploadedDocumentRelativeRoot, relativeDirectory, storedFileName).Replace('\\', '/');
    }

    public string GetUploadedDocumentFullPath(string relativePath)
    {
        var stripped = relativePath.StartsWith($"{UploadedDocumentRelativeRoot}/", StringComparison.OrdinalIgnoreCase)
            ? relativePath.Substring($"{UploadedDocumentRelativeRoot}/".Length)
            : relativePath;

        return Path.Combine(DefaultUploadedDocumentStoragePath, stripped.Replace('/', Path.DirectorySeparatorChar));
    }

    public async Task<List<string>> ValidateUploadedDocumentQrAsync(IFormFile file, WarningLetterEntity warningLetter, CancellationToken cancellationToken)
    {
        var expectedReferenceNumber = BuildReferenceNumber(warningLetter);
        var uploadedReferenceNumber = await TryReadWarningLetterReferenceFromPdfQrAsync(file, cancellationToken);

        if (string.IsNullOrWhiteSpace(uploadedReferenceNumber))
        {
            return new List<string>
            {
                "Could not read a warning letter QR code from page 1 of the uploaded PDF. Upload the official warning letter PDF for this record."
            };
        }

        if (!string.Equals(uploadedReferenceNumber, expectedReferenceNumber, StringComparison.OrdinalIgnoreCase))
        {
            return new List<string>
            {
                $"Uploaded document QR does not match this warning letter. Expected reference '{expectedReferenceNumber}' but found '{uploadedReferenceNumber}'."
            };
        }

        return new List<string>();
    }

    public async Task<EmailAttachmentDto?> BuildSignedCopyAttachmentAsync(WarningLetterEntity warningLetter, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(warningLetter.SignedCopyFilePath))
        {
            return null;
        }

        var fullPath = GetUploadedDocumentFullPath(warningLetter.SignedCopyFilePath);
        if (!File.Exists(fullPath))
        {
            _logger.LogWarning("Signed copy attachment file was not found for warning letter {WarningLetterId} at {Path}", warningLetter.Id, fullPath);
            return null;
        }

        var bytes = await File.ReadAllBytesAsync(fullPath, cancellationToken);
        if (bytes.Length == 0)
        {
            _logger.LogWarning("Signed copy attachment file was empty for warning letter {WarningLetterId} at {Path}", warningLetter.Id, fullPath);
            return null;
        }

        return new EmailAttachmentDto
        {
            FileName = string.IsNullOrWhiteSpace(warningLetter.SignedCopyFileName)
                ? Path.GetFileName(fullPath)
                : warningLetter.SignedCopyFileName,
            ContentType = string.IsNullOrWhiteSpace(warningLetter.SignedCopyContentType)
                ? ResolveStoredDocumentContentType(Path.GetExtension(fullPath))
                : warningLetter.SignedCopyContentType,
            Content = bytes
        };
    }

    internal static string BuildReferenceNumber(WarningLetterEntity warningLetter)
    {
        var suffix = warningLetter.Id > 0 ? warningLetter.Id.ToString("D5") : "PREVIEW";
        return $"WL-{warningLetter.SiteId}-{warningLetter.LetterDate:yyyy}-{suffix}";
    }

    internal static string BuildPdfFileName(WarningLetterEntity warningLetter)
    {
        return $"Warning-Letter-{warningLetter.Id}-{warningLetter.LetterDate:yyyyMMdd}.pdf";
    }

    internal static string ResolveStoredDocumentContentType(string extension)
    {
        return extension.ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".svg" => "image/svg+xml",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "image/png"
        };
    }

    private async Task<string?> TryReadWarningLetterReferenceFromPdfQrAsync(IFormFile file, CancellationToken cancellationToken)
    {
        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream, cancellationToken);
            var pdfBytes = stream.ToArray();

            if (pdfBytes.Length == 0)
            {
                return null;
            }

            using var docReader = DocLib.Instance.GetDocReader(pdfBytes, new PageDimensions(1080, 1920));
            if (docReader.GetPageCount() <= 0)
            {
                return null;
            }

            using var pageReader = docReader.GetPageReader(0);
            var rawBytes = pageReader.GetImage();
            var width = pageReader.GetPageWidth();
            var height = pageReader.GetPageHeight();

            if (rawBytes == null || rawBytes.Length == 0 || width <= 0 || height <= 0)
            {
                return null;
            }

            var qrPayload = TryDecodeQrPayload(rawBytes, width, height)
                ?? TryDecodeFooterQrPayload(rawBytes, width, height);

            return ExtractReferenceNumberFromQrPayload(qrPayload);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read warning letter QR from uploaded PDF {FileName}", file.FileName);
            return null;
        }
    }

    private static string? TryDecodeFooterQrPayload(byte[] rawBytes, int width, int height)
    {
        var footerWidth = Math.Max(1, (int)(width * 0.35));
        var footerHeight = Math.Max(1, (int)(height * 0.28));
        var startX = Math.Max(0, width - footerWidth);
        var startY = Math.Max(0, height - footerHeight);

        var croppedRawBytes = CropRawBytes(rawBytes, width, height, startX, startY, footerWidth, footerHeight);
        return TryDecodeQrPayload(croppedRawBytes, footerWidth, footerHeight);
    }

    private static string? TryDecodeQrPayload(byte[] rawBytes, int width, int height)
    {
        var barcodeReader = new BarcodeReaderGeneric
        {
            AutoRotate = true,
            Options = new DecodingOptions
            {
                TryHarder = true,
                PossibleFormats = new List<BarcodeFormat> { BarcodeFormat.QR_CODE }
            }
        };

        var luminanceSource = new RGBLuminanceSource(rawBytes, width, height, RGBLuminanceSource.BitmapFormat.BGRA32);
        var result = barcodeReader.Decode(luminanceSource);
        return string.IsNullOrWhiteSpace(result?.Text)
            ? null
            : result.Text.Trim();
    }

    private static string? ExtractReferenceNumberFromQrPayload(string? qrPayload)
    {
        if (string.IsNullOrWhiteSpace(qrPayload))
        {
            return null;
        }

        var lines = qrPayload
            .Split(new[] { "\r\n", "\n", "\r" }, StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmedLine))
            {
                continue;
            }

            if (trimmedLine.StartsWith("Reference:", StringComparison.OrdinalIgnoreCase))
            {
                return trimmedLine[(trimmedLine.IndexOf(':') + 1)..].Trim();
            }

            return trimmedLine;
        }

        return null;
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
}