using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Queries.Database.FMSQuery.TagQueries;
using MediatR;
using Moq;
using Xunit;

namespace FMS.Testing.TagQueries {
    /// <summary>
    /// Unit tests for the ValidateTagQuery handler.
    /// These tests verify the functionality of validating tags by checking authentication
    /// and validating against daily and monthly limits.
    /// </summary>
    public class ValidateTagQueryTests {
        private readonly Mock<IMediator> _mockMediator;
        private readonly ValidateTagQueryHandler _handler;

        public ValidateTagQueryTests () {
            _mockMediator = new Mock<IMediator> ();
            _handler = new ValidateTagQueryHandler (_mockMediator.Object);
        }

        #region Valid Tag Tests

        /// <summary>
        /// Tests that a valid tag (authenticated and within limits) returns a valid result.
        /// </summary>
        [Fact]
        public async Task Handle_ValidTagWithinLimits_ReturnsValidResult () {
            // Arrange
            var tagName = "123456789";

            // Setup tag authentication successful
            _mockMediator.Setup (m => m.Send (
                    It.Is<AuthenticateFuelTagQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (true, null, 50, false));

            // Setup tag details with limits not exceeded
            _mockMediator.Setup (m => m.Send (
                    It.Is<GetFuelTagDetailsQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new FuelTagDetailsDto {
                    TagId = tagName,
                        DailyUsed = 30,
                        DailyLimit = 100,
                        MonthlyUsed = 300,
                        MonthlyLimit = 500,
                        IsEnabled = true
                });

            // Act
            var result = await _handler.Handle (new ValidateFuelTagQuery (tagName), CancellationToken.None);

            // Assert
            Assert.True (result.IsValid);
            Assert.Equal ("Tag is valid", result.Message);
            Assert.NotNull (result.VehicleInfo);
            Assert.False (result.IsMasterTag);
        }

        /// <summary>
        /// Tests that a valid master tag returns a valid result with the IsMasterTag flag set.
        /// </summary>
        [Fact]
        public async Task Handle_ValidMasterTag_ReturnsValidResultWithMasterFlag () {
            // Arrange
            var tagName = "123456789";

            // Setup tag authentication successful for master tag
            _mockMediator.Setup (m => m.Send (
                    It.Is<AuthenticateFuelTagQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (true, null, 50, true)); // IsMasterTag = true

            // Setup tag details with limits not exceeded
            _mockMediator.Setup (m => m.Send (
                    It.Is<GetFuelTagDetailsQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new FuelTagDetailsDto {
                    TagId = tagName,
                        DailyUsed = 30,
                        DailyLimit = 100,
                        MonthlyUsed = 300,
                        MonthlyLimit = 500,
                        IsEnabled = true
                });

            // Act
            var result = await _handler.Handle (new ValidateFuelTagQuery (tagName), CancellationToken.None);

            // Assert
            Assert.True (result.IsValid);
            Assert.Equal ("Master Tag is valid", result.Message);
            Assert.Null (result.VehicleInfo); // For master tags, vehicle info might be null
            Assert.True (result.IsMasterTag);
        }

        #endregion

        #region Invalid Tag Tests

        /// <summary>
        /// Tests that a tag that fails authentication returns an invalid result.
        /// </summary>
        [Fact]
        public async Task Handle_FailedAuthentication_ReturnsInvalidResult () {
            // Arrange
            var tagName = "INVALIDTAG";

            // Setup tag authentication failed
            _mockMediator.Setup (m => m.Send (
                    It.Is<AuthenticateFuelTagQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (false, null, 0, false));

            // Act
            var result = await _handler.Handle (new ValidateFuelTagQuery (tagName), CancellationToken.None);

            // Assert
            Assert.False (result.IsValid);
            Assert.Equal ("Tag authentication failed", result.Message);
            Assert.Null (result.VehicleInfo);
            Assert.False (result.IsMasterTag);
        }

        /// <summary>
        /// Tests that a tag with daily limit exceeded returns an invalid result.
        /// </summary>
        [Fact]
        public async Task Handle_DailyLimitExceeded_ReturnsInvalidResult () {
            // Arrange
            var tagName = "123456789";

            // Setup tag authentication successful
            _mockMediator.Setup (m => m.Send (
                    It.Is<AuthenticateFuelTagQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (true, null, 0, false));

            // Setup tag details with daily limit exceeded
            _mockMediator.Setup (m => m.Send (
                    It.Is<GetFuelTagDetailsQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new FuelTagDetailsDto {
                    TagId = tagName,
                        DailyUsed = 100, // Equal to daily limit (maxed out)
                        DailyLimit = 100,
                        MonthlyUsed = 300,
                        MonthlyLimit = 500,
                        IsEnabled = true
                });

            // Act
            var result = await _handler.Handle (new ValidateFuelTagQuery (tagName), CancellationToken.None);

            // Assert
            Assert.False (result.IsValid);
            Assert.Equal ("Daily fuel limit exceeded", result.Message);
            Assert.NotNull (result.VehicleInfo);
            Assert.False (result.IsMasterTag);
        }

        /// <summary>
        /// Tests that a master tag with daily limit exceeded returns an invalid result
        /// with a master-specific message.
        /// </summary>
        [Fact]
        public async Task Handle_MasterTagDailyLimitExceeded_ReturnsInvalidResultWithMasterMessage () {
            // Arrange
            var tagName = "123456789";

            // Setup tag authentication successful for master tag
            _mockMediator.Setup (m => m.Send (
                    It.Is<AuthenticateFuelTagQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (true, null, 0, true)); // IsMasterTag = true

            // Setup tag details with daily limit exceeded
            _mockMediator.Setup (m => m.Send (
                    It.Is<GetFuelTagDetailsQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new FuelTagDetailsDto {
                    TagId = tagName,
                        DailyUsed = 100, // Equal to daily limit (maxed out)
                        DailyLimit = 100,
                        MonthlyUsed = 300,
                        MonthlyLimit = 500,
                        IsEnabled = true
                });

            // Act
            var result = await _handler.Handle (new ValidateFuelTagQuery (tagName), CancellationToken.None);

            // Assert
            Assert.False (result.IsValid);
            Assert.Equal ("Master Tag daily fuel limit exceeded", result.Message); // Master-specific message
            Assert.NotNull (result.VehicleInfo);
            Assert.True (result.IsMasterTag);
        }

        /// <summary>
        /// Tests that a tag with monthly limit exceeded returns an invalid result.
        /// </summary>
        [Fact]
        public async Task Handle_MonthlyLimitExceeded_ReturnsInvalidResult () {
            // Arrange
            var tagName = "123456789";

            // Setup tag authentication successful
            _mockMediator.Setup (m => m.Send (
                    It.Is<AuthenticateFuelTagQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (true, null, 0, false));

            // Setup tag details with monthly limit exceeded
            _mockMediator.Setup (m => m.Send (
                    It.Is<GetFuelTagDetailsQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new FuelTagDetailsDto {
                    TagId = tagName,
                        DailyUsed = 50, // Within daily limit
                        DailyLimit = 100,
                        MonthlyUsed = 500, // Equal to monthly limit (maxed out)
                        MonthlyLimit = 500,
                        IsEnabled = true
                });

            // Act
            var result = await _handler.Handle (new ValidateFuelTagQuery (tagName), CancellationToken.None);

            // Assert
            Assert.False (result.IsValid);
            Assert.Equal ("Monthly fuel limit exceeded", result.Message);
            Assert.NotNull (result.VehicleInfo);
            Assert.False (result.IsMasterTag);
        }

        /// <summary>
        /// Tests that a master tag with monthly limit exceeded returns an invalid result
        /// with a master-specific message.
        /// </summary>
        [Fact]
        public async Task Handle_MasterTagMonthlyLimitExceeded_ReturnsInvalidResultWithMasterMessage () {
            // Arrange
            var tagName = "123456789";

            // Setup tag authentication successful for master tag
            _mockMediator.Setup (m => m.Send (
                    It.Is<AuthenticateFuelTagQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (true, null, 0, true)); // IsMasterTag = true

            // Setup tag details with monthly limit exceeded
            _mockMediator.Setup (m => m.Send (
                    It.Is<GetFuelTagDetailsQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new FuelTagDetailsDto {
                    TagId = tagName,
                        DailyUsed = 50, // Within daily limit
                        DailyLimit = 100,
                        MonthlyUsed = 500, // Equal to monthly limit (maxed out)
                        MonthlyLimit = 500,
                        IsEnabled = true
                });

            // Act
            var result = await _handler.Handle (new ValidateFuelTagQuery (tagName), CancellationToken.None);

            // Assert
            Assert.False (result.IsValid);
            Assert.Equal ("Master Tag monthly fuel limit exceeded", result.Message); // Master-specific message
            Assert.NotNull (result.VehicleInfo);
            Assert.True (result.IsMasterTag);
        }

        /// <summary>
        /// Tests that when GetTagDetailsQuery throws a KeyNotFoundException, it is handled properly.
        /// </summary>
        [Fact]
        public async Task Handle_TagNotFound_ReturnsInvalidResultWithMessage () {
            // Arrange
            var tagName = "NONEXISTENTTAG";
            var errorMessage = "Tag not found";

            // Setup tag authentication successful (to get to tag details lookup)
            _mockMediator.Setup (m => m.Send (
                    It.Is<AuthenticateFuelTagQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (true, null, 50, false));

            // Setup tag details throws KeyNotFoundException
            _mockMediator.Setup (m => m.Send (
                    It.Is<GetFuelTagDetailsQuery> (q => q.fuelTagName == tagName),
                    It.IsAny<CancellationToken> ()))
                .ThrowsAsync (new KeyNotFoundException (errorMessage));

            // Act
            var result = await _handler.Handle (new ValidateFuelTagQuery (tagName), CancellationToken.None);

            // Assert
            Assert.False (result.IsValid);
            Assert.Equal (errorMessage, result.Message);
            Assert.Null (result.VehicleInfo);
            Assert.False (result.IsMasterTag);
        }

        #endregion
    }
}