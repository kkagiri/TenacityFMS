using System.Threading;
using System.Threading.Tasks;

namespace FMS.Sales.Api.Services.Invoicing
{
    public interface IInvoicePdfRenderer
    {
        Task<byte[]> RenderAsync(InvoicePdfModel model, CancellationToken cancellationToken);
    }
}
