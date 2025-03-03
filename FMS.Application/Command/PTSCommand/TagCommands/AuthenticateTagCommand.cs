using FMS.Application.Queries.Database.PTSQueries.TagQueries;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRule.Rules;
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
        private readonly ILogger<AuthenticateTagCommandHandler> _logger;
        private readonly IMediator _mediator;

        public AuthenticateTagCommandHandler(GpsdataContext context, ILogger<AuthenticateTagCommandHandler> logger, IMediator mediator)
        {

            _context = context;
            _logger = logger;
            _mediator = mediator;
        }


        public async Task<AuthenticateTagResult> Handle(AuthenticateTagCommand request, CancellationToken cancellationToken)
        {
            try
            {

                var tag = await _context.Tags.Include(t => t.FuelRuleSet).ThenInclude(rs => rs.Rules).FirstOrDefaultAsync(x => x.Name == request.TagName);



                if (tag == null || !tag.IsEnabled.GetValueOrDefault(true))
                    return new AuthenticateTagResult(false, tag, 0);

                var dailyFuelIssued = await _mediator.Send(new GetDailyFuelIssuedForTagQuery(request.TagName, DateTime.Now), cancellationToken);
                var monthlyFuelIssued = await _mediator.Send(new GetMonthlyFuelIssuedForTagQuery(request.TagName, DateTime.Now), cancellationToken);

                var fuelingContext = new FuelingContext
                {
                    TagName = request.TagName,
                    FuelTakenToday = dailyFuelIssued,
                    FuelTakenThisMonth = monthlyFuelIssued,
                    NoOfRefillToday = await GetRefillCount(tag.Id, DateTime.Today),
                    NoOfRefillThisWeek = await GetRefillCount(tag.Id, DateTime.Today.AddDays(-7)),
                    NoOfRefillThisMonth = await GetRefillCount(tag.Id, DateTime.Today.AddMonths(-1))
                };
                decimal lowestLimit = decimal.MaxValue;
                bool hasLimit = false;

                foreach (var rule in tag.FuelRuleSet!.Rules.Where(r => r.IsActive))
                {
                    if (!rule.Evaluate(fuelingContext))
                    {
                        return new AuthenticateTagResult(false, tag, 0);
                    }

                    if (rule is DailyMonthlyLimitRule limitRule)
                    {
                        if (limitRule.DailyLimitLiter.HasValue)
                        {
                            var remainingDaily = limitRule.DailyLimitLiter.Value - dailyFuelIssued;
                            if (remainingDaily <= 0)
                                return new AuthenticateTagResult(false, tag, 0);

                            lowestLimit = Math.Min(lowestLimit, remainingDaily);
                            hasLimit = true;
                        }

                        if (limitRule.MonthlyLimitLiter.HasValue)
                        {
                            var remainingMonthly = limitRule.MonthlyLimitLiter.Value - monthlyFuelIssued;
                            if (remainingMonthly <= 0)
                                return new AuthenticateTagResult(false, tag, 0);

                            lowestLimit = Math.Min(lowestLimit, remainingMonthly);
                            hasLimit = true;
                        }
                    }
                }

                decimal dose = hasLimit ? lowestLimit : decimal.MaxValue;
                return new AuthenticateTagResult(true, tag, dose);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw new Exception(ex.ToString()); ;
            }


        }
        private async Task<int> GetRefillCount(int tagId, DateTime since)
        {
            return await _context.Fuelrefils
                .Where(f => f.TagId == tagId.ToString()
                    && f.DateCreated >= since
                    && f.DateCreated <= DateTime.Now)
                .CountAsync();
        }


    }

    //To:Do Move this file to Domain.Entities.Features.FuelRuleSet

    public record AuthenticateTagResult(bool IsAuthenticated, Tag Tag, decimal dose);
}
