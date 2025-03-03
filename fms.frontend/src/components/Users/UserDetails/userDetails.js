import UserActivityLog from '../UserActivityLog/userActivityLog';

const UserDetails = ({ userId }) => {
    return (
        <div className="user-details">
            {/* Other user details components */}

            <div className="activity-section">
                <h3>Activity History</h3>
                <UserActivityLog userId={userId} />
            </div>
        </div>
    );
};