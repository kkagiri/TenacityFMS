import Icon from '@/components/wrappers/Icon'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const ChatToolbar = () => {
  return (
    <>
      <div className="d-flex align-items-center gap-1">
        <button className="btn btn-default btn-icon">
          <Icon icon="video" className="fs-lg" />
        </button>

        <button className="btn btn-default btn-icon">
          <Icon icon="phone-call" className="fs-lg" />
        </button>

        <Dropdown align="end">
          <DropdownToggle as="button" className="btn btn-default btn-icon drop-arrow-none">
            <Icon icon="dots-vertical" className="fs-lg" />
          </DropdownToggle>

          <DropdownMenu>
            <DropdownItem>
              <Icon icon="user" className="me-2" /> View Profile
            </DropdownItem>
            <DropdownItem>
              <Icon icon="bell-off" className="me-2" /> Mute Notifications
            </DropdownItem>
            <DropdownItem>
              <Icon icon="trash" className="me-2" /> Delete Chat
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  )
}

export default ChatToolbar
