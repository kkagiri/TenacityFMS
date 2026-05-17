import dropboxLogo from '@/assets/images/logos/dropbox.svg'
import figmaLogo from '@/assets/images/logos/figma.svg'
import googleLogo from '@/assets/images/logos/google.svg'
import slackLogo from '@/assets/images/logos/slack.svg'
import Icon from '@/components/wrappers/Icon'
import { Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
const appItems = [
  {
    name: 'Google',
    img: googleLogo,
    variant: 'light',
  },
  {
    name: 'Figma',
    img: figmaLogo,
    variant: 'light',
  },
  {
    name: 'Slack',
    img: slackLogo,
    variant: 'light',
  },
  {
    name: 'Dropbox',
    img: dropboxLogo,
    variant: 'light',
  },
  {
    name: 'Calendar',
    icon: 'calendar',
    variant: 'primary',
  },
  {
    name: 'Files',
    icon: 'folder',
    variant: 'primary',
  },
]
const AppsDropdown = () => {
  return (
    <div id="apps-dropdown-rounded" className="topbar-item">
      <Dropdown align="end">
        <DropdownToggle className="topbar-link dropdown-toggle drop-arrow-none" type="button">
          <span className="topbar-link-icon">
            <Icon icon="apps" />
          </span>
        </DropdownToggle>

        <DropdownMenu className="dropdown-menu-lg p-2 dropdown-menu-end">
          <Row className="align-items-center g-1">
            {appItems.map((item, index) => (
              <Col xs={4} key={index}>
                <DropdownItem href="" className="rounded text-center py-2">
                  <span className="avatar-sm d-block mx-auto mb-1">
                    <span className={`avatar-title rounded-circle ${item.variant === 'primary' ? 'bg-primary-subtle text-primary' : 'text-bg-light'}`}>{item.img ? <img src={item.img} alt={`${item.name} Logo`} height={18} /> : <Icon icon={item.icon} className="fs-18" />}</span>
                  </span>
                  <span className="align-middle fw-medium">{item.name}</span>
                </DropdownItem>
              </Col>
            ))}
          </Row>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
export default AppsDropdown
