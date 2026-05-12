/**
 * File: LegacyMySqlSearchTermNormalizer.cs
 * Purpose: Normalizes user-entered search text so it can be safely compared against legacy latin1 MySQL columns.
 * Dependencies: System.Globalization, System.Text
 * Last Modified: 2026-03-28
 *
 * Key Functions:
 * - NormalizeForLikeSearch(): Converts Unicode search text into a latin1-compatible form for LIKE queries.
 */
using System.Globalization;
using System.Text;

namespace FMS.Application.Common;

internal static class LegacyMySqlSearchTermNormalizer
{
    public static string NormalizeForLikeSearch(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Trim().Normalize(NormalizationForm.FormKD);
        var builder = new StringBuilder(normalized.Length);
        var previousWasWhitespace = false;

        foreach (var character in normalized)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(character);
            if (unicodeCategory is UnicodeCategory.NonSpacingMark
                or UnicodeCategory.SpacingCombiningMark
                or UnicodeCategory.EnclosingMark)
            {
                continue;
            }

            if (character <= 0x00FF)
            {
                if (char.IsWhiteSpace(character))
                {
                    if (!previousWasWhitespace)
                    {
                        builder.Append(' ');
                        previousWasWhitespace = true;
                    }

                    continue;
                }

                builder.Append(character);
                previousWasWhitespace = false;
            }
        }

        return builder.ToString().Trim();
    }
}