using Microsoft.EntityFrameworkCore;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Interface for entity type configurations
    /// </summary>
    /// <typeparam name="TEntity">The entity type being configured</typeparam>
    public interface IEntityTypeConfiguration<TEntity> : Microsoft.EntityFrameworkCore.IEntityTypeConfiguration<TEntity>
        where TEntity : class
    {
    }
}