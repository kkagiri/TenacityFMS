import usFlag from '@/assets/images/flags/us.svg'
import user3 from '@/assets/images/users/user-3.jpg'
import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'
import clsx from 'clsx'
import { Link } from 'react-router'
import { Card, CardBody, Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { categoryData, profileMainMenuData } from './data'

const SocialProfile = () => {
  return (
    <Card className="card-top-sticky">
      <CardBody>
        <div className="d-flex align-items-center mb-3">
          <div className="me-2 position-relative">
            <img src={user3} alt="avatar" className="rounded" width="42" height="42" />
          </div>
          <div>
            <h5 className="mb-0 d-flex align-items-center">
              <Link to="/apps/users/profile" className="link-reset">
                {META_DATA.username}
              </Link>
              <img src={usFlag} alt="US" className="ms-2 rounded-circle" height="16" />
            </h5>
            <p className="text-muted mb-0">Content Creator</p>
          </div>
          <div className="ms-auto">
            <Dropdown>
              <DropdownToggle className="btn btn-icon btn-ghost-light text-muted drop-arrow-none">
                <Icon icon="dots-vertical" className="fs-24" />
              </DropdownToggle>
              <DropdownMenu align="end" className="dropdown-menu-end">
                <li>
                  <DropdownItem href="">View Profile</DropdownItem>
                </li>
                <li>
                  <DropdownItem href="">Send Message</DropdownItem>
                </li>
                <li>
                  <DropdownItem href="">Copy Profile Link</DropdownItem>
                </li>
                <li>
                  <DropdownDivider />
                </li>
                <li>
                  <DropdownItem href="">Edit Profile</DropdownItem>
                </li>
                <li>
                  <DropdownItem className="text-danger" href="">
                    Block User
                  </DropdownItem>
                </li>
                <li>
                  <DropdownItem className="text-danger" href="">
                    Report User
                  </DropdownItem>
                </li>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        <div className="list-group list-group-flush list-custom mt-3">
          {profileMainMenuData.map((item, idx) => (
            <Link to={item.href} className={clsx('list-group-item list-group-item-action', { active: idx === 0 })} key={idx}>
              <Icon icon={item.icon} className="me-2 opacity-75 fs-lg align-middle"></Icon>
              <span className="align-middle">{item.label}</span>
              {item.badge && <span className={clsx('badge align-middle fs-xxs  float-end', item.badge.className)}>{item.badge.label}</span>}
            </Link>
          ))}

          <div className="list-group-item mt-2">
            <span className="align-middle">Categories</span>
          </div>

          {categoryData.map((category, idx) => (
            <Link to={category.href} className="list-group-item list-group-item-action" key={idx}>
              <Icon icon="tag" className={clsx('me-2 align-middle fs-lg', category.iconClassName)} />
              <span className="align-middle">{category.label}</span>
            </Link>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

export default SocialProfile
