import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import UserList from '../../components/Users/UserList/userList';
import UserDetails from '../../components/Users/UserDetails/userDetails';
import { Item, Toolbar } from 'devextreme-react/toolbar';
import Button from 'devextreme-react/button';
import { fetchUsers, setSelectedUser } from '../../redux/actions/userActions';
import './userPage.scss';

const UserPage = () => {
    const dispatch = useDispatch();
    const users = useSelector((state) => state.user.users);
    const selectedUser = useSelector((state) => state.user.selectedUser);

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    const handleUserSelection = (user) => {
        dispatch(setSelectedUser(user));
    };

    return (
        <div>
            <div className='view-wrapper view-wrapper-user-page'>
                <div className='view-container'>
                    <Toolbar className='toolbar-details theme-dependent' style={{padding: "10px"}}>
                        <Item location='before'>
                            <h2 style={{marginLeft: "20px"}}>Users</h2>
                        </Item>
                        <Item location='after' locateInMenu='auto'>
                            <Button
                                text='Add User'
                                type='default'
                                stylingMode='contained'
                            />
                        </Item>
                        <Item
                            location='after'
                            locateInMenu='auto'
                            widget='dxButton'
                            showText='inMenu'
                        >
                            <Button
                                text="Refresh"
                                icon="refresh"
                                stylingMode="text"
                                onClick={() => dispatch(fetchUsers())}
                            />
                        </Item>
                    </Toolbar>
                </div>
                <div className='content content-block'>
                    <div className='panels'>
                        <div className='left'>
                            <UserList users={users} onUserSelect={handleUserSelection} />
                        </div>
                        <div className='right'>
                            {selectedUser && <UserDetails userId={selectedUser.id} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserPage;
