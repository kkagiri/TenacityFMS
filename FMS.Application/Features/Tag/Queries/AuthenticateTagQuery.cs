using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Tag.Queries;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Server.IIS.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.TagQueries {
    public record AuthenticateTagQuery (string TagName) : IRequest<AuthenticateTagResult>;

    public class AuthenticateTagQueryHandler : IRequestHandler<AuthenticateTagQuery, AuthenticateTagResult> {
        private readonly GpsdataContext _context;
        private readonly ILogger<AuthenticateTagQueryHandler> _logger;
        private readonly IMediator _mediator;

        public AuthenticateTagQueryHandler (GpsdataContext context, ILogger<AuthenticateTagQueryHandler> logger, IMediator mediator) {

            _context = context;
            _logger = logger;
            _mediator = mediator;
        }

        public async Task<AuthenticateTagResult> Handle (AuthenticateTagQuery request, CancellationToken cancellationToken) {
            try {

                var tag = await _context.Tags.Include (t => t.FuelRuleSet).ThenInclude (rs => rs.Rules).FirstOrDefaultAsync (x => x.Name == request.TagName);

                if (tag == null)
                    return new AuthenticateTagResult (false, null, 0, false);

                bool isMasterTag = tag.IsMaster.GetValueOrDefault ((sbyte) 0) == 1;

                if (!tag.IsEnabled.GetValueOrDefault (true))
                    return new AuthenticateTagResult (false, tag, 0, isMasterTag);

                var dailyFuelIssued = await _mediator.Send (new GetDailyFuelIssuedForTagQuery (tag, DateTime.Now), cancellationToken);
                var monthlyFuelIssued = await _mediator.Send (new GetMonthlyFuelIssuedForTagQuery (tag.Name, DateTime.Now), cancellationToken);

                var fuelingContext = new FuelingContext {
                    TagName = request.TagName,
                    FuelTakenToday = dailyFuelIssued,
                    FuelTakenThisMonth = monthlyFuelIssued,
                    NoOfRefillToday = await GetRefillCount (tag.Id, DateTime.Today),
                    NoOfRefillThisWeek = await GetRefillCount (tag.Id, DateTime.Today.AddDays (-7)),
                    NoOfRefillThisMonth = await GetRefillCount (tag.Id, DateTime.Today.AddMonths (-1)),
                };
                decimal lowestLimit = decimal.MaxValue;
                bool hasLimit = false;

                foreach (var ruleData in tag.FuelRuleSet!.Rules.Where (r => r.IsActive)) {
                    FuelingRule concreteRule;
                    if (ruleData.DailyLimitLiter.HasValue || ruleData.MonthlyLimitLiter.HasValue) {
                        concreteRule = new DailyMonthlyLimitRule {
                            DailyLimitLiter = ruleData.DailyLimitLiter,
                            MonthlyLimitLiter = ruleData.MonthlyLimitLiter
                        };
                    } else if (ruleData.MaxRefillsPerDay.HasValue || ruleData.MaxRefillsPerWeek.HasValue || ruleData.MaxRefillsPerMonth.HasValue) {
                        concreteRule = new NoOfRefillRule {
                            MaxRefillsPerDay = ruleData.MaxRefillsPerDay,
                            MaxRefillsPerWeek = ruleData.MaxRefillsPerWeek,
                            MaxRefillsPerMonth = ruleData.MaxRefillsPerMonth
                        };
                    } else {
                        _logger.LogWarning ($"Rule ID {ruleData.Id} for Tag {request.TagName} is of an unknown or base type and cannot be evaluated.");
                        continue;
                    }

                    if (!concreteRule.Evaluate (fuelingContext)) {
                        return new AuthenticateTagResult (false, tag, 0, isMasterTag);
                    }

                    if (concreteRule is DailyMonthlyLimitRule limitRule) {
                        if (limitRule.DailyLimitLiter.HasValue) {
                            var remainingDaily = limitRule.DailyLimitLiter.Value - dailyFuelIssued;
                            if (remainingDaily <= 0)
                                return new AuthenticateTagResult (false, tag, 0, isMasterTag);

                            lowestLimit = Math.Min (lowestLimit, remainingDaily);
                            hasLimit = true;
                        }

                        if (limitRule.MonthlyLimitLiter.HasValue) {
                            var remainingMonthly = limitRule.MonthlyLimitLiter.Value - monthlyFuelIssued;
                            if (remainingMonthly <= 0)
                                return new AuthenticateTagResult (false, tag, 0, isMasterTag);

                            lowestLimit = Math.Min (lowestLimit, remainingMonthly);
                            hasLimit = true;
                        }
                    }
                }

                decimal dose = hasLimit ? lowestLimit : decimal.MaxValue;
                return new AuthenticateTagResult (true, tag, dose, isMasterTag);
            } catch (Exception ex) {
                _logger.LogError (ex.Message);
                throw new Exception (ex.ToString ());;
            }

        }
        private async Task<int> GetRefillCount (int tagId, DateTime since) {
            return await _context.FuelRefills
                .Where (f => f.TagId == tagId.ToString () &&
                    f.DateCreated >= since &&
                    f.DateCreated <= DateTime.Now)
                .CountAsync ();
        }

    }

    //To:Do Move this file to Domain.Entities.Features.FuelRuleSet

    public record AuthenticateTagResult (bool IsAuthenticated, Tag Tag, decimal dose, bool IsMasterTag);
}