using DevExpress.DataAccess.ConnectionParameters;
using DevExpress.DataAccess.Web;

namespace FMS.WebClient.Report;

/// <summary>
/// Provides connection strings for SQL data sources in the Report Designer wizard.
/// This allows the Data Source wizard to show available database connections.
/// </summary>
public class DataSourceWizardConnectionStringsProvider : IDataSourceWizardConnectionStringsProvider
{
    /// <summary>
    /// Returns the available connection string descriptions for the data source wizard.
    /// </summary>
    public Dictionary<string, string> GetConnectionDescriptions()
    {
        // Return connection string names with display descriptions
        // The actual connection strings are registered via DefaultConnectionStringProvider
        return new Dictionary<string, string>
        {
            { "FMSConnection", "FMS MySQL Database" }
        };
    }

    /// <summary>
    /// Returns the data connection parameters for the specified connection name.
    /// </summary>
    public DataConnectionParametersBase? GetDataConnectionParameters(string name)
    {
        // The actual connection is handled by DefaultConnectionStringProvider
        // Return null to let DevExpress use the registered connection string
        return null;
    }
}
