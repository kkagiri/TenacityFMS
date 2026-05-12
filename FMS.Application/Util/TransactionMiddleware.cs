using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Transactions;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Util {
    public class TransactionMiddleware<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : IRequest<TResponse> {
            private readonly IServiceProvider _serviceProvider;
            private readonly ILogger<TransactionMiddleware<TRequest, TResponse>> _logger;

            public TransactionMiddleware (IServiceProvider serviceProvider, ILogger<TransactionMiddleware<TRequest, TResponse>> logger) {
                _serviceProvider = serviceProvider;
                _logger = logger;
            }

            public async Task<TResponse> Handle (TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken) {
                using var scope = _serviceProvider.CreateScope ();
                var dbContext = scope.ServiceProvider.GetRequiredService<GpsdataContext> ();

                var strategy = dbContext.Database.CreateExecutionStrategy ();

                try {
                    return await strategy.ExecuteAsync (async () => {
                        await using var transaction = await dbContext.Database.BeginTransactionAsync (cancellationToken);
                        try {
                            var response = await next ();
                            await dbContext.SaveChangesAsync (cancellationToken);
                            await transaction.CommitAsync (cancellationToken);
                            return response;
                        } catch (Exception ex) {
                            _logger.LogError (ex, "Error occurred during transaction, rolling back.");
                            await transaction.RollbackAsync (cancellationToken);
                            throw;
                        }
                    });
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error executing transaction strategy");
                    throw;
                }
            }
        }
}