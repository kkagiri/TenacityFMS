using System.Threading.Tasks;

namespace TenacyFMS.Deployment.Interfaces
{
    /// <summary>
    /// Interface for managing IIS components
    /// </summary>
    public interface IIISManager
    {
        /// <summary>
        /// Stops the required IIS services based on deployment options
        /// </summary>
        /// <param name="frontendOnly">If true, only stop frontend-related services</param>
        /// <param name="backendOnly">If true, only stop backend-related services</param>
        /// <returns>True if all required services were stopped successfully, false otherwise</returns>
        Task<bool> StopRequiredServicesAsync(bool frontendOnly, bool backendOnly);

        /// <summary>
        /// Starts the required IIS services based on deployment options
        /// </summary>
        /// <param name="frontendOnly">If true, only start frontend-related services</param>
        /// <param name="backendOnly">If true, only start backend-related services</param>
        /// <returns>True if all required services were started successfully, false otherwise</returns>
        Task<bool> StartRequiredServicesAsync(bool frontendOnly, bool backendOnly);

        /// <summary>
        /// Attempts to release locks on log directories that might prevent deployment
        /// </summary>
        /// <returns>A task representing the asynchronous operation</returns>
        Task ReleaseLogDirectoryLocksAsync();

        /// <summary>
        /// Checks if the IIS site exists
        /// </summary>
        /// <param name="siteName">The name of the site to check</param>
        /// <returns>True if the site exists, false otherwise</returns>
        Task<bool> SiteExistsAsync(string siteName);

        /// <summary>
        /// Checks if the application pool exists
        /// </summary>
        /// <param name="appPoolName">The name of the application pool to check</param>
        /// <returns>True if the application pool exists, false otherwise</returns>
        Task<bool> AppPoolExistsAsync(string appPoolName);
    }
}