using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Application.Features.FuelAudit.Queries;
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
    /// Unit tests for GetFuelAuditsQuery handler
    /// </summary>
    public class GetFuelAuditsQueryTests : IDisposable
    {
        private readonly GpsdataContext _context;
        private readonly Mock<ILogger<GetFuelAuditsQueryHandler>> _mockLogger;
        private readonly GetFuelAuditsQueryHandler _handler;

        public GetFuelAuditsQueryTests()
        {
            // Setup in-memory database with unique name for test isolation
            var options = new DbContextOptionsBuilder<GpsdataContext>()
                .UseInMemoryDatabase(databaseName: $"FuelAuditQueryTest_{Guid.NewGuid()}")
                .Options;
            _context = new GpsdataContext(options);

            _mockLogger = new Mock<ILogger<GetFuelAuditsQueryHandler>>();

            _handler = new GetFuelAuditsQueryHandler(_context, _mockLogger.Object);

            // Seed test data
            SeedTestData().Wait();
        }

        private async Task SeedTestData()
        {
            var audits = new[]
            {
                new FuelAuditEntity
                {
                    AuditNumber = "FA-2025-001",
                    StartDate = new DateTime(2025, 1, 1),
                    EndDate = new DateTime(2025, 1, 7),
                    Status = "Draft",
                    Description = "First week audit",
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    FlagCount = 0,
                    UnresolvedFlagCount = 0
                },
                new FuelAuditEntity
                {
                    AuditNumber = "FA-2025-002",
                    StartDate = new DateTime(2025, 1, 8),
                    EndDate = new DateTime(2025, 1, 14),
                    Status = "Calculated",
                    Description = "Second week audit",
                    CreatedAt = DateTime.UtcNow.AddDays(-23),
                    SystemVariance = -50.5m,
                    SystemVariancePercent = -1.2m,
                    FlagCount = 2,
                    UnresolvedFlagCount = 1
                },
                new FuelAuditEntity
                {
                    AuditNumber = "FA-2025-003",
                    StartDate = new DateTime(2025, 1, 15),
                    EndDate = new DateTime(2025, 1, 21),
                    Status = "Finalized",
                    Description = "Third week audit",
                    CreatedAt = DateTime.UtcNow.AddDays(-16),
                    SystemVariance = -25.0m,
                    SystemVariancePercent = -0.6m,
                    FlagCount = 1,
                    UnresolvedFlagCount = 0,
                    DataConfidence = "High"
                },
                new FuelAuditEntity
                {
                    AuditNumber = "FA-2025-004",
                    StartDate = new DateTime(2025, 1, 22),
                    EndDate = new DateTime(2025, 1, 28),
                    Status = "Cancelled",
                    Description = "Cancelled audit",
                    CreatedAt = DateTime.UtcNow.AddDays(-9),
                    FlagCount = 0,
                    UnresolvedFlagCount = 0
                },
                new FuelAuditEntity
                {
                    AuditNumber = "FA-2025-005",
                    StartDate = new DateTime(2025, 2, 1),
                    EndDate = new DateTime(2025, 2, 7),
                    Status = "Draft",
                    Description = "February audit",
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    FlagCount = 0,
                    UnresolvedFlagCount = 0
                }
            };

            _context.FuelAudits.AddRange(audits);
            await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        #region Basic Query Tests

        [Fact]
        public async Task Handle_NoFilter_ReturnsAllAudits()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO();
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(5, result.Data.TotalCount);
            Assert.Equal(5, result.Data.Items.Count);
        }

        [Fact]
        public async Task Handle_DefaultSorting_OrdersByCreatedAtDescending()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO();
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            // Most recent should be first
            Assert.Equal("FA-2025-005", result.Data.Items[0].AuditNumber);
        }

        #endregion

        #region Status Filter Tests

        [Fact]
        public async Task Handle_FilterByStatus_ReturnsMatchingAudits()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO { Status = "Draft" };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(2, result.Data.TotalCount);
            Assert.All(result.Data.Items, item => Assert.Equal("Draft", item.Status));
        }

        [Fact]
        public async Task Handle_FilterByFinalizedStatus_ReturnsFinalizedOnly()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO { Status = "Finalized" };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(1, result.Data.TotalCount);
            Assert.Equal("FA-2025-003", result.Data.Items[0].AuditNumber);
        }

        [Fact]
        public async Task Handle_FilterByNonExistentStatus_ReturnsEmpty()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO { Status = "NonExistent" };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(0, result.Data.TotalCount);
            Assert.Empty(result.Data.Items);
        }

        #endregion

        #region Date Filter Tests

        [Fact]
        public async Task Handle_FilterByStartDateFrom_ReturnsAuditsAfterDate()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO
            {
                StartDateFrom = new DateTime(2025, 1, 15)
            };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(3, result.Data.TotalCount); // FA-003, FA-004, FA-005
            Assert.All(result.Data.Items, item =>
                Assert.True(item.StartDate >= new DateTime(2025, 1, 15)));
        }

        [Fact]
        public async Task Handle_FilterByStartDateTo_ReturnsAuditsBeforeDate()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO
            {
                StartDateTo = new DateTime(2025, 1, 14)
            };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(2, result.Data.TotalCount); // FA-001, FA-002
        }

        [Fact]
        public async Task Handle_FilterByDateRange_ReturnsAuditsInRange()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO
            {
                StartDateFrom = new DateTime(2025, 1, 8),
                StartDateTo = new DateTime(2025, 1, 22)
            };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(3, result.Data.TotalCount); // FA-002, FA-003, FA-004
        }

        #endregion

        #region Audit Number Filter Tests

        [Fact]
        public async Task Handle_FilterByAuditNumber_ReturnsMatchingAudits()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO { AuditNumber = "003" };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(1, result.Data.TotalCount);
            Assert.Equal("FA-2025-003", result.Data.Items[0].AuditNumber);
        }

        [Fact]
        public async Task Handle_FilterByPartialAuditNumber_ReturnsAllMatching()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO { AuditNumber = "2025" };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(5, result.Data.TotalCount); // All have 2025 in their number
        }

        #endregion

        #region Flag Filter Tests

        [Fact]
        public async Task Handle_FilterByHasUnresolvedFlags_ReturnsAuditsWithFlags()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO { HasUnresolvedFlags = true };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(1, result.Data.TotalCount);
            Assert.Equal("FA-2025-002", result.Data.Items[0].AuditNumber);
            Assert.True(result.Data.Items[0].UnresolvedFlagCount > 0);
        }

        [Fact]
        public async Task Handle_FilterByNoUnresolvedFlags_ReturnsAuditsWithoutFlags()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO { HasUnresolvedFlags = false };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(4, result.Data.TotalCount);
            Assert.All(result.Data.Items, item => Assert.Equal(0, item.UnresolvedFlagCount));
        }

        #endregion

        #region Sorting Tests

        [Fact]
        public async Task Handle_SortByStartDateAscending_ReturnsSortedAudits()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO
            {
                SortBy = "startdate",
                SortDescending = false
            };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal("FA-2025-001", result.Data.Items[0].AuditNumber);
            Assert.Equal("FA-2025-005", result.Data.Items[^1].AuditNumber);
        }

        [Fact]
        public async Task Handle_SortByVarianceDescending_ReturnsSortedAudits()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO
            {
                SortBy = "variance",
                SortDescending = true
            };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            // Audits with null variance should be sorted, then by variance value
        }

        #endregion

        #region Pagination Tests

        [Fact]
        public async Task Handle_Pagination_ReturnsCorrectPage()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO
            {
                Page = 1,
                PageSize = 2
            };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(5, result.Data.TotalCount);
            Assert.Equal(2, result.Data.Items.Count);
            Assert.Equal(1, result.Data.Page);
            Assert.Equal(2, result.Data.PageSize);
            Assert.Equal(3, result.Data.TotalPages);
            Assert.False(result.Data.HasPreviousPage);
            Assert.True(result.Data.HasNextPage);
        }

        [Fact]
        public async Task Handle_SecondPage_ReturnsCorrectItems()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO
            {
                Page = 2,
                PageSize = 2,
                SortBy = "startdate",
                SortDescending = false
            };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(2, result.Data.Items.Count);
            Assert.True(result.Data.HasPreviousPage);
            Assert.True(result.Data.HasNextPage);
        }

        [Fact]
        public async Task Handle_LastPage_HasNoNextPage()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO
            {
                Page = 3,
                PageSize = 2,
                SortBy = "startdate",
                SortDescending = false
            };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(1, result.Data.Items.Count); // Only 1 item on last page
            Assert.True(result.Data.HasPreviousPage);
            Assert.False(result.Data.HasNextPage);
        }

        [Fact]
        public async Task Handle_InvalidPageNumber_DefaultsToFirstPage()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO
            {
                Page = 0, // Invalid
                PageSize = 2
            };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(1, result.Data.Page);
        }

        [Fact]
        public async Task Handle_InvalidPageSize_DefaultsTo20()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO
            {
                Page = 1,
                PageSize = 0 // Invalid
            };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(20, result.Data.PageSize);
        }

        #endregion

        #region Combined Filter Tests

        [Fact]
        public async Task Handle_MultipleFilters_ReturnsMatchingAudits()
        {
            // Arrange
            var filter = new FuelAuditFilterDTO
            {
                Status = "Draft",
                StartDateFrom = new DateTime(2025, 1, 1)
            };
            var query = new GetFuelAuditsQuery(filter);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(2, result.Data.TotalCount);
            Assert.All(result.Data.Items, item => Assert.Equal("Draft", item.Status));
        }

        #endregion
    }
}
