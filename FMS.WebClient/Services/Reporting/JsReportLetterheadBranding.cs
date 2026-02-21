/**
 * File: JsReportLetterheadBranding.cs
 * Purpose: Injects company letterhead (logo + CSS) into jsreport HTML templates before rendering.
 * Dependencies: ILogger, System.IO
 * Last Modified: 2026-02-18
 *
 * Key Functions:
 * - Apply: Injects letterhead CSS and HTML block into a template string
 * - LoadLogoDataUri: Reads the logo file and converts it to a base64 data URI
 */
using Microsoft.Extensions.Logging;
using System;
using System.IO;

namespace FMS.WebClient.Services.Reporting
{
    /// <summary>
    /// Handles letterhead branding injection: resolves the company logo, converts it to a
    /// base64 data URI, and injects the corresponding CSS/HTML into report templates.
    /// </summary>
    internal sealed class JsReportLetterheadBranding
    {
        private readonly ILogger _logger;
        private readonly string _logoPath;
        private readonly string _logoDataUri;

        public string LogoPath => _logoPath;

        public JsReportLetterheadBranding(ILogger logger, string logoPath)
        {
            _logger = logger;
            _logoPath = logoPath;
            _logoDataUri = LoadLogoDataUri(logoPath);
        }

        // ─── Public API ───────────────────────────────────────────────────────────

        /// <summary>
        /// Injects letterhead CSS and an image/placeholder block into the template.
        /// No-ops if the template already contains the letterhead marker.
        /// </summary>
        public string Apply(string templateContent)
        {
            if (string.IsNullOrWhiteSpace(templateContent))
                return templateContent;

            if (templateContent.Contains("fms-report-letterhead", StringComparison.OrdinalIgnoreCase))
                return templateContent;

            var result = InjectCss(templateContent);
            result = InjectHtmlBlock(result);
            return result;
        }

        // ─── CSS injection ────────────────────────────────────────────────────────

        private static string InjectCss(string template)
        {
            const string styleEndTag = "</style>";
            const string headEndTag  = "</head>";
            var css = LetterheadCss();

            var styleIdx = template.IndexOf(styleEndTag, StringComparison.OrdinalIgnoreCase);
            if (styleIdx >= 0)
                return template.Insert(styleIdx, css);

            var headIdx = template.IndexOf(headEndTag, StringComparison.OrdinalIgnoreCase);
            var block = $"\n<style>{css}\n</style>\n";
            return headIdx >= 0 ? template.Insert(headIdx, block) : block + template;
        }

        private static string LetterheadCss() => @"
        .fms-report-letterhead { margin: 0 0 18px 0; padding-bottom: 10px; border-bottom: 2px solid #d1d5db; }
        .fms-report-letterhead img { display: block; width: 100%; max-height: 140px; object-fit: contain; object-position: left center; }
        .fms-report-letterhead-missing { border: 1px dashed #9ca3af; background: #f9fafb; color: #374151; font-size: 11px; padding: 10px 12px; border-radius: 4px; }
        .fms-report-letterhead-missing code { background: #eef2f7; padding: 2px 4px; border-radius: 3px; }";

        // ─── HTML block injection ─────────────────────────────────────────────────

        private string InjectHtmlBlock(string template)
        {
            const string bodyTag = "<body";
            var html = BuildHtmlBlock();
            var bodyIdx = template.IndexOf(bodyTag, StringComparison.OrdinalIgnoreCase);
            if (bodyIdx < 0)
                return $"{html}\n{template}";

            var tagEnd = template.IndexOf('>', bodyIdx);
            return tagEnd >= 0
                ? template.Insert(tagEnd + 1, $"\n{html}\n")
                : $"{html}\n{template}";
        }

        private string BuildHtmlBlock()
        {
            if (!string.IsNullOrWhiteSpace(_logoDataUri))
                return $"<div class=\"fms-report-letterhead\">\n        <img src=\"{_logoDataUri}\" alt=\"Company Letterhead\" />\n    </div>";

            return $"<div class=\"fms-report-letterhead fms-report-letterhead-missing\">\n        Letterhead logo not found. Place your letterhead image at:\n        <code>{_logoPath.Replace("\\", "/")}</code>\n    </div>";
        }

        // ─── Logo loading ─────────────────────────────────────────────────────────

        private string LoadLogoDataUri(string logoPath)
        {
            try
            {
                if (!File.Exists(logoPath))
                {
                    _logger.LogWarning(
                        "Letterhead logo not found at {LogoPath}. Place logo file there to show branding in reports.",
                        logoPath);
                    return string.Empty;
                }

                var bytes = File.ReadAllBytes(logoPath);
                if (bytes.Length == 0)
                {
                    _logger.LogWarning("Letterhead logo file is empty at {LogoPath}", logoPath);
                    return string.Empty;
                }

                var mime = MimeTypeFor(Path.GetExtension(logoPath));
                return $"data:{mime};base64,{Convert.ToBase64String(bytes)}";
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load letterhead logo from {LogoPath}", logoPath);
                return string.Empty;
            }
        }

        private static string MimeTypeFor(string ext) => ext.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".svg"            => "image/svg+xml",
            ".gif"            => "image/gif",
            ".webp"           => "image/webp",
            _                 => "image/png",
        };
    }
}
