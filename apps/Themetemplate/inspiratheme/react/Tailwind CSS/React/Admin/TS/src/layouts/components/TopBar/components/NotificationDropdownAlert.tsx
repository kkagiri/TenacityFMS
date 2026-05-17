import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'

const NotificationDropdown = () => {
  return (
    <div className="topbar-item hs-dropdown relative inline-flex [--auto-close:inside] [--placement:bottom-right]" id="notification-dropdown-alert">
      <button className="topbar-link hs-dropdown-toggle relative flex items-center" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
        <Icon icon="bell" className="text-xl" />
        <span className="badge bg-warning absolute -end-px -top-4 size-4 rounded text-white">12</span>
      </button>
      <div className="hs-dropdown-menu min-w-80 p-0 space-y-0" role="menu" aria-orientation="vertical" aria-labelledby="dropdown-menu">
        <div className="border-default-300 border-b px-3 py-2">
          <div className="flex items-center justify-between">
            <h6 className="text-base font-semibold">Notifications</h6>
            <Link to="" className="badge badge-label py-1.5 bg-light text-dark">
              12 Alerts
            </Link>
          </div>
        </div>
        <SimpleBar style={{ maxHeight: 300 }}>
          {notificationData.map((notification, idx) => (
            <div className="dropdown-item hs-removing:hidden items-start gap-3 px-4.5 py-3 text-wrap" id={`notification-${idx}`} key={idx}>
              <span className="shrink-0">
                <span className={cn('bg-danger/15 text-danger flex size-9 items-center justify-center rounded', notification.iconClassName)}>
                  <Icon icon={notification.icon} className="text-lg fill-danger" />
                </span>
              </span>
              <span className="text-default-400 grow">
                <span className="font-medium text-body-color">{notification.message}</span>
                <br />
                <span className="text-xs">{notification.time}</span>
              </span>
              <button type="button" className="text-default-400 btn btn-link shrink-0 p-0" data-hs-remove-element={`#notification-${idx}`}>
                <Icon icon="square-rounded-x" className="text-xl" />
              </button>
            </div>
          ))}
        </SimpleBar>

        <Link to="" className="dropdown-item text-reset border-light justify-center border-t py-3 font-bold underline underline-offset-2">
          View All Alerts
        </Link>
      </div>
    </div>
  )
}

export default NotificationDropdown

type NotificationType = {
  icon: string
  iconClassName: string
  message: string
  time: string
}

const notificationData: NotificationType[] = [
  {
    icon: 'server-bolt',
    iconClassName: 'bg-danger/15 text-danger',
    message: 'Critical alert: Server crash detected',
    time: '30 minutes ago',
  },
  {
    icon: 'alert-triangle',
    iconClassName: 'bg-warning/15 text-warning',
    message: 'High memory usage on Node A',
    time: '10 minutes ago',
  },
  {
    icon: 'circle-check',
    iconClassName: 'bg-success/15 text-success',
    message: 'Backup completed successfully',
    time: '1 hour ago',
  },
  {
    icon: 'user-plus',
    iconClassName: 'bg-primary/15 text-primary',
    message: 'New user registration: Sarah Miles',
    time: 'Just now',
  },
  {
    icon: 'bug',
    iconClassName: 'bg-danger/15 text-danger',
    message: 'Bug reported in payment module',
    time: '20 minutes ago',
  },
  {
    icon: 'message-circle',
    iconClassName: 'bg-info/15 text-info',
    message: 'New comment on Task #142',
    time: '15 minutes ago',
  },
  {
    icon: 'battery-charging',
    iconClassName: 'bg-warning/15 text-warning',
    message: 'Low battery on Device X',
    time: '45 minutes ago',
  },
  {
    icon: 'cloud-upload',
    iconClassName: 'bg-success/15 text-success',
    message: 'File upload completed',
    time: '1 hour ago',
  },
  {
    icon: 'calendar',
    iconClassName: 'bg-primary/15 text-primary',
    message: 'Team meeting scheduled at 3 PM',
    time: '2 hours ago',
  },
  {
    icon: 'download',
    iconClassName: 'bg-secondary/15 text-secondary',
    message: 'Report ready for download',
    time: '3 hours ago',
  },
  {
    icon: 'lock',
    iconClassName: 'bg-danger/15 text-danger',
    message: 'Multiple failed login attempts',
    time: '5 hours ago',
  },
  {
    icon: 'bell-ringing',
    iconClassName: 'bg-info/15 text-info',
    message: 'Reminder: Submit your timesheet',
    time: 'Today, 9:00 AM',
  },
]
