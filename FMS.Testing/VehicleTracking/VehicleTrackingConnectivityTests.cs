using System.Threading.Tasks;
using FMS.Infrastructure.VehicleTracking.Factory;
using FMS.Infrastructure.VehicleTracking.Interfaces;
using FMS.Infrastructure.VehicleTracking.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FMS.Testing.VehicleTracking
{
    public class VehicleTrackingConnectivityTests
    {
        [Fact]
        public async Task TestProviderConnectivityAsync_ReturnsTrue_OnSuccess()
        {
            // Arrange
            var providerMock = new Mock<IVehicleTrackingProvider>();
            providerMock.Setup(p => p.ProviderName).Returns("GPSGate");
            providerMock.Setup(p => p.ValidateConnectionAsync())
                .ReturnsAsync(Application.Common.FMSResponse<bool>.Success(true));

            var factoryMock = new Mock<IProviderFactory>();
            factoryMock.Setup(f => f.CreateProviderAsync("GPSGate"))
                .ReturnsAsync(providerMock.Object);

            var configMock = new Mock<IProviderConfigurationService>();
            var cache = new MemoryCache(new MemoryCacheOptions());
            var logger = Mock.Of<ILogger<VehicleTrackingService>>();

            var svc = new VehicleTrackingService(factoryMock.Object, configMock.Object, cache, logger);

            // Act
            var ok = await svc.TestProviderConnectivityAsync("GPSGate");

            // Assert
            Assert.True(ok);
        }

        [Fact]
        public async Task TestProviderConnectivityAsync_ReturnsFalse_OnFailure()
        {
            // Arrange
            var providerMock = new Mock<IVehicleTrackingProvider>();
            providerMock.Setup(p => p.ProviderName).Returns("GPSGate");
            providerMock.Setup(p => p.ValidateConnectionAsync())
                .ReturnsAsync(Application.Common.FMSResponse<bool>.Success(false));

            var factoryMock = new Mock<IProviderFactory>();
            factoryMock.Setup(f => f.CreateProviderAsync("GPSGate"))
                .ReturnsAsync(providerMock.Object);

            var configMock = new Mock<IProviderConfigurationService>();
            var cache = new MemoryCache(new MemoryCacheOptions());
            var logger = Mock.Of<ILogger<VehicleTrackingService>>();

            var svc = new VehicleTrackingService(factoryMock.Object, configMock.Object, cache, logger);

            // Act
            var ok = await svc.TestProviderConnectivityAsync("GPSGate");

            // Assert
            Assert.False(ok);
        }

        [Fact]
        public async Task TestProviderConnectivityAsync_ReturnsFalse_WhenProviderMissing()
        {
            var factoryMock = new Mock<IProviderFactory>();
            factoryMock.Setup(f => f.CreateProviderAsync("Missing"))
                .ReturnsAsync((IVehicleTrackingProvider?)null);

            var configMock = new Mock<IProviderConfigurationService>();
            var cache = new MemoryCache(new MemoryCacheOptions());
            var logger = Mock.Of<ILogger<VehicleTrackingService>>();

            var svc = new VehicleTrackingService(factoryMock.Object, configMock.Object, cache, logger);

            var ok = await svc.TestProviderConnectivityAsync("Missing");

            Assert.False(ok);
        }
    }
}
