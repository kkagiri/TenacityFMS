# EmailService Implementation Documentation

## Overview

The EmailService is a comprehensive SMTP-based email service implementation for the FMS Notification System. It provides robust email sending capabilities with retry logic, error handling, and flexible configuration options.

## Features

### Core Functionality
- **SMTP Email Sending**: Full SMTP protocol support with SSL/TLS options
- **Multiple Recipients**: Support for comma and semicolon-separated recipient lists
- **HTML/Text Emails**: Support for both HTML and plain text email formats
- **Authentication**: Flexible authentication options including username/password and default credentials
- **Configuration Management**: Comprehensive configuration through appsettings.json

### Advanced Features
- **Retry Logic**: Configurable retry attempts with exponential backoff
- **Error Handling**: Comprehensive error handling with specific SMTP error recognition
- **Validation**: Email address format validation and configuration validation
- **Logging**: Detailed logging for debugging and monitoring
- **Timeout Management**: Configurable connection timeouts

## File Structure

```
FMS.Application/Features/Notification/
├── Services/
│   ├── EmailService.cs           # Main implementation
│   └── IEmailService.cs          # Interface definition
└── DTOs/
    └── EmailSettings.cs          # Configuration model
```

## Configuration

### EmailSettings Model

```csharp
public class EmailSettings {
    public string SmtpServer { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 25;
    public bool UseSsl { get; set; } = false;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string FromAddress { get; set; } = string.Empty;
    public string? FromDisplayName { get; set; }
    public int TimeoutSeconds { get; set; } = 30;
    public int MaxRetryAttempts { get; set; } = 3;
    public int RetryDelaySeconds { get; set; } = 5;
}
```

### Configuration in appsettings.json

#### Production Configuration (appsettings.json)
```json
{
  "EmailSettings": {
    "SmtpServer": "mail.hyoung.co.ke",
    "SmtpPort": 25,
    "UseSsl": false,
    "Username": "hy.gps@hyoung.co.ke",
    "Password": "Hyoung2030",
    "FromAddress": "hy.gps@hyoung.co.ke",
    "FromDisplayName": "FMS Notifications",
    "TimeoutSeconds": 30,
    "MaxRetryAttempts": 3,
    "RetryDelaySeconds": 5
  }
}
```

#### Development Configuration (appsettings.Development.json)
```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.example.com",
    "SmtpPort": 587,
    "UseSsl": true,
    "Username": "notifications@example.com",
    "Password": "dev-password",
    "FromAddress": "fms-dev@example.com",
    "FromDisplayName": "FMS Dev Notifications",
    "TimeoutSeconds": 30,
    "MaxRetryAttempts": 3,
    "RetryDelaySeconds": 5
  }
}
```

## Implementation Details

### EmailService Class

The `EmailService` class implements the `IEmailService` interface and provides the following key methods:

#### Main Method
```csharp
public async Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = false, CancellationToken cancellationToken = default)
```

#### Supporting Methods
- `CreateSmtpClient()`: Creates and configures the SMTP client
- `CreateMailMessage()`: Creates the email message with proper formatting
- `GetEmailSettings()`: Loads configuration from appsettings
- `IsConfigurationValid()`: Validates the email configuration

### Key Features Implementation

#### 1. Retry Logic with Exponential Backoff
```csharp
while (attempt < maxAttempts) {
    try {
        // Send email attempt
    } catch (SmtpException ex) {
        // Don't retry for specific errors
        if (ex.StatusCode == SmtpStatusCode.AuthenticationRequired ||
            ex.StatusCode == SmtpStatusCode.InsufficientStorage ||
            ex.StatusCode == SmtpStatusCode.CommandNotImplemented) {
            break;
        }
    }

    // Wait with exponential backoff
    if (attempt < maxAttempts) {
        var delay = TimeSpan.FromSeconds(_emailSettings.RetryDelaySeconds * attempt);
        await Task.Delay(delay, cancellationToken);
    }
}
```

#### 2. Multiple Recipient Support
```csharp
var recipients = to.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
foreach (var recipient in recipients) {
    var trimmedRecipient = recipient.Trim();
    if (!string.IsNullOrWhiteSpace(trimmedRecipient)) {
        try {
            mailMessage.To.Add(new MailAddress(trimmedRecipient));
        } catch (FormatException ex) {
            _logger.LogWarning(ex, "Invalid email address format: {Email}", trimmedRecipient);
        }
    }
}
```

#### 3. Flexible Authentication
```csharp
if (!string.IsNullOrEmpty(_emailSettings.Username) && !string.IsNullOrEmpty(_emailSettings.Password)) {
    smtpClient.Credentials = new NetworkCredential(_emailSettings.Username, _emailSettings.Password);
} else {
    smtpClient.UseDefaultCredentials = true;
}
```

## Usage Examples

### Basic Email Sending
```csharp
var emailService = serviceProvider.GetService<IEmailService>();

var success = await emailService.SendEmailAsync(
    to: "user@example.com",
    subject: "Test Email",
    body: "This is a test email",
    isHtml: false
);
```

### HTML Email with Multiple Recipients
```csharp
var htmlBody = @"
<html>
<body>
    <h2>Notification Alert</h2>
    <p>Tank level is critically low!</p>
    <p><strong>Tank:</strong> Tank #1</p>
    <p><strong>Level:</strong> 5%</p>
</body>
</html>";

var success = await emailService.SendEmailAsync(
    to: "admin@company.com,supervisor@company.com",
    subject: "Critical Tank Level Alert",
    body: htmlBody,
    isHtml: true
);
```

### Integration with Notification System
```csharp
// In NotificationService.cs
private async Task<bool> SendEmailNotificationAsync(
    Domain.Entities.Notification notification,
    NotificationRecipient recipient,
    CancellationToken cancellationToken) {

    try {
        var policy = notification.NotificationPolicy;
        var emailTemplate = policy?.EmailTemplate ?? GetDefaultEmailTemplate();
        var emailContent = FormatEmailTemplate(emailTemplate, notification, recipient);

        return await _emailService.SendEmailAsync(
            recipient.RecipientAddress,
            notification.Title,
            emailContent,
            isHtml: true,
            cancellationToken);
    } catch (Exception ex) {
        _logger.LogError(ex, "Error sending email notification to {Email}", recipient.RecipientAddress);
        return false;
    }
}
```

## Error Handling

### SMTP-Specific Error Handling
The service recognizes specific SMTP errors and handles them appropriately:

- **Authentication Errors**: No retry, immediate failure
- **Insufficient Storage**: No retry, immediate failure
- **Command Not Implemented**: No retry, immediate failure
- **Network Errors**: Retry with backoff
- **Temporary Failures**: Retry with backoff

### Validation Errors
- Invalid email addresses are logged but don't stop the entire operation
- Configuration validation occurs before any send attempts
- Malformed recipient lists are cleaned and processed

## Logging

The service provides comprehensive logging at different levels:

### Information Level
- Email send attempts and successes
- Configuration status
- Retry attempts and delays

### Warning Level
- Configuration issues
- Invalid email addresses
- Missing settings

### Error Level
- SMTP errors with full exception details
- Final failure after all retry attempts
- Unexpected exceptions

### Debug Level
- SMTP client configuration details
- Authentication method selection

## Dependencies

### Required NuGet Packages
- `Microsoft.Extensions.Configuration` (included in .NET)
- `Microsoft.Extensions.Logging` (included in .NET)
- `System.Net.Mail` (included in .NET)

### Project Dependencies
- `FMS.Application.Features.Notification.DTOs` - EmailSettings configuration model

## Service Registration

Register the EmailService in the dependency injection container:

```csharp
// In Program.cs or Startup.cs
services.AddScoped<IEmailService, EmailService>();
```

## Security Considerations

### Credential Management
- Passwords should be stored securely (Azure Key Vault, environment variables)
- Consider using application-specific passwords for production
- Rotate credentials regularly

### Network Security
- Use SSL/TLS for production environments
- Configure firewall rules for SMTP port access
- Consider using internal mail relays for security

### Email Content
- Sanitize user input in email content
- Validate email addresses before sending
- Implement rate limiting if needed

## Testing

### Unit Testing
```csharp
[Test]
public async Task SendEmailAsync_WithValidConfiguration_ReturnsTrue() {
    // Arrange
    var mockLogger = new Mock<ILogger<EmailService>>();
    var mockConfiguration = new Mock<IConfiguration>();
    // Setup configuration mocks...

    var emailService = new EmailService(mockLogger.Object, mockConfiguration.Object);

    // Act
    var result = await emailService.SendEmailAsync("test@example.com", "Test", "Body");

    // Assert
    Assert.IsTrue(result);
}
```

### Integration Testing
- Test with actual SMTP server
- Verify email delivery to test accounts
- Test error scenarios (invalid credentials, network issues)

## Monitoring and Maintenance

### Health Checks
Consider implementing health checks for the email service:

```csharp
public class EmailHealthCheck : IHealthCheck {
    private readonly IEmailService _emailService;

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default) {
        try {
            // Test email configuration without sending
            var isHealthy = await _emailService.TestConnectionAsync();
            return isHealthy ? HealthCheckResult.Healthy() : HealthCheckResult.Unhealthy();
        } catch (Exception ex) {
            return HealthCheckResult.Unhealthy(exception: ex);
        }
    }
}
```

### Performance Monitoring
- Monitor email send success/failure rates
- Track retry patterns and common errors
- Monitor SMTP server response times

## Troubleshooting

### Common Issues

#### Configuration Issues
- **Symptom**: "Email configuration is not valid" warnings
- **Solution**: Verify SmtpServer and FromAddress are properly configured

#### Authentication Failures
- **Symptom**: SMTP authentication errors
- **Solution**: Verify username/password, check if app-specific passwords are required

#### Network Connectivity
- **Symptom**: Connection timeouts
- **Solution**: Check firewall rules, SMTP server availability, DNS resolution

#### Email Delivery Issues
- **Symptom**: Emails not received (but service reports success)
- **Solution**: Check spam folders, verify recipient addresses, check mail server logs

### Diagnostic Steps
1. Enable debug logging for detailed SMTP information
2. Test with a simple email client (Outlook, Thunderbird)
3. Verify SMTP server settings with IT administrators
4. Check network connectivity to SMTP server
5. Test with different email addresses (internal vs external)

## Future Enhancements

### Potential Improvements
- **Email Templates**: Support for more sophisticated templating engines
- **Attachments**: Add support for file attachments
- **Email Queuing**: Implement background email queuing for high volume
- **Delivery Tracking**: Track email delivery status and read receipts
- **Alternative Providers**: Support for cloud email services (SendGrid, AWS SES)

### Configuration Enhancements
- **Environment-specific Templates**: Different templates per environment
- **Dynamic Configuration**: Hot-reload of email settings
- **Advanced Routing**: Route emails through different SMTP servers based on recipient domain

## Changelog

### Version 1.0.0 (Current)
- Initial implementation with SMTP support
- Retry logic with exponential backoff
- Multiple recipient support
- HTML/text email support
- Comprehensive error handling and logging
- Configuration through appsettings.json

---

**Author**: FMS Development Team
**Last Updated**: December 2024
**Version**: 1.0.0