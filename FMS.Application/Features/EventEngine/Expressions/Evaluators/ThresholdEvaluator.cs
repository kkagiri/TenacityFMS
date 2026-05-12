/**
 * File: ThresholdEvaluator.cs
 * Purpose: Generic numeric threshold evaluator. Compares a named field from the event's
 *          Data dictionary against a threshold using configurable operators.
 * Dependencies: IExpressionEvaluator, FMSEvent
 * Last Modified: 2026-02-11
 *
 * Conditions JSON format:
 * { "field": "SomeNumericField", "operator": ">=", "value": 80 }
 *
 * Supported operators: >=, <=, >, <, ==, !=
 */

using System;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Generic threshold evaluator. Reads a named field from FMSEvent.Data
    /// and compares it against a threshold value using a configurable operator.
    /// Register this for event types that only need simple numeric comparison.
    /// </summary>
    public class ThresholdEvaluator : IExpressionEvaluator
    {
        public string EventType => "Threshold";

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            try
            {
                using var doc = JsonDocument.Parse(conditionsJson);
                var root = doc.RootElement;

                if (!root.TryGetProperty("field", out var fieldProp))
                    return true;

                var fieldName = fieldProp.GetString();
                if (string.IsNullOrEmpty(fieldName))
                    return true;

                // Get the value from the event's Data dictionary
                if (!fmsEvent.Data.TryGetValue(fieldName, out var rawValue) || rawValue == null)
                    return true;

                if (!decimal.TryParse(rawValue.ToString(), out var actualValue))
                    return true;

                // Get threshold value
                if (!root.TryGetProperty("value", out var valueProp) || !valueProp.TryGetDecimal(out var threshold))
                    return true;

                // Get operator (default: >=)
                var op = ">=";
                if (root.TryGetProperty("operator", out var opProp))
                {
                    op = opProp.GetString() ?? ">=";
                }

                return op switch
                {
                    ">=" => actualValue >= threshold,
                    "<=" => actualValue <= threshold,
                    ">" => actualValue > threshold,
                    "<" => actualValue < threshold,
                    "==" => actualValue == threshold,
                    "!=" => actualValue != threshold,
                    _ => true
                };
            }
            catch (JsonException)
            {
                return true; // Fail-open on malformed JSON
            }
        }
    }
}
