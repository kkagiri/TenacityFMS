using FMS.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Persistence.Repositories.FuelDispensing.Common
{
    public interface ITagRepository
    {
        Task<Tag> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<Tag> GetByNameAsync(string name, CancellationToken cancellationToken = default);
        Task<IEnumerable<Tag>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<Tag> AddAsync(Tag tag, CancellationToken cancellationToken = default);
        Task<Tag> UpdateAsync(Tag tag, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    }
}
