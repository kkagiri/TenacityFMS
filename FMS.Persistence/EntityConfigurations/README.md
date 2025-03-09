# Entity Framework Core Fluent API Configurations

This directory contains the Entity Framework Core Fluent API configurations for the FMS application. The Fluent API is used to configure the database schema, relationships, and constraints for the entities in the application.

## Structure

- `EntityTypeConfiguration<TEntity>`: Base abstract class for entity configurations
- `IEntityTypeConfiguration<TEntity>`: Interface for entity configurations
- `ModelBuilderExtensions`: Extension methods for ModelBuilder to register all entity configurations

## How to Use

### Creating a New Entity Configuration

1. Create a new class in the `FMS.Persistence/EntityConfigurations` directory
2. Inherit from `EntityTypeConfiguration<TEntity>` where `TEntity` is the entity you want to configure
3. Override the `Configure` method to configure the entity

Example:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class MyEntityConfiguration : EntityTypeConfiguration<MyEntity>
    {
        public override void Configure(EntityTypeBuilder<MyEntity> builder)
        {
            // Configure the entity
            builder.HasKey(e => e.Id);

            builder.ToTable("my_entity");

            // Configure properties
            builder.Property(e => e.Name)
                .HasMaxLength(100)
                .IsRequired();

            // Configure relationships
            builder.HasOne(e => e.RelatedEntity)
                .WithMany(r => r.MyEntities)
                .HasForeignKey(e => e.RelatedEntityId);
        }
    }
}
```

### Common Fluent API Configurations

#### Table Configuration

```csharp
builder.ToTable("table_name");
```

#### Primary Key Configuration

```csharp
builder.HasKey(e => e.Id);
// Composite key
builder.HasKey(e => new { e.Id1, e.Id2 });
```

#### Property Configuration

```csharp
builder.Property(e => e.Name)
    .HasMaxLength(100)
    .IsRequired();

builder.Property(e => e.Price)
    .HasColumnType("decimal(18,2)");

builder.Property(e => e.CreatedAt)
    .HasDefaultValueSql("CURRENT_TIMESTAMP");
```

#### Relationship Configuration

```csharp
// One-to-Many
builder.HasOne(e => e.Parent)
    .WithMany(p => p.Children)
    .HasForeignKey(e => e.ParentId);

// One-to-One
builder.HasOne(e => e.Profile)
    .WithOne(p => p.User)
    .HasForeignKey<Profile>(p => p.UserId);

// Many-to-Many
builder.HasMany(e => e.Categories)
    .WithMany(c => c.Products)
    .UsingEntity<Dictionary<string, object>>(
        "ProductCategory",
        j => j.HasOne<Category>().WithMany().HasForeignKey("CategoryId"),
        j => j.HasOne<Product>().WithMany().HasForeignKey("ProductId"),
        j => j.ToTable("product_category"));
```

#### Indexes

```csharp
builder.HasIndex(e => e.Email).IsUnique();
builder.HasIndex(e => new { e.FirstName, e.LastName });
```

## Benefits of Using Fluent API

- More control over the database schema than using Data Annotations
- Separation of concerns: entity configuration is separate from the entity definition
- Better organization of code
- Easier to maintain and extend
- Better support for complex configurations and relationships

## References

- [Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core/)
- [Fluent API - EF Core](https://docs.microsoft.com/en-us/ef/core/modeling/)
