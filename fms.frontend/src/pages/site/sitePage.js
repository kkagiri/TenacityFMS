import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Column,
  Selection,
  SearchPanel,
  HeaderFilter,
  Paging,
  Editing,
  Toolbar,
  Item as GridItem
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Toolbar as ToolbarComponent, Item } from 'devextreme-react/toolbar';
import { Popup } from 'devextreme-react/popup';
import { LoadPanel } from 'devextreme-react/load-panel';
import { Form, SimpleItem, RequiredRule, StringLengthRule } from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';
import { fetchSiteList, createSite, updateSite, deleteSite } from '../../redux/actions/siteActions';
import './sitePage.css';

const SitePage = () => {
  const dispatch = useDispatch();
  const { sites, loading, creating, updating, deleting, error } = useSelector(state => state.site);
  const { user } = useSelector(state => state.auth);

  // Get user roles from auth state
  const userRoles = user ? user.roles : [];

  console.log('User roles:', userRoles);
  const canCreateSite = userRoles.includes('Administrator') || userRoles.includes('SiteManager');
  const canEditSite = userRoles.includes('Administrator') || userRoles.includes('SiteManager');
  const canDeleteSite = userRoles.includes('Administrator');

  const [selectedSites, setSelectedSites] = useState([]);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [currentSite, setCurrentSite] = useState(null);

  useEffect(() => {
    dispatch(fetchSiteList());
  }, [dispatch]);

  const handleSelectionChanged = useCallback((e) => {
    setSelectedSites(e.selectedRowsData);
  }, []);

  const handleAddSite = () => {
    setEditMode(false);
    setFormData({ name: '' });
    setCurrentSite(null);
    setShowSiteForm(true);
  };

  const handleEditSite = () => {
    if (selectedSites.length === 1) {
      const site = selectedSites[0];
      setEditMode(true);
      setFormData({ name: site.name });
      setCurrentSite(site);
      setShowSiteForm(true);
    }
  };

  const handleDeleteSite = async () => {
    if (selectedSites.length === 1) {
      const site = selectedSites[0];
      if (window.confirm(`Are you sure you want to delete the site "${site.name}"?`)) {
        const result = await dispatch(deleteSite(site.id));
        if (result.success) {
          notify('Site deleted successfully', 'success', 3000);
          setSelectedSites([]);
        } else {
          notify(result.message || 'Failed to delete site', 'error', 5000);
        }
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      notify('Site name is required', 'error', 3000);
      return;
    }

    let result;
    if (editMode && currentSite) {
      result = await dispatch(updateSite(currentSite.id, formData));
    } else {
      result = await dispatch(createSite(formData));
    }

    if (result.success) {
      setShowSiteForm(false);
      setSelectedSites([]);
      notify(`Site ${editMode ? 'updated' : 'created'} successfully`, 'success', 3000);
    } else {
      if (result.validationErrors && result.validationErrors.length > 0) {
        notify(result.validationErrors.join(', '), 'error', 5000);
      } else {
        notify(result.message || `Failed to ${editMode ? 'update' : 'create'} site`, 'error', 5000);
      }
    }
  };

  const handleFormClose = () => {
    setShowSiteForm(false);
    setEditMode(false);
    setFormData({ name: '' });
    setCurrentSite(null);
  };

  const onValueChanged = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.dataField]: e.value
    }));
  };

  return (
    <div className="site-page tw-h-full tw-flex tw-flex-col tw-p-4">
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6 tw-flex-1">
        <ToolbarComponent className="tw-mb-4">
          <Item location="before">
            <div className="tw-text-2xl tw-font-semibold tw-text-gray-800">
              <i className="fas fa-building tw-mr-2 tw-text-blue-500"></i>
              Site Management
            </div>
          </Item>
          <Item location="after">
            <Button
              text="Add Site"
              icon="plus"
              onClick={handleAddSite}
              disabled={!canCreateSite}
              type="default"
              stylingMode="contained"
              className="tw-mr-2"
            />
          </Item>
          <Item location="after">
            <Button
              text="Edit Site"
              icon="edit"
              onClick={handleEditSite}
              disabled={!canEditSite || selectedSites.length !== 1}
              type="normal"
              className="tw-mr-2"
            />
          </Item>
          <Item location="after">
            <Button
              text="Delete Site"
              icon="trash"
              onClick={handleDeleteSite}
              disabled={!canDeleteSite || selectedSites.length !== 1}
              type="danger"
            />
          </Item>
        </ToolbarComponent>

        <DataGrid
          dataSource={sites}
          keyExpr="id"
          showBorders={true}
          showRowLines={true}
          columnAutoWidth={true}
          wordWrapEnabled={true}
          height="calc(100vh - 300px)"
          onSelectionChanged={handleSelectionChanged}
          loadPanel={{
            enabled: loading,
            text: 'Loading sites...'
          }}
        >
          <Selection mode="single" />
          <SearchPanel visible={true} width={250} placeholder="Search sites..." />
          <HeaderFilter visible={true} />
          <Paging enabled={true} pageSize={20} />

          <Column
            dataField="id"
            caption="ID"
            width={80}
            allowSorting={true}
          />
          <Column
            dataField="name"
            caption="Site Name"
            allowSorting={true}
            allowFiltering={true}
          />
          <Column
            caption="Actions"
            width={120}
            cellRender={(data) => (
              <div className="tw-flex tw-gap-2">
                <Button
                  icon="edit"
                  hint="Edit"
                  onClick={() => {
                    setSelectedSites([data.data]);
                    handleEditSite();
                  }}
                  disabled={!canEditSite}
                  stylingMode="text"
                  type="normal"
                />
                <Button
                  icon="trash"
                  hint="Delete"
                  onClick={() => {
                    setSelectedSites([data.data]);
                    handleDeleteSite();
                  }}
                  disabled={!canDeleteSite}
                  stylingMode="text"
                  type="danger"
                />
              </div>
            )}
          />
        </DataGrid>

        {/* Site Form Popup */}
        <Popup
          visible={showSiteForm}
          onHiding={handleFormClose}
          dragEnabled={false}
          closeOnOutsideClick={true}
          showTitle={true}
          title={editMode ? 'Edit Site' : 'Create New Site'}
          width={500}
          height={300}
          position={{ my: 'center', at: 'center', of: window }}
        >
          <form onSubmit={handleFormSubmit} className="tw-p-4">
            <Form
              formData={formData}
              onFieldDataChanged={onValueChanged}
              labelLocation="top"
              className="tw-mb-4"
            >
              <SimpleItem
                dataField="name"
                label={{ text: 'Site Name' }}
                editorType="dxTextBox"
                editorOptions={{
                  placeholder: 'Enter site name',
                  maxLength: 255
                }}
              >
                <RequiredRule message="Site name is required" />
                <StringLengthRule max={255} message="Site name must not exceed 255 characters" />
              </SimpleItem>
            </Form>

            <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6">
              <Button
                text="Cancel"
                onClick={handleFormClose}
                type="normal"
                stylingMode="outlined"
              />
              <Button
                text={editMode ? 'Update' : 'Create'}
                type="default"
                stylingMode="contained"
                useSubmitBehavior={true}
                disabled={creating || updating}
              />
            </div>
          </form>
        </Popup>

        {/* Loading Panel */}
        <LoadPanel
          visible={creating || updating || deleting}
          message={
            creating ? 'Creating site...' :
            updating ? 'Updating site...' :
            deleting ? 'Deleting site...' : ''
          }
          position={{ my: 'center', at: 'center', of: window }}
        />
      </div>
    </div>
  );
};

export default SitePage;