using System.Collections.Generic;
using FMS.Application.Services.Dashboard;

namespace FMS.Application.Features.Dashboard.Dtos {
    public class DataSourceCatalogDto {
        public List<DataSourceCatalogItemDto> Items { get; set; } = new List<DataSourceCatalogItemDto> ();
        public int Count { get; set; }
    }

    public class DataSourceCatalogItemDto {
        public string Id { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public DataSourceMetadata Metadata { get; set; } = new DataSourceMetadata ();

        public DataSourceCatalogItemDto () { }

        public DataSourceCatalogItemDto (string id, string displayName, string category, DataSourceMetadata metadata) {
            Id = id;
            DisplayName = displayName;
            Category = category;
            Metadata = metadata;
        }
    }
}