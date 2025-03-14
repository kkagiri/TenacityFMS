using System;
using System.Threading.Tasks;
using HyoungFMS.Deployment.Models;

namespace HyoungFMS.Deployment.Interfaces
{
    /// <summary>
    /// Interface for sending deployment notifications
    /// </summary>
    public interface INotificationService
    {
        /// <summary>
        /// Sends a notification about the deployment status
        /// </summary>
        /// <param name="summary">Summary of the deployment</param>
        /// <param name="success">Whether the deployment was successful</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task SendDeploymentNotificationAsync(DeploymentSummary summary, bool success);

        /// <summary>
        /// Sends a notification about an error during deployment
        /// </summary>
        /// <param name="ex">The exception that occurred</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task SendErrorNotificationAsync(Exception ex);

        /// <summary>
        /// Sends a custom notification message
        /// </summary>
        /// <param name="subject">The subject of the notification</param>
        /// <param name="message">The message body</param>
        /// <param name="isError">Whether this is an error notification</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task SendCustomNotificationAsync(string subject, string message, bool isError = false);
    }
}