import React from 'react';
import { List } from 'devextreme-react/list';
import './userList.scss';

const UserList = ({ users, onUserSelect }) => {
    const renderUserItem = (user) => {
        return (
            <div className="user-list-item">
                <div className="user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                </div>
            </div>
        );
    };

    return (
        <List
            dataSource={users}
            itemRender={renderUserItem}
            onItemClick={onUserSelect}
            className="users-list"
        />
    );
};

export default UserList;