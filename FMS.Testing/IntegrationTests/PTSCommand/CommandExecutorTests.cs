using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Common.Commands;
using FMS.Application.Common.PTSResponse;
using FMS.Application.Communication;
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.HttpPolling;
using FMS.Application.Communication.Redis;
using FMS.Application.ModelsDTOs.PTS.Common;
using FMS.Application.ModelsDTOs.PTS.Enum;
using FMS.Application.Validation.PTSValidators;
using FMS.Application.Validation.PTSValidators.Common;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using Moq;
using Newtonsoft.Json.Linq;
using Xunit;

namespace FMS.Testing.IntegrationTests.PTSCommand {
    /// <summary>
    /// Integration tests for CommandExecutor class focused on the fueling workflow
    /// </summary>
    public class CommandExecutorTests {
        // Test double for IDeviceHttpCommandPusher to avoid expression tree issues
        public class TestHttpCommandPusher : IDeviceHttpCommandPusher {
            public bool ShouldSucceed { get; set; } = true;
            public int? ErrorCode { get; set; } = null;
            public PTSMessage ResponseToReturn { get; set; }

            // Updated signature to match interface exactly with optional bearerToken parameter
            public Task < (bool Success, int? ErrorCode, PTSMessage Response) > SendPTSMessageAsync (
                string ipAddress, int port, PTSMessage message, string bearerToken = null) {
                // Bearer token is ignored in tests, we just return the configured response
                return Task.FromResult ((ShouldSucceed, ErrorCode, ResponseToReturn));
            }
        }

        // Mocks
        private readonly Mock<IDeviceCommunicationService> _mockDeviceCommunicationService;
        private readonly Mock<IPendingCommandRepository> _mockPendingCommandRepo;
        private readonly TestHttpCommandPusher _httpCommandPusher; // Use test double instead of mock
        private readonly Mock<IDeviceValidator> _mockDeviceValidator;
        private readonly Mock<ILogger<CommandExecutor>> _mockLogger;
        private readonly Mock<RedisCommandService> _mockRedisCommandService;

        // System Under Test
        private readonly CommandExecutor _commandExecutor;

        // Test data
        private const string TEST_DEVICE_ID = "123456789";
        private const string TEST_COMMAND_TYPE = "PumpAuthorize";
        private readonly object TEST_COMMAND_DATA = new {
            Pump = 1,
            Nozzle = 2,
            Dose = 10.0,
            Type = "Volume"
        };

        public CommandExecutorTests () {
            // Initialize mocks
            _mockDeviceCommunicationService = new Mock<IDeviceCommunicationService> ();
            _mockPendingCommandRepo = new Mock<IPendingCommandRepository> ();
            _httpCommandPusher = new TestHttpCommandPusher (); // Create test double
            _mockDeviceValidator = new Mock<IDeviceValidator> ();
            _mockLogger = new Mock<ILogger<CommandExecutor>> ();
            _mockRedisCommandService = new Mock<RedisCommandService> ();

            // Initialize SUT
            _commandExecutor = new CommandExecutor (
                _mockDeviceCommunicationService.Object,
                _mockPendingCommandRepo.Object,
                _httpCommandPusher, // Use test double instead of mock
                _mockDeviceValidator.Object,
                _mockLogger.Object,
                _mockRedisCommandService.Object
            );
        }

        [Fact]
        public async Task ExecuteCommandAsync_WebSocketMode_SuccessfulCommand () {
            // Arrange
            _mockDeviceCommunicationService
                .Setup (s => s.GetPreferredCommunicationMode (TEST_DEVICE_ID))
                .ReturnsAsync (CommunicationMode.WebSocket);

            // Set up Redis Command Service response
            var mockResponseData = new JObject { { "Id", 12345 }, { "Status", "Success" }, { "Message", "Command executed successfully" } };

            var redisResponse = new RedisPTSCommandResponse {
                DeviceId = TEST_DEVICE_ID,
                Status = "Success",
                Message = "Command executed successfully",
                CorrelationId = "cmd123",
                ResponsePayload = System.Text.Json.JsonDocument.Parse (mockResponseData.ToString ()).RootElement
            };

            _mockRedisCommandService
                .Setup (s => s.SendCommandAsync (It.IsAny<RedisPTSCommand> (), It.IsAny<CancellationToken> ()))
                .ReturnsAsync (redisResponse);

            // Act
            var result = await _commandExecutor.ExecuteCommandAsync (TEST_DEVICE_ID, TEST_COMMAND_TYPE, JObject.FromObject (TEST_COMMAND_DATA));

            // Assert
            Assert.NotNull (result);
            Assert.True (result.Success);
            Assert.Equal (TEST_COMMAND_TYPE, result.CommandType);

            // Verify Redis command service was called
            _mockRedisCommandService.Verify (
                s => s.SendCommandAsync (
                    It.Is<RedisPTSCommand> (cmd =>
                        cmd.DeviceId == TEST_DEVICE_ID &&
                        cmd.CommandType == TEST_COMMAND_TYPE),
                    It.IsAny<CancellationToken> ()),
                Times.Once);
        }

        [Fact]
        public async Task ExecuteCommandAsync_HttpMode_SuccessfulCommand () {
            // Arrange
            _mockDeviceCommunicationService
                .Setup (s => s.GetPreferredCommunicationMode (TEST_DEVICE_ID))
                .ReturnsAsync (CommunicationMode.Http);

            // Setup device validator to return device info
            var deviceInfo = new DeviceInfoDTO {
                PtsId = TEST_DEVICE_ID, // This will set DeviceId property
                IpAddress = "10.0.10.95",
                PortNumber = 8080
            };

            _mockDeviceValidator
                .Setup (v => v.ValidateDevice (TEST_DEVICE_ID))
                .ReturnsAsync (new DeviceValidationResult {
                    DeviceInfo = deviceInfo
                });

            // Setup HTTP command pusher with a simple mock that always returns success
            var responsePacket = new Packet {
                Id = 1,
                Error = false,
                Message = "Success",
                Data = JObject.FromObject (TEST_COMMAND_DATA)
            };

            var responseMessage = new PTSMessage {
                Protocol = "jsonPTS",
                Packets = new List<Packet> { responsePacket }
            };

            // Configure test double instead of using Setup
            _httpCommandPusher.ShouldSucceed = true;
            _httpCommandPusher.ResponseToReturn = responseMessage;

            // Act
            var result = await _commandExecutor.ExecuteCommandAsync (TEST_DEVICE_ID, TEST_COMMAND_TYPE, TEST_COMMAND_DATA);

            // Assert
            Assert.NotNull (result);
            Assert.True (result.Success);
            Assert.Equal (TEST_COMMAND_TYPE, result.CommandType);
        }

        [Fact]
        public async Task ExecuteCommandAsync_HttpMode_DeviceReturnedError () {
            // Arrange
            _mockDeviceCommunicationService
                .Setup (s => s.GetPreferredCommunicationMode (TEST_DEVICE_ID))
                .ReturnsAsync (CommunicationMode.Http);

            // Setup device validator to return device info
            var deviceInfo = new DeviceInfoDTO {
                PtsId = TEST_DEVICE_ID,
                IpAddress = "10.0.10.95",
                PortNumber = 8080
            };

            _mockDeviceValidator
                .Setup (v => v.ValidateDevice (TEST_DEVICE_ID))
                .ReturnsAsync (new DeviceValidationResult {
                    DeviceInfo = deviceInfo
                });

            // Setup HTTP command pusher with an error response
            var errorPacket = new Packet {
                Id = 1,
                Error = true,
                Code = 500,
                Message = "Device Error",
                Data = null
            };

            var errorResponse = new PTSMessage {
                Protocol = "jsonPTS",
                Packets = new List<Packet> { errorPacket }
            };

            // Configure test double instead of using Setup
            _httpCommandPusher.ShouldSucceed = true;
            _httpCommandPusher.ResponseToReturn = errorResponse;

            // Act
            var result = await _commandExecutor.ExecuteCommandAsync (TEST_DEVICE_ID, TEST_COMMAND_TYPE, TEST_COMMAND_DATA);

            // Assert
            Assert.NotNull (result);
            Assert.False (result.Success);
            Assert.Equal ("Device Error", result.Message);
            Assert.Equal (500, result.Code);
        }

        [Fact]
        public async Task ExecuteCommandAsync_HttpMode_FailedToPush_QueuesPendingCommand () {
            // Arrange
            _mockDeviceCommunicationService
                .Setup (s => s.GetPreferredCommunicationMode (TEST_DEVICE_ID))
                .ReturnsAsync (CommunicationMode.Http);

            // Setup device validator to return device info
            var deviceInfo = new DeviceInfoDTO {
                PtsId = TEST_DEVICE_ID,
                IpAddress = "10.0.10.95",
                PortNumber = 8080
            };

            _mockDeviceValidator
                .Setup (v => v.ValidateDevice (TEST_DEVICE_ID))
                .ReturnsAsync (new DeviceValidationResult {
                    DeviceInfo = deviceInfo
                });

            // Configure test double to fail
            _httpCommandPusher.ShouldSucceed = false;
            _httpCommandPusher.ResponseToReturn = null;

            // Setup pending command repo - returns Task<int> instead of Task
            _mockPendingCommandRepo
                .Setup (r => r.QueueCommandAsync (
                    TEST_DEVICE_ID,
                    TEST_COMMAND_TYPE,
                    It.IsAny<object> (),
                    It.IsAny<int> (),
                    It.IsAny<string> ()))
                .ReturnsAsync (1); // Return 1 as the command ID

            // Act
            var result = await _commandExecutor.ExecuteCommandAsync (TEST_DEVICE_ID, TEST_COMMAND_TYPE, TEST_COMMAND_DATA);

            // Assert
            Assert.NotNull (result);
            Assert.False (result.Success);

            // Verify pending command was queued
            _mockPendingCommandRepo.Verify (
                r => r.QueueCommandAsync (
                    TEST_DEVICE_ID,
                    TEST_COMMAND_TYPE,
                    It.IsAny<object> (),
                    It.IsAny<int> (),
                    "HTTP_Retry"),
                Times.Once);
        }

        [Fact]
        public async Task ExecuteCommandAsync_NoDeviceInfo_ReturnsFailure () {
            // Arrange
            _mockDeviceCommunicationService
                .Setup (s => s.GetPreferredCommunicationMode (TEST_DEVICE_ID))
                .ReturnsAsync (CommunicationMode.Http);

            // Setup device validator to return null device info
            _mockDeviceValidator
                .Setup (v => v.ValidateDevice (TEST_DEVICE_ID))
                .ReturnsAsync (new DeviceValidationResult {
                    DeviceInfo = null
                });

            // Act
            var result = await _commandExecutor.ExecuteCommandAsync (TEST_DEVICE_ID, TEST_COMMAND_TYPE, TEST_COMMAND_DATA);

            // Assert
            Assert.NotNull (result);
            Assert.False (result.Success);
            Assert.Equal ("Device not found", result.Message);
            Assert.Equal (404, result.Code);
        }

        [Fact]
        public async Task ExecuteCommandAsync_WebSocketMode_RedisServiceError () {
            // Arrange
            _mockDeviceCommunicationService
                .Setup (s => s.GetPreferredCommunicationMode (TEST_DEVICE_ID))
                .ReturnsAsync (CommunicationMode.WebSocket);

            // Setup Redis service to throw exception
            _mockRedisCommandService
                .Setup (s => s.SendCommandAsync (It.IsAny<RedisPTSCommand> (), It.IsAny<CancellationToken> ()))
                .ThrowsAsync (new HttpRequestException ("Redis service error"));

            // Act
            var result = await _commandExecutor.ExecuteCommandAsync (TEST_DEVICE_ID, TEST_COMMAND_TYPE, TEST_COMMAND_DATA);

            // Assert
            Assert.NotNull (result);
            Assert.False (result.Success);
        }
    }
}