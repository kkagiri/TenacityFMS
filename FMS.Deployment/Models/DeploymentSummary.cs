using System;
using System.Text;

namespace HyoungFMS.Deployment.Models
{
    /// <summary>
    /// Summary information about a deployment
    /// </summary>
    public class DeploymentSummary
    {
        /// <summary>
        /// Type of deployment (Frontend Only, Backend Only, Full)
        /// </summary>
        public string DeploymentType { get; set; }

        /// <summary>
        /// When the deployment started
        /// </summary>
        public DateTime StartTime { get; set; }

        /// <summary>
        /// When the deployment ended
        /// </summary>
        public DateTime EndTime { get; set; }

        /// <summary>
        /// How long the deployment took
        /// </summary>
        public TimeSpan Duration { get; set; }

        /// <summary>
        /// Whether the deployment was successful
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Whether the health check was successful
        /// </summary>
        public bool HealthCheckSuccess { get; set; }

        /// <summary>
        /// The environment the deployment was made to
        /// </summary>
        public string Environment { get; set; }

        /// <summary>
        /// The server name where the deployment was made
        /// </summary>
        public string ServerName { get; set; }

        /// <summary>
        /// The frontend site name
        /// </summary>
        public string FrontendSite { get; set; }

        /// <summary>
        /// The backend site name
        /// </summary>
        public string BackendSite { get; set; }

        /// <summary>
        /// The application pool name
        /// </summary>
        public string ApplicationPool { get; set; }

        /// <summary>
        /// Number of files deployed to the frontend
        /// </summary>
        public int FrontendFileCount { get; set; }

        /// <summary>
        /// Number of files deployed to the backend
        /// </summary>
        public int BackendFileCount { get; set; }

        /// <summary>
        /// Converts the deployment summary to a formatted string
        /// </summary>
        /// <returns>A formatted string representation of the deployment summary</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();

            sb.AppendLine("=== DEPLOYMENT SUMMARY ===");
            sb.AppendLine($"Deployment Type: {DeploymentType}");
            sb.AppendLine($"Environment: {Environment}");
            sb.AppendLine($"Server: {ServerName}");
            sb.AppendLine($"Start Time: {StartTime:yyyy-MM-dd HH:mm:ss}");
            sb.AppendLine($"End Time: {EndTime:yyyy-MM-dd HH:mm:ss}");
            sb.AppendLine($"Duration: {Duration.TotalMinutes:F2} minutes");
            sb.AppendLine($"Status: {(Success ? "SUCCESS" : "FAILED")}");
            sb.AppendLine($"Health Check: {(HealthCheckSuccess ? "PASSED" : "FAILED")}");

            if (DeploymentType.Contains("Frontend") || DeploymentType.Contains("Full"))
            {
                sb.AppendLine($"Frontend Site: {FrontendSite}");
                sb.AppendLine($"Frontend Files: {FrontendFileCount}");
            }

            if (DeploymentType.Contains("Backend") || DeploymentType.Contains("Full"))
            {
                sb.AppendLine($"Backend Site: {BackendSite}");
                sb.AppendLine($"Backend Files: {BackendFileCount}");
            }

            sb.AppendLine($"Application Pool: {ApplicationPool}");
            sb.AppendLine("===========================");

            return sb.ToString();
        }
    }
}