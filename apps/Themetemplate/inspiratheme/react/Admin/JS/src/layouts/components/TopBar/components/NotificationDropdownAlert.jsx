import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { useState } from 'react'
import { Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
import { Link } from 'react-router'
const notifications = [
  {
    id: 'notification-1',
    icon: 'server-bolt',
    bgClass: 'bg-danger-subtle text-danger',
    fillClass: 'fill-danger',
    message: 'Critical alert: Server crash detected',
    time: '30 minutes ago',
  },
  {
    id: 'notification-2',
    icon: 'alert-triangle',
    bgClass: 'bg-warning-subtle text-warning',
    fillClass: 'fill-warning',
    message: 'High memory usage on Node A',
    time: '10 minutes ago',
  },
  {
    id: 'notification-3',
    icon: 'circle-check',
    bgClass: 'bg-success-subtle text-success',
    fillClass: 'fill-success',
    message: 'Backup completed successfully',
    time: '1 hour ago',
  },
  {
    id: 'notification-4',
    icon: 'user-plus',
    bgClass: 'bg-primary-subtle text-primary',
    fillClass: 'fill-primary',
    message: 'New user registration: Sarah Miles',
    time: 'Just now',
  },
  {
    id: 'notification-5',
    icon: 'bug',
    bgClass: 'bg-danger-subtle text-danger',
    fillClass: 'fill-danger',
    message: 'Bug reported in payment module',
    time: '20 minutes ago',
  },
  {
    id: 'notification-6',
    icon: 'message-circle',
    bgClass: 'bg-info-subtle text-info',
    fillClass: 'fill-info',
    message: 'New comment on Task #142',
    time: '15 minutes ago',
  },
  {
    id: 'notification-7',
    icon: 'battery-charging',
    bgClass: 'bg-warning-subtle text-warning',
    fillClass: 'fill-warning',
    message: 'Low battery on Device X',
    time: '45 minutes ago',
  },
  {
    id: 'notification-8',
    icon: 'cloud-upload',
    bgClass: 'bg-success-subtle text-success',
    fillClass: 'fill-success',
    message: 'File upload completed',
    time: '1 hour ago',
  },
  {
    id: 'notification-9',
    icon: 'calendar',
    bgClass: 'bg-primary-subtle text-primary',
    fillClass: 'fill-primary',
    message: 'Team meeting scheduled at 3 PM',
    time: '2 hours ago',
  },
  {
    id: 'notification-10',
    icon: 'download',
    bgClass: 'bg-secondary-subtle text-secondary',
    fillClass: 'fill-secondary',
    message: 'Report ready for download',
    time: '3 hours ago',
  },
  {
    id: 'notification-11',
    icon: 'lock',
    bgClass: 'bg-danger-subtle text-danger',
    fillClass: 'fill-danger',
    message: 'Multiple failed login attempts',
    time: '5 hours ago',
  },
  {
    id: 'notification-12',
    icon: 'bell-ringing',
    bgClass: 'bg-info-subtle text-info',
    fillClass: 'fill-info',
    message: 'Reminder: Submit your timesheet',
    time: 'Today, 9:00 AM',
  },
]
const NotificationDropdown = () => {
  const [notificationList, setNotificationList] = useState(notifications)
  const handleDismissNotification = (id) => {
    setNotificationList((prev) => prev.filter((item) => item.id !== id))
  }
  return (
    <div id="notification-dropdown-alert" className="topbar-item">
      <Dropdown align="end">
        <DropdownToggle className="topbar-link drop-arrow-none" as="button">
          <span className="topbar-link-icon">
            <Icon icon="bell" className="animate-ring" />
          </span>
          <span className="badge badge-square text-bg-warning topbar-badge">{notificationList.length}</span>
        </DropdownToggle>

        <DropdownMenu className="p-0 dropdown-menu-end dropdown-menu-lg">
          <div className="px-3 py-2 border-bottom">
            <Row className="align-items-center">
              <Col>
                <h6 className="m-0 fs-md fw-semibold">Notifications</h6>
              </Col>
              <Col className="text-end">
                <Link to="" className="badge text-bg-light badge-label py-1">
                  {notificationList.length} Alerts
                </Link>
              </Col>
            </Row>
          </div>

          <SimpleBar
            style={{
              maxHeight: 300,
            }}
          >
            {notificationList.map((item) => (
              <DropdownItem key={item.id} className="notification-item py-2 text-wrap" id={item.id}>
                <span className="d-flex gap-2">
                  <span className="avatar-md flex-shrink-0">
                    <span className={`avatar-title ${item.bgClass} rounded`}>
                      <Icon icon={item.icon} className={`notification-item-icon ${item.fillClass}`} />
                    </span>
                  </span>
                  <span className="flex-grow-1 text-muted">
                    <span className="fw-medium text-body">{item.message}</span>
                    <br />
                    <span className="fs-xs">{item.time}</span>
                  </span>
                  <button
                    type="button"
                    className="flex-shrink-0 text-muted btn btn-link p-0"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDismissNotification(item.id)
                    }}
                  >
                    <Icon icon="square-rounded-x" className="fs-xxl" />
                  </button>
                </span>
              </DropdownItem>
            ))}
          </SimpleBar>

          <DropdownItem href="" className="text-center text-reset text-decoration-underline link-offset-2 fw-bold notify-item border-top border-light py-2">
            View All Alerts
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
export default NotificationDropdown
