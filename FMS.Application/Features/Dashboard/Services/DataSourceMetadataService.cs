using System.Collections.Generic;

namespace FMS.Application.Services.Dashboard {
    public class DataSourceMetadataService : IDataSourceMetadataService {
        public DataSourceMetadata GetMetadata (string dataSource) {
            // Reuse DataSourceManager's metadata via static accessor to avoid constructing dependencies
            return DataSourceManager.GetMetadataStatic (dataSource);
        }

        public IEnumerable<KeyValuePair<string, DataSourceMetadata>> GetAll () {
            return DataSourceManager.GetAllMetadataStatic ();
        }
    }
}