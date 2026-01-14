using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;

namespace FMS.BackgroundServices.IssueTracker
{
    /// <summary>
    /// Interface for auto-close condition checkers.
    /// Each checker implements a specific strategy for determining
    /// if an issue should be automatically closed.
    /// </summary>
    public interface IAutoCloseChecker
    {
        /// <summary>
        /// Gets the checker type name.
        /// </summary>
        string CheckerType { get; }

        /// <summary>
        /// Evaluates whether the given issue should be auto-closed.
        /// </summary>
        /// <param name="issue">The issue to evaluate</param>
        /// <param name="config">The auto-close configuration</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>True if the issue should be auto-closed</returns>
        Task<bool> ShouldAutoCloseAsync(
            Issuetracker issue,
            Issueautocloseconfig config,
            CancellationToken cancellationToken);

        /// <summary>
        /// Gets the reason description for auto-closing.
        /// Called after ShouldAutoCloseAsync returns true.
        /// </summary>
        /// <returns>Human-readable reason for the auto-close</returns>
        string GetCloseReason();
    }
}
