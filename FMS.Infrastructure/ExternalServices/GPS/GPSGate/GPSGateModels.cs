namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate
{
    /// <summary>
    /// GPSGate API response model for user status
    /// </summary>
    public class GPSGateUserStatus
    {
        public int Id { get; set; }
        public string? Username { get; set; }
        public string? UTC { get; set; }
        public GPSGatePosition? Position { get; set; }
        public GPSGateVelocity? Velocity { get; set; }
    }

    /// <summary>
    /// GPSGate API position data model
    /// </summary>
    public class GPSGatePosition
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? Altitude { get; set; }
    }

    /// <summary>
    /// GPSGate API velocity data model
    /// </summary>
    public class GPSGateVelocity
    {
        public double? GroundSpeed { get; set; }
        public double? Heading { get; set; }
    }

    /// <summary>
    /// GPSGate API accumulator data model (for odometer readings)
    /// </summary>
    public class GPSGateAccumulator
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int AccumulatorTypeId { get; set; }
        public double? Value { get; set; }
        public string? Timestamp { get; set; }
    }
}
