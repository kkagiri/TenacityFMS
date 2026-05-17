import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader, CardTitle, Col, Container, Nav, Row } from 'react-bootstrap'
import { Link } from 'react-router'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Breadcrumb" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col xl={12}>
            <Card>
              <CardHeader>
                <CardTitle as="h4">Examples</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-muted mb-2">Indicate the current page’s location within a navigational hierarchy that automatically adds separators via CSS.</p>
                <a className="btn btn-link p-0 fw-semibold" href="https://getbootstrap.com/docs/5.3/components/breadcrumb/" target="_blank">
                  Breadcrumb on Bootstrap
                  <Icon icon="chevron-right" className="ms-1" />
                </a>
              </CardBody>
            </Card>
          </Col>

          <Col xl={12}>
            <Basic />
          </Col>

          <Col xl={12}>
            <WithIcon />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
const Basic = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Basic</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <Nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 py-2">
            <li className="breadcrumb-item active" aria-current="page">
              Home
            </li>
          </ol>
        </Nav>

        <Nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 py-2">
            <li className="breadcrumb-item">
              <Link to="">Home</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Library
            </li>
          </ol>
        </Nav>

        <Nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 py-2">
            <li className="breadcrumb-item">
              <Link to="">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="">Library</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Data
            </li>
          </ol>
        </Nav>
      </CardBody>
    </Card>
  )
}
const WithIcon = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">With Icons</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb bg-light bg-opacity-50 p-2 mb-2">
            <li className="breadcrumb-item active" aria-current="page">
              <Icon icon="smart-home" className="me-1" />
              Home
            </li>
          </ol>
        </nav>

        <nav aria-label="breadcrumb">
          <ol className="breadcrumb bg-light bg-opacity-50 p-2 mb-2">
            <li className="breadcrumb-item">
              <Link to="">
                <Icon icon="smart-home" className="me-1" />
                Home
              </Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Library
            </li>
          </ol>
        </nav>

        <nav aria-label="breadcrumb">
          <ol className="breadcrumb bg-light bg-opacity-50 p-2 mb-0">
            <li className="breadcrumb-item">
              <Link to="">
                <Icon icon="smart-home" className="me-1" />
                Home
              </Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="">Library</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Data
            </li>
          </ol>
        </nav>
      </CardBody>
    </Card>
  )
}
