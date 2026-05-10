import small8 from '@/assets/images/stock/small-8.jpg'
import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { Button, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
const Megamenu = () => {
  return (
    <div id="megamenu-apps" className="topbar-item d-none d-md-flex">
      <Dropdown>
        <DropdownToggle className="topbar-link btn fw-medium btn-link drop-arrow-none" type="button">
          Apps <Icon icon="chevron-down" className="ms-1" />
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-xxl p-0">
          <SimpleBar
            className="h-100"
            style={{
              maxHeight: 380,
            }}
          >
            <Row className="g-0">
              <Col sm={8}>
                <Row className="g-0">
                  <Col sm={6}>
                    <div className="p-2">
                      <DropdownItem href="">
                        <span className="d-flex align-items-center">
                          <span className="avatar-md me-2">
                            <span className="avatar-title text-primary border border-light bg-light bg-opacity-50 rounded">
                              <Icon icon="basket" className="fs-22" />
                            </span>
                          </span>
                          <span>
                            <h5 className="fs-base mb-0 lh-base">eCommerce</h5>
                            <span className="text-muted fs-12">Products, orders & etc.</span>
                          </span>
                        </span>
                      </DropdownItem>
                      <DropdownItem href="" className="my-2">
                        <span className="d-flex align-items-center">
                          <span className="avatar-md me-2">
                            <span className="avatar-title text-success border border-light bg-light bg-opacity-50 rounded">
                              <Icon icon="message" className="fs-22" />
                            </span>
                          </span>
                          <span>
                            <h5 className="fs-base mb-0 lh-base">Chat</h5>
                            <span className="text-muted fs-12">Team conversations</span>
                          </span>
                        </span>
                      </DropdownItem>
                      <DropdownItem href="" className="my-2">
                        <span className="d-flex align-items-center">
                          <span className="avatar-md me-2">
                            <span className="avatar-title text-danger border border-light bg-light bg-opacity-50 rounded">
                              <Icon icon="list-check" className="fs-22" />
                            </span>
                          </span>
                          <span>
                            <h5 className="fs-base mb-0 lh-base">Task</h5>
                            <span className="text-muted fs-12">Plan and track work</span>
                          </span>
                        </span>
                      </DropdownItem>
                      <DropdownItem href="" className="mt-2">
                        <span className="d-flex align-items-center">
                          <span className="avatar-md me-2">
                            <span className="avatar-title text-info border border-light bg-light bg-opacity-50 rounded">
                              <Icon icon="mailbox" className="fs-22" />
                            </span>
                          </span>
                          <span>
                            <h5 className="fs-base mb-0 lh-base">Email</h5>
                            <span className="text-muted fs-12">Messages and inbox</span>
                          </span>
                        </span>
                      </DropdownItem>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="p-2">
                      <DropdownItem href="">
                        <span className="d-flex align-items-center">
                          <span className="avatar-md me-2">
                            <span className="avatar-title text-secondary border border-light bg-light bg-opacity-50 rounded">
                              <Icon icon="building" className="fs-22" />
                            </span>
                          </span>
                          <span>
                            <h5 className="fs-base mb-0 lh-base">Companies</h5>
                            <span className="text-muted fs-12">Business profiles</span>
                          </span>
                        </span>
                      </DropdownItem>
                      <DropdownItem href="" className="my-2">
                        <span className="d-flex align-items-center">
                          <span className="avatar-md me-2">
                            <span className="avatar-title text-dark border border-light bg-light bg-opacity-50 rounded">
                              <Icon icon="id" className="fs-22" />
                            </span>
                          </span>
                          <span>
                            <h5 className="fs-base mb-0 lh-base">Contacts Diary</h5>
                            <span className="text-muted fs-12">People and connections</span>
                          </span>
                        </span>
                      </DropdownItem>
                      <DropdownItem href="" className="my-2">
                        <span className="d-flex align-items-center">
                          <span className="avatar-md me-2">
                            <span className="avatar-title text-warning border border-light bg-light bg-opacity-50 rounded">
                              <Icon icon="calendar" className="fs-22" />
                            </span>
                          </span>
                          <span>
                            <h5 className="fs-base mb-0 lh-base">Calendar</h5>
                            <span className="text-muted fs-12">Events and reminders</span>
                          </span>
                        </span>
                      </DropdownItem>
                      <DropdownItem href="" className="mt-2">
                        <span className="d-flex align-items-center">
                          <span className="avatar-md me-2">
                            <span className="avatar-title text-success border border-light bg-light bg-opacity-50 rounded">
                              <Icon icon="lifebuoy" className="fs-22" />
                            </span>
                          </span>
                          <span>
                            <h5 className="fs-base mb-0 lh-base">Support</h5>
                            <span className="text-muted fs-12">Help and assistance</span>
                          </span>
                        </span>
                      </DropdownItem>
                    </div>
                  </Col>
                </Row>
                <Row className="g-0 border-top border-light border-dashed text-center">
                  <Col>
                    <div className="p-3">
                      <p className="fw-medium text-muted mb-2 fs-11 text-uppercase lh-1">-: &nbsp; Support &nbsp;:-</p>
                      <h5 className="fs-15 mb-0"> help@mydomain.com</h5>
                    </div>
                  </Col>
                  <Col>
                    <div className="p-3">
                      <p className="fw-medium text-muted mb-2 fs-11 text-uppercase lh-1">-: &nbsp; Help: &nbsp;:-</p>
                      <h5 className="fs-15 mb-0"> +(12) 3456 7890</h5>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col sm={4}>
                <div
                  className="h-100 position-relative rounded-end rounded-0 overflow-hidden"
                  style={{
                    background: `url("${small8}")`,
                    backgroundSize: 'cover',
                  }}
                >
                  <div className="p-3 card-img-overlay bg-gradient bg-secondary bg-opacity-90 d-flex align-items-center justify-content-center">
                    <div className="text-center  text-white">
                      <Icon icon="atom" className="fs-36" />
                      <p className="text-white text-opacity-75 mb-3 text-uppercase">Limited Offer</p>
                      <h3 className="fw-semibold text-white mb-2 fs-20">Unlock Exclusive Savings</h3>
                      <h4 className="fw-medium fs-16 mb-1">
                        <del className="text-white text-opacity-75">$49.00</del> / <span className="fw-bold text-white">$25 USD</span>
                      </h4>
                      <Button variant="danger" type="button" className="btn btn-sm mt-3">
                        <Icon icon="shopping-cart" className="me-1" /> Grab Deal
                      </Button>
                    </div>
                  </div>
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
