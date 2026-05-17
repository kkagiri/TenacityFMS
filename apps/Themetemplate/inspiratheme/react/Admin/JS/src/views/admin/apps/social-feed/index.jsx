import user7 from '@/assets/images/users/user-7.jpg'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Card, CardBody, CardHeader, CardTitle, Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import Feeds from './components/Feeds'
import SocialProfile from './components/SocialProfile'
import { activityData, requestData, trendingData } from './components/data'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Social Feed" subtitle="Apps" />
      <Container fluid="xxl">
        <Row>
          <Col xl={3} lg={6} className="order-lg-1 order-xl-1">
            <SocialProfile />
          </Col>

          <Col xl={6} lg={12} className="order-lg-2 order-xl-1">
            <Feeds />
          </Col>

          <Col xl={3} lg={6} className="order-lg-1 order-xl-2">
            <Activity />

            <Trending />

            <Requests />

            <FeaturedVideo />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
const Activity = () => {
  return (
    <Card>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Activity</h5>
          <Link to="" className="link-reset fs-sm">
            See all
          </Link>
        </div>

        <div className="mb-3">
          <small className="text-muted text-uppercase">Stories About You</small>
          <div className="d-flex align-items-center mt-2">
            <img src={user7} className="rounded-circle me-2" width="32" height="32" alt="mention" />
            <div>
              <strong>Mentions</strong>
              <br />
              <span className="text-muted fs-xs">3 stories mention you</span>
            </div>
          </div>
        </div>

        <span className="text-muted fs-xs fw-bold text-uppercase">New</span>
        <ul className="list-unstyled mt-2 mb-0">
          {activityData.map((item, idx) => (
            <li className="d-flex align-items-center py-1" key={idx}>
              <img src={item.user.image} className="rounded-circle me-2" width="36" height="36" alt={item.user.name} />
              <div className="flex-grow-1">
                <strong>{item.user.name}</strong> {item.message}
                <br />
                <span className="text-muted fs-xs">{item.time}</span>
              </div>
              {item.image ? (
                <div>
                  <img src={item.image} className="rounded" width="32" height="32" alt="commented" />
                </div>
              ) : (
                <div className="text-primary">
                  <Icon icon="user-plus" className="fs-lg" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}
const Trending = () => {
  return (
    <Card>
      <CardHeader className="justify-content-between align-items-center border-dashed">
        <CardTitle className="mb-0">Trending</CardTitle>
        <Dropdown>
          <DropdownToggle variant="link" className="text-muted drop-arrow-none card-drop p-0">
            <Icon icon="dots-vertical" className="fs-lg" />
          </DropdownToggle>
          <DropdownMenu className="dropdown-menu-end">
            <DropdownItem href="">
              <Icon icon="refresh" className="me-2" />
              Refresh Feed
            </DropdownItem>
            <DropdownItem href="">
              <Icon icon="settings" className="me-2" />
              Manage Topics
            </DropdownItem>
            <DropdownItem href="">
              <Icon icon="alert-circle" className="me-2" />
              Report Issue
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardHeader>

      <CardBody>
        {trendingData.map((item, idx) => (
          <div
            className={clsx('d-flex', {
              'mb-3': idx !== trendingData.length - 1,
            })}
            key={idx}
          >
            <span>
              <Icon icon="trending-up" className="text-primary me-2 mt-1" />
            </span>
            <Link to={item.href || ''} className="link-reset text-decoration-none">
              <strong>{item.title}:</strong> {item.description}
            </Link>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}
const Requests = () => {
  return (
    <Card>
      <CardHeader className="justify-content-between align-items-center border-dashed">
        <CardTitle className="mb-0">Requests</CardTitle>
        <Dropdown>
          <DropdownToggle variant="link" className="text-muted drop-arrow-none card-drop p-0">
            <Icon icon="dots-vertical" className="fs-lg" />
          </DropdownToggle>
          <DropdownMenu align="end">
            <DropdownItem href="">
              <Icon icon="check" className="me-2" />
              Mark All as Read
            </DropdownItem>
            <DropdownItem href="">
              <Icon icon="trash" className="me-2" />
              Clear All
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardHeader>

      <CardBody>
        {requestData.map((item, idx) => (
          <div key={idx} className={`d-flex justify-content-between align-items-center ${idx !== requestData.length - 1 ? 'mb-3' : ''}`}>
            <div className={`d-flex align-items-start ${item.icon ? 'gap-2' : ''}`}>
              {item.image ? (
                <img src={item.image} alt={item.title} width={32} height={32} className="avatar-xs rounded-circle me-2" />
              ) : (
                <div className="avatar-xs flex-shrink-0">
                  <span className={clsx('avatar-title rounded-circle', item.iconClassName)}>{item.icon && <Icon icon={item.icon} />}</span>
                </div>
              )}

              <div>
                <p className="mb-1">
                  <strong>{item.title}</strong> {item.description}
                  <span className={`badge ms-1 ${item.badge.className}`}>{item.badge.label}</span>
                </p>
                <small className="text-muted">{item.time}</small>
              </div>
            </div>

            <button className="btn btn-sm py-0 px-1 btn-default">{item.action}</button>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}
const FeaturedVideo = () => {
  return (
    <Card>
      <CardHeader className="justify-content-between align-items-center border-dashed">
        <CardTitle className="mb-0">Featured Video For You</CardTitle>
        <Dropdown>
          <DropdownToggle variant="link" className="text-muted drop-arrow-none card-drop p-0">
            <Icon icon="dots-vertical" className="fs-lg" />
          </DropdownToggle>
          <DropdownMenu align="end">
            <DropdownItem href="">Watch Later</DropdownItem>
            <DropdownItem href="">Report Video</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardHeader>
      <CardBody>
        <div className="ratio ratio-16x9 rounded overflow-hidden">
          <iframe src="https://player.vimeo.com/video/357274789" allowFullScreen></iframe>
        </div>
      </CardBody>
    </Card>
  )
}
