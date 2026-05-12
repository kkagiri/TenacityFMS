using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Vehicle.DTOs
{
    /// <summary>
    /// Represents a geofence area for vehicle monitoring
    /// </summary>
    public class GeofenceDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public GeofenceType Type { get; set; }
        public bool IsActive { get; set; }
        public List<GeofenceCoordinate> Coordinates { get; set; } = new();
        public decimal? Radius { get; set; } // For circle type
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// GeoJSON representation of the geofence geometry for map rendering
        /// </summary>
        public string? GeometryJson { get; set; }
    }

    public enum GeofenceType
    {
        Circle = 1,
        Polygon = 2,
        Route = 3
    }

    public class GeofenceCoordinate
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public int Order { get; set; }
    }
}
