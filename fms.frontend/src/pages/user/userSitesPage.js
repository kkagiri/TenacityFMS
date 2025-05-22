import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
    fetchUserById,
    fetchAllSites,
    fetchUserSites,
    updateUserSites
} from '../../redux/actions/userActions';
import { Button } from 'devextreme-react/button';
import DataGrid, {
    Column,
    Paging,
    Pager,
    FilterRow,
    HeaderFilter,
    SearchPanel,
    Selection,
    Scrolling
} from 'devextreme-react/data-grid';
import TextBox from 'devextreme-react/text-box';
import LoadPanel from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import './userSitesPage.scss';

const UserSitesPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const user = useSelector(state => state.user.selectedUserDetails);
    const allSites = useSelector(state => state.user.allSites);
    const userSites = useSelector(state => state.user.userSites);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedSiteIds, setSelectedSiteIds] = useState([]);
    const [filteredSites, setFilteredSites] = useState([]);
    const [dataGridInstance, setDataGridInstance] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            // Check if necessary data is already in the store
            const userInStore = user && user.id === id; //Cursor
            const allSitesInStore = allSites && allSites.length > 0; //Cursor
            // Check if userSites is an array and contains data for the current user
            const userSitesInStore = Array.isArray(userSites) && userSites.length > 0 && userSites.every(site => site.userId === id || site.userId === undefined); // Assuming userSites in state is for the selected user or globally filtered

            if (userInStore && allSitesInStore && userSitesInStore) { //Cursor
                console.log(`Data for user ${id} and all sites already in store. Skipping fetch.`);
                setLoading(false);

            } else { //Cursor
                console.log(`Data for user ${id} or all sites not in store or incomplete. Fetching...`);
                setLoading(true);
                try {
                    const userData = await dispatch(fetchUserById(id));
                    await dispatch(fetchAllSites());
                    const userSitesData = await dispatch(fetchUserSites(id)) || [];

                    // Set initially selected sites
                    if (userSitesData && userSitesData.length > 0) {
                        const siteIds = userSitesData.map(site => site.id);
                        setSelectedSiteIds(siteIds);
                        console.log('Setting initial selected sites:', siteIds);
                    }
                } catch (error) {
                    notify(error.message, 'error', 3000);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadData();
    }, [dispatch, id]);

    useEffect(() => {
        if (!allSites || allSites.length === 0) {
            setFilteredSites([]);
            return;
        }

        if (searchText) {
            setFilteredSites(
                allSites.filter(
                    site =>
                        site.name.toLowerCase().includes(searchText.toLowerCase()) ||
                        (site.location && site.location.toLowerCase().includes(searchText.toLowerCase()))
                )
            );
        } else {
            setFilteredSites(allSites);
        }
    }, [allSites, searchText]);

    useEffect(() => {
        // After userSites are loaded and dataGridInstance is available
        // select the rows programmatically
        if (dataGridInstance && userSites && Array.isArray(userSites) && userSites.length > 0) {
            console.log('Selecting sites in grid:', userSites.map(site => site.id));
            dataGridInstance.selectRows(userSites.map(site => site.id), false);
        }
    }, [dataGridInstance, userSites]);

    const goBack = () => {
        navigate(`/users/${id}`);
    };

    const handleSearchChange = (e) => {
        setSearchText(e.value);
    };

    const handleSiteSelectionChanged = (e) => {
        setSelectedSiteIds(e.selectedRowKeys);
        console.log('Selected site IDs updated:', e.selectedRowKeys);
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            await dispatch(updateUserSites(id, selectedSiteIds));
            notify('Site assignments updated successfully', 'success', 3000);
        } catch (error) {
            notify(error.message, 'error', 3000);
        } finally {
            setSaving(false);
        }
    };

    const onGridInitialized = (e) => {
        setDataGridInstance(e.component);
    };

    if (loading) {
        return <LoadPanel visible={true} />;
    }

    if (!user) {
        return (
            <div className="user-not-found">
                <h2>User Not Found</h2>
                <p>The requested user could not be found.</p>
                <Button text="Back to Users" onClick={() => navigate('/users')} />
            </div>
        );
    }

    return (
        <div className="user-sites-container">
            <div className="header-container">
                <div className="back-button">
                    <Button
                        icon="chevronleft"
                        stylingMode="text"
                        onClick={goBack}
                    />
                    <h2>Manage User Sites</h2>
                </div>
            </div>

            <div className="sites-card">
                <div className="sites-header">
                    <h3>Site Access for {user.userName}</h3>
                    <p>Select which sites this user can access and manage</p>
                </div>

                <div className="sites-search">
                    <TextBox
                        placeholder="Search sites..."
                        mode="search"
                        value={searchText}
                        onValueChanged={handleSearchChange}
                        stylingMode="filled"
                        width="100%"
                    />
                </div>

                <div className="sites-grid">
                    <DataGrid
                        dataSource={filteredSites}
                        showBorders={true}
                        columnAutoWidth={true}
                        wordWrapEnabled={true}
                        hoverStateEnabled={true}
                        noDataText="No sites found matching the search criteria"
                        height="100%"
                        keyExpr="id"
                        onInitialized={onGridInitialized}
                        onSelectionChanged={handleSiteSelectionChanged}
                    >
                        <Selection mode="multiple" selectAllMode="allPages" />
                        <SearchPanel visible={false} />
                        <FilterRow visible={true} />
                        <HeaderFilter visible={true} />
                        <Scrolling mode="virtual" />
                        <Paging defaultPageSize={20} />
                        <Pager
                            showPageSizeSelector={true}
                            allowedPageSizes={[10, 20, 50, 100]}
                            showInfo={true}
                        />

                        <Column dataField="name" caption="Site Name" />
                        <Column dataField="location" caption="Location" />
                        <Column dataField="status" caption="Status" />
                    </DataGrid>
                </div>

                <div className="sites-footer">
                    <div className="selected-count">
                        {selectedSiteIds.length} sites selected
                    </div>
                    <Button
                        text="Save Changes"
                        type="default"
                        icon="save"
                        onClick={handleSaveChanges}
                        disabled={saving}
                    />
                </div>
            </div>
        </div>
    );
};

export default UserSitesPage;