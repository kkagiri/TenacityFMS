import user1 from '@/assets/images/users/user-1.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user6 from '@/assets/images/users/user-6.jpg'
import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'

const MessagesDropdown = () => {
  return (
    <div className="topbar-item hs-dropdown relative inline-flex [--auto-close:inside] [--placement:bottom-right]">
      <button className="topbar-link hs-dropdown-toggle relative flex items-center" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
        <Icon icon="mail" className="text-xl" />
        <span className="badge bg-success absolute -end-px -top-4 size-4 rounded-full text-white">7</span>
      </button>
      <div className="hs-dropdown-menu min-w-80 p-0 space-y-0" role="menu" aria-orientation="vertical" aria-labelledby="dropdown-menu">
        <div className="border-default-300 border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <h6 className="text-base font-semibold">Messages</h6>
            <Link to="" className="badge badge-label py-1.5 bg-success/15 text-success">
              09 Notifications
            </Link>
          </div>
        </div>
        <SimpleBar style={{ maxHeight: 300 }}>
          {messageData.map((message, idx) => (
            <div id={`message-${idx}`} className={cn('hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300 dropdown-item px-4.5 py-3 text-wrap', { 'active': idx === 0 })} key={idx}>
              <span className="flex gap-base">
                {message.image && (
                  <span className="shrink-0">
                    <img src={message.image} className="size-9 rounded-full" alt="User Avatar" />
                  </span>
                )}

                {message.icon && (
                  <span className="bg-info flex size-9 shrink-0 items-center justify-center rounded-full text-white">
                    <Icon icon={message.icon} className="text-xl" />
                  </span>
                )}
                <span className="text-default-400 grow">
                  <span className="text-body-color font-medium">{message.name}</span>
                  {message.action}
                  <span className="text-body-color font-medium">{message.context}</span>
                  <br />
                  <span className="text-xs">{message.time}</span>
                </span>
                <button type="button" className="text-default-400 btn btn-link shrink-0 p-0" data-hs-remove-element={`#message-${idx}`}>
                  <Icon icon="square-rounded-x" className="text-xl" />
                </button>
              </span>
            </div>
          ))}
        </SimpleBar>
        <Link to="" className="dropdown-item text-reset notify-item border-light justify-center border-t py-3 text-center font-bold underline underline-offset-2">
          Read All Messages
        </Link>
      </div>
    </div>
  )
}

export default MessagesDropdown

type MessageItemType = {
  name: string
  image?: string
  icon?: string
  action: string
  context: string
  time: string
  active?: boolean
}

const messageData: MessageItemType[] = [
  {
    name: 'Liam Carter',
    image: user1,
    action: 'uploaded a new document to',
    context: 'Project Phoenix',
    time: '5 minutes ago',
    active: true,
  },
  {
    name: 'Ava Mitchell',
    image: user2,
    action: 'commented on',
    context: 'Marketing Campaign Q3',
    time: '12 minutes ago',
  },
  {
    name: 'Noah Blake',
    icon: 'user-hexagon',
    action: 'updated the status of',
    context: 'Client Onboarding',
    time: '30 minutes ago',
  },
  {
    name: 'Sophia Taylor',
    image: user4,
    action: 'sent an invoice for',
    context: 'Service Renewal',
    time: '1 hour ago',
  },
  {
    name: 'Ethan Moore',
    image: user5,
    action: 'completed the task',
    context: 'UI Review',
    time: '2 hours ago',
  },
  {
    name: 'Olivia White',
    image: user6,
    action: 'assigned you a task in',
    context: 'Sales Pipeline',
    time: 'Yesterday',
  },
]
