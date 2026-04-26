using CommandLine;

namespace TenacyFMS.Deployment.Models
{
    /// <summary>
    /// Command-line options for the deployment application
    /// </summary>
    public class CommandLineOptions
    {
        [Option('f', "frontend-only", Required = false, HelpText = "Deploy only the frontend component")]
        public bool FrontendOnly { get; set; }

        [Option('b', "backend-only", Required = false, HelpText = "Deploy only the backend component")]
        public bool BackendOnly { get; set; }

        [Option('l', "log-file", Required = false, HelpText = "Custom log file path")]
        public string LogFile { get; set; }

        [Option('e', "environment", Required = false, HelpText = "Deployment environment (development, production)")]
        public string Environment { get; set; }

        [Option('v', "verbose", Required = false, HelpText = "Set output to verbose")]
        public bool Verbose { get; set; }

        [Option('n', "no-backup", Required = false, HelpText = "Skip backup before deployment")]
        public bool NoBackup { get; set; }

        [Option('s', "skip-health-check", Required = false, HelpText = "Skip health check after deployment")]
        public bool SkipHealthCheck { get; set; }

        [Option('r', "rollback-on-failure", Required = false, HelpText = "Automatically rollback on deployment failure")]
        public bool RollbackOnFailure { get; set; }
    }
}