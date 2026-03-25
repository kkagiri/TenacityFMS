/**
 * File: EmployeeDocumentMappingProfile.cs
 * Purpose: Maps employee document entities into API DTOs.
 * Dependencies: AutoMapper, EmployeeDocument, EmployeeDocumentDto
 * Last Modified: 2026-03-25
 */
using AutoMapper;
using FMS.Application.Features.Employee.DTOs;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile;

public class EmployeeDocumentMappingProfile : Profile
{
    public EmployeeDocumentMappingProfile()
    {
        CreateMap<EmployeeDocument, EmployeeDocumentDto>()
            .ForMember(destination => destination.EmployeeName, option => option.MapFrom(source => source.Employee.FullName))
            .ForMember(destination => destination.EmployeeWorkNo, option => option.MapFrom(source => source.Employee.EmployeeWorkNo ?? string.Empty))
            .ForMember(destination => destination.DocumentTypeName, option => option.MapFrom(source => source.DocumentType.ToString()))
            .ForMember(destination => destination.DaysUntilExpiry, option => option.MapFrom(source => source.DaysUntilExpiry));
    }
}