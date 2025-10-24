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

        public bool DeleteFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath))
            {
                return false;
            }

            var physicalPath = Path.Combine(_hostingEnvironment.ContentRootPath, "wwwroot", filePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

            if (!File.Exists(physicalPath))
            {
                return false;
            }
            try
            {
                File.Delete(physicalPath);
                return true;
            }
            catch (Exception)
            {
                // TODO: Log exception
                return false;
            }
        }

        public async Task<string> UploadFileAsync(IFormFile file, string uploadDirectory)
        {
            if (file == null || file.Length == 0)
            {
                return null;
            }

            string uploadsFolderPath = Path.Combine(_hostingEnvironment.ContentRootPath, "wwwroot", uploadDirectory);
            if (!Directory.Exists(uploadsFolderPath))
            {
                Directory.CreateDirectory(uploadsFolderPath);
            }

            string fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            string filePath = Path.Combine(uploadsFolderPath, fileName);

            using (FileStream stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Path.Combine(uploadDirectory, fileName).Replace("\\", "/");
        }
    }
}
