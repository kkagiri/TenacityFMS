using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
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

        public TransactionMiddleware(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);



            // Create a new DbContext for this request
            using var dbContext = _serviceProvider.CreateScope().ServiceProvider.GetRequiredService<GpsdataContext>();

            //create an

            try
            {
                // Execute the next delegate (usually the handler) in the pipeline
                var response = await next();

                // If we get here, no exception was thrown, so we can complete the transaction
                await dbContext.SaveChangesAsync(cancellationToken);
                scope.Complete();

                return response;
            }
            catch (Exception)
            {
                // Transaction will automatically be rolled back if we don't call Complete()
                throw;
            }
        }
    }
}
