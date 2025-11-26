using System.Collections.Generic;
using System.Xml.Linq;

namespace FMS.Application.Features.GPSGate.Processors
{
    /// <summary>
    /// Interface for processing different types of GPSGate reports.
    /// Each report type has a unique processor that knows how to parse its XML structure.
    /// </summary>
    /// <typeparam name="T">The model type for the report data</typeparam>
    public interface IReportProcessor<T> where T : class
    {
        /// <summary>
        /// The GPSGate report ID this processor handles
        /// </summary>
        int ReportId { get; }

        /// <summary>
        /// The name/description of this report type
        /// </summary>
        string ReportName { get; }

        /// <summary>
        /// Parses the XML report data and returns a list of typed objects
        /// </summary>
        /// <param name="reportXml">The XML document containing the report data</param>
        /// <returns>List of parsed report data objects</returns>
        List<T> ProcessReport(XDocument reportXml);

        /// <summary>
        /// Parses a single data row from the report
        /// </summary>
        /// <param name="dataRow">The XML element representing a single row</param>
        /// <returns>Parsed data object</returns>
        T ParseRow(XElement dataRow);

        /// <summary>
        /// Validates the report structure to ensure it's the correct format
        /// </summary>
        /// <param name="reportXml">The XML document to validate</param>
        /// <returns>True if valid, false otherwise</returns>
        bool ValidateReportStructure(XDocument reportXml);
    }
}
