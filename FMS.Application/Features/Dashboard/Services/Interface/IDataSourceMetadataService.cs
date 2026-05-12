using System.Collections.Generic;

namespace FMS.Application.Services.Dashboard {
    public interface IDataSourceMetadataService {
        DataSourceMetadata GetMetadata (string dataSource);
        IEnumerable<KeyValuePair<string, DataSourceMetadata>> GetAll ();
    }
}