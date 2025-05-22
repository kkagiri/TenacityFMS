import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserById, updateUser } from '../../redux/actions/userActions';
import { Button } from 'devextreme-react/button';
import Form, {
    SimpleItem,
    GroupItem,
    ButtonItem,
    RequiredRule
} from 'devextreme-react/form';
import LoadPanel from 'devextreme-react/load-panel';
import Popup from 'devextreme-react/popup';
import notify from 'devextreme/ui/notify';
import './userEditPage.scss';

const UserEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const user = useSelector(state => state.user.selectedUserDetails);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPasswordPopup, setShowPasswordPopup] = useState(false);

    const formData = useRef({
        userName: '',
        email: '',
    });

    const passwordFormData = useRef({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const loadData = async () => {
            // Check if user data for this ID is already in the store
            const userInStore = user && user.id === id;

            if (userInStore) {
                console.log(`User data for ${id} already in store. Skipping fetch.`);
                formData.current = {
                    userName: user.userName || '',
                    email: user.email || '',
                };
                setLoading(false);
            } else {
                console.log(`User data for ${id} not in store. Fetching...`);
                setLoading(true);
                try {
                    const userData = await dispatch(fetchUserById(id));
                    if (userData) {
                        formData.current = {
                            userName: userData.userName || '',
                            email: userData.email || '',
                        };
                    }
                } catch (error) {
                    notify(error.message, 'error', 3000);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadData();
    }, [dispatch, id, user]);

    const goBack = () => {
        navigate('/users');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const result = e.validationGroup.validate();
        if (!result.isValid) return;

        setSaving(true);
        try {
            await dispatch(updateUser(id, formData.current));
            notify('User information updated successfully', 'success', 3000);
            goBack();
        } catch (error) {
            notify(error.message, 'error', 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        const result = e.validationGroup.validate();
        if (!result.isValid) return;

        if (passwordFormData.current.newPassword !== passwordFormData.current.confirmPassword) {
            notify('New password and confirmation do not match', 'error', 3000);
            return;
        }

        setSaving(true);
        try {
            await dispatch(updateUser(id, {
                password: passwordFormData.current.newPassword,
                currentPassword: passwordFormData.current.currentPassword
            }));
            notify('Password changed successfully', 'success', 3000);
            setShowPasswordPopup(false);

            // Reset password form
            passwordFormData.current = {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            };
        } catch (error) {
            notify(error.message, 'error', 3000);
        } finally {
            setSaving(false);
        }
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
        <div className="user-edit-container">
            <div className="header-container">
                <div className="back-button">
                    <Button
                        icon="chevronleft"
                        stylingMode="text"
                        onClick={goBack}
                    />
                    <h2>Edit User</h2>
                </div>
            </div>

            <div className="edit-card">
                <div className="form-container">
                    <Form
                        formData={formData.current}
                        labelMode="floating"
                        onFieldDataChanged={(e) => {
                            formData.current[e.dataField] = e.value;
                        }}
                        colCount={1}
                        width="100%"
                        className="compact-form"
                    >
                        <GroupItem>
                            <SimpleItem
                                dataField="userName"
                                editorType="dxTextBox"
                                editorOptions={{
                                    stylingMode: "filled"
                                }}
                                label={{ text: "Username" }}
                            >
                                <RequiredRule message="Username is required" />
                            </SimpleItem>

                            <SimpleItem
                                dataField="email"
                                editorType="dxTextBox"
                                editorOptions={{
                                    stylingMode: "filled"
                                }}
                                label={{ text: "Email" }}
                            >
                                <RequiredRule message="Email is required" />
                            </SimpleItem>
                        </GroupItem>

                        <ButtonItem
                            horizontalAlignment="left"
                            buttonOptions={{
                                text: "Change Password",
                                type: "normal",
                                onClick: () => setShowPasswordPopup(true)
                            }}
                        />

                        <ButtonItem
                            horizontalAlignment="right"
                            buttonOptions={{
                                text: "Save Changes",
                                type: "default",
                                useSubmitBehavior: true,
                                onClick: handleSave
                            }}
                        />
                    </Form>
                </div>
            </div>

            {/* Password Change Popup */}
            <Popup
                visible={showPasswordPopup}
                onHiding={() => setShowPasswordPopup(false)}
                title="Change Password"
                showCloseButton={true}
                width={400}
                height="auto"
            >
                <Form
                    formData={passwordFormData.current}
                    labelMode="floating"
                    onFieldDataChanged={(e) => {
                        passwordFormData.current[e.dataField] = e.value;
                    }}
                >
                    <GroupItem>
                        <SimpleItem
                            dataField="currentPassword"
                            editorType="dxTextBox"
                            editorOptions={{
                                stylingMode: "filled",
                                mode: "password"
                            }}
                            label={{ text: "Current Password" }}
                        >
                            <RequiredRule message="Current password is required" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="newPassword"
                            editorType="dxTextBox"
                            editorOptions={{
                                stylingMode: "filled",
                                mode: "password"
                            }}
                            label={{ text: "New Password" }}
                        >
                            <RequiredRule message="New password is required" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="confirmPassword"
                            editorType="dxTextBox"
                            editorOptions={{
                                stylingMode: "filled",
                                mode: "password"
                            }}
                            label={{ text: "Confirm New Password" }}
                        >
                            <RequiredRule message="Password confirmation is required" />
                        </SimpleItem>
                    </GroupItem>

                    <ButtonItem
                        horizontalAlignment="right"
                        buttonOptions={{
                            text: "Change Password",
                            type: "default",
                            useSubmitBehavior: true,
                            onClick: handleChangePassword
                        }}
                    />
                </Form>
            </Popup>
        </div>
    );
};

export default UserEditPage;