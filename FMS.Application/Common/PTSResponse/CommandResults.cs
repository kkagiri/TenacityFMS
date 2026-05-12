#nullable enable

using System.Collections.Generic;


namespace FMS.Application.Common.PTSResponse
{
    /// <summary>
    /// Generic command result class for CommandExecutor
    /// </summary>
    /// <param name="Success"></param>
    /// <param name="Message"></param>
    /// <param name="Code"></param>
    /// <param name="CommandType"></param>
    /// <param name="CommandData"></param>
    public record CommandResult(
       bool Success,
       string Message,
       int? Code = null,
       string? CommandType = null,
       object? CommandData = null)
    {
        public static CommandResult Succeeded(string commandType, object commandData) =>
            new CommandResult(true, "OK", null, commandType, commandData);

        public static CommandResult Failed(string message, int? code = null) =>
            new CommandResult(false, message, code);
    }
}
