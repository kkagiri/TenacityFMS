using FMS.Application.CommonInterface;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using System;
using System.IO;
using System.Threading.Tasks;

namespace FMS.Infrastructure.Services
{
    public class FileHandlingService : IFileHandlingService
    {
        private readonly IHostEnvironment _hostingEnvironment;

        public FileHandlingService(IHostEnvironment hostingEnvironment)
        {
            _hostingEnvironment = hostingEnvironment;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string uploadDirectory)
        {
            if (file == null || file.Length == 0)
            {
                return null;
            }

            var uploadsFolderPath = Path.Combine(_hostingEnvironment.ContentRootPath, "wwwroot", uploadDirectory);
            if (!Directory.Exists(uploadsFolderPath))
            {
                Directory.CreateDirectory(uploadsFolderPath);
            }

            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsFolderPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/{uploadDirectory}/{fileName}";
        }
    }
}
