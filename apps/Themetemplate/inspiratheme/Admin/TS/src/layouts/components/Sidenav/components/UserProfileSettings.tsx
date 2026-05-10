import bgPattern from '@/assets/images/user-bg-pattern.svg'
import user1 from '@/assets/images/users/user-1.jpg'
import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'
import { Link } from 'react-router'
import { Dropdown, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const UserProfileSettings = () => {
  return (
    <div id="user-profile-settings" className="sidenav-user" style={{ background: `url(${bgPattern})` }}>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <Link to="" className="link-reset">
            <img src={user1} alt="user-image" className="rounded-circle mb-2 avatar-md" />
            <span className="sidenav-user-name fw-bold">{META_DATA.username}</span>
            <span className="fs-12 fw-semibold" data-lang="user-role">
              Art Director
            </span>
          </Link>
        </div>
        <div>
          <Dropdown align="end">
            <DropdownToggle as="a" href="#" className="drop-arrow-none link-reset sidenav-user-set-icon" aria-haspopup="false" aria-expanded={false}>
              <Icon icon="settings" className="fs-24 align-middle ms-1" />
            </DropdownToggle>
            <DropdownMenu>
              <DropdownHeader className="noti-title">
                <h6 className="text-overflow m-0">Welcome back!</h6>
              </DropdownHeader>
              <DropdownItem href="">
                <Icon icon="user-circle" className="me-1 fs-lg align-middle" />
                <span className="align-middle">Profile</span>
              </DropdownItem>
              <DropdownItem href="">
                <Icon icon="settings-2" className="me-1 fs-lg align-middle" />
                <span className="align-middle">Account Settings</span>
              </DropdownItem>
              <DropdownItem href="auth/lock-screen">
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
      </div>
    </div>
  )
}

export default UserProfileSettings
