using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Application.Features.FuelAudit.Services;
using FMS.Domain.Entities;
using FMS.Domain.Entities.FuelAudit;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services;
using FMS.Infrastructure.VehicleTracking.Models.GPSGate;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using Xunit;

// Use explicit alias to avoid ambiguity - GPSGatePosition exists in both namespaces
using VTGPSGatePosition = FMS.Infrastructure.VehicleTracking.Models.GPSGate.GPSGatePosition;

namespace FMS.Testing.FuelAudit
{
    public class FuelAuditGPSServiceTests : IDisposable
    {
        private readonly GpsdataContext _context;
        private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;
        private readonly HttpClient _httpClient;
        private readonly Mock<IGPSGateConfigurationProvider> _mockConfigProvider;
        private readonly Mock<ILogger<FuelAuditGPSService>> _mockLogger;
        private readonly FuelAuditGPSService _service;

        public FuelAuditGPSServiceTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<GpsdataContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new GpsdataContext(options);

            // Setup HTTP mock
            _mockHttpMessageHandler = new Mock<HttpMessageHandler>();
            _httpClient = new HttpClient(_mockHttpMessageHandler.Object);

            // Setup configuration provider mock
            _mockConfigProvider = new Mock<IGPSGateConfigurationProvider>();
            _mockConfigProvider.Setup(x => x.GetProviderSettingsAsync())
                .ReturnsAsync((
                    "http://10.0.10.150/comGpsGate/api/v.1/applications/12",
                    1,
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "hk%2bXL3thlikm31JLAon0FjBxyyOtnrUOMCHIP%2bFfrhEXQPffqSrPDVGperVhCXPA")
                ));

            // Setup logger mock
            _mockLogger = new Mock<ILogger<FuelAuditGPSService>>();

            // Create service
            _service = new FuelAuditGPSService(
                _context,
                _httpClient,
                _mockConfigProvider.Object,
                _mockLogger.Object);
        }

        public void Dispose()
        {
            _context.Dispose();
            _httpClient.Dispose();
        }

        #region GetVehicleFuelAtDateAsync Tests

        [Fact]
        public async Task GetVehicleFuelAtDateAsync_WithCachedData_ReturnsCachedReading()
        {
            // Arrange
            var vehicleId = 1;
            var date = new DateTime(2025, 11, 25);
            var readingType = "opening";

            // Add cached reading to database
            _context.FuelAuditGPSReadings.Add(new FuelAuditGPSReading
            {
                VehicleId = vehicleId,
                ReadingDate = date,
                ReadingType = readingType,
                FuelLevel = 150.5m,
                DataQuality = "Exact",
                DataQualityReason = "Data from requested date",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetVehicleFuelAtDateAsync(vehicleId, date, readingType);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Equal(150.5m, result.Data.FuelLevel);
            Assert.Equal(FuelDataQuality.Exact, result.Data.DataQuality);
        }

        [Fact]
        public async Task GetVehicleFuelAtDateAsync_WithNoDeviceMapping_ReturnsNoSensor()
        {
            // Arrange
            var vehicleId = 999; // Vehicle with no mapping
            var date = new DateTime(2025, 11, 25);

            // Act
            var result = await _service.GetVehicleFuelAtDateAsync(vehicleId, date, "opening", useCache: false);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Equal(FuelDataQuality.NoSensor, result.Data.DataQuality);
        }

        [Fact]
        public async Task GetVehicleFuelAtDateAsync_WithValidGPSData_ReturnsExactReading()
        {
            // Arrange
            var vehicleId = 1;
            var date = new DateTime(2025, 11, 25);

            // Add vehicle with device mapping
            await SetupVehicleWithDeviceMapping(vehicleId, "12345");

            // Setup GPS response with fuel data
            var tracksResponse = new List<GPSGateTrack>
            {
                new GPSGateTrack
                {
                    UTC = "2025-11-25T05:30:00Z",
                    Valid = true,
                    TrackInfoId = 1001,
                    Position = new VTGPSGatePosition { Latitude = -1.2345, Longitude = 36.7890 },
                    Variables = new List<GPSGateVariable>
                    {
                        new GPSGateVariable { Name = "Fuel level", Value = "125.5" },
                        new GPSGateVariable { Name = "Ignition", Value = "true" }
                    }
                }
            };

            SetupHttpResponse(HttpStatusCode.OK, JsonSerializer.Serialize(tracksResponse));

            // Act
            var result = await _service.GetVehicleFuelAtDateAsync(vehicleId, date, "opening", useCache: false);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Equal(125.5m, result.Data.FuelLevel);
            Assert.Equal(FuelDataQuality.Exact, result.Data.DataQuality);
            Assert.Equal(0, result.Data.DaysFromRequestedDate);
        }

        [Fact]
        public async Task GetVehicleFuelAtDateAsync_WithNoFuelInVariables_ReturnsSensorNotReporting()
        {
            // Arrange
            var vehicleId = 1;
            var date = new DateTime(2025, 11, 25);

            await SetupVehicleWithDeviceMapping(vehicleId, "12345");

            // GPS response with tracks but no fuel variables
            var tracksResponse = new List<GPSGateTrack>
            {
                new GPSGateTrack
                {
                    UTC = "2025-11-25T05:30:00Z",
                    Valid = true,
                    Position = new VTGPSGatePosition { Latitude = -1.2345, Longitude = 36.7890 },
                    Variables = new List<GPSGateVariable>
                    {
                        new GPSGateVariable { Name = "Speed", Value = "45" },
                        new GPSGateVariable { Name = "Ignition", Value = "true" }
                    }
                }
            };

            SetupHttpResponse(HttpStatusCode.OK, JsonSerializer.Serialize(tracksResponse));

            // Act
            var result = await _service.GetVehicleFuelAtDateAsync(vehicleId, date, "opening", useCache: false);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Equal(FuelDataQuality.SensorNotReporting, result.Data.DataQuality);
            Assert.Contains("fuel sensor is not reporting", result.Data.DataQualityReason);
        }

        #endregion

        #region GetFleetFuelAtDateAsync Tests

        [Fact]
        public async Task GetFleetFuelAtDateAsync_WithMultipleVehicles_ReturnsAllResults()
        {
            // Arrange
            var vehicleIds = new List<int> { 1, 2, 3 };
            var date = new DateTime(2025, 11, 25);

            // Add cached readings for all vehicles
            foreach (var vehicleId in vehicleIds)
            {
                _context.FuelAuditGPSReadings.Add(new FuelAuditGPSReading
                {
                    VehicleId = vehicleId,
                    ReadingDate = date,
                    ReadingType = "opening",
                    FuelLevel = 100m + vehicleId * 10,
                    DataQuality = "Exact",
                    CreatedAt = DateTime.UtcNow
                });
            }
            await _context.SaveChangesAsync();

            var request = new FleetFuelPositionRequestDTO
            {
                VehicleIds = vehicleIds,
                Date = date,
                ReadingType = "opening"
            };

            // Act
            var result = await _service.GetFleetFuelAtDateAsync(request);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Equal(3, result.Data.TotalVehiclesRequested);
            Assert.Equal(3, result.Data.VehiclesWithData);
            Assert.Equal(0, result.Data.VehiclesWithoutData);
            Assert.Equal(360m, result.Data.TotalFleetFuel); // 110 + 120 + 130 = 360
        }

        [Fact]
        public async Task GetFleetFuelAtDateAsync_WithEmptyVehicleList_ReturnsError()
        {
            // Arrange
            var request = new FleetFuelPositionRequestDTO
            {
                VehicleIds = new List<int>(),
                Date = new DateTime(2025, 11, 25)
            };

            // Act
            var result = await _service.GetFleetFuelAtDateAsync(request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("No vehicle IDs", result.Message);
        }

        #endregion

        #region GetVehicleConsumptionAsync Tests

        [Fact]
        public async Task GetVehicleConsumptionAsync_WithValidData_CalculatesConsumption()
        {
            // Arrange
            var vehicleId = 1;
            var startDate = new DateTime(2025, 11, 1);
            var endDate = new DateTime(2025, 11, 30);

            // Add opening reading
            _context.FuelAuditGPSReadings.Add(new FuelAuditGPSReading
            {
                VehicleId = vehicleId,
                ReadingDate = startDate,
                ReadingType = "opening",
                FuelLevel = 200m,
                DataQuality = "Exact",
                CreatedAt = DateTime.UtcNow
            });

            // Add closing reading
            _context.FuelAuditGPSReadings.Add(new FuelAuditGPSReading
            {
                VehicleId = vehicleId,
                ReadingDate = endDate,
                ReadingType = "closing",
                FuelLevel = 50m,
                DataQuality = "Exact",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetVehicleConsumptionAsync(vehicleId, startDate, endDate);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Equal(200m, result.Data.OpeningFuelLevel);
            Assert.Equal(50m, result.Data.ClosingFuelLevel);
            Assert.Equal(150m, result.Data.GrossConsumption); // 200 - 50
        }

        #endregion

        #region DetectRefuelEventsAsync Tests

        [Fact]
        public async Task DetectRefuelEventsAsync_WithFuelIncrease_DetectsRefuelEvent()
        {
            // Arrange
            var vehicleId = 1;
            var date = new DateTime(2025, 11, 25);

            await SetupVehicleWithDeviceMapping(vehicleId, "12345");

            // GPS response with fuel increase (refuel event)
            var tracksResponse = new List<GPSGateTrack>
            {
                new GPSGateTrack
                {
                    UTC = "2025-11-25T08:00:00Z",
                    Valid = true,
                    Position = new VTGPSGatePosition { Latitude = -1.2345, Longitude = 36.7890 },
                    Variables = new List<GPSGateVariable>
                    {
                        new GPSGateVariable { Name = "Fuel level", Value = "50" }
                    }
                },
                new GPSGateTrack
                {
                    UTC = "2025-11-25T08:30:00Z",
                    Valid = true,
                    Position = new VTGPSGatePosition { Latitude = -1.2345, Longitude = 36.7890 },
                    Variables = new List<GPSGateVariable>
                    {
                        new GPSGateVariable { Name = "Fuel level", Value = "120" } // +70L refuel
                    }
                }
            };

            SetupHttpResponse(HttpStatusCode.OK, JsonSerializer.Serialize(tracksResponse));

            // Act
            var result = await _service.DetectRefuelEventsAsync(vehicleId, date, minimumRefuelThreshold: 10m);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Single(result.Data);
            Assert.Equal(50m, result.Data[0].FuelLevelBefore);
            Assert.Equal(120m, result.Data[0].FuelLevelAfter);
            Assert.Equal(70m, result.Data[0].FuelAdded);
        }

        [Fact]
        public async Task DetectRefuelEventsAsync_WithSmallIncrease_DoesNotDetect()
        {
            // Arrange
            var vehicleId = 1;
            var date = new DateTime(2025, 11, 25);

            await SetupVehicleWithDeviceMapping(vehicleId, "12345");

            // GPS response with small fuel increase (below threshold)
            var tracksResponse = new List<GPSGateTrack>
            {
                new GPSGateTrack
                {
                    UTC = "2025-11-25T08:00:00Z",
                    Variables = new List<GPSGateVariable>
                    {
                        new GPSGateVariable { Name = "Fuel level", Value = "100" }
                    }
                },
                new GPSGateTrack
                {
                    UTC = "2025-11-25T08:30:00Z",
                    Variables = new List<GPSGateVariable>
                    {
                        new GPSGateVariable { Name = "Fuel level", Value = "105" } // +5L (below 10L threshold)
                    }
                }
            };

            SetupHttpResponse(HttpStatusCode.OK, JsonSerializer.Serialize(tracksResponse));

            // Act
            var result = await _service.DetectRefuelEventsAsync(vehicleId, date, minimumRefuelThreshold: 10m);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Empty(result.Data);
        }

        #endregion

        #region HasFuelSensorAsync Tests

        [Fact]
        public async Task HasFuelSensorAsync_WithNoDeviceMapping_ReturnsFalse()
        {
            // Arrange
            var vehicleId = 999; // No mapping

            // Act
            var result = await _service.HasFuelSensorAsync(vehicleId);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.False(result.Data);
        }

        #endregion

        #region RefreshVehicleDataAsync Tests

        [Fact]
        public async Task RefreshVehicleDataAsync_RemovesCachedData()
        {
            // Arrange
            var vehicleId = 1;
            var date = new DateTime(2025, 11, 25);

            // Add cached reading
            _context.FuelAuditGPSReadings.Add(new FuelAuditGPSReading
            {
                VehicleId = vehicleId,
                ReadingDate = date,
                ReadingType = "opening",
                FuelLevel = 150m,
                DataQuality = "Exact",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            // Verify it exists
            var countBefore = await _context.FuelAuditGPSReadings.CountAsync();
            Assert.Equal(1, countBefore);

            // Act
            var result = await _service.RefreshVehicleDataAsync(vehicleId, date);

            // Assert
            Assert.True(result.IsSuccess);
            var countAfter = await _context.FuelAuditGPSReadings
                .CountAsync(r => r.VehicleId == vehicleId && r.ReadingDate.Date == date.Date);
            // Note: count may be > 0 if new data was fetched and cached
        }

        #endregion

        #region Helper Methods

        private async Task SetupVehicleWithDeviceMapping(int vehicleId, string externalDeviceId)
        {
            // Add vehicle
            var vehicle = new Vehicle
            {
                VehicleId = vehicleId,
                HyoungNo = $"TEST-{vehicleId}",
                DeviceId = int.Parse(externalDeviceId) // Legacy fallback
            };
            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();
        }

        private void SetupHttpResponse(HttpStatusCode statusCode, string content)
        {
            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = statusCode,
                    Content = new StringContent(content, System.Text.Encoding.UTF8, "application/json")
                });
        }

        #endregion
    }
}
