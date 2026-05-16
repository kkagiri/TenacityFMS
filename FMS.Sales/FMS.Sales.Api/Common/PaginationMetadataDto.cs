namespace FMS.Sales.Api.Common
{
    public sealed record PaginationMetadataDto(
        int TotalCount,
        int PageNumber,
        int PageSize,
        int TotalPages,
        bool HasPrevious,
        bool HasNext);
}
