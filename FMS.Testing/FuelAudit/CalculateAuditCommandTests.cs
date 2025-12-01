using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.Commands;
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
    /// Unit tests for CalculateAuditCommand handler
    /// </summary>
    public class CalculateAuditCommandTests : IDisposable
    {
        private readonly GpsdataContext _context;
        private readonly Mock<IFuelAuditCalculationService> _mockCalculationService;
        private readonly Mock<ILogger<CalculateAuditCommandHandler>> _mockLogger;
        private readonly CalculateAuditCommandHandler _handler;

        public CalculateAuditCommandTests()
        {
            // Setup in-memory database with unique name for test isolation
            var options = new DbContextOptionsBuilder<GpsdataContext>()
                .UseInMemoryDatabase(databaseName: $"FuelAuditCalcTest_{Guid.NewGuid()}")
                .Options;
            _context = new GpsdataContext(options);

            _mockCalculationService = new Mock<IFuelAuditCalculationService>();
            _mockLogger = new Mock<ILogger<CalculateAuditCommandHandler>>();

            // Setup default calculation service mocks
            SetupDefaultMocks();

            _handler = new CalculateAuditCommandHandler(
                _context,
                _mockCalculationService.Object,
                _mockLogger.Object);
        }

        private void SetupDefaultMocks()
        {
            _mockCalculationService
                .Setup(x => x.FetchGPSDataAsync(
                    It.IsAny<long>(),
                    It.IsAny<DateTime>(),
                    It.IsAny<DateTime>(),
                    It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _mockCalculationService
                .Setup(x => x.CalculateTankerReconciliationAsync(
                    It.IsAny<FuelAuditEntity>(),
                    It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _mockCalculationService
                .Setup(x => x.CalculateFleetReconciliationAsync(
                    It.IsAny<FuelAuditEntity>(),
                    It.IsAny<bool>(),
                    It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _mockCalculationService
                .Setup(x => x.CalculateVariancesAsync(
                    It.IsAny<FuelAuditEntity>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<FuelAuditVariance>());

            _mockCalculationService
                .Setup(x => x.GenerateFlagsAsync(
                    It.IsAny<FuelAuditEntity>(),
                    It.IsAny<List<FuelAuditVariance>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<FuelAuditFlag>());
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private async Task<FuelAuditEntity> CreateTestAudit(string status = "Draft", bool withTankerReadings = true)
        {
            var audit = new FuelAuditEntity
            {
                AuditNumber = $"FA-{DateTime.Now.Year}-{Guid.NewGuid().ToString().Substring(0, 3)}",
                StartDate = DateTime.Today.AddDays(-7),
                EndDate = DateTime.Today.AddDays(-1),
                Status = status,
                Description = "Test audit",
                CreatedAt = DateTime.UtcNow,
                TankerReadings = new List<FuelAuditTankerReading>(),
                VehiclePositions = new List<FuelAuditVehiclePosition>(),
                Variances = new List<FuelAuditVariance>(),
                Flags = new List<FuelAuditFlag>()
            };

            if (withTankerReadings)
            {
                audit.TankerReadings.Add(new FuelAuditTankerReading
                {
                    TankId = 1,
                    TankName = "Tank 1",
                    OpeningStock = 5000,
                    ClosingStock = 4500,
                    OpeningReadingTime = DateTime.Today.AddDays(-7),
                    ClosingReadingTime = DateTime.Today.AddDays(-1),
                    CreatedAt = DateTime.UtcNow
                });
            }

            _context.FuelAudits.Add(audit);
            await _context.SaveChangesAsync();

            return audit;
        }

        #region Success Cases

        [Fact]
        public async Task Handle_ValidAudit_CalculatesSuccessfully()
        {
            // Arrange
            var audit = await CreateTestAudit();
            var dto = new CalculateAuditDTO
            {
                AuditId = audit.Id,
                FetchFreshGPSData = false,
                IncludePickupEstimation = true,
                CalculatedBy = "1"
            };
            var command = new CalculateAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal("Calculated", result.Data.Status);
            Assert.NotNull(result.Data.CalculatedAt);
        }

        [Fact]
        public async Task Handle_WithFreshGPSData_CallsFetchGPSData()
        {
            // Arrange
            var audit = await CreateTestAudit();
            var dto = new CalculateAuditDTO
            {
                AuditId = audit.Id,
                FetchFreshGPSData = true,
                IncludePickupEstimation = true
            };
            var command = new CalculateAuditCommand(dto);

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            _mockCalculationService.Verify(
                x => x.FetchGPSDataAsync(
                    audit.Id,
                    audit.StartDate,
                    audit.EndDate,
                    It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task Handle_WithoutFreshGPSData_SkipsFetchGPSData()
        {
            // Arrange
            var audit = await CreateTestAudit();
            var dto = new CalculateAuditDTO
            {
                AuditId = audit.Id,
                FetchFreshGPSData = false
            };
            var command = new CalculateAuditCommand(dto);

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            _mockCalculationService.Verify(
                x => x.FetchGPSDataAsync(
                    It.IsAny<long>(),
                    It.IsAny<DateTime>(),
                    It.IsAny<DateTime>(),
                    It.IsAny<CancellationToken>()),
                Times.Never);
        }

        [Fact]
        public async Task Handle_CallsAllCalculationSteps()
        {
            // Arrange
            var audit = await CreateTestAudit();
            var dto = new CalculateAuditDTO
            {
                AuditId = audit.Id,
                IncludePickupEstimation = true
            };
            var command = new CalculateAuditCommand(dto);

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            _mockCalculationService.Verify(
                x => x.CalculateTankerReconciliationAsync(
                    It.Is<FuelAudit>(a => a.Id == audit.Id),
                    It.IsAny<CancellationToken>()),
                Times.Once);

            _mockCalculationService.Verify(
                x => x.CalculateFleetReconciliationAsync(
                    It.Is<FuelAudit>(a => a.Id == audit.Id),
                    true,
                    It.IsAny<CancellationToken>()),
                Times.Once);

            _mockCalculationService.Verify(
                x => x.CalculateVariancesAsync(
                    It.Is<FuelAudit>(a => a.Id == audit.Id),
                    It.IsAny<CancellationToken>()),
                Times.Once);

            _mockCalculationService.Verify(
                x => x.GenerateFlagsAsync(
                    It.Is<FuelAudit>(a => a.Id == audit.Id),
                    It.IsAny<List<FuelAuditVariance>>(),
                    It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task Handle_UpdatesAuditStatus()
        {
            // Arrange
            var audit = await CreateTestAudit();
            var dto = new CalculateAuditDTO { AuditId = audit.Id };
            var command = new CalculateAuditCommand(dto);

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            var updatedAudit = await _context.FuelAudits.FindAsync(audit.Id);
            Assert.Equal("Calculated", updatedAudit.Status);
            Assert.NotNull(updatedAudit.CalculatedAt);
        }

        [Fact]
        public async Task Handle_GeneratesFlags_UpdatesFlagCount()
        {
            // Arrange
            var audit = await CreateTestAudit();
            var testFlags = new List<FuelAuditFlag>
            {
                new FuelAuditFlag { Title = "Flag 1", Status = "Open", Severity = "Warning", CreatedAt = DateTime.UtcNow },
                new FuelAuditFlag { Title = "Flag 2", Status = "Open", Severity = "Critical", CreatedAt = DateTime.UtcNow }
            };

            _mockCalculationService
                .Setup(x => x.GenerateFlagsAsync(
                    It.IsAny<FuelAudit>(),
                    It.IsAny<List<FuelAuditVariance>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(testFlags);

            var dto = new CalculateAuditDTO { AuditId = audit.Id };
            var command = new CalculateAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.Equal(2, result.Data.FlagCount);
            Assert.Equal(2, result.Data.UnresolvedFlagCount);
        }

        #endregion

        #region Validation Cases

        [Fact]
        public async Task Handle_NonExistentAudit_ReturnsFailed()
        {
            // Arrange
            var dto = new CalculateAuditDTO { AuditId = 99999 };
            var command = new CalculateAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("not found", result.Message);
        }

        [Fact]
        public async Task Handle_FinalizedAudit_ReturnsFailed()
        {
            // Arrange
            var audit = await CreateTestAudit(status: "Finalized");
            var dto = new CalculateAuditDTO { AuditId = audit.Id };
            var command = new CalculateAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("finalized", result.Message.ToLower());
        }

        [Fact]
        public async Task Handle_CancelledAudit_ReturnsFailed()
        {
            // Arrange
            var audit = await CreateTestAudit(status: "Cancelled");
            var dto = new CalculateAuditDTO { AuditId = audit.Id };
            var command = new CalculateAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("cancelled", result.Message.ToLower());
        }

        [Fact]
        public async Task Handle_MissingOpeningStock_ReturnsFailed()
        {
            // Arrange - Create audit without tanker readings
            var audit = await CreateTestAudit(withTankerReadings: false);
            var dto = new CalculateAuditDTO { AuditId = audit.Id };
            var command = new CalculateAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("opening", result.Message.ToLower());
        }

        [Fact]
        public async Task Handle_MissingClosingStock_ReturnsFailed()
        {
            // Arrange
            var audit = new FuelAuditEntity
            {
                AuditNumber = "FA-2025-NOCLOSE",
                StartDate = DateTime.Today.AddDays(-7),
                EndDate = DateTime.Today.AddDays(-1),
                Status = "Draft",
                CreatedAt = DateTime.UtcNow,
                TankerReadings = new List<FuelAuditTankerReading>
                {
                    new FuelAuditTankerReading
                    {
                        TankId = 1,
                        OpeningStock = 5000, // Has opening but no closing
                        OpeningReadingTime = DateTime.Today.AddDays(-7),
                        CreatedAt = DateTime.UtcNow
                    }
                },
                VehiclePositions = new List<FuelAuditVehiclePosition>(),
                Variances = new List<FuelAuditVariance>(),
                Flags = new List<FuelAuditFlag>()
            };
            _context.FuelAudits.Add(audit);
            await _context.SaveChangesAsync();

            var dto = new CalculateAuditDTO { AuditId = audit.Id };
            var command = new CalculateAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("closing", result.Message.ToLower());
        }

        #endregion

        #region Data Confidence Tests

        [Fact]
        public async Task Handle_HighGPSCoverage_SetsHighConfidence()
        {
            // Arrange
            var audit = await CreateTestAudit();

            // Mock calculation service to set high GPS coverage
            _mockCalculationService
                .Setup(x => x.CalculateFleetReconciliationAsync(
                    It.IsAny<FuelAudit>(),
                    It.IsAny<bool>(),
                    It.IsAny<CancellationToken>()))
                .Callback<FuelAudit, bool, CancellationToken>((a, _, _) =>
                {
                    a.GPSVehicleCount = 95;
                    a.PickupVehicleCount = 5;
                });

            var dto = new CalculateAuditDTO { AuditId = audit.Id };
            var command = new CalculateAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal("High", result.Data.DataConfidence);
        }

        [Fact]
        public async Task Handle_LowGPSCoverage_SetsLowConfidence()
        {
            // Arrange
            var audit = await CreateTestAudit();

            // Mock calculation service to set low GPS coverage
            _mockCalculationService
                .Setup(x => x.CalculateFleetReconciliationAsync(
                    It.IsAny<FuelAudit>(),
                    It.IsAny<bool>(),
                    It.IsAny<CancellationToken>()))
                .Callback<FuelAudit, bool, CancellationToken>((a, _, _) =>
                {
                    a.GPSVehicleCount = 30;
                    a.PickupVehicleCount = 70;
                });

            var dto = new CalculateAuditDTO { AuditId = audit.Id };
            var command = new CalculateAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.True(result.Data.DataConfidence == "Low" || result.Data.DataConfidence == "VeryLow");
        }

        #endregion

        #region Recalculation Tests

        [Fact]
        public async Task Handle_Recalculation_ClearsExistingVariances()
        {
            // Arrange
            var audit = await CreateTestAudit();

            // Add existing variance
            _context.FuelAuditVariances.Add(new FuelAuditVariance
            {
                AuditId = audit.Id,
                Category = "Test",
                VarianceAmount = 100,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var dto = new CalculateAuditDTO { AuditId = audit.Id };
            var command = new CalculateAuditCommand(dto);

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            var variances = await _context.FuelAuditVariances
                .Where(v => v.AuditId == audit.Id)
                .ToListAsync();
            Assert.Empty(variances); // Old variance should be cleared
        }

        [Fact]
        public async Task Handle_Recalculation_ClearsExistingFlags()
        {
            // Arrange
            var audit = await CreateTestAudit();

            // Add existing flag
            _context.FuelAuditFlags.Add(new FuelAuditFlag
            {
                AuditId = audit.Id,
                Title = "Old Flag",
                Status = "Open",
                Severity = "Warning",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var dto = new CalculateAuditDTO { AuditId = audit.Id };
            var command = new CalculateAuditCommand(dto);

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            var flags = await _context.FuelAuditFlags
                .Where(f => f.AuditId == audit.Id)
                .ToListAsync();
            Assert.Empty(flags); // Old flag should be cleared
        }

        #endregion
    }
}
