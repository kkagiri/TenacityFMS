//using Microsoft.EntityFrameworkCore;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Reflection;

//namespace FMS.Persistence.EntityConfigurations
//{
//    /// <summary>
//    /// Extension methods for ModelBuilder
//    /// </summary>
//    public static class ModelBuilderExtensions
//    {
//        /// <summary>
//        /// Applies all entity configurations from the assembly
//        /// </summary>
//        /// <param name="modelBuilder">The model builder</param>
//        /// <param name="assembly">The assembly to scan for entity configurations</param>
//        public static void ApplyAllConfigurations(this ModelBuilder modelBuilder, Assembly assembly)
//        {
//            var applyGenericMethod = typeof(ModelBuilder).GetMethods()
//       .First(m => m.Name == nameof(ModelBuilder.ApplyConfiguration) && m.IsGenericMethod);

//            var configurationTypes = assembly.GetTypes()
//                .Where(t => !t.IsAbstract && !t.IsInterface && t.GetInterfaces()
//                    .Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEntityTypeConfiguration<>)))
//                .ToList();

//            // Apply one configuration at a time with detailed error handling
//            foreach (var configurationType in configurationTypes)
//            {
//                try
//                {
//                    Console.WriteLine($"Applying configuration: {configurationType.Name}");

//                    var entityType = configurationType.GetInterfaces()
//                        .First(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEntityTypeConfiguration<>))
//                        .GetGenericArguments()[0];

//                    var configuration = Activator.CreateInstance(configurationType);
//                    var genericMethod = applyGenericMethod.MakeGenericMethod(entityType);

//                    // Store the current model state
//                    try
//                    {
//                        genericMethod.Invoke(modelBuilder, new[] { configuration });
//                        Console.WriteLine($"Successfully applied configuration for {entityType.Name}");
//                    }
//                    catch (Exception ex)
//                    {
//                        var innerEx = ex.InnerException ?? ex;
//                        Console.WriteLine($"ERROR in {configurationType.Name} for entity {entityType.Name}: {innerEx.Message}");
//                        Console.WriteLine($"Stack trace: {innerEx.StackTrace}");
//                        throw new Exception($"Failed to apply configuration for {entityType.Name} using {configurationType.Name}", innerEx);
//                    }
//                }
//                catch (Exception ex)
//                {
//                    Console.WriteLine($"ERROR processing configuration type {configurationType.Name}: {ex.Message}");
//                    throw;
//                }
//            }
//        }
//    }
//}