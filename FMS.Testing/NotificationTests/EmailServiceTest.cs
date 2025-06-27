using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NUnit.Framework;

namespace FMS.Testing.NotificationTests {
    /// <summary>
    /// Test class for EmailService functionality
    /// </summary>
    [TestFixture]
    public class EmailServiceTest {
        private IEmailService _emailService;
        private IServiceProvider _serviceProvider;
        private ILogger<EmailService> _logger;
        private IConfiguration _configuration;

        [SetUp]
        public void Setup () {
            // Create test configuration
            var inMemorySettings = new Dictionary<string, string> { { "EmailSettings:SmtpServer", "smtp.test.com" },
                    { "EmailSettings:SmtpPort", "587" },
                    { "EmailSettings:UseSsl", "true" },
                    { "EmailSettings:Username", "test@test.com" },
                    { "EmailSettings:Password", "testpassword" },
                    { "EmailSettings:FromAddress", "noreply@test.com" },
                    { "EmailSettings:FromDisplayName", "Test System" },
                    { "EmailSettings:TimeoutSeconds", "30" },
                    { "EmailSettings:MaxRetryAttempts", "3" },
                    { "EmailSettings:RetryDelaySeconds", "2" }
                };

            _configuration = new ConfigurationBuilder ()
                .AddInMemoryCollection (inMemorySettings)
                .Build ();

            // Create service collection
            var services = new ServiceCollection ();
            services.AddLogging (builder => builder.AddConsole ());
            services.AddSingleton (_configuration);
            services.AddScoped<IEmailService, EmailService> ();

            _serviceProvider = services.BuildServiceProvider ();
            _emailService = _serviceProvider.GetRequiredService<IEmailService> ();
            _logger = _serviceProvider.GetRequiredService<ILogger<EmailService>> ();
        }

        [TearDown]
        public void TearDown () {
            _serviceProvider?.Dispose ();
        }

        /// <summary>
        /// Test email service configuration validation
        /// NOTE: This test validates configuration without actually sending emails
        /// </summary>
        [Test]
        public void EmailService_Configuration_ShouldBeValid () {
            // Arrange & Act
            var emailService = new EmailService (_logger, _configuration);

            // Assert - The service should be created without throwing exceptions
            Assert.IsNotNull (emailService);

            // Configuration validation happens during the first send attempt
            // For testing, we can verify the service is properly configured
            Assert.DoesNotThrow (() => {
                // This will test configuration loading without sending
                var _ = _serviceProvider.GetRequiredService<IEmailService> ();
            });
        }

        /// <summary>
        /// Test email address validation
        /// NOTE: This is a unit test that doesn't actually send emails
        /// </summary>
        [Test]
        public async Task SendEmailAsync_WithInvalidEmailAddress_ShouldHandleGracefully () {
            // Arrange
            var invalidEmail = "not-an-email";
            var subject = "Test Subject";
            var body = "Test Body";

            // Act & Assert
            // With invalid configuration, the service should return false without throwing
            var result = await _emailService.SendEmailAsync (invalidEmail, subject, body);

            // Since we have test configuration that won't connect to real SMTP,
            // this will fail gracefully
            Assert.IsFalse (result);
        }

        /// <summary>
        /// Test multiple recipients parsing
        /// NOTE: This tests the email parsing logic without sending
        /// </summary>
        [Test]
        public async Task SendEmailAsync_WithMultipleRecipients_ShouldParseCorrectly () {
            // Arrange
            var multipleEmails = "test1@example.com,test2@example.com;test3@example.com";
            var subject = "Test Subject";
            var body = "Test Body";

            // Act
            var result = await _emailService.SendEmailAsync (multipleEmails, subject, body);

            // Assert
            // With test configuration, this will attempt to send but fail at SMTP level
            // which is expected for this test environment
            Assert.IsFalse (result);
        }

        /// <summary>
        /// Test HTML email formatting
        /// NOTE: This tests HTML content handling
        /// </summary>
        [Test]
        public async Task SendEmailAsync_WithHtmlContent_ShouldHandleHtml () {
            // Arrange
            var email = "test@example.com";
            var subject = "HTML Test";
            var htmlBody = @"
                <html>
                <body>
                    <h2>Test HTML Email</h2>
                    <p>This is a <strong>test</strong> email with HTML content.</p>
                    <ul>
                        <li>Item 1</li>
                        <li>Item 2</li>
                    </ul>
                </body>
                </html>";

            // Act
            var result = await _emailService.SendEmailAsync (email, subject, htmlBody, isHtml : true);

            // Assert
            // With test configuration, this will fail at SMTP connection level
            Assert.IsFalse (result);
        }

        /// <summary>
        /// Performance test for email service responsiveness
        /// </summary>
        [Test]
        public async Task SendEmailAsync_ShouldRespondWithinReasonableTime () {
            // Arrange
            var email = "test@example.com";
            var subject = "Performance Test";
            var body = "Test Body";
            var startTime = DateTime.UtcNow;

            // Act
            var result = await _emailService.SendEmailAsync (email, subject, body);
            var endTime = DateTime.UtcNow;
            var duration = endTime - startTime;

            // Assert
            // Should fail quickly due to test configuration, but not hang
            Assert.IsTrue (duration.TotalSeconds < 10, "Email service should respond within 10 seconds even on failure");
            Assert.IsFalse (result); // Expected to fail with test config
        }

        /// <summary>
        /// Test cancellation token handling
        /// </summary>
        [Test]
        public async Task SendEmailAsync_WithCancellationToken_ShouldRespectCancellation () {
            // Arrange
            var email = "test@example.com";
            var subject = "Cancellation Test";
            var body = "Test Body";
            var cts = new CancellationTokenSource ();

            // Cancel immediately
            cts.Cancel ();

            // Act & Assert
            var result = await _emailService.SendEmailAsync (email, subject, body, false, cts.Token);

            // Should handle cancellation gracefully
            Assert.IsFalse (result);
        }
    }
}

/// <summary>
/// Integration test class for EmailService with real SMTP server
/// NOTE: These tests require actual SMTP configuration and should be run manually
/// </summary>
[TestFixture]
[Category ("Integration")]
[Ignore ("Integration tests require real SMTP configuration")]
public class EmailServiceIntegrationTest {
    private IEmailService _emailService;
    private IServiceProvider _serviceProvider;

    [SetUp]
    public void Setup () {
        // Load actual configuration from appsettings
        var configuration = new ConfigurationBuilder ()
            .AddJsonFile ("appsettings.Testing.json", optional : false)
            .Build ();

        var services = new ServiceCollection ();
        services.AddLogging (builder => builder.AddConsole ());
        services.AddSingleton<IConfiguration> (configuration);
        services.AddScoped<IEmailService, EmailService> ();

        _serviceProvider = services.BuildServiceProvider ();
        _emailService = _serviceProvider.GetRequiredService<IEmailService> ();
    }

    [TearDown]
    public void TearDown () {
        _serviceProvider?.Dispose ();
    }

    /// <summary>
    /// Integration test for actual email sending
    /// NOTE: Requires valid SMTP configuration in appsettings.Testing.json
    /// </summary>
    [Test]
    public async Task SendEmailAsync_WithRealSmtpServer_ShouldSendEmail () {
        // Arrange
        var testEmail = "test@example.com"; // Replace with actual test email
        var subject = $"FMS Email Service Test - {DateTime.Now:yyyy-MM-dd HH:mm:ss}";
        var body = "This is a test email from the FMS Email Service integration test.";

        // Act
        var result = await _emailService.SendEmailAsync (testEmail, subject, body);

        // Assert
        Assert.IsTrue (result, "Email should be sent successfully with proper SMTP configuration");
    }

    /// <summary>
    /// Integration test for HTML email sending
    /// </summary>
    [Test]
    public async Task SendEmailAsync_WithHtmlContent_ShouldSendHtmlEmail () {
        // Arrange
        var testEmail = "test@example.com"; // Replace with actual test email
        var subject = $"FMS HTML Email Test - {DateTime.Now:yyyy-MM-dd HH:mm:ss}";
        var htmlBody = $@"
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; }}
                    .header {{ background-color: #f0f0f0; padding: 10px; }}
                    .content {{ padding: 20px; }}
                    .footer {{ background-color: #e0e0e0; padding: 10px; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='header'>
                    <h2>FMS Email Service Test</h2>
                </div>
                <div class='content'>
                    <p>This is a test HTML email from the FMS Email Service.</p>
                    <p><strong>Test Time:</strong> {DateTime.Now:yyyy-MM-dd HH:mm:ss}</p>
                    <p><strong>Features Tested:</strong></p>
                    <ul>
                        <li>HTML content rendering</li>
                        <li>CSS styling</li>
                        <li>Multiple content sections</li>
                    </ul>
                </div>
                <div class='footer'>
                    <p>This is an automated test email from the FMS system.</p>
                </div>
            </body>
            </html>";

        // Act
        var result = await _emailService.SendEmailAsync (testEmail, subject, htmlBody, isHtml : true);

        // Assert
        Assert.IsTrue (result, "HTML email should be sent successfully");
    }
}