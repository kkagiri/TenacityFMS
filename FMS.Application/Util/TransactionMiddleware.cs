using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Transactions;

namespace FMS.Application.Util
{
    public class TransactionMiddleware<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
     where TRequest : IRequest<TResponse>
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TransactionMiddleware<TRequest, TResponse>> _logger;

        public TransactionMiddleware(IServiceProvider serviceProvider, ILogger<TransactionMiddleware<TRequest, TResponse>> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            //chatgpt: Create a new scope to obtain a DbContext instance.
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
            var script = dbContext.Database.GenerateCreateScript();
            _logger.LogDebug("Database create script: {script}", script);
            try
            {
                // Accessing the Model property forces EF Core to build the model.
                var model = dbContext.Model;
                _logger.LogDebug("EF Core model built successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during EF Core model creation.");
                throw;
            }
            //chatgpt: Create the execution strategy from the DbContext. This strategy supports automatic retries.
           

            var strategy = dbContext.Database.CreateExecutionStrategy();

            //chatgpt: Execute all operations inside the execution strategy's lambda.
            return await strategy.ExecuteAsync(async () =>
            {
                // Begin a new database transaction.
                await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
                try
                {
                    // Execute the next delegate in the MediatR pipeline.
                    var response = await next();

                    // Save any pending changes.
                    await dbContext.SaveChangesAsync(cancellationToken);

                    // Commit the transaction.
                    await transaction.CommitAsync(cancellationToken);

                    return response;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during transaction, rolling back.");
                    // The transaction will be rolled back automatically if not committed.
                    throw;
                }
            });

        }
    }
}
