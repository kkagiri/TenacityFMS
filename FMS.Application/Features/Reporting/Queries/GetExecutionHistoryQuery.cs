using System;
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.Reporting.DTOs;
using MediatR;

namespace FMS.Application.Features.Reporting.Queries
{
    /// <summary>
    /// Query to get report execution history with optional date-range filter
    /// </summary>
    public class GetExecutionHistoryQuery : IRequest<FMSResponse<List<ReportExecutionHistoryDTO>>>
    {
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
    }
}
