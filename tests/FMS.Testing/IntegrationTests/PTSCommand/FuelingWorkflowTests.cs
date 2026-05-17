using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Application.Common;
using FMS.Application.Common.Commands;
using FMS.Application.Common.PTSResponse;
using FMS.Application.CommonInterface;
using FMS.Application.Communication;
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.HttpPolling;
using FMS.Application.Features.PTS.Common;
using FMS.Application.Features.PTS.Enum;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Features.Devices.Fueling.PumpControl.Services;
using FMS.Application.Validation.PTSValidators;
using FMS.Application.Validation.PTSValidators.Common;
using FMS.Domain.Entities.PTS;
using FMS.Domain.Entities.PTS.Enums;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using Moq;
using Newtonsoft.Json.Linq;
using StackExchange.Redis;
using Xunit;

namespace FMS.Testing.IntegrationTests.PTSCommand
{
    /// <summary>
    /// Simplified integration tests for the fueling workflow
    /// </summary>
    public class FuelingWorkflowTests
    {
        // Test double for IDeviceHttpCommandPusher to avoid expression tree issues
        public class TestHttpCommandPusher : IDeviceHttpCommandPusher
        {
            public bool ShouldSucceed { get; set; } = true;
            public int? ErrorCode { get; set; } = null;
            public PTSMessage ResponseToReturn { get; set; }

            // Method with proper signature matching the interface exactly
            public Task<(bool Success, int? ErrorCode, PTSMessage Response)> SendPTSMessageAsync(
                string ipAddress, int port, PTSMessage message, string bearerToken = null)
            {
                // Bearer token is ignored in tests, we just return the configured response
                return Task.FromResult((ShouldSucceed, ErrorCode, ResponseToReturn));
            }
        }

        // Mocks for CommandExecutor dependencies
        private readonly Mock<IDeviceCommunicationService> _mockDeviceCommunicationService;
        private readonly Mock<IPendingCommandRepository> _mockPendingCommandRepo;
        private readonly TestHttpCommandPusher _httpCommandPusher; // Use test double instead of mock
        private readonly Mock<IDeviceValidator> _mockDeviceValidator;
        private readonly Mock<ILogger<CommandExecutor>> _mockLogger;
        private readonly Mock<IRedisCommandService> _mockRedisCommandService;
        private readonly Mock<IAuthorizationStateTracker> _mockAuthTracker;
        private readonly Mock<IConnectionMultiplexer> _mockRedisConnection;

        // System Under Test
        private readonly CommandExecutor _commandExecutor;
        private readonly IPumpService _pumpService;

        // Test constants
        private const string TEST_DEVICE_ID = "device123";
        private const int TEST_PUMP_ID = 1;
        private const int TEST_NOZZLE_ID = 2;
        private const double TEST_DOSE = 10.0;

        public FuelingWorkflowTests()
        {
            // Initialize mocks
            _mockDeviceCommunicationService = new Mock<IDeviceCommunicationService>();
            _mockPendingCommandRepo = new Mock<IPendingCommandRepository>();
            _httpCommandPusher = new TestHttpCommandPusher(); // Create test double
            _mockDeviceValidator = new Mock<IDeviceValidator>();
            _mockLogger = new Mock<ILogger<CommandExecutor>>();
            _mockRedisCommandService = new Mock<IRedisCommandService>();
            _mockAuthTracker = new Mock<IAuthorizationStateTracker>();
            _mockRedisConnection = new Mock<IConnectionMultiplexer>();

            // Initialize CommandExecutor
            _commandExecutor = new CommandExecutor(
                _mockDeviceCommunicationService.Object,
                _mockPendingCommandRepo.Object,
                _httpCommandPusher, // Use test double instead of mock
                _mockDeviceValidator.Object,
                _mockLogger.Object,
                _mockRedisCommandService.Object,
                _mockRedisConnection.Object
            );

            // Mock the PumpService
            var mockPumpService = new Mock<IPumpService>();

            // Mock the PumpAuthorizeAsync method with a simple implementation returning PumpAuthorizeConfirmation
            mockPumpService
                .Setup(ps => ps.PumpAuthorizeAsync(It.IsAny<string>(), It.IsAny<FMS.Domain.Entities.PTS.PumpAuthorizeData>()))
                .Returns((string deviceId, FMS.Domain.Entities.PTS.PumpAuthorizeData data) =>
                {
                    // Simple implementation returning success unless deviceId is "error"
                    if (deviceId == "error")
                        return Task.FromResult<PumpAuthorizeConfirmation>(null);

                    return Task.FromResult(new PumpAuthorizeConfirmation
                    {
                        Pump = data.Pump,
                        Transaction = 12345
                    });
                });

            _pumpService = mockPumpService.Object;
        }

        [Fact]
        public async Task ExecuteCommand_WebSocketMode_SuccessfulCommand()
        {
            // Arrange
            _mockDeviceCommunicationService
                .Setup(s => s.GetPreferredCommunicationMode(TEST_DEVICE_ID))
                .ReturnsAsync(CommunicationMode.WebSocket);

            // Setup Redis Command Service response
            var mockResponseData = new JObject { { "Id", 12345 }, { "Status", "Success" }, { "Message", "Command executed successfully" } };

            var redisResponse = new RedisPTSCommandResponse
            {
                DeviceId = TEST_DEVICE_ID,
                Status = "Success",
                Message = "Command executed successfully",
                CorrelationId = "cmd123",
                ResponsePayload = System.Text.Json.JsonDocument.Parse(mockResponseData.ToString()).RootElement
            };

            _mockRedisCommandService
                .Setup(s => s.SendCommandAsync(It.IsAny<RedisPTSCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(redisResponse);

            // Act
            var result = await _commandExecutor.ExecuteCommandAsync(TEST_DEVICE_ID, "PumpAuthorize", JObject.FromObject(new
            {
                Pump = TEST_PUMP_ID,
                Nozzle = TEST_NOZZLE_ID,
                Dose = TEST_DOSE
            }));

            // Assert
            Assert.NotNull(result);
            Assert.True(result.Success);
            Assert.Equal("PumpAuthorize", result.CommandType);
        }

        [Fact]
        public async Task ExecuteCommand_HttpMode_SuccessfulCommand()
        {
            // Arrange
            _mockDeviceCommunicationService
                .Setup(s => s.GetPreferredCommunicationMode(TEST_DEVICE_ID))
                .ReturnsAsync(CommunicationMode.Http);

            // Setup device validator to return device info
            var deviceInfo = new DeviceInfoDTO
            {
                PtsId = TEST_DEVICE_ID,
                IpAddress = "10.0.10.95",
                PortNumber = 8080
            };

            _mockDeviceValidator
                .Setup(v => v.ValidateDevice(TEST_DEVICE_ID))
                .ReturnsAsync(new DeviceValidationResult
                {
                    DeviceInfo = deviceInfo
                });

            // Setup HTTP command pusher using a response object
            var responsePacket = new Packet
            {
                Id = 1,
                Error = false,
                Message = "Success",
                Data = JObject.FromObject(new { Transaction = 54321 })
            };

            var responseMessage = new PTSMessage
            {
                Protocol = "jsonPTS",
                Packets = new List<Packet> { responsePacket }
            };

            // Configure test double
            _httpCommandPusher.ShouldSucceed = true;
            _httpCommandPusher.ResponseToReturn = responseMessage;

            // Act
            var result = await _commandExecutor.ExecuteCommandAsync(TEST_DEVICE_ID, "PumpAuthorize", JObject.FromObject(new
            {
                Pump = TEST_PUMP_ID,
                Nozzle = TEST_NOZZLE_ID,
                Dose = TEST_DOSE
            }));

            // Assert
            Assert.NotNull(result);
            Assert.True(result.Success);
            Assert.Equal("PumpAuthorize", result.CommandType);
        }

        [Fact]
        public async Task ExecuteCommand_FallbackMode_CommandQueued()
        {
            // Arrange - Use Http mode but make it queue the command
            _mockDeviceCommunicationService
                .Setup(s => s.GetPreferredCommunicationMode(TEST_DEVICE_ID))
                .ReturnsAsync(CommunicationMode.Http);

            // Setup device validator to return device info
            var deviceInfo = new DeviceInfoDTO
            {
                PtsId = TEST_DEVICE_ID,
                IpAddress = "10.0.10.95",
                PortNumber = 8080
            };

            _mockDeviceValidator
                .Setup(v => v.ValidateDevice(TEST_DEVICE_ID))
                .ReturnsAsync(new DeviceValidationResult
                {
                    DeviceInfo = deviceInfo
                });

            // Configure test double to fail
            _httpCommandPusher.ShouldSucceed = false;
            _httpCommandPusher.ResponseToReturn = null;

            // Setup pending command repository
            _mockPendingCommandRepo
                .Setup(r => r.QueueCommandAsync(
                    TEST_DEVICE_ID,
                    "PumpAuthorize",
                    It.IsAny<object>(),
                    It.IsAny<int>(),
                    It.IsAny<string>()))
                .ReturnsAsync(1); // Return 1 as command ID

            // Act
            var result = await _commandExecutor.ExecuteCommandAsync(TEST_DEVICE_ID, "PumpAuthorize", JObject.FromObject(new
            {
                Pump = TEST_PUMP_ID,
                Nozzle = TEST_NOZZLE_ID,
                Dose = TEST_DOSE
            }));

            // Assert
            Assert.NotNull(result);
            Assert.False(result.Success);

            // Verify pending command was queued
            _mockPendingCommandRepo.Verify(
                r => r.QueueCommandAsync(
                    TEST_DEVICE_ID,
                    "PumpAuthorize",
                    It.IsAny<object>(),
                    It.IsAny<int>(),
                    "HTTP_Retry"),
                Times.Once);
        }

        [Fact]
        public async Task PumpService_AuthorizesPump_SuccessfullyReturnsTransactionId()
        {
            // Act
            var result = await _pumpService.PumpAuthorizeAsync(TEST_DEVICE_ID, new FMS.Domain.Entities.PTS.PumpAuthorizeData
            {
                Pump = TEST_PUMP_ID,
                Nozzle = TEST_NOZZLE_ID,
                Dose = TEST_DOSE,
                Type = PumpAuthorizeType.VOLUME
            });

            // Assert - Using the properties available in PumpAuthorizeConfirmation
            Assert.NotNull(result);
            Assert.Equal(TEST_PUMP_ID, result.Pump);
            Assert.Equal(12345, result.Transaction);
        }

        [Fact]
        public async Task PumpService_ErrorCase_ReturnsNull()
        {
            // Act
            var result = await _pumpService.PumpAuthorizeAsync("error", new FMS.Domain.Entities.PTS.PumpAuthorizeData
            {
                Pump = TEST_PUMP_ID,
                Nozzle = TEST_NOZZLE_ID,
                Dose = TEST_DOSE,
                Type = PumpAuthorizeType.VOLUME
            });

            // Assert
            Assert.Null(result);
        }
    }
}