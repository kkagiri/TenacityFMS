using System;
using System.Collections.Generic;

namespace FMS.Infrastructure.VehicleTracking.Base
{
    /// <summary>
    /// Base exception for all provider-related errors
    /// </summary>
    public class ProviderException : Exception
    {
        public string ProviderName { get; }

        public ProviderException(string providerName, string message)
            : base(message)
        {
            ProviderName = providerName;
        }

        public ProviderException(string providerName, string message, Exception innerException)
            : base(message, innerException)
        {
            ProviderName = providerName;
        }
    }

    /// <summary>
    /// Exception thrown when a provider is not initialized
    /// </summary>
    public class ProviderNotInitializedException : ProviderException
    {
        public ProviderNotInitializedException(string providerName)
            : base(providerName, $"Provider '{providerName}' is not initialized. Call InitializeAsync() first.")
        {
        }
    }

    /// <summary>
    /// Exception thrown when a provider configuration is invalid
    /// </summary>
    public class ProviderConfigurationException : ProviderException
    {
        public List<string> ValidationErrors { get; }

        public ProviderConfigurationException(string providerName, string message)
            : base(providerName, message)
        {
            ValidationErrors = new List<string>();
        }

        public ProviderConfigurationException(string providerName, List<string> validationErrors)
            : base(providerName, $"Configuration validation failed for '{providerName}'")
        {
            ValidationErrors = validationErrors;
        }
    }

    /// <summary>
    /// Exception thrown when a provider operation is not supported
    /// </summary>
    public class ProviderOperationNotSupportedException : ProviderException
    {
        public string Operation { get; }

        public ProviderOperationNotSupportedException(string providerName, string operation)
            : base(providerName, $"Operation '{operation}' is not supported by provider '{providerName}'")
        {
            Operation = operation;
        }
    }

    /// <summary>
    /// Exception thrown when a provider cannot connect to its service
    /// </summary>
    public class ProviderConnectionException : ProviderException
    {
        public ProviderConnectionException(string providerName, string message)
            : base(providerName, $"Connection failed for provider '{providerName}': {message}")
        {
        }

        public ProviderConnectionException(string providerName, string message, Exception innerException)
            : base(providerName, $"Connection failed for provider '{providerName}': {message}", innerException)
        {
        }
    }

    /// <summary>
    /// Exception thrown when a provider rate limit is exceeded
    /// </summary>
    public class ProviderRateLimitException : ProviderException
    {
        public int RateLimitPerMinute { get; }
        public DateTime RetryAfter { get; }

        public ProviderRateLimitException(string providerName, int rateLimitPerMinute, DateTime retryAfter)
            : base(providerName, $"Rate limit exceeded for provider '{providerName}'. Limit: {rateLimitPerMinute}/min. Retry after: {retryAfter}")
        {
            RateLimitPerMinute = rateLimitPerMinute;
            RetryAfter = retryAfter;
        }
    }

    /// <summary>
    /// Exception thrown when a provider authentication fails
    /// </summary>
    public class ProviderAuthenticationException : ProviderException
    {
        public ProviderAuthenticationException(string providerName, string message)
            : base(providerName, $"Authentication failed for provider '{providerName}': {message}")
        {
        }

        public ProviderAuthenticationException(string providerName, string message, Exception innerException)
            : base(providerName, $"Authentication failed for provider '{providerName}': {message}", innerException)
        {
        }
    }

    /// <summary>
    /// Exception thrown when a provider is not found
    /// </summary>
    public class ProviderNotFoundException : ProviderException
    {
        public ProviderNotFoundException(string providerName)
            : base(providerName, $"Provider '{providerName}' was not found or is not registered")
        {
        }
    }
}
