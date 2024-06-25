using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using FMS.Persistence.Repositories.FuelDispensing.Common;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Persistence.Repositories.FuelDispensing
{
    public class TagRepository : ITagRepository
    {

        private readonly GpsdataContext _context;

        public TagRepository(GpsdataContext context)
        {
            _context = context;
        }
        public async Task<Tag> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.Tags.FindAsync(new object[] { id }, cancellationToken);
        }

        public async Task<Tag> GetByNameAsync(string name, CancellationToken cancellationToken = default)
        {
            return await _context.Tags.FirstOrDefaultAsync(t => t.Name == name, cancellationToken);
        }

        public async Task<IEnumerable<Tag>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.Tags.ToListAsync(cancellationToken);
        }

        public async Task<Tag> AddAsync(Tag tag, CancellationToken cancellationToken = default)
        {
            var addedTag = await _context.Tags.AddAsync(tag, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return addedTag.Entity;
        }

        public async Task<Tag> UpdateAsync(Tag tag, CancellationToken cancellationToken = default)
        {
            var updatedTag = _context.Tags.Update(tag);
            await _context.SaveChangesAsync(cancellationToken);
            return updatedTag.Entity;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var tag = await _context.Tags.FindAsync(new object[] { id }, cancellationToken);
            if (tag == null)
                return false;

            _context.Tags.Remove(tag);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
