/**
 * File: ProviderAttribute.cs
 * Purpose: Legacy vehicle-tracking provider discovery attribute retained during the
 *          GPSGate migration. ProviderRegistry in FMS.Infrastructure still reads this
 *          type until the registry is fully replaced by FMS.Devices.Core.
 * Dependencies: System.Attribute
 * Last Modified: 2026-04-30
 */
using System;

namespace FMS.Infrastructure.VehicleTracking.Factory
{
    /// <summary>
    /// Attribute to mark and describe provider implementations.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
    public class ProviderAttribute : Attribute
    {
        /// <summary>
        /// Provider name (unique identifier).
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Provider display name.
        /// </summary>
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>
        /// Provider description.
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Provider version.
        /// </summary>
        public string Version { get; set; } = "1.0.0";

        public ProviderAttribute(string name)
        {
            Name = name;
            DisplayName = name;
        }
    }
}
