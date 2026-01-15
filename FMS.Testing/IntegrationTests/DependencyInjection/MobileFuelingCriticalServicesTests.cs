using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Xunit;
using Xunit.Abstractions;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.Notification.Services.Channels;
using FMS.Application.Features.Notification.Services.DeliveryChannel;

namespace FMS.Testing.IntegrationTests.DependencyInjection
{
    /// <summary>
    /// Validates critical services for mobile fueling are properly registered.
    /// Run these tests as part of CI/CD pipeline before deployment.
    /// </summary>
    public class MobileFuelingCriticalServicesTests
    {
        private readonly ITestOutputHelper _output;
        private readonly string _ptsServiceProgram;

        public MobileFuelingCriticalServicesTests(ITestOutputHelper output)
        {
            _output = output;
            
            var solutionRoot = FindSolutionRoot();
            var ptsPath = Path.Combine(solutionRoot, "FMS.PTS.WindowsService", "Program.cs");
            
            _ptsServiceProgram = File.Exists(ptsPath) ? File.ReadAllText(ptsPath) : string.Empty;
            
            if (string.IsNullOrEmpty(_ptsServiceProgram))
            {
                _output.WriteLine($"WARNING: Could not read {ptsPath}");
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
        /// CRITICAL TEST: This was the exact issue that broke mobile pump display.
        /// </summary>
        [Fact]
        public void CriticalFix_IPushNotificationService_MustBeRegistered()
        {
            bool found = _ptsServiceProgram.Contains("IPushNotificationService");
            
            if (found)
            {
                _output.WriteLine("✓ IPushNotificationService is registered");
            }
            else
            {
                _output.WriteLine("✗ CRITICAL: IPushNotificationService is NOT registered!");
            }
            
            Assert.True(found, 
                "CRITICAL: IPushNotificationService must be registered in Program.cs");
        }

        /// <summary>
        /// Verifies notification channels are registered.
        /// </summary>
        [Theory]
        [InlineData("PushNotificationChannel", "Mobile push")]
        [InlineData("EmailNotificationChannel", "Email")]
        [InlineData("SmsNotificationChannel", "SMS")]
        [InlineData("SystemNotificationChannel", "In-app")]
        [InlineData("SlackNotificationChannel", "Slack")]
        public void NotificationChannel_MustBeRegistered(string channelName, string purpose)
        {
            bool found = _ptsServiceProgram.Contains(channelName);
            
            _output.WriteLine($"{channelName}: {(found ? "✓" : "✗")} - {purpose}");
            
            Assert.True(found, $"{channelName} should be registered for: {purpose}");
        }

        /// <summary>
        /// Verifies delivery services are registered.
        /// </summary>
        [Theory]
        [InlineData("IEmailService", "Email delivery")]
        [InlineData("ISmsService", "SMS delivery")]
        [InlineData("IPushNotificationService", "Push notification delivery")]
        public void DeliveryService_MustBeRegistered(string serviceName, string purpose)
        {
            bool found = _ptsServiceProgram.Contains(serviceName);
            
            _output.WriteLine($"{serviceName}: {(found ? "✓" : "✗")} - {purpose}");
            
            Assert.True(found, $"{serviceName} must be registered for: {purpose}");
        }

        /// <summary>
        /// Documents current registrations for troubleshooting.
        /// </summary>
        [Fact]
        public void Document_CurrentPTSServiceRegistrations()
        {
            var patterns = new[] { "AddScoped<", "AddTransient<", "AddSingleton<" };

            _output.WriteLine("=== PTS SERVICE REGISTRATIONS ===");
            
            var lines = _ptsServiceProgram.Split('\n')
                .Select(l => l.Trim())
                .Where(l => patterns.Any(p => l.Contains(p)));
            
            foreach (var line in lines.Take(50))
            {
                _output.WriteLine($"  {line}");
            }
            
            Assert.True(true);
        }
    }

    /// <summary>
    /// Tests that validate DI registration patterns and dependencies.
    /// </summary>
    public class DIRegistrationPatternTests
    {
        private readonly ITestOutputHelper _output;

        public DIRegistrationPatternTests(ITestOutputHelper output)
        {
            _output = output;
        }

        /// <summary>
        /// Validates PushNotificationChannel requires IPushNotificationService.
        /// </summary>
        [Fact]
        public void PushNotificationChannel_Requires_IPushNotificationService()
        {
            var channelType = typeof(PushNotificationChannel);
            var constructor = channelType.GetConstructors().First();
            var parameters = constructor.GetParameters();

            var hasDependency = parameters.Any(p => 
                p.ParameterType == typeof(IPushNotificationService));

            _output.WriteLine("PushNotificationChannel constructor dependencies:");
            foreach (var p in parameters)
            {
                _output.WriteLine($"  - {p.ParameterType.Name}");
            }

            Assert.True(hasDependency, 
                "PushNotificationChannel should require IPushNotificationService");
            
            _output.WriteLine("✓ Confirmed: PushNotificationChannel requires IPushNotificationService");
        }

        /// <summary>
        /// Lists all INotificationChannel implementations.
        /// </summary>
        [Fact]
        public void DocumentNotificationChannelImplementations()
        {
            var channelInterface = typeof(INotificationChannel);
            var channelTypes = channelInterface.Assembly
                .GetTypes()
                .Where(t => channelInterface.IsAssignableFrom(t)
                    && !t.IsInterface
                    && !t.IsAbstract)
                .ToList();

            _output.WriteLine($"Found {channelTypes.Count} implementations:");
            
            foreach (var type in channelTypes)
            {
                _output.WriteLine($"  - {type.Name}");
            }

            Assert.True(channelTypes.Count >= 5, "Expected at least 5 implementations");
        }
    }
}
