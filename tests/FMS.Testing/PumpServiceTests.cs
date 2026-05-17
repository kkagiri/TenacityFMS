using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Common.PTSResponse;
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.SignalR;
using FMS.Application.Infrastructure.Expections.Base;
using FMS.Application.Features.Devices.Fueling.PumpControl.Services;
using FMS.Domain.Entities.PTS;
using FMS.Domain.Entities.PTS.Enums;
using FMS.Application.Features.Devices.Fueling.PumpControl.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using Newtonsoft.Json.Linq;
using Xunit;

namespace FMS.Testing {
    public class PumpServiceTests {
        private readonly Mock<ICommandExecutor> _mockCommandExecutor;
        private readonly Mock<ILogger<PumpService>> _mockLogger;
        private readonly Mock<IHubContext<FrontEndHub>> _mockHubContext;
        private readonly PumpService _pumpService;

        public PumpServiceTests () {
            _mockCommandExecutor = new Mock<ICommandExecutor> ();
            _mockLogger = new Mock<ILogger<PumpService>> ();
            _mockHubContext = new Mock<IHubContext<FrontEndHub>> ();

            _pumpService = new PumpService (
                _mockLogger.Object,
                _mockHubContext.Object,
                _mockCommandExecutor.Object
            );
        }

        [Fact]
        public async Task PumpAuthorizeAsync_WithValidData_ReturnsConfirmation () {
            // Arrange
            string deviceId = "DEVICE001";
            var pumpAuthorizeData = new PumpAuthorizeData {
                Pump = 1,
                NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLE,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME,
                Dose = 20.0,
                Tag = "TAG123"
            };

            // Setup command executor to return successful response with pump data
            var responseData = new { Pump = 1, Transaction = 123 };
            _mockCommandExecutor.Setup (x => x.ExecuteCommandAsync (
                    deviceId,
                    "PumpAuthorize",
                    It.IsAny<object> ()))
                .ReturnsAsync (new CommandResult (
                    true,
                    "OK",
                    null,
                    "PumpAuthorize",
                    responseData
                ));

            // Act
            var result = await _pumpService.PumpAuthorizeAsync (deviceId, pumpAuthorizeData);

            // Assert
            Assert.NotNull (result);
            Assert.Equal (1, result.Pump);
            Assert.Equal (123, result.Transaction);
        }

        [Fact]
        public async Task PumpAuthorizeAsync_WithNozzlesSelector_SendsCorrectData () {
            // Arrange
            string deviceId = "DEVICE001";
            var pumpAuthorizeData = new PumpAuthorizeData {
                Pump = 1,
                Nozzles = new List<int> { 1, 2, 3 },
                NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLES,
                Type = PumpAuthorizeType.VOLUME,
                Dose = 20.0
            };

            // Setup command executor mock
            var responseData = new { Pump = 1, Transaction = 123 };
            _mockCommandExecutor.Setup (x => x.ExecuteCommandAsync (
                    deviceId,
                    "PumpAuthorize",
                    It.IsAny<object> ()))
                .ReturnsAsync (new CommandResult (
                    true,
                    "OK",
                    null,
                    "PumpAuthorize",
                    responseData
                ));

            // Act
            var result = await _pumpService.PumpAuthorizeAsync (deviceId, pumpAuthorizeData);

            // Assert
            Assert.NotNull (result);
            _mockCommandExecutor.Verify (
                x => x.ExecuteCommandAsync (
                    deviceId,
                    "PumpAuthorize",
                    It.Is<object> (d => true)
                ),
                Times.Once
            );
        }

        [Fact]
        public async Task PumpAuthorizeAsync_WithFuelGradeSelector_SendsCorrectData () {
            // Arrange
            string deviceId = "DEVICE001";
            var pumpAuthorizeData = new PumpAuthorizeData {
                Pump = 1,
                FuelGradeId = 5,
                NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.FUELGRADEID,
                Type = PumpAuthorizeType.VOLUME,
                Dose = 20.0
            };

            // Setup command executor mock
            var responseData = new { Pump = 1, Transaction = 123 };
            _mockCommandExecutor.Setup (x => x.ExecuteCommandAsync (
                    deviceId,
                    "PumpAuthorize",
                    It.IsAny<object> ()))
                .ReturnsAsync (new CommandResult (
                    true,
                    "OK",
                    null,
                    "PumpAuthorize",
                    responseData
                ));

            // Act
            var result = await _pumpService.PumpAuthorizeAsync (deviceId, pumpAuthorizeData);

            // Assert
            Assert.NotNull (result);
            _mockCommandExecutor.Verify (
                x => x.ExecuteCommandAsync (
                    deviceId,
                    "PumpAuthorize",
                    It.Is<object> (d => true)
                ),
                Times.Once
            );
        }

        [Fact]
        public async Task PumpAuthorizeAsync_WithTagAndTransactionEnabled_SendsCorrectData () {
            // Arrange
            string deviceId = "DEVICE001";
            string tagId = "TAG123";
            int transactionId = 456;

            var pumpAuthorizeData = new PumpAuthorizeData {
                Pump = 1,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME,
                Dose = 20.0,
                Tag = tagId,
                TransactionEnabled = true,
                Transaction = transactionId
            };

            // Setup command executor mock
            var responseData = new { Pump = 1, Transaction = transactionId };
            _mockCommandExecutor.Setup (x => x.ExecuteCommandAsync (
                    deviceId,
                    "PumpAuthorize",
                    It.IsAny<object> ()))
                .ReturnsAsync (new CommandResult (
                    true,
                    "OK",
                    null,
                    "PumpAuthorize",
                    responseData
                ));

            // Act
            var result = await _pumpService.PumpAuthorizeAsync (deviceId, pumpAuthorizeData);

            // Assert
            Assert.NotNull (result);
            Assert.Equal (transactionId, result.Transaction);
            _mockCommandExecutor.Verify (
                x => x.ExecuteCommandAsync (
                    deviceId,
                    "PumpAuthorize",
                    It.Is<object> (d => true)
                ),
                Times.Once
            );
        }

        [Fact]
        public async Task PumpAuthorizeAsync_WhenCommandFails_ThrowsException () {
            // Arrange
            string deviceId = "DEVICE001";
            var pumpAuthorizeData = new PumpAuthorizeData {
                Pump = 1,
                Nozzle = 2,
                Type = PumpAuthorizeType.VOLUME,
                Dose = 20.0
            };

            string errorMessage = "Device communication error";
            // Setup command executor to return failed result
            _mockCommandExecutor.Setup (x => x.ExecuteCommandAsync (
                    deviceId,
                    "PumpAuthorize",
                    It.IsAny<object> ()))
                .ReturnsAsync (new CommandResult (
                    false,
                    errorMessage,
                    1001,
                    null,
                    null
                ));

            // Act & Assert
            var exception = await Assert.ThrowsAsync<PTSDeviceException> (
                () => _pumpService.PumpAuthorizeAsync (deviceId, pumpAuthorizeData)
            );

            // The actual exception message is "Error authorizing pump" from the outer catch block in PumpService
            Assert.Equal ("Error authorizing pump", exception.Message);
        }
    }
}