import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Link } from 'react-router'
import { Button, Card, CardBody, CardTitle, Col, Container, OverlayTrigger, Row, Tooltip } from 'react-bootstrap'
import { AppType, authorizedAppData, integrationData, IntegrationType } from './data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Manage Apps" subtitle="Apps" />
      <Container fluid="xxl">
        <Row>
          <Col xs={12}>
            <h5 className="mb-1 fs-lg">Authorized Apps</h5>
            <p className="text-muted">
              You’re currently using&nbsp;
              <strong>3 of 3</strong>&nbsp;free integrations. Upgrade to&nbsp;
              <Link to="" className="text-decoration-underline">
                PRO
              </Link>
              &nbsp; to unlock more integrations and supercharge your workflow.
            </p>
          </Col>
        </Row>
        <Row>
          {authorizedAppData.map((app, idx) => (
            <Col md={4} key={idx}>
              <AuthorizedAppCard app={app} />
            </Col>
          ))}
        </Row>
        <Row className="my-3">
          <Col xs={12}>
            <h5 className="mb-1 fs-lg">Explore More Integrations</h5>
            <p className="text-muted mb-3">Discover over 200 integrations to enhance your workflow</p>
          </Col>
        </Row>
        <Row>
          {integrationData.map((item, idx) => (
            <Col md={4} key={idx}>
              <IntegrationCard integration={item} />
            </Col>
          ))}
          <Col xs={12} className="mb-3">
            <nav>
              <ul className="pagination pagination-boxed pagination-rounded justify-content-center">
                <li className="page-item">
                  <Link className="page-link" to="" aria-label="Previous">
                    <Icon icon="chevron-left" className="align-middle fs-lg" />
                  </Link>
                </li>
                <li className="page-item">
                  <Link className="page-link" to="">
                    1
                  </Link>
                </li>
                <li className="page-item active">
                  <Link className="page-link" to="">
                    2
                  </Link>
                </li>
                <li className="page-item">
                  <Link className="page-link" to="">
                    3
                  </Link>
                </li>
                <li className="page-item">
                  <Link className="page-link" to="">
                    4
                  </Link>
                </li>
                <li className="page-item">
                  <Link className="page-link" to="">
                    5
                  </Link>
                </li>
                <li className="page-item">
                  <Link className="page-link" to="" aria-label="Next">
                    <Icon icon="chevron-right" className="align-middle fs-lg" />
                  </Link>
                </li>
              </ul>
            </nav>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page

const AuthorizedAppCard = ({ app }: { app: AppType }) => {
  const { name, image, description, lastSync, isActive, isFree } = app
  return (
    <Card>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="avatar-xl d-block mb-1">
            <span className="avatar-title bg-light bg-opacity-75 rounded">
              <img src={image} alt={`${name} Logo`} height={30} />
            </span>
          </span>
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" checked={isActive} id="ga-toggle" />
            <label className="visually-hidden" htmlFor="ga-toggle">
              {' '}
              {name}
            </label>
          </div>
        </div>
        <h5 className="card-title mb-1">{name}</h5>
        <p className="card-text text-muted">{description}</p>

        <div className="mb-2">
          {isFree ? (
            <span className="badge badge-label text-bg-light me-2">Free</span>
          ) : (
            <span className="badge badge-label text-bg-warning me-2">
              <Icon icon="medal" />
              Premium
            </span>
          )}

          <span className="badge badge-label text-bg-success">
            <Icon icon="check" />
            Connected
          </span>
        </div>

        <small className="text-muted d-block mb-3">Last Sync: {lastSync}</small>

        <div className="d-flex gap-2">
          <Button variant="outline-danger" className="w-50">
            Remove
          </Button>
          <OverlayTrigger overlay={<Tooltip>View integration details</Tooltip>}>
            <Button variant="outline-primary" className="w-50">
              Details
            </Button>
          </OverlayTrigger>
        </div>
      </CardBody>
    </Card>
  )
}

const IntegrationCard = ({ integration }: { integration: IntegrationType }) => {
  const { name, description, image, isFree, website } = integration
  return (
    <Card>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="avatar-xl d-block mb-1">
            <span className="avatar-title bg-light bg-opacity-75 rounded">
              <img src={image} alt={name} height={30} />
            </span>
          </span>
          <span className={clsx('badge badge-label', isFree ? 'text-bg-light' : 'text-bg-warning')}>
            {!isFree && <Icon icon="medal" />} {isFree ? 'Free' : 'Premium'}
          </span>
        </div>
        <CardTitle as="h4" className="mb-1">
          {name}
        </CardTitle>
        <p className="card-text text-muted">{description}</p>
        <div className="mb-3 d-flex align-items-center gap-1">
          <Icon icon="world" />
          <Link to="" className="link-reset">
            {website}
          </Link>
        </div>
        <div className="d-flex gap-2">
          <Button variant="success" className="w-50">
            Connect
          </Button>
          <OverlayTrigger overlay={<Tooltip>View integration details</Tooltip>}>
            <button className="btn btn-outline-secondary w-50">
              Learn More
              <Icon icon="arrow-right" className="ms-1" />
            </button>
          </OverlayTrigger>
        </div>
      </CardBody>
    </Card>
  )
}
