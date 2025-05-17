# Troubleshooting Guide for Integration Tests

This guide provides solutions for common issues encountered when setting up and running the integration tests for CommandExecutor and the fueling workflow.

## Working with Test Doubles

In the test files, we've implemented a test double pattern to avoid Moq expression tree limitations. Here's how it works:

```csharp
// The TestHttpCommandPusher class implements IDeviceHttpCommandPusher directly
public class TestHttpCommandPusher : IDeviceHttpCommandPusher {
    public bool ShouldSucceed { get; set; } = true;
    public int? ErrorCode { get; set; } = null;
    public PTSMessage ResponseToReturn { get; set; }

    // Matches the interface signature exactly
    public Task<(bool Success, int? ErrorCode, PTSMessage Response)> SendPTSMessageAsync(
        string ipAddress, int port, PTSMessage message, string bearerToken = null) {
        // Bearer token is ignored in tests, we just return the configured response
        return Task.FromResult((ShouldSucceed, ErrorCode, ResponseToReturn));
    }
}
```

To use this pattern in tests:

1. Create an instance of the test double: `var httpPusher = new TestHttpCommandPusher();`
2. Configure its properties before each test: `httpPusher.ShouldSucceed = true;`
3. Pass it directly to the system under test: `_commandExecutor = new CommandExecutor(..., httpPusher, ...);`

## Common Issues and Solutions

### Moq Expression Tree Errors

If you see "An expression tree may not contain a call or invocation that uses optional arguments", here are additional solutions:

#### Option 1: Create Interface-Specific Test Doubles (Implemented)

Our solution uses a custom class that implements the interface directly, avoiding Moq's expression tree limitations. This is the most robust approach.

#### Option 2: Use ReturnsAsync with Callback

```csharp
mock.Setup(x => x.Method(It.IsAny<string>()))
    .Callback<string>(param => {
        // Verify or store parameter here
    })
    .ReturnsAsync(returnValue);
```

#### Option 3: Use Method.Object Instead of Lambda Expressions

```csharp
// Avoid:
mock.Setup(x => x.Method(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<object>()))

// Instead, use the more verbose but safer:
mock.Setup(x => x.Method(
    It.Is<string>(s => true),
    It.Is<int>(i => true),
    It.Is<object>(o => true)))
```

### Handling Optional Parameters

The method `SendPTSMessageAsync` has an optional parameter `bearerToken`. When implementing or mocking this method:

1. Always include the optional parameter in your implementation
2. Use the test double approach as shown above
3. If using Moq, avoid complex setups with optional parameters

### Working with Complex Return Types

When working with tuple return types like `(bool Success, int? ErrorCode, PTSMessage Response)`, use Task.FromResult and provide the full tuple:

```csharp
return Task.FromResult((true, (int?)null, responseMessage));
```

### Entity Type Issues

If facing issues with entity types like the PumpAuthorizeConfirmation:

1. Use the actual type directly, not custom classes
2. For mocks, ensure the setup returns the correct type:

```csharp
.Returns((string deviceId, PumpAuthorizeData data) =>
{
    if (deviceId == "error")
        return Task.FromResult<PumpAuthorizeConfirmation>(null);

    return Task.FromResult(new PumpAuthorizeConfirmation
    {
        Pump = data.Pump,
        Transaction = 12345
    });
});
```

3. In the assertions, check properties that actually exist:

```csharp
Assert.Equal(TEST_PUMP_ID, result.Pump);  // NOT PumpId
Assert.Equal(12345, result.Transaction);
```

## Package References

Make sure to use the latest version of Moq which may have better support for some edge cases:

```xml
<PackageReference Include="Moq" Version="4.18.4" />
```

## IDE-Specific Solutions

### Visual Studio 2022

For Visual Studio, enabling Null Reference Analysis can help catch potential issues with nullable reference types:

```xml
<PropertyGroup>
  <Nullable>enable</Nullable>
  <WarningsAsErrors>nullable</WarningsAsErrors>
</PropertyGroup>
```

### Rider / Other IDEs

For JetBrains Rider, you can use attribute annotations to suppress specific warnings in test code if needed:

```csharp
[SuppressMessage("", "CS8620")]
public void MyTest()
{
    // Test code that would trigger warning CS8620
}
```