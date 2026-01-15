using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Xunit;
using Xunit.Abstractions;
using FMS.Application.Features.Notification.Services.Channels;
using FMS.Application.Features.Notification.Services.DeliveryChannel;

namespace FMS.Testing.IntegrationTests.DependencyInjection
{
    /// <summary>
    /// Tests to validate that DI service registrations exist in the PTS Windows Service.
    /// Uses static code analysis to verify registrations without requiring full service instantiation.
    /// 
    /// IMPORTANT: Run these tests before deploying to catch DI registration errors
    /// that would cause runtime failures in production.
    /// </summary>
    public class PTSServiceDIValidationTests
    {
        private readonly ITestOutputHelper _output;
        private readonly string _ptsServiceProgramPath;
        private readonly string _programFileContent;

        public PTSServiceDIValidationTests(ITestOutputHelper output)
        {
            _output = output;
            
            // Find the PTS Service Program.cs file
            var solutionRoot = FindSolutionRoot();
            _ptsServiceProgramPath = Path.Combine(solutionRoot, "FMS.PTS.WindowsService", "Program.cs");
            
            if (File.Exists(_ptsServiceProgramPath))
            {
                _programFileContent = File.ReadAllText(_ptsServiceProgramPath);
            }
            else
            {
                _programFileContent = string.Empty;
                _output.WriteLine($"WARNING: Could not find {_ptsServiceProgramPath}");
            }
        }

        private string FindSolutionRoot()
        {
            var dir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            while (dir != null)
            {
                if (File.Exists(Path.Combine(dir, "Hyoung.Fms.sln")))
                {
                    return dir;
                }
                dir = Path.GetDirectoryName(dir);
            }
            
            return @"c:\Users\kkagiri\Sources\Repo\Hyoung.FMS";
        }

        /// <summary>
        /// CRITICAL TEST: Validates IPushNotificationService is registered in PTS Service.
        /// This was the root cause of the mobile pump display failure.
        /// </summary>
        [Fact]
        public void PushNotificationService_MustBeRegistered_InPTSService()
        {
            var registrationPatterns = new[]
            {
                "IPushNotificationService",
                "AddScoped<IPushNotificationService",
                "AddTransient<IPushNotificationService",
                "AddSingleton<IPushNotificationService"
            };

            bool found = registrationPatterns.Any(pattern => 
                _programFileContent.Contains(pattern, StringComparison.OrdinalIgnoreCase));

            if (found)
            {
                _output.WriteLine("✓ IPushNotificationService is registered in PTS Service");
            }
            else
            {
                _output.WriteLine("✗ CRITICAL: IPushNotificationService NOT found!");
            }

            Assert.True(found, 
                "IPushNotificationService must be registered in FMS.PTS.WindowsService/Program.cs");
        }

        /// <summary>
        /// Validates critical services needed for mobile fueling are registered.
        /// </summary>
        [Theory]
        [InlineData("IPushNotificationService", "Push notifications for mobile app")]
        [InlineData("DeviceConnectionTracker", "Device connection tracking")]
        [InlineData("INotificationChannel", "Notification channel system")]
        public void CriticalMobileServices_MustBeRegistered(string serviceName, string purpose)
        {
            bool found = _programFileContent.Contains(serviceName, StringComparison.OrdinalIgnoreCase);
            
            _output.WriteLine($"{serviceName}: {(found ? "✓ REGISTERED" : "✗ MISSING")} - {purpose}");

            Assert.True(found, $"{serviceName} must be registered in PTS Service for: {purpose}");
        }

        /// <summary>
        /// Validates notification channel types are registered.
        /// </summary>
        [Theory]
        [InlineData("PushNotificationChannel", "Mobile push notifications")]
        [InlineData("EmailNotificationChannel", "Email alerts")]  
        [InlineData("SmsNotificationChannel", "SMS alerts")]
        [InlineData("SystemNotificationChannel", "In-app notifications")]
        public void NotificationChannels_MustBeRegistered(string channelName, string purpose)
        {
            bool found = _programFileContent.Contains(channelName, StringComparison.OrdinalIgnoreCase);
            
            _output.WriteLine($"{channelName}: {(found ? "✓" : "✗")} - {purpose}");

            Assert.True(found, $"{channelName} should be registered for: {purpose}");
        }

        /// <summary>
        /// Validates PushNotificationChannel has correct dependencies.
        /// </summary>
        [Fact]
        public void PushNotificationChannel_Constructor_HasRequiredDependencies()
        {
            var channelType = typeof(PushNotificationChannel);
            var constructors = channelType.GetConstructors();
            
            Assert.Single(constructors);
            
            var parameters = constructors[0].GetParameters();
            
            _output.WriteLine($"PushNotificationChannel constructor parameters:");
            foreach (var param in parameters)
            {
                _output.WriteLine($"  - {param.ParameterType.Name} {param.Name}");
            }

            Assert.Contains(parameters, p => 
                p.ParameterType == typeof(IPushNotificationService) ||
                p.ParameterType.Name.Contains("IPushNotificationService"));
            
            _output.WriteLine("✓ IPushNotificationService is required by PushNotificationChannel");
        }
    }
}
