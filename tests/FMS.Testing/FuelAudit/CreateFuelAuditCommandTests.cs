using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.Commands;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FMS.Testing.FuelAudit
{
    /// <summary>
    /// Unit tests for CreateFuelAuditCommand handler
    /// </summary>
    public class CreateFuelAuditCommandTests : IDisposable
    {
        private readonly GpsdataContext _context;
        private readonly Mock<ILogger<CreateFuelAuditCommandHandler>> _mockLogger;
        private readonly CreateFuelAuditCommandHandler _handler;

        public CreateFuelAuditCommandTests()
        {
            // Setup in-memory database with unique name for test isolation
            var options = new DbContextOptionsBuilder<GpsdataContext>()
                .UseInMemoryDatabase(databaseName: $"FuelAuditTest_{Guid.NewGuid()}")
                .Options;
            _context = new GpsdataContext(options);

            _mockLogger = new Mock<ILogger<CreateFuelAuditCommandHandler>>();

            _handler = new CreateFuelAuditCommandHandler(_context, _mockLogger.Object);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        #region Success Cases

        [Fact]
        public async Task Handle_ValidData_CreatesAuditSuccessfully()
        {
            // Arrange
            var dto = new CreateFuelAuditDTO
            {
                StartDate = DateTime.Today.AddDays(-7),
                EndDate = DateTime.Today.AddDays(-1),
                Description = "Weekly fuel audit",
                CreatedBy = "1"
            };
            var command = new CreateFuelAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Equal("Draft", result.Data.Status);
            Assert.StartsWith("FA-", result.Data.AuditNumber);
            Assert.Equal(dto.Description, result.Data.Description);
        }

        [Fact]
        public async Task Handle_WithCustomAuditNumber_UsesProvidedNumber()
        {
            // Arrange
            var customAuditNumber = "CUSTOM-2025-001";
            var dto = new CreateFuelAuditDTO
            {
                AuditNumber = customAuditNumber,
                StartDate = DateTime.Today.AddDays(-7),
                EndDate = DateTime.Today.AddDays(-1),
                Description = "Custom audit"
            };
            var command = new CreateFuelAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(customAuditNumber, result.Data.AuditNumber);
        }

        [Fact]
        public async Task Handle_GeneratesSequentialAuditNumbers()
        {
            // Arrange - Create first audit
            var dto1 = new CreateFuelAuditDTO
            {
                StartDate = new DateTime(2025, 1, 1),
                EndDate = new DateTime(2025, 1, 7),
                Description = "First audit"
            };
            await _handler.Handle(new CreateFuelAuditCommand(dto1), CancellationToken.None);

            // Create second audit
            var dto2 = new CreateFuelAuditDTO
            {
                StartDate = new DateTime(2025, 1, 8),
                EndDate = new DateTime(2025, 1, 14),
                Description = "Second audit"
            };

            // Act
            var result = await _handler.Handle(new CreateFuelAuditCommand(dto2), CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal("FA-2025-002", result.Data.AuditNumber);
        }

        [Fact]
        public async Task Handle_SameDayAudit_CreatesSuccessfully()
        {
            // Arrange - Same start and end date (single day audit)
            var today = DateTime.Today.AddDays(-1);
            var dto = new CreateFuelAuditDTO
            {
                StartDate = today,
                EndDate = today,
                Description = "Single day audit"
            };
            var command = new CreateFuelAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(today.Date, result.Data.StartDate.Date);
            Assert.Equal(today.Date, result.Data.EndDate.Date);
        }

        #endregion

        #region Validation Cases

        [Fact]
        public async Task Handle_EndDateBeforeStartDate_ReturnsFailed()
        {
            // Arrange
            var dto = new CreateFuelAuditDTO
            {
                StartDate = DateTime.Today,
                EndDate = DateTime.Today.AddDays(-7), // End before start
                Description = "Invalid dates"
            };
            var command = new CreateFuelAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("End date must be after start date", result.Message);
        }

        [Fact]
        public async Task Handle_FutureEndDate_ReturnsFailed()
        {
            // Arrange
            var dto = new CreateFuelAuditDTO
            {
                StartDate = DateTime.Today,
                EndDate = DateTime.Today.AddDays(7), // Future date
                Description = "Future audit"
            };
            var command = new CreateFuelAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("End date cannot be in the future", result.Message);
        }

        [Fact]
        public async Task Handle_DuplicateAuditNumber_ReturnsFailed()
        {
            // Arrange - Create first audit with specific number
            var auditNumber = "FA-2025-DUP";
            var dto1 = new CreateFuelAuditDTO
            {
                AuditNumber = auditNumber,
                StartDate = DateTime.Today.AddDays(-14),
                EndDate = DateTime.Today.AddDays(-8)
            };
            await _handler.Handle(new CreateFuelAuditCommand(dto1), CancellationToken.None);

            // Try to create second audit with same number
            var dto2 = new CreateFuelAuditDTO
            {
                AuditNumber = auditNumber,
                StartDate = DateTime.Today.AddDays(-7),
                EndDate = DateTime.Today.AddDays(-1)
            };

            // Act
            var result = await _handler.Handle(new CreateFuelAuditCommand(dto2), CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("already exists", result.Message);
        }

        [Fact]
        public async Task Handle_OverlappingDates_ReturnsFailed()
        {
            // Arrange - Create first audit
            var dto1 = new CreateFuelAuditDTO
            {
                StartDate = DateTime.Today.AddDays(-10),
                EndDate = DateTime.Today.AddDays(-5)
            };
            await _handler.Handle(new CreateFuelAuditCommand(dto1), CancellationToken.None);

            // Try to create overlapping audit
            var dto2 = new CreateFuelAuditDTO
            {
                StartDate = DateTime.Today.AddDays(-7), // Overlaps with first
                EndDate = DateTime.Today.AddDays(-1)
            };

            // Act
            var result = await _handler.Handle(new CreateFuelAuditCommand(dto2), CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("overlaps", result.Message.ToLower());
        }

        [Fact]
        public async Task Handle_CancelledAuditDoesNotBlockOverlap()
        {
            // Arrange - Create and cancel first audit
            var dto1 = new CreateFuelAuditDTO
            {
                StartDate = DateTime.Today.AddDays(-10),
                EndDate = DateTime.Today.AddDays(-5)
            };
            var result1 = await _handler.Handle(new CreateFuelAuditCommand(dto1), CancellationToken.None);

            // Cancel the first audit
            var audit = await _context.FuelAudits.FindAsync(result1.Data.Id);
            audit.Status = "Cancelled";
            await _context.SaveChangesAsync();

            // Create overlapping audit (should succeed since first is cancelled)
            var dto2 = new CreateFuelAuditDTO
            {
                StartDate = DateTime.Today.AddDays(-7),
                EndDate = DateTime.Today.AddDays(-1)
            };

            // Act
            var result = await _handler.Handle(new CreateFuelAuditCommand(dto2), CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
        }

        #endregion

        #region Edge Cases

        [Fact]
        public async Task Handle_NullDescription_CreatesSuccessfully()
        {
            // Arrange
            var dto = new CreateFuelAuditDTO
            {
                StartDate = DateTime.Today.AddDays(-7),
                EndDate = DateTime.Today.AddDays(-1),
                Description = null
            };
            var command = new CreateFuelAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Null(result.Data.Description);
        }

        [Fact]
        public async Task Handle_VeryLongDescription_CreatesSuccessfully()
        {
            // Arrange
            var longDescription = new string('A', 1000);
            var dto = new CreateFuelAuditDTO
            {
                StartDate = DateTime.Today.AddDays(-7),
                EndDate = DateTime.Today.AddDays(-1),
                Description = longDescription
            };
            var command = new CreateFuelAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(longDescription, result.Data.Description);
        }

        [Fact]
        public async Task Handle_InvalidCreatedBy_CreatesWithNullCreatedBy()
        {
            // Arrange
            var dto = new CreateFuelAuditDTO
            {
                StartDate = DateTime.Today.AddDays(-7),
                EndDate = DateTime.Today.AddDays(-1),
                CreatedBy = "not-a-number"
            };
            var command = new CreateFuelAuditCommand(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            // Verify the audit was created (we can't check CreatedBy directly from DTO response)
            var audit = await _context.FuelAudits.FindAsync(result.Data.Id);
            Assert.Null(audit.CreatedBy);
        }

        #endregion
    }
}
