# Fueling Workflow Integration Tests

This folder contains integration tests for testing the CommandExecutor and the fueling workflow. The tests are designed to verify that commands are correctly executed through the various communication channels (WebSocket, HTTP, and Polling).

## Test Classes

1. **CommandExecutorTests.cs** - Unit tests for the CommandExecutor class using mocks
2. **FuelingWorkflowTests.cs** - Integration tests for the fueling workflow focusing on PumpAuthorizeCommand
3. **EndToEndFuelingTests.cs** - End-to-end tests that can be run against real infrastructure

## Test Approach

These tests use a combination of Moq mocks and custom test doubles:

1. **Test Doubles**: We use a `TestHttpCommandPusher` implementation to avoid issues with Moq's expression tree limitations when dealing with optional parameters.
2. **Mocking Strategies**: The tests demonstrate how to properly mock dependencies with complex method signatures, including tuple returns and optional parameters.
3. **Configuration over Verification**: The tests focus on configuring the test behavior rather than verifying specific method calls in most cases.

## Configuration

The tests use the configuration in `FMS.Testing/appsettings.Testing.json`. You can modify this file to:

- Point to your real database and Redis servers
- Enable testing against real infrastructure
- Configure test device IDs, pump IDs, and nozzle IDs

## Running the Tests

To run the tests:

1. Ensure the `FMS.Testing` project references all the necessary projects:
   - FMS.Application
   - FMS.Domain
   - FMS.Persistence

2. Install the required NuGet packages:
   - xUnit
   - Moq
   - Microsoft.EntityFrameworkCore.InMemory
   - Microsoft.Extensions.Configuration.Json
   - Microsoft.Extensions.Logging
   - StackExchange.Redis
   - MediatR

3. Run the tests using Visual Studio Test Explorer or the `dotnet test` command

## Running End-to-End Tests with Real Devices

The EndToEndFuelingTests.cs file is designed to be extended for testing with real devices. To run with real hardware:

1. Update the appsettings.Testing.json file to set UseRealInfrastructure to true
2. Set the TestDeviceId, TestPumpId, and TestNozzleId to match your hardware
3. Configure the connection strings to point to your real Redis and database servers
4. Remove the [Skip] attribute from the test methods you want to run
5. Run the specific end-to-end tests

**Note**: Be cautious when running end-to-end tests as they can affect real hardware and databases.

## Test Scenarios

The tests cover the following scenarios:

### CommandExecutor Tests

- WebSocket mode - successful command
- HTTP mode - successful command
- HTTP mode - device returns error
- HTTP mode - failed to push, queues pending command
- No device info - returns failure
- WebSocket mode - Redis service error

### Fueling Workflow Tests

- WebSocket mode - successful authorization
- HTTP mode - successful authorization
- HTTP fallback mode - command queued for later delivery
- PumpService - successful pump authorization
- PumpService - error handling cases

### End-to-End Tests (Skipped by Default)

- WebSocket mode - successful command against real or mocked infrastructure
- HTTP mode - successful command against real or mocked infrastructure
- Complete fueling workflow authorization and completion

## Extending the Tests

When adding new tests:

1. Follow the existing pattern using TestHttpCommandPusher as a test double
2. Use the constants in `appsettings.Testing.json` for test parameters
3. For end-to-end tests with real infrastructure, add `[Fact(Skip = "...")]` until ready to run

## Troubleshooting

If you encounter issues with the tests, see the TROUBLESHOOTING.md file for solutions to common problems.