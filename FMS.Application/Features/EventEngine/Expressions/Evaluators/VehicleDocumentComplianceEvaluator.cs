/**
 * File: VehicleDocumentComplianceEvaluator.cs
 * Purpose: Evaluates vehicle document compliance events against subtype, site, vehicle,
 *          vehicle type, compliance category, and document type filters.
 * Dependencies: IExpressionEvaluator, VehicleDocumentComplianceEvent.
 * Last Modified: 2026-03-25
 */

using System;
using System.Linq;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    public class VehicleDocumentComplianceEvaluator : IExpressionEvaluator
    {
        public string EventType => VehicleDocumentComplianceEvent.EventTypeName;

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            if (fmsEvent is not VehicleDocumentComplianceEvent documentEvent)
                return false;

            try
            {
                using var doc = JsonDocument.Parse(conditionsJson);
                var root = doc.RootElement;

                if (root.TryGetProperty("subTypeFilter", out var subTypeProp))
                {
                    var subTypeFilter = subTypeProp.GetString();
                    if (!string.IsNullOrWhiteSpace(subTypeFilter) &&
                        !string.Equals(documentEvent.SubType, subTypeFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                if (root.TryGetProperty("_siteIds", out var siteIdsProp) &&
                    siteIdsProp.ValueKind == JsonValueKind.Array &&
                    documentEvent.SiteId.HasValue)
                {
                    var siteIds = siteIdsProp.EnumerateArray()
                        .Where(element => element.ValueKind == JsonValueKind.Number)
                        .Select(element => element.TryGetInt32(out var id) ? id : -1)
                        .Where(id => id > 0)
                        .ToList();

                    if (siteIds.Count > 0 && !siteIds.Contains(documentEvent.SiteId.Value))
                        return false;
                }

                if (root.TryGetProperty("vehicleIdFilter", out var vehicleProp) &&
                    vehicleProp.TryGetInt32(out var vehicleIdFilter) &&
                    documentEvent.VehicleId != vehicleIdFilter)
                {
                    return false;
                }

                if (root.TryGetProperty("vehicleTypeIdFilter", out var vehicleTypeProp) &&
                    vehicleTypeProp.TryGetInt32(out var vehicleTypeIdFilter))
                {
                    if (!documentEvent.VehicleTypeId.HasValue || documentEvent.VehicleTypeId.Value != vehicleTypeIdFilter)
                        return false;
                }

                if (root.TryGetProperty("complianceCategoryFilter", out var categoryProp))
                {
                    var categoryFilter = categoryProp.GetString();
                    if (!string.IsNullOrWhiteSpace(categoryFilter) &&
                        !string.Equals(documentEvent.ComplianceCategoryName, categoryFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                if (root.TryGetProperty("documentTypeFilter", out var documentTypeProp))
                {
                    var documentTypeFilter = documentTypeProp.GetString();
                    if (!string.IsNullOrWhiteSpace(documentTypeFilter) &&
                        !string.Equals(documentEvent.DocumentTypeName, documentTypeFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                return true;
            }
            catch (JsonException)
            {
                return true;
            }
        }
    }
}