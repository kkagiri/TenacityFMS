import React, { useState, useEffect, useCallback } from 'react';
import DataGrid, {
  Column,
  Editing,
  Lookup,
  Paging,
  FilterRow,
  HeaderFilter,
  Selection,
  Toolbar,
  Item as ToolbarItem
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import { getSiteTagConfigurations, updateSiteTagConfiguration, getGpsGateTags } from '../../../api/siteTagApi';
import { usePermissions } from '../../../hooks/usePermissions';

/**
 * GPSGate Tag Management Component
 * Allows administrators to configure GPSGate tag assignments for each site
 */
const GpsGateTagManagement = () => {
  const [sites, setSites] = useState([]);
  const [gpsGateTags, setGpsGateTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission('_Update_Site') || hasPermission('_Admin');

  // Fetch data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch both site configurations and GPSGate tags in parallel
      const [sitesResult, tagsResult] = await Promise.all([
        getSiteTagConfigurations(),
        getGpsGateTags()
      ]);

      if (sitesResult?.data) {
        setSites(sitesResult.data);
      } else if (Array.isArray(sitesResult)) {
        setSites(sitesResult);
      }

      if (tagsResult?.data) {
        setGpsGateTags(tagsResult.data);
      } else if (Array.isArray(tagsResult)) {
        setGpsGateTags(tagsResult);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      notify({
        message: 'Failed to load site tag configurations',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRowUpdated = useCallback(async (e) => {
    setSaving(true);
    try {
      const result = await updateSiteTagConfiguration(e.data.siteId, {
        gpsGateTagId: e.data.gpsGateTagId,
        gpsGateTagName: e.data.gpsGateTagName,
        autoUpdateGpsGateTag: e.data.autoUpdateGpsGateTag
      });

      if (result?.isSuccess) {
        notify({
          message: result.message || 'Site tag configuration updated successfully',
          type: 'success',
          displayTime: 3000
        });
      } else {
        notify({
          message: result?.message || 'Failed to update site tag configuration',
          type: 'error',
          displayTime: 3000
        });
        // Reload data to reset the grid
        await loadData();
      }
    } catch (error) {
      console.error('Error updating site tag:', error);
      notify({
        message: 'Failed to update site tag configuration',
        type: 'error',
        displayTime: 3000
      });
      // Reload data to reset the grid
      await loadData();
    } finally {
      setSaving(false);
    }
  }, []);

  // When tag selection changes, auto-populate the tag name
  const handleEditorPreparing = useCallback((e) => {
    if (e.dataField === 'gpsGateTagId' && e.parentType === 'dataRow') {
      e.editorOptions.onValueChanged = (args) => {
        const selectedTag = gpsGateTags.find(t => t.id === args.value);
        e.setValue(args.value);

        // Update the tag name in the row data
        if (selectedTag) {
          e.row.data.gpsGateTagName = selectedTag.name;
        } else {
          e.row.data.gpsGateTagName = null;
        }
      };
    }
  }, [gpsGateTags]);

  const renderTagCell = useCallback((cellData) => {
    const tag = gpsGateTags.find(t => t.id === cellData.value);
    if (tag) {
      return (
        <div className="tw-flex tw-items-center tw-gap-2">
          {tag.color && (
            <span
              className="tw-w-3 tw-h-3 tw-rounded-full tw-inline-block"
              style={{ backgroundColor: tag.color }}
            />
          )}
          <span>{tag.name}</span>
        </div>
      );
    }
    return <span className="tw-text-gray-400 tw-italic">Not configured</span>;
  }, [gpsGateTags]);

  const renderAutoUpdateCell = useCallback((cellData) => {
    return (
      <div className="tw-flex tw-items-center tw-justify-center">
        {cellData.value ? (
          <span className="tw-bg-green-100 tw-text-green-800 tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
            <i className="fa-light fa-check tw-mr-1"></i>
            Enabled
          </span>
        ) : (
          <span className="tw-bg-gray-100 tw-text-gray-600 tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
            <i className="fa-light fa-times tw-mr-1"></i>
            Disabled
          </span>
        )}
      </div>
    );
  }, []);

  const renderStatusCell = useCallback((cellData) => {
    return (
      <div className="tw-flex tw-items-center tw-justify-center">
        {cellData.value ? (
          <span className="tw-bg-blue-100 tw-text-blue-800 tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
            Active
          </span>
        ) : (
          <span className="tw-bg-red-100 tw-text-red-800 tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
            Inactive
          </span>
        )}
      </div>
    );
  }, []);

  return (
    <div className="tw-p-6">
      <LoadPanel
        visible={loading || saving}
        message={saving ? 'Saving...' : 'Loading...'}
        shadingColor="rgba(0,0,0,0.4)"
      />

      {/* Header */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6 tw-mb-6">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800">
              <i className="fa-light fa-tags tw-mr-3 tw-text-blue-600"></i>
              GPSGate Tag Configuration
            </h2>
            <p className="tw-text-gray-600 tw-mt-1">
              Configure GPSGate tag assignments for each site. When vehicles are transferred,
              they will automatically be moved to the destination site's tag.
            </p>
          </div>
          <Button
            icon="refresh"
            text="Refresh"
            onClick={loadData}
            disabled={loading}
          />
        </div>

        {/* Info Card */}
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-mb-4">
          <div className="tw-flex tw-items-start">
            <i className="fa-light fa-circle-info tw-text-blue-600 tw-mt-1 tw-mr-3"></i>
            <div>
              <h4 className="tw-font-semibold tw-text-blue-800 tw-mb-1">How it works</h4>
              <ul className="tw-text-sm tw-text-blue-700 tw-space-y-1">
                <li>• Each site can be linked to a GPSGate tag for vehicle tracking</li>
                <li>• When a vehicle transfer is completed, the system automatically updates the vehicle's GPSGate tag</li>
                <li>• The vehicle is added to the destination site's tag and removed from the source site's tag</li>
                <li>• Toggle "Auto Update" to enable/disable automatic tag updates for each site</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <DataGrid
          dataSource={sites}
          keyExpr="siteId"
          showBorders={true}
          columnAutoWidth={true}
          rowAlternationEnabled={true}
          allowColumnResizing={true}
          onRowUpdated={handleRowUpdated}
          onEditorPreparing={handleEditorPreparing}
        >
          <FilterRow visible={true} />
          <HeaderFilter visible={true} />
          <Paging defaultPageSize={20} />
          <Selection mode="none" />

          <Editing
            mode="row"
            allowUpdating={canEdit}
            allowAdding={false}
            allowDeleting={false}
          />

          <Column
            dataField="siteName"
            caption="Site"
            allowEditing={false}
            width={200}
          />

          <Column
            dataField="isActive"
            caption="Status"
            allowEditing={false}
            width={100}
            cellRender={renderStatusCell}
          />

          <Column
            dataField="gpsGateTagId"
            caption="GPSGate Tag"
            width={250}
            cellRender={renderTagCell}
          >
            <Lookup
              dataSource={gpsGateTags}
              valueExpr="id"
              displayExpr="name"
              allowClearing={true}
            />
          </Column>

          <Column
            dataField="gpsGateTagName"
            caption="Tag Name"
            visible={false}
          />

          <Column
            dataField="autoUpdateGpsGateTag"
            caption="Auto Update"
            dataType="boolean"
            width={150}
            cellRender={renderAutoUpdateCell}
          />

          <Toolbar>
            <ToolbarItem location="before">
              <div className="tw-text-sm tw-text-gray-500">
                <i className="fa-light fa-building tw-mr-2"></i>
                {sites.length} sites configured
              </div>
            </ToolbarItem>
            <ToolbarItem location="after">
              <div className="tw-text-sm tw-text-gray-500">
                <i className="fa-light fa-tag tw-mr-2"></i>
                {gpsGateTags.length} GPSGate tags available
              </div>
            </ToolbarItem>
          </Toolbar>
        </DataGrid>

        {/* Legend */}
        <div className="tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-200">
          <h4 className="tw-text-sm tw-font-semibold tw-text-gray-600 tw-mb-2">Legend</h4>
          <div className="tw-flex tw-flex-wrap tw-gap-4 tw-text-sm">
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-bg-green-100 tw-text-green-800 tw-px-2 tw-py-1 tw-rounded-full tw-text-xs">
                <i className="fa-light fa-check tw-mr-1"></i>Enabled
              </span>
              <span className="tw-text-gray-600">Auto-update GPSGate tags on transfer</span>
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-bg-gray-100 tw-text-gray-600 tw-px-2 tw-py-1 tw-rounded-full tw-text-xs">
                <i className="fa-light fa-times tw-mr-1"></i>Disabled
              </span>
              <span className="tw-text-gray-600">Skip tag updates for this site</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GpsGateTagManagement;
