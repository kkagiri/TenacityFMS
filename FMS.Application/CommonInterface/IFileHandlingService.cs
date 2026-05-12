using Microsoft.AspNetCore.Http;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.CommonInterface
{
    public interface IFileHandlingService
    {
        Task<string> UploadFileAsync(IFormFile file, string uploadDirectory);
        bool DeleteFile(string filePath);
        Task<byte[]?> ReadFileAsync(string filePath, CancellationToken cancellationToken = default);
    }
}
