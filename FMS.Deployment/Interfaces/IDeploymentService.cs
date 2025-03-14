using System.Threading.Tasks;

namespace HyoungFMS.Deployment.Interfaces
{
    /// <summary>
    /// Interface for the main deployment orchestration service
    /// </summary>
    public interface IDeploymentService
    {
        /// <summary>
        /// Executes the deployment process with options for selective deployment
        /// </summary>
        /// <param name="frontendOnly">If true, only deploy the frontend component</param>
        /// <param name="backendOnly">If true, only deploy the backend component</param>
        /// <returns>True if deployment was successful, false otherwise</returns>
        Task<bool> ExecuteDeploymentAsync(bool frontendOnly, bool backendOnly);

        /// <summary>
        /// Validates the deployment environment and prerequisites
        /// </summary>
        /// <returns>True if validation passes, false otherwise</returns>
        Task<bool> ValidateDeploymentEnvironmentAsync();

        /// <summary>
        /// Performs a rollback to the previous deployment state
        /// </summary>
        /// <param name="frontendOnly">If true, only rollback the frontend component</param>
        /// <param name="backendOnly">If true, only rollback the backend component</param>
        /// <returns>True if rollback was successful, false otherwise</returns>
        Task<bool> RollbackDeploymentAsync(bool frontendOnly, bool backendOnly);
    }
}