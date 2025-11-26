using System.Threading.Tasks;

namespace FMS.Application.Communication.SignalR
{
    /// <summary>
    /// Service for broadcasting GPS fetch progress updates via SignalR
    /// </summary>
    public interface IGpsFetchProgressService
    {
        /// <summary>
        /// Send progress update for a GPS fetch job
        /// </summary>
        /// <param name="jobId">Unique identifier for the fetch job</param>
        /// <param name="status">Current status description</param>
        /// <param name="progressPercent">Progress percentage (0-100)</param>
        /// <param name="message">Detailed progress message</param>
        Task SendProgress(string jobId, string status, int progressPercent, string message);

        /// <summary>
        /// Send completion notification for a GPS fetch job
        /// </summary>
        /// <param name="jobId">Unique identifier for the fetch job</param>
        /// <param name="result">Result summary object</param>
        Task SendCompleted(string jobId, object result);

        /// <summary>
        /// Send error notification for a GPS fetch job
        /// </summary>
        /// <param name="jobId">Unique identifier for the fetch job</param>
        /// <param name="error">Error message</param>
        Task SendError(string jobId, string error);
    }
}
