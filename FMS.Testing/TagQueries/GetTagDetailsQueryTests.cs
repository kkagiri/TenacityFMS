using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Queries;
using FMS.Application.Queries.Database.FMSQuery.TagQueries;
using FMS.Application.Queries.Database.PTSQueries.TagQueries;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Domain.Entities.Features.FuelRuleSet;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace FMS.Testing.TagQueries {
    /// <summary>
    /// Unit tests for the GetTagDetailsQuery handler.
    /// These tests verify the functionality of retrieving tag details, including
    /// fuel usage and limits for vehicles.
    /// </summary>
    public class GetTagDetailsQueryTests {
        private readonly Mock<IMediator> _mockMediator;
        private readonly Mock<GpsdataContext> _mockContext;
        private readonly GetFuelTagDetailsQueryHandler _handler;

        public GetTagDetailsQueryTests () {
            _mockMediator = new Mock<IMediator> ();
            _mockContext = new Mock<GpsdataContext> ();
            _handler = new GetFuelTagDetailsQueryHandler (_mockMediator.Object, _mockContext.Object);
        }

        /// <summary>
        /// Tests that GetTagDetails returns correct tag information when the tag has a rule set
        /// with daily and monthly limits.
        /// </summary>
        [Fact]
        public async Task Handle_ValidTagWithRules_ReturnsCorrectDetails () {
            // Arrange
            var tagName = "123456789";
            var tagId = 1;
            var vehicleId = 5;
            var dailyLimit = 100;
            var monthlyLimit = 500;
            var dailyUsed = 30m;
            var monthlyUsed = 200m;
            var hyoungNo = "HYG123";
            var vehicleTypeName = "Truck";

            // Create tag with rule set
            var tag = new FuelTag {
                Id = tagId,
                Name = tagName,
                IsEnabled = true,
                VehicleId = vehicleId,
                FuelRuleSetId = 1,
                FuelRuleSet = new FuelingRuleSet {
                Id = 1,
                Name = "Standard Rules",
                Rules = new System.Collections.Generic.List<FMS.Domain.Entities.Features.FuelRule.FuelingRule> {
                new DailyMonthlyLimitRule {
                Id = 1,
                RuleName = "Standard Limits",
                IsActive = true,
                DailyLimitLiter = dailyLimit,
                MonthlyLimitLiter = monthlyLimit
                }
                }
                }
            };

            // Setup vehicle and vehicle type
            var vehicle = new Vehicle {
                VehicleId = vehicleId,
                HyoungNo = hyoungNo,
                VehicleTypeId = 2
            };

            var vehicleType = new Vehicletype {
                Id = 2,
                Name = vehicleTypeName
            };

            // Setup mediator mocks
            _mockMediator.Setup (m => m.Send (It.IsAny<GetFuelTagByNameQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (tag);

            _mockMediator.Setup (m => m.Send (It.IsAny<GetDailyFuelIssuedForTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (dailyUsed);

            _mockMediator.Setup (m => m.Send (It.IsAny<GetMonthlyFuelIssuedForTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (monthlyUsed);

            // Setup context mocks
            var mockVehicles = new Mock<DbSet<Vehicle>> ();
            var mockVehicleTypes = new Mock<DbSet<Vehicletype>> ();

            _mockContext.Setup (c => c.Vehicles.FindAsync (vehicleId))
                .ReturnsAsync (vehicle);

            _mockContext.Setup (c => c.Vehicletypes.FindAsync (vehicle.VehicleTypeId))
                .ReturnsAsync (vehicleType);

            // Act
            var result = await _handler.Handle (new GetFuelTagDetailsQuery (tagName), CancellationToken.None);

            // Assert
            Assert.NotNull (result);
            Assert.Equal (tagName, result.TagId);
            Assert.Equal (vehicleId, result.VehicleId);
            Assert.Equal (hyoungNo, result.HyoungNo);
            Assert.Equal (dailyUsed, result.DailyUsed);
            Assert.Equal (dailyLimit, result.DailyLimit);
            Assert.Equal (monthlyUsed, result.MonthlyUsed);
            Assert.Equal (monthlyLimit, result.MonthlyLimit);
            Assert.True (result.IsEnabled);
            Assert.Equal (vehicleTypeName, result.VehicleType);
        }

        /// <summary>
        /// Tests that GetTagDetails throws KeyNotFoundException when the tag is not found.
        /// </summary>
        [Fact]
        public async Task Handle_TagNotFound_ThrowsKeyNotFoundException () {
            // Arrange
            var tagName = "NONEXISTENTTAG";

            // Setup mediator to return null for the tag
            _mockMediator.Setup (m => m.Send (It.IsAny<GetFuelTagByNameQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync ((FuelTag) null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException> (() =>
                _handler.Handle (new GetFuelTagDetailsQuery (tagName), CancellationToken.None));

            Assert.Contains ("Tag not found", exception.Message);
        }

        /// <summary>
        /// Tests that GetTagDetails returns default limits when the tag has no rule set.
        /// </summary>
        [Fact]
        public async Task Handle_TagWithNoRuleSet_ReturnsDefaultLimits () {
            // Arrange
            var tagName = "123456789";
            var tagId = 1;
            var vehicleId = 5;
            var dailyUsed = 30m;
            var monthlyUsed = 200m;

            // Create tag with no rule set
            var tag = new FuelTag {
                Id = tagId,
                Name = tagName,
                IsEnabled = true,
                VehicleId = vehicleId,
                FuelRuleSetId = null,
                FuelRuleSet = null
            };

            // Setup vehicle and vehicle type
            var vehicle = new Vehicle {
                VehicleId = vehicleId,
                HyoungNo = "HYG123",
                VehicleTypeId = 2
            };

            var vehicleType = new Vehicletype {
                Id = 2,
                Name = "Truck"
            };

            // Setup mediator mocks
            _mockMediator.Setup (m => m.Send (It.IsAny<GetFuelTagByNameQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (tag);

            _mockMediator.Setup (m => m.Send (It.IsAny<GetDailyFuelIssuedForTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (dailyUsed);

            _mockMediator.Setup (m => m.Send (It.IsAny<GetMonthlyFuelIssuedForTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (monthlyUsed);

            // Setup context mocks
            _mockContext.Setup (c => c.Vehicles.FindAsync (vehicleId))
                .ReturnsAsync (vehicle);

            _mockContext.Setup (c => c.Vehicletypes.FindAsync (vehicle.VehicleTypeId))
                .ReturnsAsync (vehicleType);

            // Act
            var result = await _handler.Handle (new GetFuelTagDetailsQuery (tagName), CancellationToken.None);

            // Assert
            Assert.NotNull (result);
            // Default daily limit should be 50
            Assert.Equal (50, result.DailyLimit);
            // Default monthly limit should be 500
            Assert.Equal (500, result.MonthlyLimit);
        }

        /// <summary>
        /// Tests that GetTagDetails gracefully handles a missing vehicle record.
        /// </summary>
        [Fact]
        public async Task Handle_MissingVehicle_HandlesGracefully () {
            // Arrange
            var tagName = "123456789";
            var tagId = 1;
            var vehicleId = 5;
            var dailyUsed = 30m;
            var monthlyUsed = 200m;

            // Create tag with rule set
            var tag = new FuelTag {
                Id = tagId,
                Name = tagName,
                IsEnabled = true,
                VehicleId = vehicleId,
                FuelRuleSet = new FuelingRuleSet {
                Id = 1,
                Name = "Standard Rules",
                Rules = new System.Collections.Generic.List<FMS.Domain.Entities.Features.FuelRule.FuelingRule> {
                new DailyMonthlyLimitRule {
                Id = 1,
                RuleName = "Standard Limits",
                IsActive = true,
                DailyLimitLiter = 100,
                MonthlyLimitLiter = 500
                }
                }
                }
            };

            // Setup mediator mocks
            _mockMediator.Setup (m => m.Send (It.IsAny<GetFuelTagByNameQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (tag);

            _mockMediator.Setup (m => m.Send (It.IsAny<GetDailyFuelIssuedForTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (dailyUsed);

            _mockMediator.Setup (m => m.Send (It.IsAny<GetMonthlyFuelIssuedForTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (monthlyUsed);

            // Setup context mocks to return null for vehicle
            _mockContext.Setup (c => c.Vehicles.FindAsync (vehicleId))
                .ReturnsAsync ((Vehicle) null);

            // Make sure we don't call FindAsync on vehicle types when vehicle is null
            _mockContext.Setup (c => c.Vehicletypes.FindAsync (It.IsAny<int> ()))
                .Throws (new InvalidOperationException ("This should not be called when vehicle is null"));

            // Act
            var result = await _handler.Handle (new GetFuelTagDetailsQuery (tagName), CancellationToken.None);

            // Assert
            Assert.NotNull (result);
            Assert.Equal (vehicleId, result.VehicleId);
            // Should handle missing vehicle gracefully
            Assert.Null (result.HyoungNo);
            Assert.Null (result.VehicleType);
        }

        /// <summary>
        /// Tests that GetTagDetails gracefully handles a vehicle with null VehicleTypeId.
        /// </summary>
        [Fact]
        public async Task Handle_VehicleWithNullTypeId_HandlesGracefully () {
            // Arrange
            var tagName = "123456789";
            var tagId = 1;
            var vehicleId = 5;
            var dailyUsed = 30m;
            var monthlyUsed = 200m;
            var hyoungNo = "HYG123";

            // Create tag with rule set
            var tag = new FuelTag {
                Id = tagId,
                Name = tagName,
                IsEnabled = true,
                VehicleId = vehicleId,
                FuelRuleSet = new FuelingRuleSet {
                Id = 1,
                Name = "Standard Rules",
                Rules = new System.Collections.Generic.List<FMS.Domain.Entities.Features.FuelRule.FuelingRule> {
                new DailyMonthlyLimitRule {
                Id = 1,
                RuleName = "Standard Limits",
                IsActive = true,
                DailyLimitLiter = 100,
                MonthlyLimitLiter = 500
                }
                }
                }
            };

            // Setup vehicle with null VehicleTypeId
            var vehicle = new Vehicle {
                VehicleId = vehicleId,
                HyoungNo = hyoungNo,
                VehicleTypeId = null // Explicitly null
            };

            // Setup mediator mocks
            _mockMediator.Setup (m => m.Send (It.IsAny<GetFuelTagByNameQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (tag);

            _mockMediator.Setup (m => m.Send (It.IsAny<GetDailyFuelIssuedForTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (dailyUsed);

            _mockMediator.Setup (m => m.Send (It.IsAny<GetMonthlyFuelIssuedForTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (monthlyUsed);

            // Setup context mocks
            _mockContext.Setup (c => c.Vehicles.FindAsync (vehicleId))
                .ReturnsAsync (vehicle);

            // Make sure we don't call FindAsync on vehicle types when VehicleTypeId is null
            _mockContext.Setup (c => c.Vehicletypes.FindAsync (It.IsAny<int> ()))
                .Throws (new InvalidOperationException ("This should not be called when VehicleTypeId is null"));

            // Act
            var result = await _handler.Handle (new GetFuelTagDetailsQuery (tagName), CancellationToken.None);

            // Assert
            Assert.NotNull (result);
            Assert.Equal (vehicleId, result.VehicleId);
            Assert.Equal (hyoungNo, result.HyoungNo); // HyoungNo should be present
            Assert.Null (result.VehicleType); // VehicleType should be null
        }
    }
}