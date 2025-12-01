using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FuelAudit.Commands;
using FMS.Application.Features.FuelAudit.DTOs;
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
    /// Unit tests for FinalizeAuditCommand handler
    /// </summary>
    public class FinalizeAuditCommandTests : IDisposable
    {
        private readonly GpsdataContext _context;
        private readonly Mock<ILogger<FinalizeAuditCommandHandler>> _mockLogger;
        private readonly FinalizeAuditCommandHandler _handler;

        public FinalizeAuditCommandTests()
        {
            var options = new DbContextOptionsBuilder<GpsdataContext>()
                .UseInMemoryDatabase(databaseName: $"FinalizeAuditTest_{Guid.NewGuid()}")
                .Options;
            _context = new GpsdataContext(options);

            _mockLogger = new Mock<ILogger<FinalizeAuditCommandHandler>>();
            _handler = new FinalizeAuditCommandHandler(_context, _mockLogger.Object);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private async Task<FuelAuditEntity> CreateTestAudit(
            string status = "Calculated",
            bool withCriticalFlags = false)
        {
            var audit = new FuelAuditEntity
            {
                AuditNumber = $"FA-2025-{Guid.NewGuid().ToString().Substring(0, 3)}",
                StartDate = DateTime.Today.AddDays(-7),
                EndDate = DateTime.Today.AddDays(-1),
                Status = status,
                CreatedAt = DateTime.UtcNow,
                TankerReadings = new List<FuelAuditTankerReading>(),
                VehiclePositions = new List<FuelAuditVehiclePosition>(),
                Variances = new List<FuelAuditVariance>(),
                Flags = new List<FuelAuditFlag>()
            };

            _context.FuelAudits.Add(audit);
            await _context.SaveChangesAsync();

            if (withCriticalFlags)
            {
                // Add critical flags that are open
                var flag = new FuelAuditFlag
                {
                    AuditId = audit.Id,
                    FlagType = "High Variance",
                    Severity = "Critical",
                    Status = "Open",
                    Description = "Test critical flag",
                    CreatedAt = DateTime.UtcNow
                };
                _context.FuelAuditFlags.Add(flag);
                await _context.SaveChangesAsync();

                audit.FlagCount = 1;
                audit.UnresolvedFlagCount = 1;
                await _context.SaveChangesAsync();
            }

            return audit;
        }

        #region Success Cases

        [Fact]
        public async Task Handle_CalculatedAuditNoFlags_FinalizesSuccessfully()
        {
            // Arrange
            var audit = await CreateTestAudit(status: "Calculated", withCriticalFlags: false);
            var dto = new FinalizeAuditDTO
            {
                AuditId = audit.Id,
                Notes = "Audit completed successfully",
                FinalizedBy = "1"
            };
            var command = new FinalizeAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);

            var updatedAudit = await _context.FuelAudits.FindAsync(audit.Id);
            Assert.Equal("Finalized", updatedAudit.Status);
            Assert.NotNull(updatedAudit.FinalizedAt);
            Assert.Equal("Audit completed successfully", updatedAudit.FinalizationNotes);
        }

        [Fact]
        public async Task Handle_SetsCorrectFinalizedBy()
        {
            // Arrange
            var audit = await CreateTestAudit();
            var dto = new FinalizeAuditDTO
            {
                AuditId = audit.Id,
                FinalizedBy = "123"
            };
            var command = new FinalizeAuditCommand(dto);

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            var updatedAudit = await _context.FuelAudits.FindAsync(audit.Id);
            Assert.Equal(123, updatedAudit.FinalizedBy);
        }

        #endregion

        #region Validation Cases

        [Fact]
        public async Task Handle_NonExistentAudit_ReturnsFailed()
        {
            // Arrange
            var dto = new FinalizeAuditDTO { AuditId = 99999 };
            var command = new FinalizeAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("not found", result.Message.ToLower());
        }

        [Fact]
        public async Task Handle_DraftAudit_ReturnsFailed()
        {
            // Arrange
            var audit = await CreateTestAudit(status: "Draft");
            var dto = new FinalizeAuditDTO { AuditId = audit.Id };
            var command = new FinalizeAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("calculated", result.Message.ToLower());
        }

        [Fact]
        public async Task Handle_AlreadyFinalizedAudit_ReturnsFailed()
        {
            // Arrange
            var audit = await CreateTestAudit(status: "Finalized");
            var dto = new FinalizeAuditDTO { AuditId = audit.Id };
            var command = new FinalizeAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("already", result.Message.ToLower());
        }

        [Fact]
        public async Task Handle_CancelledAudit_ReturnsFailed()
        {
            // Arrange
            var audit = await CreateTestAudit(status: "Cancelled");
            var dto = new FinalizeAuditDTO { AuditId = audit.Id };
            var command = new FinalizeAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task Handle_WithUnresolvedCriticalFlags_ReturnsFailed()
        {
            // Arrange
            var audit = await CreateTestAudit(status: "Calculated", withCriticalFlags: true);
            var dto = new FinalizeAuditDTO { AuditId = audit.Id };
            var command = new FinalizeAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("unresolved", result.Message.ToLower());
        }

        #endregion
    }

    /// <summary>
    /// Unit tests for CancelAuditCommand handler
    /// </summary>
    public class CancelAuditCommandTests : IDisposable
    {
        private readonly GpsdataContext _context;
        private readonly Mock<ILogger<CancelAuditCommandHandler>> _mockLogger;
        private readonly CancelAuditCommandHandler _handler;

        public CancelAuditCommandTests()
        {
            var options = new DbContextOptionsBuilder<GpsdataContext>()
                .UseInMemoryDatabase(databaseName: $"CancelAuditTest_{Guid.NewGuid()}")
                .Options;
            _context = new GpsdataContext(options);

            _mockLogger = new Mock<ILogger<CancelAuditCommandHandler>>();
            _handler = new CancelAuditCommandHandler(_context, _mockLogger.Object);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private async Task<FuelAuditEntity> CreateTestAudit(string status = "Draft")
        {
            var audit = new FuelAuditEntity
            {
                AuditNumber = $"FA-2025-{Guid.NewGuid().ToString().Substring(0, 3)}",
                StartDate = DateTime.Today.AddDays(-7),
                EndDate = DateTime.Today.AddDays(-1),
                Status = status,
                CreatedAt = DateTime.UtcNow
            };

            _context.FuelAudits.Add(audit);
            await _context.SaveChangesAsync();
            return audit;
        }

        #region Success Cases

        [Fact]
        public async Task Handle_DraftAudit_CancelsSuccessfully()
        {
            // Arrange
            var audit = await CreateTestAudit(status: "Draft");
            var command = new CancelAuditCommand(audit.Id, "1", "No longer needed");

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);

            var updatedAudit = await _context.FuelAudits.FindAsync(audit.Id);
            Assert.Equal("Cancelled", updatedAudit.Status);
            Assert.Contains("No longer needed", updatedAudit.Description);
        }

        [Fact]
        public async Task Handle_CalculatedAudit_CancelsSuccessfully()
        {
            // Arrange
            var audit = await CreateTestAudit(status: "Calculated");
            var command = new CancelAuditCommand(audit.Id, "1", "Data was incorrect");

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);

            var updatedAudit = await _context.FuelAudits.FindAsync(audit.Id);
            Assert.Equal("Cancelled", updatedAudit.Status);
        }

        [Fact]
        public async Task Handle_InProgressAudit_CancelsSuccessfully()
        {
            // Arrange
            var audit = await CreateTestAudit(status: "InProgress");
            var command = new CancelAuditCommand(audit.Id, "1", "Calculation timeout");

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
        }

        #endregion

        #region Validation Cases

        [Fact]
        public async Task Handle_NonExistentAudit_ReturnsFailed()
        {
            // Arrange
            var command = new CancelAuditCommand(99999, "1", "Test");

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("not found", result.Message.ToLower());
        }

        [Fact]
        public async Task Handle_FinalizedAudit_ReturnsFailed()
        {
            // Arrange
            var audit = await CreateTestAudit(status: "Finalized");
            var command = new CancelAuditCommand(audit.Id, "1", "Want to cancel");

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("finalized", result.Message.ToLower());
        }

        [Fact]
        public async Task Handle_AlreadyCancelledAudit_ReturnsFailed()
        {
            // Arrange
            var audit = await CreateTestAudit(status: "Cancelled");
            var command = new CancelAuditCommand(audit.Id, "1", "Cancel again");

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("already", result.Message.ToLower());
        }

        #endregion
    }
}
