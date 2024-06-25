using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries.Category;

public record GetIssueCategoryListQuery : IRequest<List<Issuecategory>>;

public class GetIssueCategoryListQueryHandler : IRequestHandler<GetIssueCategoryListQuery, List<Issuecategory>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssueCategoryListQueryHandler> _logger;

    public GetIssueCategoryListQueryHandler(GpsdataContext context, ILogger<GetIssueCategoryListQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Issuecategory>> Handle(GetIssueCategoryListQuery request, CancellationToken cancellationToken)
    {
      try{
           var category = await _context.Issuecategories.ToListAsync(cancellationToken);
           return category;
       }
       catch (Exception ex)
       {
           _logger.LogError(ex, "An error occured while getting issue category");
           throw new Exception("Error in GetIssueCategoryListQueryHandler");
       }
    }


}