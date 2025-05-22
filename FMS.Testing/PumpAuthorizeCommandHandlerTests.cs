/// <summary>
/// Unit tests for the PumpAuthorizeCommandHandler.
///
/// These tests verify the functionality of PumpAuthorizeCommandHandler, which handles requests
/// to authorize pumps for fueling from the frontend/UI. The handler validates requests, checks
/// if a pump is already authorized, authenticates tags, calls the pump service to authorize the
/// pump, and updates the authorization state in the tracker.
///
/// The tests are organized in two main regions:
/// 1. ValidateRequest Tests - Testing the private ValidateRequest method through reflection
/// 2. Handle Tests - Testing the public Handle method with various scenarios
/// </summary>
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Application.Common;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Infrastructure.Expections.Base;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Queries.Database.FMSQuery.TagQueries;
using FMS.Domain.Entities.PTS;
using FMS.Domain.Entities.PTS.Enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FMS.Testing {
    public class PumpAuthorizeCommandHandlerTests {
        private readonly Mock<IAuthorizationStateTracker> _mockAuthTracker;
        private readonly Mock<IMediator> _mockMediator;
        private readonly Mock<GpsdataContext> _mockContext;
        private readonly Mock<IPumpService> _mockPumpService;
        private readonly Mock<ILogger<PumpAuthorizeCommandHandler>> _mockLogger;
        private readonly PumpAuthorizeCommandHandler _handler;

        /// <summary>
        /// Setup for all tests. Creates mocks for all dependencies:
        /// - IAuthorizationStateTracker: Tracks pump/nozzle authorization state
        /// - IMediator: For sending queries (e.g., AuthenticateTagQuery)
        /// - GpsdataContext: Database context
        /// - IPumpService: Service for authorizing pumps with the PTS device
        /// - ILogger: For logging
        /// </summary>
        public PumpAuthorizeCommandHandlerTests () {
            _mockAuthTracker = new Mock<IAuthorizationStateTracker> ();
            _mockMediator = new Mock<IMediator> ();
            _mockContext = new Mock<GpsdataContext> ();
            _mockPumpService = new Mock<IPumpService> ();
            _mockLogger = new Mock<ILogger<PumpAuthorizeCommandHandler>> ();

            _handler = new PumpAuthorizeCommandHandler (
                _mockAuthTracker.Object,
                _mockMediator.Object,
                _mockContext.Object,
                _mockPumpService.Object,
                _mockLogger.Object
            );
        }

        #region ValidateRequest Tests
        /// <summary>
        /// Tests for the private ValidateRequest method, which validates incoming PumpAuthorizeCommand requests.
        /// These tests use reflection to access the private method.
        /// </summary>

        /// <summary>
        /// Verifies that ValidateRequest returns true when all request parameters are valid.
        /// </summary>
        [Fact]
        public async Task ValidateRequest_ReturnsTrue_WhenRequestIsValid () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME,
                NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLE
            };

            // Use reflection to access private method
            var method = typeof (PumpAuthorizeCommandHandler).GetMethod ("ValidateRequest",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // Act
            var result = await (Task<bool>) method.Invoke (_handler, new object[] { request });

            // Assert
            Assert.True (result);
        }

        /// <summary>
        /// Verifies that ValidateRequest returns false when DeviceId is null or empty.
        /// DeviceId is required to identify the PTS device.
        /// </summary>
        [Fact]
        public async Task ValidateRequest_ReturnsFalse_WhenDeviceIdIsEmpty () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = null,
                PumpId = 1,
                Dose = 20.0,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME,
                NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLE
            };

            // Use reflection to access private method
            var method = typeof (PumpAuthorizeCommandHandler).GetMethod ("ValidateRequest",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // Act
            var result = await (Task<bool>) method.Invoke (_handler, new object[] { request });

            // Assert
            Assert.False (result);
        }

        /// <summary>
        /// Verifies that ValidateRequest returns false when PumpId is invalid.
        /// Valid PumpId must be between 1 and 50 inclusive.
        /// </summary>
        [Theory]
        [InlineData (0)] // Too low
        [InlineData (-1)] // Negative
        [InlineData (51)] // Too high (max is 50)
        public async Task ValidateRequest_ReturnsFalse_WhenPumpIdIsInvalid (int pumpId) {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = pumpId,
                Dose = 20.0,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME,
                NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLE
            };

            // Use reflection to access private method
            var method = typeof (PumpAuthorizeCommandHandler).GetMethod ("ValidateRequest",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // Act
            var result = await (Task<bool>) method.Invoke (_handler, new object[] { request });

            // Assert
            Assert.False (result);
        }

        /// <summary>
        /// Verifies that ValidateRequest returns false when Dose is zero or negative for VOLUME type.
        /// A positive Dose is required for VOLUME type authorizations.
        /// </summary>
        [Theory]
        [InlineData (0)] // Zero
        [InlineData (-1)] // Negative
        public async Task ValidateRequest_ReturnsFalse_WhenDoseIsZeroOrNegative (double dose) {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = dose,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME, // Only enforced for VOLUME type
                NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLE
            };

            // Use reflection to access private method
            var method = typeof (PumpAuthorizeCommandHandler).GetMethod ("ValidateRequest",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // Act
            var result = await (Task<bool>) method.Invoke (_handler, new object[] { request });

            // Assert
            Assert.False (result);
        }

        /// <summary>
        /// Verifies that ValidateRequest returns false when Nozzle is invalid for NOZZLE selector.
        /// When NozzleOrFuelIdSelector is NOZZLE, a valid Nozzle value (> 0) is required.
        /// </summary>
        [Fact]
        public async Task ValidateRequest_ReturnsFalse_WhenNozzleIsInvalidForNozzleSelector () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                Nozzle = 0, // Invalid nozzle
                Type = PumpAuthorizeType.VOLUME,
                NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLE
            };

            // Use reflection to access private method
            var method = typeof (PumpAuthorizeCommandHandler).GetMethod ("ValidateRequest",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // Act
            var result = await (Task<bool>) method.Invoke (_handler, new object[] { request });

            // Assert
            Assert.False (result);
        }

        /// <summary>
        /// Verifies that ValidateRequest returns false when FuelGradeId is invalid for FUELGRADEID selector.
        /// When NozzleOrFuelIdSelector is FUELGRADEID, a valid FuelGradeId (> 0) is required.
        /// </summary>
        [Fact]
        public async Task ValidateRequest_ReturnsFalse_WhenFuelGradeIdIsInvalidForFuelGradeSelector () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                FuelGradeId = 0, // Invalid fuel grade ID
                Type = PumpAuthorizeType.VOLUME,
                NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.FUELGRADEID
            };

            // Use reflection to access private method
            var method = typeof (PumpAuthorizeCommandHandler).GetMethod ("ValidateRequest",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // Act
            var result = await (Task<bool>) method.Invoke (_handler, new object[] { request });

            // Assert
            Assert.False (result);
        }

        #endregion

        #region Handle Tests
        /// <summary>
        /// Tests for the Handle method, which processes PumpAuthorizeCommand requests.
        /// These tests verify the behavior of the handler when processing different types of requests.
        /// </summary>

        /// <summary>
        /// Verifies that Handle sets NozzleOrFuelIdSelector to NOZZLE when a Nozzle value is provided.
        /// </summary>
        [Fact]
        public async Task Handle_SetsNozzleSelector_WhenNozzleIsProvided () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (false);

            _mockPumpService.Setup (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()))
                .ReturnsAsync (new PumpAuthorizeConfirmation { Pump = 1, Transaction = 123 });

            // Act
            var result = await _handler.Handle (request, CancellationToken.None);

            // Assert
            _mockPumpService.Verify (x => x.PumpAuthorizeAsync (
                It.IsAny<string> (),
                It.Is<PumpAuthorizeData> (d => d.NozzleOrFuelIdSelector == NozzleOrFuelIdSelector.NOZZLE)
            ), Times.Once);
        }

        /// <summary>
        /// Verifies that Handle sets NozzleOrFuelIdSelector to FUELGRADEID when a FuelGradeId value is provided.
        /// </summary>
        [Fact]
        public async Task Handle_SetsFuelGradeIdSelector_WhenFuelGradeIdIsProvided () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                FuelGradeId = 5,
                Type = PumpAuthorizeType.VOLUME
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (false);

            _mockPumpService.Setup (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()))
                .ReturnsAsync (new PumpAuthorizeConfirmation { Pump = 1, Transaction = 123 });

            // Act
            var result = await _handler.Handle (request, CancellationToken.None);

            // Assert
            _mockPumpService.Verify (x => x.PumpAuthorizeAsync (
                It.IsAny<string> (),
                It.Is<PumpAuthorizeData> (d => d.NozzleOrFuelIdSelector == NozzleOrFuelIdSelector.FUELGRADEID)
            ), Times.Once);
        }

        /// <summary>
        /// Verifies that Handle sets NozzleOrFuelIdSelector to NOZZLES when a list of Nozzles is provided.
        /// </summary>
        [Fact]
        public async Task Handle_SetsNozzlesSelector_WhenNozzlesListIsProvided () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                Nozzles = new List<int> { 1, 2, 3 },
                Type = PumpAuthorizeType.VOLUME
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (false);

            _mockPumpService.Setup (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()))
                .ReturnsAsync (new PumpAuthorizeConfirmation { Pump = 1, Transaction = 123 });

            // Act
            var result = await _handler.Handle (request, CancellationToken.None);

            // Assert
            _mockPumpService.Verify (x => x.PumpAuthorizeAsync (
                It.IsAny<string> (),
                It.Is<PumpAuthorizeData> (d => d.NozzleOrFuelIdSelector == NozzleOrFuelIdSelector.NOZZLES)
            ), Times.Once);
        }

        /// <summary>
        /// Verifies that Handle returns a "Pump already authorized" message when the pump is already authorized.
        /// This prevents double-authorizing the same pump/nozzle.
        /// </summary>
        [Fact]
        public async Task Handle_ReturnsAlreadyAuthorized_WhenPumpIsAlreadyAuthorized () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (true);

            // Act
            var result = await _handler.Handle (request, CancellationToken.None);

            // Assert
            Assert.True (result.Success);
            Assert.Equal ("Pump already authorized", result.Message);
            Assert.Null (result.Data);
            _mockPumpService.Verify (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()), Times.Never);
        }

        /// <summary>
        /// Verifies that Handle authenticates a tag when a Tag value is provided.
        /// The handler should send an AuthenticateTagQuery to verify the tag.
        /// </summary>
        [Fact]
        public async Task Handle_AuthenticatesTag_WhenTagIsProvided () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME,
                Tag = "TAG123"
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (false);

            _mockMediator.Setup (x => x.Send (It.IsAny<AuthenticateTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (true, null, 30, false));

            _mockPumpService.Setup (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()))
                .ReturnsAsync (new PumpAuthorizeConfirmation { Pump = 1, Transaction = 123 });

            // Act
            var result = await _handler.Handle (request, CancellationToken.None);

            // Assert
            _mockMediator.Verify (x => x.Send (It.Is<AuthenticateTagQuery> (q => q.TagName == "TAG123"), It.IsAny<CancellationToken> ()), Times.Once);
            Assert.True (result.Success);
        }

        /// <summary>
        /// Verifies that Handle returns false when tag authentication fails.
        /// This prevents unauthorized tags from being used for fueling.
        /// </summary>
        [Fact]
        public async Task Handle_ReturnsFalse_WhenTagAuthenticationFails () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME,
                Tag = "INVALID_TAG"
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (false);

            _mockMediator.Setup (x => x.Send (It.IsAny<AuthenticateTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (false, null, 0, false));

            // Act
            var result = await _handler.Handle (request, CancellationToken.None);

            // Assert
            Assert.False (result.Success);
            Assert.Equal ("Tag not authenticated", result.Message);
            _mockPumpService.Verify (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()), Times.Never);
        }

        /// <summary>
        /// Verifies that Handle uses the dose limit from the tag when a dose is not provided.
        /// This allows the tag to define the maximum amount of fuel allowed.
        /// </summary>
        [Fact]
        public async Task Handle_UsesDoseLimitFromTag_WhenDoseNotProvided () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = null, // No dose provided
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME,
                Tag = "123456789"
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (false);

            decimal tagDoseLimit = 25;
            _mockMediator.Setup (x => x.Send (It.IsAny<AuthenticateTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (true, null, tagDoseLimit, false));

            _mockPumpService.Setup (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()))
                .ReturnsAsync (new PumpAuthorizeConfirmation { Pump = 1, Transaction = 123 });

            // Act
            var result = await _handler.Handle (request, CancellationToken.None);

            // Assert
            _mockPumpService.Verify (x => x.PumpAuthorizeAsync (
                It.IsAny<string> (),
                It.Is<PumpAuthorizeData> (d => d.Dose == (double) tagDoseLimit)
            ), Times.Once);
            Assert.True (result.Success);
        }

        /// <summary>
        /// Verifies that Handle calls the pump service with the correct data.
        /// This ensures that all parameters are correctly passed to the PTS device.
        /// </summary>
        [Fact]
        public async Task Handle_CallsPumpServiceWithCorrectData () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME,
                PriceEnabled = true,
                AutoCloseTransaction = true,
                TransactionEnabled = true,
                Tag = "TAG123"
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (false);

            _mockMediator.Setup (x => x.Send (It.IsAny<AuthenticateTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (true, null, 30, false));

            _mockPumpService.Setup (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()))
                .ReturnsAsync (new PumpAuthorizeConfirmation { Pump = 1, Transaction = 123 });

            // Act
            var result = await _handler.Handle (request, CancellationToken.None);

            // Assert
            _mockPumpService.Verify (x => x.PumpAuthorizeAsync (
                "DEVICE001",
                It.Is<PumpAuthorizeData> (d =>
                    d.Pump == 1 &&
                    d.Nozzle == 2 &&
                    d.Type == PumpAuthorizeType.VOLUME &&
                    d.Dose == 20.0 &&
                    d.PriceEnabled == true &&
                    d.AutoCloseTransaction == true &&
                    d.TransactionEnabled == true &&
                    d.Tag == "TAG123")
            ), Times.Once);
        }

        /// <summary>
        /// Verifies that Handle updates the authorization state tracker when authorization succeeds.
        /// This ensures that the system tracks which pump/nozzle is authorized for which tag, how much fuel is allowed, etc.
        /// </summary>
        [Fact]
        public async Task Handle_UpdatesAuthStateTracker_WhenAuthorizationSucceeds () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (false);

            _mockPumpService.Setup (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()))
                .ReturnsAsync (new PumpAuthorizeConfirmation { Pump = 1, Transaction = 123 });

            // Act
            var result = await _handler.Handle (request, CancellationToken.None);

            // Assert
            _mockAuthTracker.Verify (x => x.SetAuthorized (
                "DEVICE001",
                2,
                It.Is<AuthState> (s =>
                    s.DeviceId == "DEVICE001" &&
                    s.PumpId == 1 &&
                    s.NozzleId == 2 &&
                    s.Status == "Authorized" &&
                    s.TransactionId == 123 &&
                    s.AuthorizedAmount == 20.0m)
            ), Times.Once);
        }

        /// <summary>
        /// Verifies that Handle properly handles device exceptions with appropriate error messages.
        /// This ensures that PTS device errors are caught and reported back to the caller.
        /// </summary>
        [Fact]
        public async Task Handle_HandlesDeviceExceptions_WithProperError () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (false);

            _mockPumpService.Setup (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()))
                .ThrowsAsync (new PTSDeviceException ("Device communication error"));

            // Act
            var result = await _handler.Handle (request, CancellationToken.None);

            // Assert
            Assert.False (result.Success);
            Assert.Equal ("Device communication error", result.Message);
            Assert.Null (result.Data);
        }

        /// <summary>
        /// Verifies that Handle propagates unexpected exceptions to the caller.
        /// This ensures that critical errors are not silently caught.
        /// </summary>
        [Fact]
        public async Task Handle_PropagatesUnexpectedExceptions () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (false);

            _mockPumpService.Setup (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()))
                .ThrowsAsync (new InvalidOperationException ("Unexpected error"));

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException> (() => _handler.Handle (request, CancellationToken.None));
        }

        /// <summary>
        /// Verifies that Handle correctly uses the lower of Tag dose limit or request dose when both are provided.
        /// This ensures tag limits are always respected even when a specific dose is requested.
        /// </summary>
        [Fact]
        public async Task Handle_UsesLowerOfTagLimitAndRequestDose_WhenBothProvided () {
            // Arrange
            var requestDose = 30.0;
            var tagDoseLimit = 20.0m; // Lower than request dose

            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = requestDose, // Higher than tag limit
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME,
                Tag = "TAG123"
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (false);

            _mockMediator.Setup (x => x.Send (It.IsAny<AuthenticateTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (true, null, tagDoseLimit, false));

            _mockPumpService.Setup (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()))
                .ReturnsAsync (new PumpAuthorizeConfirmation { Pump = 1, Transaction = 123 });

            // Act
            var result = await _handler.Handle (request, CancellationToken.None);

            // Assert
            // Verify the PumpService was called with the tag's dose limit (lower value)
            _mockPumpService.Verify (x => x.PumpAuthorizeAsync (
                It.IsAny<string> (),
                It.Is<PumpAuthorizeData> (d => d.Dose == (double) tagDoseLimit)
            ), Times.Once);

            Assert.True (result.Success);
        }

        /// <summary>
        /// Verifies that Handle properly generates and passes a transaction ID when TransactionEnabled is true.
        /// This ensures proper tracking of transactions in the system.
        /// </summary>
        [Fact]
        public async Task Handle_GeneratesAndPassesTransactionId_WhenTransactionEnabled () {
            // Arrange
            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME,
                TransactionEnabled = true // Transaction should be generated
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (false);

            _mockPumpService.Setup (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()))
                .ReturnsAsync (new PumpAuthorizeConfirmation { Pump = 1, Transaction = 123 });

            // Act
            var result = await _handler.Handle (request, CancellationToken.None);

            // Assert
            _mockPumpService.Verify (x => x.PumpAuthorizeAsync (
                It.IsAny<string> (),
                It.Is<PumpAuthorizeData> (d =>
                    d.TransactionEnabled == true &&
                    d.Transaction > 0) // Transaction ID should be generated
            ), Times.Once);

            Assert.True (result.Success);
        }

        /// <summary>
        /// Verifies that the complete TagId from authentication is properly passed in the PumpAuthorizeData.
        /// This ensures the tag identification is properly tracked in the PTS system.
        /// </summary>
        [Fact]
        public async Task Handle_PassesTagIdToAuthData_WhenTagIsAuthenticated () {
            // Arrange
            string tagId = "TAG123";
            var tag = new FMS.Domain.Entities.Tag {
                Id = 1,
                Name = tagId,
                IsEnabled = true
            };

            var request = new PumpAuthorizeCommand {
                DeviceId = "DEVICE001",
                PumpId = 1,
                Dose = 20.0,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME,
                Tag = tagId
            };

            _mockAuthTracker.Setup (x => x.IsAuthorized (It.IsAny<string> (), It.IsAny<int> ()))
                .ReturnsAsync (false);

            _mockMediator.Setup (x => x.Send (It.IsAny<AuthenticateTagQuery> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (new AuthenticateTagResult (true, tag, 30, false));

            _mockPumpService.Setup (x => x.PumpAuthorizeAsync (It.IsAny<string> (), It.IsAny<PumpAuthorizeData> ()))
                .ReturnsAsync (new PumpAuthorizeConfirmation { Pump = 1, Transaction = 123 });

            // Act
            var result = await _handler.Handle (request, CancellationToken.None);

            // Assert
            // Verify Tag ID is passed correctly to both PumpService and AuthTracker
            _mockPumpService.Verify (x => x.PumpAuthorizeAsync (
                It.IsAny<string> (),
                It.Is<PumpAuthorizeData> (d => d.Tag == tagId)
            ), Times.Once);

            _mockAuthTracker.Verify (x => x.SetAuthorized (
                It.IsAny<string> (),
                It.IsAny<int> (),
                It.Is<AuthState> (s => s.TagId == tagId)
            ), Times.Once);

            Assert.True (result.Success);
        }

        #endregion
    }
}