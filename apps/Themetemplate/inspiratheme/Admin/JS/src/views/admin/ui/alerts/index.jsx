import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Alert, AlertHeading, Button, Card, CardBody, CardHeader, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { CustomButton, LiveAlert } from './components/Alerts'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Alerts" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col xl={12}>
            <Card>
              <CardHeader>
                <CardTitle as="h4">Examples</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-muted mb-2">Provide contextual feedback messages for typical user actions with the handful of available and flexible alert messages.</p>
                <a className="btn btn-link p-0 fw-semibold" href="https://getbootstrap.com/docs/5.3/components/alerts/" target="_blank">
                  Alerts on Bootstrap
                  <Icon icon="chevron-right" className="ms-1" />
                </a>
              </CardBody>
            </Card>
          </Col>

          <Col xl={12}>
            <DefaultAlert />
          </Col>
          <Col>
            <DismissingAlert />
          </Col>
          <Col xl={12}>
            <LinkColor />
          </Col>
          <Col xl={12}>
            <AdditionalContent />
          </Col>
          <Col xl={12}>
            <CustomAlerts />
          </Col>
          <Col>
            <LiveAlert />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
const DefaultAlert = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4" className="mb-0">
            Default Alert
          </CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <Alert variant="primary" role="alert">
          This is a primary alert—something important you should know!
        </Alert>

        <Alert variant="secondary" role="alert">
          This is a secondary alert—some additional context.
        </Alert>

        <Alert variant="success" role="alert">
          Success! Your operation was completed successfully.
        </Alert>

        <Alert variant="danger" role="alert">
          Error! Something went wrong—please try again.
        </Alert>

        <Alert variant="warning" role="alert">
          Warning! Please double-check your inputs.
        </Alert>

        <Alert variant="info" role="alert">
          Info: Here&apos;s something you might find useful.
        </Alert>

        <Alert variant="light" role="alert">
          Light alert—just a subtle notification.
        </Alert>

        <Alert variant="dark" role="alert">
          Dark alert—use for general-purpose messages.
        </Alert>

        <Alert className="mb-0" variant="purple" role="alert">
          Purple alert—use for general-purpose messages.
        </Alert>
      </CardBody>
    </Card>
  )
}
const DismissingAlert = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Dismissing Alert with Solid Colors</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <Alert variant="primary" dismissible className="text-bg-primary">
          <div>Heads up! This is a primary alert with important information.</div>
        </Alert>
        <Alert variant="secondary" dismissible className="text-bg-secondary">
          <div>Notice: This is a secondary alert with supporting details.</div>
        </Alert>
        <Alert variant="success" dismissible className="text-bg-success">
          <div>Success! Your action was completed successfully.</div>
        </Alert>
        <Alert variant="danger" dismissible className="text-bg-danger">
          <div>Error! Something went wrong—please try again later.</div>
        </Alert>
        <Alert variant="warning" dismissible className="text-bg-warning">
          <div>Warning! Please review your input before proceeding.</div>
        </Alert>
        <Alert variant="info" dismissible className="text-bg-info">
          <div>Info: Here’s something you might find helpful.</div>
        </Alert>
        <Alert variant="light" dismissible className="text-bg-light">
          <div>Note: This is a light alert with a subtle message.</div>
        </Alert>
        <Alert variant="dark" dismissible className="text-bg-dark">
          <div>Notice: This dark alert is great for general messages.</div>
        </Alert>
        <Alert variant="purple" dismissible className="text-bg-purple">
          <div>Heads up: This purple alert is perfect for catching attention with general information.</div>
        </Alert>
      </CardBody>
    </Card>
  )
}
const LinkColor = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Link Color</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <Alert variant="primary">
          Need more info? Check out&nbsp;
          <Link to="" className="alert-link">
            this primary link
          </Link>
          for important details.
        </Alert>
        <Alert variant="secondary">
          Here&apos;s a secondary message with&nbsp;
          <Link to="" className="alert-link">
            a helpful link
          </Link>
          for additional context.
        </Alert>
        <Alert variant="success">
          Operation successful! View the results&nbsp;
          <Link to="" className="alert-link">
            by clicking here
          </Link>
        </Alert>
        <Alert variant="danger" role="alert">
          Something went wrong. Learn more&nbsp;
          <Link to="" className="alert-link">
            through this alert link
          </Link>
          .
        </Alert>
        <Alert variant="warning" role="alert">
          Heads up! You might want to check&nbsp;
          <Link to="" className="alert-link">
            this warning link
          </Link>
          .
        </Alert>
        <Alert variant="info" role="alert">
          Here’s some information that may help—click&nbsp;
          <Link to="" className="alert-link">
            this link
          </Link>
          to read more.
        </Alert>
        <Alert variant="light" role="alert">
          Just a light reminder with&nbsp;
          <Link to="" className="alert-link">
            a gentle link
          </Link>
          to explore.
        </Alert>
        <Alert variant="dark" role="alert">
          This is a general dark alert. Find out more&nbsp;
          <Link to="" className="alert-link">
            by clicking here
          </Link>
          .
        </Alert>
        <Alert variant="purple" className="mb-0" role="alert">
          Important notice: For more information,&nbsp;
          <Link to="" className="alert-link">
            click here
          </Link>
          .
        </Alert>
      </CardBody>
    </Card>
  )
}
const AdditionalContent = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Additional Content</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <Alert variant="success" className="p-3">
          <AlertHeading as="h4">Great job!</AlertHeading>
          <p>You’ve successfully read this important alert message. The text is intentionally a bit longer to demonstrate how spacing behaves in this kind of layout.</p>
          <hr className="border-success border-opacity-25" />
          <p className="mb-0">Use margin utilities to keep your content clean and organized.</p>
        </Alert>

        <Alert variant="secondary" className="p-3 d-flex">
          <Icon icon="alarm-snooze" className="fs-1 me-2" />
          <div>
            <AlertHeading as="h4" className="alert-heading">
              Heads up!
            </AlertHeading>
            <p>This alert message gives additional information with a longer message to show content spacing within an alert.</p>
            <hr className="border-secondary border-opacity-25" />
            <p className="mb-0">Apply spacing classes wisely to maintain structure and clarity.</p>
          </div>
        </Alert>

        <Alert variant="danger" className="d-flex p-3 mb-0">
          <Icon icon="phone-ringing" className="text-danger fs-1 me-2" />
          <div>
            <AlertHeading as="h4">Notice!</AlertHeading>
            <p>You’ve just read through a primary alert message. The extra length helps show how well the layout handles content spacing.</p>
            <Button variant="danger" className="btn-sm">
              Got it
            </Button>
          </div>
        </Alert>
      </CardBody>
    </Card>
  )
}
const CustomAlerts = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Custom Alerts</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <Alert variant="primary" dismissible className="border border-primary" role="alert">
          <div>A primary alert with a full border!</div>
        </Alert>
        <Alert variant="secondary" dismissible className="alert-bordered border-start border-secondary" role="alert">
          <div>A secondary alert with a left border only!</div>
        </Alert>
        <Alert variant="dark" dismissible className="alert-bordered border-bottom border-dark" role="alert">
          <div>A dark alert with a bottom border!</div>
        </Alert>
        <Alert variant="purple" dismissible className="border-2 border border-dashed border-purple" role="alert">
          <div>A purple alert with a dashed border!</div>
        </Alert>
        <Alert variant="danger" dismissible className="border-2  border-danger" role="alert">
          <div>A danger alert with a thick border!</div>
        </Alert>
        <CustomButton />
        <Alert variant="info" dismissible className="d-flex align-items-center gap-2" role="alert">
          <Icon icon="alert-octagon" className="fs-xl" /> An info alert with a custom icon!
        </Alert>

        <Alert variant="light" className="border-2 d-flex align-items-center p-3 mb-0" role="alert">
          <Icon icon="phone-ringing" className="text-success fs-2 me-3" />
          <div>
            <AlertHeading as="h4">Notice!</AlertHeading>
            <p className="m-0">You’ve just read through a primary alert message. The extra length helps show how well the layout handles content spacing.</p>
          </div>
        </Alert>
      </CardBody>
    </Card>
  )
}
