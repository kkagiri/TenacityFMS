import User1 from '@/assets/images/users/user-1.jpg'
import User2 from '@/assets/images/users/user-2.jpg'
import User4 from '@/assets/images/users/user-4.jpg'
import User5 from '@/assets/images/users/user-5.jpg'
import User6 from '@/assets/images/users/user-6.jpg'
import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import clsx from 'clsx'
import { useState } from 'react'
import { Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
import { Link } from 'react-router'
const messages = [
  {
    id: 'message-1',
    name: 'Liam Carter',
    message: 'uploaded a new document to',
    project: 'Project Phoenix',
    time: '5 minutes ago',
    avatarType: 'image',
    avatar: User1,
    active: true,
  },
  {
    id: 'message-2',
    name: 'Ava Mitchell',
    message: 'commented on',
    project: 'Marketing Campaign Q3',
    time: '12 minutes ago',
    avatarType: 'image',
    avatar: User2,
  },
  {
    id: 'message-3',
    name: 'Noah Blake',
    message: 'updated the status of',
    project: 'Client Onboarding',
    time: '30 minutes ago',
    avatarType: 'icon',
    icon: 'user-hexagon',
    avatarBg: 'text-bg-info',
  },
  {
    id: 'message-4',
    name: 'Sophia Taylor',
    message: 'sent an invoice for',
    project: 'Service Renewal',
    time: '1 hour ago',
    avatarType: 'image',
    avatar: User4,
  },
  {
    id: 'message-5',
    name: 'Ethan Moore',
    message: 'completed the task',
    project: 'UI Review',
    time: '2 hours ago',
    avatarType: 'image',
    avatar: User5,
  },
  {
    id: 'message-6',
    name: 'Olivia White',
    message: 'assigned you a task in',
    project: 'Sales Pipeline',
    time: 'Yesterday',
    avatarType: 'image',
    avatar: User6,
  },
]
const MessagesDropdown = () => {
  const [messagesList, setMessagesList] = useState(messages)
  const handleDismissMessage = (messageId) => {
    setMessagesList((prev) => prev.filter((msg) => msg.id !== messageId))
  }
  return (
    <div id="simple-messages-dropdown" className="topbar-item">
      <Dropdown align="end">
        <DropdownToggle as="button" className="topbar-link drop-arrow-none" type="button">
          <span className="topbar-link-icon">
            <Icon icon="mail" />
          </span>
          <span className="badge text-bg-success badge-circle topbar-badge">{messagesList.length}</span>
        </DropdownToggle>

        <DropdownMenu className="p-0 dropdown-menu-end dropdown-menu-lg">
          <div className="px-3 py-2 border-bottom">
            <Row className="align-items-center">
              <Col>
                <h6 className="m-0 fs-md fw-semibold">Messages</h6>
              </Col>
              <Col className="text-end">
                <Link to="" className="badge badge-soft-success badge-label py-1">
                  {String(messagesList.length).padStart(2, '0')} Notifications
                </Link>
              </Col>
            </Row>
          </div>

          <SimpleBar
            style={{
              maxHeight: 300,
            }}
          >
            {messagesList.map((msg) => (
              <DropdownItem key={msg.id} id={msg.id} className={clsx('notification-item py-2 text-wrap', msg.active ? 'active' : '')}>
                <span className="d-flex gap-3">
                  {msg.avatarType === 'image' && msg.avatar ? (
                    <span className="flex-shrink-0">
                      <img src={msg.avatar} alt={`${msg.name} Avatar`} className="avatar-md rounded-circle" width={48} height={48} />
                    </span>
                  ) : (
                    <span className="avatar-md flex-shrink-0">
                      <span className={`avatar-title ${msg.avatarBg} rounded-circle fs-22`}>
                        <Icon icon={msg.icon ?? ''} className="fs-22" />
                      </span>
                    </span>
                  )}

                  <span className="flex-grow-1 text-muted">
                    <span className="fw-medium text-body">{msg.name}</span> {msg.message}
                    <span className="fw-medium text-body">{msg.project}</span>
                    <br />
                    <span className="fs-xs">{msg.time}</span>
                  </span>

                  <button
                    className="flex-shrink-0 text-muted btn btn-link p-0"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDismissMessage(msg.id)
                    }}
                  >
                    <Icon icon="square-rounded-x" className="fs-xxl" />
                  </button>
                </span>
              </DropdownItem>
            ))}
          </SimpleBar>

          <DropdownItem href="" className="text-center text-reset text-decoration-underline link-offset-2 fw-bold notify-item border-top border-light py-2">
            Read All Messages
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
export default MessagesDropdown
