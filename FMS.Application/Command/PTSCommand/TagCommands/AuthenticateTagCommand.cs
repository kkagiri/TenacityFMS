using FMS.Application.Queries.Database.PTSQueries.TagQueries;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Server.IIS.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Org.BouncyCastle.Asn1.Mozilla;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.PTSCommand.TagCommands
{
    public record AuthenticateTagCommand(string TagName) : IRequest<AuthenticateTagResult>;


    public class AuthenticateTagCommandHandler : IRequestHandler<AuthenticateTagCommand, AuthenticateTagResult>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger _logger;
        private readonly IMediator _mediator;

        public AuthenticateTagCommandHandler(GpsdataContext context, ILogger<AuthenticateTagCommand> logger , IMediator mediator)
        {

            _context = context;
            _logger = logger;
            _mediator = mediator;
        }


        public async Task<AuthenticateTagResult> Handle(AuthenticateTagCommand request, CancellationToken cancellationToken)
        {
            try
            {

                var tag = await _context.Tags.FirstOrDefaultAsync(x => x.Name == request.TagName);

                if (tag == null || (tag.IsEnabled.HasValue && !tag.IsEnabled.Value)) //incldue !tag.IsEnable
                    return new AuthenticateTagResult(false, tag,0);

                var dailyFuelIssued = await _mediator.Send(new GetDailyFuelIssuedForTagQuery(request.TagName, DateTime.Now), cancellationToken);
                var monthlyFuelIssued = await _mediator.Send(new GetMonthlyFuelIssuedForTagQuery(request.TagName,DateTime.Now), cancellationToken);


                decimal? remainingDailyLimit = tag.DailyFuelLimit - dailyFuelIssued;
                decimal? remainingMonthlyLimit = tag.MonthlyFuelLimit - monthlyFuelIssued;

                decimal dose = Math.Min(remainingDailyLimit ?? 0, remainingMonthlyLimit ?? 0);

                if(dose <= 0)
                {
                    return new AuthenticateTagResult(false, tag, dose);
                }
      
              return new AuthenticateTagResult(true, tag,dose);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                 throw new Exception(ex.ToString()); ;
            }


        }
        

    }


    public record AuthenticateTagResult(bool IsAuthenticated, Tag Tag,decimal dose);
}
