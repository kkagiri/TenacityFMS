/*
 * File:          SalesApplicationServiceCollectionExtensions.cs
 * Purpose:       Registers MediatR + FluentValidation handlers from the
 *                Sales.Application assembly.
 * Last Modified: 2026-04-29
 */
using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace FMS.Sales.Application;

public static class SalesApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddSalesApplication(this IServiceCollection services)
    {
        var assembly = typeof(SalesApplicationServiceCollectionExtensions).Assembly;
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
        services.AddValidatorsFromAssembly(assembly);
        return services;
    }
}
