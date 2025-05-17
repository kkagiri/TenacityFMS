# Fuel Management System Tag Query Tests

This directory contains comprehensive tests for the Tag-related queries in the FMS.Application project.

## Test Files

### GetFuelIssuedForTagQueryTests.cs

Tests for the following queries:
- `GetDailyFuelIssuedForTagQuery`: Calculates fuel issued to a specific tag on a given day
- `GetMonthlyFuelIssuedForTagQuery`: Calculates fuel issued to a specific tag in a given month
- `GetDailyFuelIssuedForVehicleQuery`: Calculates fuel issued to a specific vehicle on a given day
- `GetMonthlyFuelIssuedForVehicleQuery`: Calculates fuel issued to a specific vehicle in a given month

These tests use Moq to mock the database context and ensure that both automatic pump transactions and manual fuel refills are correctly summed for the specified time periods.

### AuthenticateTagQueryTests.cs

Tests for the `AuthenticateTagQuery` which validates a tag against various authorization rules.

### ValidateTagQueryTests.cs

Tests for the `ValidateTagQuery` which checks if a tag is valid for use.

### GetTagDetailsQueryTests.cs

Tests for the `GetTagDetailsQuery` which retrieves detailed information about a tag.

## Running the Tests

You can run all tests in the project using the following command:

```
dotnet test FMS.Testing/FMS.Testing.csproj
```

To run only the Tag query tests:

```
dotnet test FMS.Testing/FMS.Testing.csproj --filter "FullyQualifiedName~TagQueries"
```

To run a specific test file:

```
dotnet test FMS.Testing/FMS.Testing.csproj --filter "FullyQualifiedName~GetFuelIssuedForTagQueryTests"
```

## Test Structure

Each test file follows the Arrange-Act-Assert pattern:

1. **Arrange**: Set up the mock database context with test data
2. **Act**: Execute the query being tested
3. **Assert**: Verify that the result matches the expected outcome

The tests use a combination of in-memory test data and mocking to isolate the query logic from actual database dependencies.