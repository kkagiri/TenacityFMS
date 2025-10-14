import React, { useState, useEffect } from 'react';
import { Popup, Button, TagBox, LoadIndicator } from 'devextreme-react';
import notify from 'devextreme/ui/notify';
import dashboardService from '../../../services/dashboardService';

/**
 * ShareWidgetModal - Modal for sharing widgets with other users
 *
 * Features:
 * - Select multiple users to share with
 * - Visual feedback for shared status
 * - Prevents sharing with self
 * - Shows success/failure results
 *
 * @param {boolean} visible - Modal visibility
 * @param {function} onHiding - Callback when modal closes
 * @param {number} widgetInstanceId - Widget ID to share
 * @param {string} widgetName - Widget name for display
 */
const ShareWidgetModal = ({ visible, onHiding, widgetInstanceId, widgetName }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [sharedWithUsers, setSharedWithUsers] = useState([]);
  const [loadingShares, setLoadingShares] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getUsersForSharing();
      setUsers(response);
    } catch (error) {
      console.error('Failed to load users:', error);
      notify('Failed to load users', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const loadSharedUsers = async () => {
    try {
      setLoadingShares(true);
      const response = await dashboardService.getWidgetShares(widgetInstanceId);

      if (response?.isSuccess && response?.result) {
        setSharedWithUsers(response.result);
      }
    } catch (error) {
      console.error('Failed to load shared users:', error);
    } finally {
      setLoadingShares(false);
    }
  };  // Load available users and existing shares
  useEffect(() => {
    if (visible && widgetInstanceId) {
      loadUsers();
      loadSharedUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, widgetInstanceId]);

    const handleShare = async () => {
    if (!selectedUserIds || selectedUserIds.length === 0) {
      notify('Please select at least one user', 'warning', 3000);
      return;
    }

    try {
      setSharing(true);

      const response = await dashboardService.shareWidget(
        widgetInstanceId,
        selectedUserIds
      );

      if (response?.isSuccess) {
        const result = response.result;

        if (result.successCount > 0) {
          notify(
            `Widget shared successfully with ${result.successCount} user(s)`,
            'success',
            3000
          );
        }

        if (result.failures && result.failures.length > 0) {
          result.failures.forEach(failure => {
            notify(`Failed to share with ${failure.userId}: ${failure.reason}`, 'error', 5000);
          });
        }

        // Reload shares to show updated list
        await loadSharedUsers();

        // Clear selection
        setSelectedUserIds([]);

        // Close modal if all shares succeeded
        if (result.failureCount === 0) {
          setTimeout(() => {
            onHiding();
          }, 1500);
        }
      } else {
        notify(response?.message || 'Failed to share widget', 'error', 3000);
      }
    } catch (error) {
      console.error('Failed to share widget:', error);
      notify(
        error.response?.data?.message || 'Failed to share widget',
        'error',
        3000
      );
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveShare = async (sharedWithUserId, sharedWidgetInstanceId) => {
    try {
      const response = await dashboardService.unshareWidget(sharedWidgetInstanceId);

      if (response?.isSuccess) {
        notify('Share removed successfully', 'success', 2000);
        await loadSharedUsers();
      } else {
        notify(response?.message || 'Failed to remove share', 'error', 3000);
      }
    } catch (error) {
      console.error('Failed to remove share:', error);
      notify('Failed to remove share', 'error', 3000);
    }
  };

  // Filter out users who already have the widget shared
  const availableUsers = users.filter(
    user => !sharedWithUsers.some(shared => shared.userId === user.id)
  );

  return (
    <Popup
      visible={visible}
      onHiding={onHiding}
      title={`Share Widget: ${widgetName}`}
      width={600}
      height="auto"
      showCloseButton={true}
      dragEnabled={false}
    >
      <div className="tw-p-4">
        {/* Loading Indicator */}
        {(loading || loadingShares) && (
          <div className="tw-flex tw-justify-center tw-py-4">
            <LoadIndicator visible={true} />
          </div>
        )}

        {/* Already Shared With Section */}
        {!loadingShares && sharedWithUsers.length > 0 && (
          <div className="tw-mb-6">
            <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
              <i className="fa-light fa-users tw-mr-2"></i>
              Currently Shared With
            </h4>
            <div className="tw-space-y-2">
              {sharedWithUsers.map(share => (
                <div
                  key={share.sharedWidgetInstanceId}
                  className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg"
                >
                  <div className="tw-flex tw-items-center">
                    <i className="fa-light fa-user tw-mr-2 tw-text-blue-600"></i>
                    <div>
                      <div className="tw-font-medium tw-text-sm">{share.userDisplayName}</div>
                      <div className="tw-text-xs tw-text-gray-600">
                        Shared {new Date(share.sharedAt).toLocaleDateString()} •
                        {share.canEdit ? ' Can edit' : ' Read-only'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveShare(share.userId, share.sharedWidgetInstanceId)}
                    className="tw-text-red-600 hover:tw-text-red-700 tw-px-3 tw-py-1 tw-rounded tw-transition-colors"
                    title="Remove share"
                  >
                    <i className="fa-light fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share With New Users Section */}
        {!loading && (
          <div className="tw-mb-4">
            <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
              <i className="fa-light fa-share-nodes tw-mr-2"></i>
              Share With New Users
            </h4>

            {availableUsers.length === 0 ? (
              <div className="tw-text-center tw-py-4 tw-text-gray-500">
                <i className="fa-light fa-info-circle tw-mr-2"></i>
                {sharedWithUsers.length > 0
                  ? 'Widget is already shared with all available users'
                  : 'No users available to share with'}
              </div>
            ) : (
              <>
                <TagBox
                  dataSource={availableUsers}
                  displayExpr="displayName"
                  valueExpr="id"
                  value={selectedUserIds}
                  onValueChanged={(e) => setSelectedUserIds(e.value)}
                  placeholder="Select users to share with..."
                  searchEnabled={true}
                  showSelectionControls={true}
                  applyValueMode="useButtons"
                  stylingMode="outlined"
                  className="tw-mb-4"
                  itemRender={(item) => (
                    <div className="tw-py-1">
                      <div className="tw-font-medium">{item.displayName}</div>
                      {item.email && (
                        <div className="tw-text-xs tw-text-gray-600">{item.email}</div>
                      )}
                    </div>
                  )}
                />

                <div className="tw-flex tw-items-center tw-p-3 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-mb-4">
                  <i className="fa-light fa-info-circle tw-mr-2 tw-text-blue-600"></i>
                  <span className="tw-text-sm tw-text-gray-700">
                    Shared users can edit widget parameters but cannot delete the widget.
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
          <Button
            text="Cancel"
            onClick={onHiding}
            stylingMode="outlined"
            type="normal"
            disabled={sharing}
          />
          {availableUsers.length > 0 && (
            <Button
              text={sharing ? 'Sharing...' : 'Share Widget'}
              onClick={handleShare}
              stylingMode="contained"
              type="default"
              disabled={sharing || selectedUserIds.length === 0}
              icon={sharing ? undefined : 'share'}
            />
          )}
        </div>
      </div>
    </Popup>
  );
};

export default ShareWidgetModal;
