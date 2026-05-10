import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { META_DATA } from '@/config/constants'
import { Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
const Megamenu = () => {
  return (
    <div id="megamenu-header" className="topbar-item d-none d-md-flex">
      <Dropdown>
        <DropdownToggle className="topbar-link btn fw-medium btn-link dropdown-toggle drop-arrow-none" type="button">
          Mega Menu <Icon icon="chevron-down" className="ms-1" />
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-xxl p-0">
          <SimpleBar
            className="h-100"
            style={{
              maxHeight: 380,
            }}
          >
            <Row className="g-0">
              <Col xs={12}>
                <div className="px-3 py-2 text-center bg-light bg-opacity-50">
                  <h4 className="mb-0 fs-lg fw-semibold">
                    Welcome to
                    <span className="text-primary">{META_DATA.name}</span>
                    Admin Theme.
                  </h4>
                </div>
              </Col>
            </Row>
            <Row className="g-0">
              <Col md={4}>
                <div className="p-3">
                  <h5 className="mb-2 fw-semibold fs-sm dropdown-header">Dashboard &amp; Analytics</h5>
                  <ul className="list-unstyled megamenu-list">
                    <li>
                      <DropdownItem href="">Sales Dashboard</DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">Marketing Dashboard</DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">Finance Overview</DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">User Analytics</DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">Traffic Insights</DropdownItem>
                    </li>
                  </ul>
                </div>
              </Col>
              <Col md={4}>
                <div className="p-3">
                  <h5 className="mb-2 fw-semibold fs-sm dropdown-header">Project Management</h5>
                  <ul className="list-unstyled megamenu-list">
                    <li>
                      <DropdownItem href="">Task Overview</DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">Kanban Board</DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">Gantt Chart</DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">Team Collaboration</DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">Project Milestones</DropdownItem>
                    </li>
                  </ul>
                </div>
              </Col>
              <Col md={4}>
                <div className="p-3">
                  <h5 className="mb-2 fw-semibold fs-sm dropdown-header">User Management</h5>
                  <ul className="list-unstyled megamenu-list">
                    <li>
                      <DropdownItem href="">User Profiles</DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">Access Control</DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">Role Permissions</DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">Activity Logs</DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">Security Settings</DropdownItem>
                    </li>
                  </ul>
                </div>
              </Col>
            </Row>
          </SimpleBar>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
export default Megamenu
