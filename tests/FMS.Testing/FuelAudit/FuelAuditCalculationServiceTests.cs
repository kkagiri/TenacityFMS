using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Application.Features.FuelAudit.Services;
using FMS.Domain.Entities.FuelAudit;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FuelAuditEntity = FMS.Domain.Entities.FuelAudit.FuelAudit;

namespace FMS.Testing.FuelAudit
{
    /// <summary>
    /// Unit tests for FuelAuditCalculationService
    /// </summary>
    public class FuelAuditCalculationServiceTests : IDisposable
    {
        private readonly GpsdataContext _context;
        private readonly Mock<IFuelAuditGPSService> _mockGpsService;
        private readonly Mock<IFuelAuditTankStockService> _mockTankStockService;
        private readonly Mock<ILogger<FuelAuditCalculationService>> _mockLogger;
        private readonly FuelAuditCalculationService _service;

        public FuelAuditCalculationServiceTests()
        {
            var options = new DbContextOptionsBuilder<GpsdataContext>()
                .UseInMemoryDatabase(databaseName: $"CalculationServiceTest_{Guid.NewGuid()}")
                .Options;
            _context = new GpsdataContext(options);

            _mockGpsService = new Mock<IFuelAuditGPSService>();
            _mockTankStockService = new Mock<IFuelAuditTankStockService>();
            _mockLogger = new Mock<ILogger<FuelAuditCalculationService>>();

            _service = new FuelAuditCalculationService(
                _context,
                _mockGpsService.Object,
                _mockTankStockService.Object,
                _mockLogger.Object);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private async Task<FuelAuditEntity> CreateTestAudit()
        {
            var audit = new FuelAuditEntity
            {
                AuditNumber = $"FA-2025-{Guid.NewGuid().ToString().Substring(0, 3)}",
                StartDate = DateTime.Today.AddDays(-7),
                EndDate = DateTime.Today.AddDays(-1),
                Status = "Draft",
                CreatedAt = DateTime.UtcNow,
                TankerReadings = new List<FuelAuditTankerReading>(),
                VehiclePositions = new List<FuelAuditVehiclePosition>(),
                Variances = new List<FuelAuditVariance>(),
                Flags = new List<FuelAuditFlag>()
            };

            _context.FuelAudits.Add(audit);
            await _context.SaveChangesAsync();
            return audit;
        }

        #region CalculateTankerReconciliation Tests

        [Fact]
        public async Task CalculateTankerReconciliation_WithTankerReadings_CalculatesCorrectly()
        {
            // Arrange
            var audit = await CreateTestAudit();

            // Add tanker readings
            var reading1 = new FuelAuditTankerReading
            {
                AuditId = audit.Id,
                TankId = 1,
                TankName = "Tank 1",
                OpeningStock = 5000,
                ClosingStock = 4500,
                FuelReceived = 2000,
                FuelDispensed = 2500,
                CreatedAt = DateTime.UtcNow
            };
            var reading2 = new FuelAuditTankerReading
            {
                AuditId = audit.Id,
                TankId = 2,
                TankName = "Tank 2",
                OpeningStock = 3000,
                ClosingStock = 3200,
                FuelReceived = 1000,
                FuelDispensed = 800,
                CreatedAt = DateTime.UtcNow
            };

            _context.FuelAuditTankerReadings.AddRange(reading1, reading2);
            await _context.SaveChangesAsync();

            // Reload audit with readings
            audit = await _context.FuelAudits
                .Include(a => a.TankerReadings)
                .FirstAsync(a => a.Id == audit.Id);

            // Act
            await _service.CalculateTankerReconciliationAsync(audit, CancellationToken.None);

            // Assert
            Assert.Equal(8000, audit.TankerOpeningStock); // 5000 + 3000
            Assert.Equal(7700, audit.TankerClosingStock); // 4500 + 3200
            Assert.Equal(3000, audit.ExternalFuelIn); // 2000 + 1000
            Assert.Equal(3300, audit.TotalDispensed); // 2500 + 800
            Assert.Equal(7700, audit.ExpectedClosingStock); // 8000 + 3000 - 3300
            Assert.Equal(0, audit.SystemVariance); // 7700 - 7700
        }

        [Fact]
        public async Task CalculateTankerReconciliation_WithShortage_CalculatesNegativeVariance()
        {
            // Arrange
            var audit = await CreateTestAudit();

            var reading = new FuelAuditTankerReading
            {
                AuditId = audit.Id,
                TankId = 1,
                TankName = "Tank 1",
                OpeningStock = 5000,
                ClosingStock = 4000, // Less than expected
                FuelReceived = 1000,
                FuelDispensed = 1500,
                CreatedAt = DateTime.UtcNow
            };

            _context.FuelAuditTankerReadings.Add(reading);
            await _context.SaveChangesAsync();

            audit = await _context.FuelAudits
                .Include(a => a.TankerReadings)
                .FirstAsync(a => a.Id == audit.Id);

            // Act
            await _service.CalculateTankerReconciliationAsync(audit, CancellationToken.None);

            // Assert
            // Expected = 5000 + 1000 - 1500 = 4500
            // Actual = 4000
            // Variance = 4000 - 4500 = -500 (shortage)
            Assert.Equal(4500, audit.ExpectedClosingStock);
            Assert.Equal(-500, audit.SystemVariance);
            Assert.NotNull(audit.SystemVariancePercent);
        }

        [Fact]
        public async Task CalculateTankerReconciliation_NoReadings_FetchesFromTankStockService()
        {
            // Arrange
            var audit = await CreateTestAudit();
            audit.SiteId = 1;
            await _context.SaveChangesAsync();

            var tankData = new List<TankAuditDataDTO>
            {
                new TankAuditDataDTO
                {
                    TankId = 1,
                    TankName = "Auto Tank 1",
                    TankCapacity = 10000,
                    OpeningVolume = 5000,
                    ClosingVolume = 4500,
                    TotalDeliveries = 1000,
                    TotalDispensing = 1500,
                    HasExplicitOpeningStock = true,
                    HasExplicitClosingStock = true
                }
            };

            _mockTankStockService.Setup(s => s.GetSiteTankAuditDataAsync(
                audit.SiteId,
                audit.StartDate,
                audit.EndDate,
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(tankData);

            audit = await _context.FuelAudits
                .Include(a => a.TankerReadings)
                .FirstAsync(a => a.Id == audit.Id);

            // Act
            await _service.CalculateTankerReconciliationAsync(audit, CancellationToken.None);

            // Assert
            _mockTankStockService.Verify(s => s.GetSiteTankAuditDataAsync(
                audit.SiteId,
                audit.StartDate,
                audit.EndDate,
                It.IsAny<CancellationToken>()), Times.Once);

            // Verify readings were auto-created
            var createdReadings = await _context.FuelAuditTankerReadings
                .Where(r => r.AuditId == audit.Id)
                .ToListAsync();
            Assert.Single(createdReadings);
            Assert.True(createdReadings[0].IsAutoPopulated);
        }

        [Fact]
        public async Task CalculateTankerReconciliation_UpdatesTankerCount()
        {
            // Arrange
            var audit = await CreateTestAudit();

            for (int i = 1; i <= 3; i++)
            {
                var reading = new FuelAuditTankerReading
                {
                    AuditId = audit.Id,
                    TankId = i,
                    TankName = $"Tank {i}",
                    OpeningStock = 1000,
                    ClosingStock = 900,
                    FuelReceived = 100,
                    FuelDispensed = 200,
                    CreatedAt = DateTime.UtcNow
                };
                _context.FuelAuditTankerReadings.Add(reading);
            }
            await _context.SaveChangesAsync();

            audit = await _context.FuelAudits
                .Include(a => a.TankerReadings)
                .FirstAsync(a => a.Id == audit.Id);

            // Act
            await _service.CalculateTankerReconciliationAsync(audit, CancellationToken.None);

            // Assert
            Assert.Equal(3, audit.TankerCount);
        }

        #endregion

        #region CalculateVariances Tests

        [Fact]
        public async Task CalculateVariances_SystemVariance_CreatesVarianceRecord()
        {
            // Arrange
            var audit = await CreateTestAudit();
            audit.ExpectedClosingStock = 5000;
            audit.TankerClosingStock = 4900;
            audit.SystemVariance = -100; // Shortage
            audit.SystemVariancePercent = -2.0m;
            await _context.SaveChangesAsync();

            // Add threshold
            var threshold = new FuelAuditThreshold
            {
                ThresholdType = "TankerVariance",
                ThresholdValue = 1.5m, // 1.5%
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.FuelAuditThresholds.Add(threshold);
            await _context.SaveChangesAsync();

            // Act
            var variances = await _service.CalculateVariancesAsync(audit, CancellationToken.None);

            // Assert
            Assert.NotEmpty(variances);
            var tankerVariance = variances.First(v => v.Category == "Tanker");
            Assert.Equal(-100, tankerVariance.VarianceAmount);
            Assert.Equal("Shortage", tankerVariance.VarianceDirection);
            Assert.True(tankerVariance.ExceedsThreshold);
        }

        [Fact]
        public async Task CalculateVariances_ExcessVariance_LabelsCorrectly()
        {
            // Arrange
            var audit = await CreateTestAudit();
            audit.ExpectedClosingStock = 5000;
            audit.TankerClosingStock = 5200;
            audit.SystemVariance = 200; // Excess
            audit.SystemVariancePercent = 4.0m;
            await _context.SaveChangesAsync();

            // Act
            var variances = await _service.CalculateVariancesAsync(audit, CancellationToken.None);

            // Assert
            var tankerVariance = variances.First(v => v.Category == "Tanker");
            Assert.Equal("Excess", tankerVariance.VarianceDirection);
        }

        [Fact]
        public async Task CalculateVariances_SmallVariance_NotFlagged()
        {
            // Arrange
            var audit = await CreateTestAudit();
            audit.ExpectedClosingStock = 5000;
            audit.TankerClosingStock = 5005;
            audit.SystemVariance = 5; // Tiny variance (below 10L threshold)
            audit.SystemVariancePercent = 0.1m;
            await _context.SaveChangesAsync();

            // Act
            var variances = await _service.CalculateVariancesAsync(audit, CancellationToken.None);

            // Assert - tiny variances still get recorded but shouldn't exceed threshold
            var tankerVariance = variances.FirstOrDefault(v => v.Category == "Tanker");
            if (tankerVariance != null)
            {
                Assert.False(tankerVariance.ExceedsThreshold);
            }
        }

        #endregion

        #region GenerateFlags Tests

        [Fact]
        public async Task GenerateFlags_VarianceExceedsThreshold_CreatesFlag()
        {
            // Arrange
            var audit = await CreateTestAudit();
            var variances = new List<FuelAuditVariance>
            {
                new FuelAuditVariance
                {
                    AuditId = audit.Id,
                    Category = "Tanker",
                    VarianceAmount = -500,
                    VariancePercent = -10,
                    ExceedsThreshold = true,
                    Severity = "Critical"
                }
            };

            // Act
            var flags = await _service.GenerateFlagsAsync(audit, variances, CancellationToken.None);

            // Assert
            Assert.Single(flags);
            Assert.Equal("TankerVariance", flags[0].FlagType);
            Assert.Equal("Critical", flags[0].Severity);
            Assert.Equal("Open", flags[0].Status);
        }

        [Fact]
        public async Task GenerateFlags_LowFuelEfficiency_CreatesFlag()
        {
            // Arrange
            var audit = await CreateTestAudit();

            // Add vehicle with low efficiency
            var vehiclePosition = new FuelAuditVehiclePosition
            {
                AuditId = audit.Id,
                VehicleId = 1,
                VehicleName = "Test Vehicle",
                FuelEfficiency = 2.5m, // Very low
                CreatedAt = DateTime.UtcNow
            };
            _context.FuelAuditVehiclePositions.Add(vehiclePosition);

            // Add efficiency threshold
            var threshold = new FuelAuditThreshold
            {
                ThresholdType = "FuelEfficiency",
                ThresholdValue = 5m,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.FuelAuditThresholds.Add(threshold);
            await _context.SaveChangesAsync();

            // Act
            var flags = await _service.GenerateFlagsAsync(audit, new List<FuelAuditVariance>(), CancellationToken.None);

            // Assert
            var efficiencyFlag = flags.FirstOrDefault(f => f.FlagType == "LowFuelEfficiency");
            Assert.NotNull(efficiencyFlag);
            Assert.Equal("Critical", efficiencyFlag.Severity); // 2.5 is less than 5/2 = 2.5
        }

        [Fact]
        public async Task GenerateFlags_MissingGPSData_CreatesQualityFlag()
        {
            // Arrange
            var audit = await CreateTestAudit();

            var vehiclePosition = new FuelAuditVehiclePosition
            {
                AuditId = audit.Id,
                VehicleId = 1,
                VehicleName = "No GPS Vehicle",
                OpeningDataQuality = "NoData",
                ClosingDataQuality = "NoData",
                CreatedAt = DateTime.UtcNow
            };
            _context.FuelAuditVehiclePositions.Add(vehiclePosition);
            await _context.SaveChangesAsync();

            // Act
            var flags = await _service.GenerateFlagsAsync(audit, new List<FuelAuditVariance>(), CancellationToken.None);

            // Assert
            var qualityFlag = flags.FirstOrDefault(f => f.FlagType == "MissingData");
            Assert.NotNull(qualityFlag);
            Assert.Equal("Quality", qualityFlag.Category);
            Assert.Equal("Low", qualityFlag.Severity);
        }

        [Fact]
        public async Task GenerateFlags_VarianceUnderThreshold_NoFlag()
        {
            // Arrange
            var audit = await CreateTestAudit();
            var variances = new List<FuelAuditVariance>
            {
                new FuelAuditVariance
                {
                    AuditId = audit.Id,
                    Category = "Tanker",
                    VarianceAmount = -10,
                    VariancePercent = -0.2m,
                    ExceedsThreshold = false,
                    Severity = "Low"
                }
            };

            // Act
            var flags = await _service.GenerateFlagsAsync(audit, variances, CancellationToken.None);

            // Assert - No flags generated for variance under threshold
            var varianceFlags = flags.Where(f => f.FlagType.Contains("Variance")).ToList();
            Assert.Empty(varianceFlags);
        }

        #endregion

        #region Severity Determination Tests

        [Theory]
        [InlineData(-15, "Critical")]
        [InlineData(-7, "High")]
        [InlineData(-3, "Medium")]
        [InlineData(-0.5, "Low")]
        [InlineData(12, "Critical")]
        [InlineData(6, "High")]
        public async Task CalculateVariances_AssignsCorrectSeverity(decimal variancePercent, string expectedSeverity)
        {
            // Arrange
            var audit = await CreateTestAudit();
            audit.ExpectedClosingStock = 5000;
            audit.TankerClosingStock = 5000 + (variancePercent * 50); // Calculate actual based on percent
            audit.SystemVariance = variancePercent * 50;
            audit.SystemVariancePercent = variancePercent;
            await _context.SaveChangesAsync();

            // Act
            var variances = await _service.CalculateVariancesAsync(audit, CancellationToken.None);

            // Assert
            var tankerVariance = variances.FirstOrDefault(v => v.Category == "Tanker");
            Assert.NotNull(tankerVariance);
            Assert.Equal(expectedSeverity, tankerVariance.Severity);
        }

        #endregion
    }
}
