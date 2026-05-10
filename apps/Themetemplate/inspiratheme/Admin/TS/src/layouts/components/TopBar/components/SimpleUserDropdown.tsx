import User1 from '@/assets/images/users/user-1.jpg'
import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'
import { Dropdown, DropdownDivider, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const UserDropdown = () => {
  return (
    <div id="simple-user-dropdown" className="topbar-item nav-user">
      <Dropdown>
        <DropdownToggle className="topbar-link drop-arrow-none" type="button">
          <img src={User1} width={32} className="rounded-circle me-lg-2 d-flex" alt="user-image" />
          <div className="d-lg-flex align-items-center gap-1 d-none">
            <h5 className="my-0">{META_DATA.username}</h5>
            <Icon icon="chevron-down" className="align-middle" />
          </div>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <DropdownHeader className="noti-title">
            <h6 className="text-overflow m-0">Welcome back!</h6>
          </DropdownHeader>

          <DropdownItem href="">
            <Icon icon="user-circle" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Profile</span>
          </DropdownItem>

          <DropdownItem href="">
            <Icon icon="bell-ringing" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Notifications</span>
          </DropdownItem>

          <DropdownItem href="">
            <Icon icon="credit-card" className="me-1 fs-lg align-middle" />
            <span className="align-middle">
              Balance: <span className="fw-semibold">$985.25</span>
            </span>
          </DropdownItem>

          <DropdownItem href="">
            <Icon icon="settings-2" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Account Settings</span>
          </DropdownItem>

          <DropdownItem href="">
            <Icon icon="headset" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Support Center</span>
          </DropdownItem>

          <DropdownDivider />

          <DropdownItem href="/auth/lock-screen">
            <Icon icon="lock" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Lock Screen</span>
          </DropdownItem>

          <DropdownItem href="" className="text-danger fw-semibold">
            <Icon icon="logout" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Log Out</span>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

export default UserDropdown
