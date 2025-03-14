using System.Threading.Tasks;

namespace HyoungFMS.Deployment.Interfaces
{
    /// <summary>
    /// Interface for managing file operations during deployment
    /// </summary>
    public interface IFileManager
    {
        /// <summary>
        /// Creates a backup of the current deployment
        /// </summary>
        /// <param name="frontendOnly">If true, only backup the frontend component</param>
        /// <param name="backendOnly">If true, only backup the backend component</param>
        /// <returns>True if backup was successful, false otherwise</returns>
        Task<bool> BackupCurrentDeploymentAsync(bool frontendOnly, bool backendOnly);

        /// <summary>
        /// Deploys the frontend component
        /// </summary>
        /// <returns>True if deployment was successful, false otherwise</returns>
        Task<bool> DeployFrontendAsync();

        /// <summary>
        /// Deploys the backend component
        /// </summary>
        /// <returns>True if deployment was successful, false otherwise</returns>
        Task<bool> DeployBackendAsync();

        /// <summary>
        /// Builds the frontend component if needed
        /// </summary>
        /// <returns>True if build was successful, false otherwise</returns>
        Task<bool> BuildFrontendAsync();

        /// <summary>
        /// Builds the backend component if needed
        /// </summary>
        /// <returns>True if build was successful, false otherwise</returns>
        Task<bool> BuildBackendAsync();

        /// <summary>
        /// Restores a previous deployment from backup
        /// </summary>
        /// <param name="frontendOnly">If true, only restore the frontend component</param>
        /// <param name="backendOnly">If true, only restore the backend component</param>
        /// <returns>True if restore was successful, false otherwise</returns>
        Task<bool> RestoreFromBackupAsync(bool frontendOnly, bool backendOnly);

        /// <summary>
        /// Cleans up old backups to save disk space
        /// </summary>
        /// <param name="maxBackupsToKeep">Maximum number of backups to keep</param>
        /// <returns>True if cleanup was successful, false otherwise</returns>
        Task<bool> CleanupOldBackupsAsync(int maxBackupsToKeep);
    }
}