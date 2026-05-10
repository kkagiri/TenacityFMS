import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Container, Row, Spinner } from 'react-bootstrap'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Spinners" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader>
                <CardTitle as={'h4'}>Examples</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-muted mb-2">Indicate the loading state of a component or page with Bootstrap spinners, built entirely with HTML, CSS, and no JavaScript.</p>
                <Link className="btn btn-link p-0" to="https://react-bootstrap.netlify.app/docs/components/spinners" target="_blank">
                  Spinners on React Bootstrap
                  <Icon icon="chevron-right" className="ms-1" />
                </Link>
              </CardBody>
            </Card>
          </Col>
          <Col xl={6}>
            <BorderSpinner />
            <ColorsSpinner />
            <AlignMent />
            <ButtonsSpinner />
          </Col>

          <Col xl={6}>
            <GrowingSpinner />
            <ColorGrowingSpinner />
            <Size />
          </Col>

          <Col xs={12}>
            <CSSBasedPlugin />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page

const BorderSpinner = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Border Spinner</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">Use border spinners as lightweight loading indicators.</p>

        <Spinner className="m-2" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </CardBody>
    </Card>
  )
}

const ColorsSpinner = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Colors</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use text color utilities like <code>.text-primary</code>, <code>.text-success</code>, or <code>.text-danger</code> to style the spinner, which inherits its color from <code>currentColor</code>.
        </p>

        <div>
          <Spinner className="text-primary m-2" role="status" />
          <Spinner className="text-secondary m-2" role="status" />
          <Spinner className="text-success m-2" role="status" />
          <Spinner className="text-danger m-2" role="status" />
          <Spinner className="text-warning m-2" role="status" />
          <Spinner className="text-info m-2" role="status" />
          <Spinner className="text-light m-2" role="status" />
          <Spinner className="text-dark m-2" role="status" />
        </div>
      </CardBody>
    </Card>
  )
}

const AlignMent = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Alignment</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">
          Bootstrap spinners use <code>rem</code>, <code>currentColor</code>, and <code>inline-flex</code> for easy sizing and alignment.
        </p>

        <div className="d-flex align-items-center">
          <strong>Loading...</strong>
          <Spinner className="ms-auto" role="status" aria-hidden="true" />
        </div>

        <div className="d-flex justify-content-center mt-3">
          <Spinner role="status" />
        </div>
      </CardBody>
    </Card>
  )
}

const ButtonsSpinner = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Buttons Spinner</CardTitle>
      </CardHeader>

      <CardBody>
        <Row className="g-3">
          <Col lg={6}>
            <div className="d-flex flex-wrap gap-2">
              <Button variant="primary" className="btn-icon" type="button" disabled>
                <Spinner className="spinner-border-sm" role="status" aria-hidden="true" />
                <span className="visually-hidden">Loading...</span>
              </Button>
              <Button variant="primary" className="btn-icon rounded-circle" type="button" disabled>
                <Spinner className="spinner-border-sm" role="status" aria-hidden="true" />
                <span className="visually-hidden">Loading...</span>
              </Button>
              <Button variant="primary" type="button" disabled>
                <Spinner className="spinner-border-sm" role="status" aria-hidden="true" />
                <span className="visually-hidden">Loading...</span>
              </Button>
              <Button className="btn-primary" type="button" disabled>
                <Spinner className="spinner-border-sm me-2" role="status" aria-hidden="true" />
                Loading...
              </Button>
            </div>
          </Col>
          <Col lg={6}>
            <div className="d-flex flex-wrap gap-2">
              <Button variant="primary" className="btn-icon" type="button" disabled>
                <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
                <span className="visually-hidden">Loading...</span>
              </Button>

              <Button variant="primary" className="btn-icon rounded-circle" type="button" disabled>
                <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
                <span className="visually-hidden">Loading...</span>
              </Button>

              <Button variant="primary" type="button" disabled>
                <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
                <span className="visually-hidden">Loading...</span>
              </Button>

              <Button variant="primary" type="button" disabled>
                <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />
                Loading...
              </Button>
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

const GrowingSpinner = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Growing Spinner</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">
          Bootstrap spinners use <code>rem</code>, <code>currentColor</code>, and <code>inline-flex</code> for easy resizing, coloring, and alignment.
        </p>

        <div className="spinner-grow m-2" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </CardBody>
    </Card>
  )
}

const ColorGrowingSpinner = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Color Growing Spinner</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          The grow spinner also uses <code>currentColor</code>, so apply classes like <code>.text-primary</code>, <code>.text-warning</code>, or <code>.text-info</code> to customize its color.
        </p>

        <div>
          <Spinner animation="grow" className="text-primary m-2" role="status" />
          <Spinner animation="grow" className="text-secondary m-2" role="status" />
          <Spinner animation="grow" className="text-success m-2" role="status" />
          <Spinner animation="grow" className="text-danger m-2" role="status" />
          <Spinner animation="grow" className="text-warning m-2" role="status" />
          <Spinner animation="grow" className="text-info m-2" role="status" />
          <Spinner animation="grow" className="text-light m-2" role="status" />
          <Spinner animation="grow" className="text-dark m-2" role="status" />
        </div>
      </CardBody>
    </Card>
  )
}

const Size = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Size</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <Row>
          <Col lg={6}>
            <Spinner animation="border" className="avatar-lg text-primary m-2" role="status" />
            <Spinner animation="grow" className="avatar-lg text-secondary m-2" role="status" />
          </Col>
          <Col lg={6}>
            <Spinner animation="border" className="avatar-md text-primary m-2" role="status" />
            <Spinner animation="grow" className="avatar-md text-secondary m-2" role="status" />
          </Col>
          <Col lg={6}>
            <Spinner animation="border" className="avatar-sm text-primary m-2" role="status" />
            <Spinner animation="grow" className="avatar-sm text-secondary m-2" role="status" />
          </Col>
          <Col lg={6}>
            <Spinner animation="border" size="sm" className="m-2" role="status" />
            <Spinner animation="grow" size="sm" className="m-2" role="status" />
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

const CSSBasedPlugin = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">
            SpinKit{' '}
            <Link to="https://tobiasahlin.com/spinkit/" target="_blank" rel="noopener noreferrer" className="badge badge-soft-warning">
              CSS Based Plugin
            </Link>
          </CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <Row className="mb-5">
          <Col>
            <div className="sk-plane mx-auto"></div>
          </Col>
          <Col>
            <div className="sk-chase mx-auto">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="sk-chase-dot"></div>
              ))}
            </div>
          </Col>
          <Col>
            <div className="sk-bounce mx-auto">
              <div className="sk-bounce-dot"></div>
              <div className="sk-bounce-dot"></div>
            </div>
          </Col>
          <Col>
            <div className="sk-wave mx-auto">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="sk-wave-rect"></div>
              ))}
            </div>
          </Col>
        </Row>

        <Row className="mb-5">
          <Col>
            <div className="sk-pulse mx-auto"></div>
          </Col>
          <Col>
            <div className="sk-swing mx-auto">
              <div className="sk-swing-dot"></div>
              <div className="sk-swing-dot"></div>
            </div>
          </Col>
          <Col>
            <div className="sk-circle mx-auto">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="sk-circle-dot"></div>
              ))}
            </div>
          </Col>
          <Col>
            <div className="sk-circle-fade mx-auto">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="sk-circle-fade-dot"></div>
              ))}
            </div>
          </Col>
        </Row>

        <Row>
          <Col xs={3}>
            <div className="sk-grid mx-auto">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="sk-grid-cube"></div>
              ))}
            </div>
          </Col>
          <Col xs={3}>
            <div className="sk-fold mx-auto">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="sk-fold-cube"></div>
              ))}
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}
