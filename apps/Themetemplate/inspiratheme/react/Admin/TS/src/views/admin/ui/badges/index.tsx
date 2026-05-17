import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Container, Row } from 'react-bootstrap'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Badges" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col xl={12}>
            <Card>
              <CardHeader>
                <CardTitle as="h4">Examples</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-muted mb-2">Documentation and examples for badges, our small count and labeling component.</p>
                <a className="btn btn-link p-0 fw-semibold" href="https://getbootstrap.com/docs/5.3/components/badge/" target="_blank">
                  Badges on Bootstrap
                  <Icon icon="chevron-right" className="ms-1" />
                </a>
              </CardBody>
            </Card>
          </Col>

          <Col xl={6}>
            <BasicBadges />
          </Col>

          <Col xl={6}>
            <BasicPillBadges />
          </Col>

          <Col xl={6}>
            <OutlineBadges />
          </Col>

          <Col xl={6}>
            <OutlinePillBadges />
          </Col>

          <Col xl={6}>
            <LightenBadges />
          </Col>

          <Col xl={6}>
            <LightenPillBadges />
          </Col>

          <Col xl={6}>
            <LabelBadges />
          </Col>

          <Col xl={6}>
            <SquareBadges />
          </Col>

          <Col xl={6}>
            <CircleBadges />
            <Positioned />
          </Col>

          <Col xl={6}>
            <HeadingswithBadges />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page

const BasicBadges = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Basic Badges</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use the <code>.badge</code> &amp; <code>.text-bg-*</code> classes to make badges.
        </p>
        <span className="badge me-1  badge-default">Default</span>
        <span className="badge me-1 text-bg-primary">Primary</span>
        <span className="badge me-1 text-bg-secondary">Secondary</span>
        <span className="badge me-1 text-bg-success">Success</span>
        <span className="badge me-1 text-bg-danger">Danger</span>
        <span className="badge me-1 text-bg-warning">Warning</span>
        <span className="badge me-1 text-bg-info">Info</span>
        <span className="badge me-1 text-bg-light">Light</span>
        <span className="badge me-1 text-bg-dark">Dark</span>
        <span className="badge  text-bg-purple">Purple</span>
      </CardBody>
    </Card>
  )
}

const BasicPillBadges = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Basic Pill Badges</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use the <code>.rounded-pill</code> modifier class to make badges more rounded.
        </p>
        <span className="badge badge-default rounded-pill me-1">Default</span>
        <span className="badge text-bg-primary rounded-pill me-1">Primary</span>
        <span className="badge text-bg-secondary rounded-pill me-1">Secondary</span>
        <span className="badge text-bg-success rounded-pill me-1">Success</span>
        <span className="badge text-bg-danger rounded-pill me-1">Danger</span>
        <span className="badge text-bg-warning rounded-pill me-1">Warning</span>
        <span className="badge text-bg-info rounded-pill me-1">Info</span>
        <span className="badge text-bg-light rounded-pill me-1">Light</span>
        <span className="badge text-bg-dark rounded-pill me-1">Dark</span>
        <span className="badge text-bg-purple rounded-pill me-1">Purple</span>
      </CardBody>
    </Card>
  )
}

const OutlineBadges = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Outline Badges</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Using the <code>.badge-outline-*</code> to quickly create a bordered badges.
        </p>
        <span className="badge me-1 badge-outline-primary">Primary</span>
        <span className="badge me-1 badge-outline-secondary">Secondary</span>
        <span className="badge me-1 badge-outline-success">Success</span>
        <span className="badge me-1 badge-outline-danger">Danger</span>
        <span className="badge me-1 badge-outline-warning">Warning</span>
        <span className="badge me-1 badge-outline-info">Info</span>
        <span className="badge me-1 badge-outline-dark">Dark</span>
        <span className="badge me-1 badge-outline-purple">Purple</span>
      </CardBody>
    </Card>
  )
}
const OutlinePillBadges = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Outline Pill Badges</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use the <code>.rounded-pill</code> modifier class to make badges more rounded.
        </p>
        <span className="badge me-1 badge-outline-primary rounded-pill me-1">Primary</span>
        <span className="badge me-1 badge-outline-secondary rounded-pill me-1">Secondary</span>
        <span className="badge me-1 badge-outline-success rounded-pill me-1">Success</span>
        <span className="badge me-1 badge-outline-danger rounded-pill me-1">Danger</span>
        <span className="badge me-1 badge-outline-warning rounded-pill me-1">Warning</span>
        <span className="badge me-1 badge-outline-info rounded-pill me-1">Info</span>
        <span className="badge me-1 badge-outline-dark rounded-pill me-1">Dark</span>
        <span className="badge me-1 badge-outline-purple rounded-pill me-1">Purple</span>
      </CardBody>
    </Card>
  )
}

const LightenBadges = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Lighten Badges</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use the <code>.badge-soft--*</code> modifier class to make badges lighten.
        </p>
        <span className="badge me-1 badge-soft-primary">Primary</span>
        <span className="badge me-1 badge-soft-secondary">Secondary</span>
        <span className="badge me-1 badge-soft-success">Success</span>
        <span className="badge me-1 badge-soft-danger">Danger</span>
        <span className="badge me-1 badge-soft-warning">Warning</span>
        <span className="badge me-1 badge-soft-info">Info</span>
        <span className="badge me-1 badge-soft-dark">Dark</span>
        <span className="badge me-1 badge-soft-purple">Purple</span>
      </CardBody>
    </Card>
  )
}

const LightenPillBadges = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Lighten Pill Badges</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use the <code>.badge-soft--*</code> modifier class to make badges lighten.
        </p>

        <span className="badge badge-soft-primary rounded-pill me-1">Primary</span>
        <span className="badge badge-soft-secondary rounded-pill me-1">Secondary</span>
        <span className="badge badge-soft-success rounded-pill me-1">Success</span>
        <span className="badge badge-soft-danger rounded-pill me-1">Danger</span>
        <span className="badge badge-soft-warning rounded-pill me-1">Warning</span>
        <span className="badge badge-soft-info rounded-pill me-1">Info</span>
        <span className="badge badge-soft-dark rounded-pill me-1">Dark</span>
        <span className="badge badge-soft-purple rounded-pill me-1">Purple</span>
      </CardBody>
    </Card>
  )
}

const LabelBadges = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Label Badges</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Using the <code>.badge-label</code> to quickly create a square based badges.
        </p>
        <span className="badge me-1 badge-label badge-default">Default</span>
        <span className="badge me-1 badge-label text-bg-primary">Primary</span>
        <span className="badge me-1 badge-label text-bg-secondary">Secondary</span>
        <span className="badge me-1 badge-label text-bg-success">Success</span>
        <span className="badge me-1 badge-label text-bg-danger">Danger</span>
        <span className="badge me-1 badge-label text-bg-warning">Warning</span>
        <span className="badge me-1 badge-label text-bg-info">Info</span>
        <span className="badge me-1 badge-label text-bg-light">Light</span>
        <span className="badge me-1 badge-label text-bg-dark">Dark</span>
        <span className="badge me-1 badge-label text-bg-purple">Purple</span>
      </CardBody>
    </Card>
  )
}
const SquareBadges = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Square Badges</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Using the <code>.badge-square</code> to quickly create a square based badges.
        </p>
        <span className="badge me-1 badge-square badge-default">0</span>
        <span className="badge me-1 badge-square text-bg-primary">1</span>
        <span className="badge me-1 badge-square text-bg-secondary">2</span>
        <span className="badge me-1 badge-square text-bg-success">3</span>
        <span className="badge me-1 badge-square text-bg-danger">4</span>
        <span className="badge me-1 badge-square text-bg-warning">5</span>
        <span className="badge me-1 badge-square text-bg-info">6</span>
        <span className="badge me-1 badge-square text-bg-light">7</span>
        <span className="badge me-1 badge-square text-bg-dark">8</span>
        <span className="badge me-1 badge-square text-bg-purple">9</span>
      </CardBody>
    </Card>
  )
}

const CircleBadges = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Circle Badges</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Using the <code>.badge-circle</code> to quickly create a circle based badges.
        </p>
        <span className="badge me-1 badge-circle badge-default">0</span>
        <span className="badge me-1 badge-circle text-bg-primary">1</span>
        <span className="badge me-1 badge-circle text-bg-secondary">2</span>
        <span className="badge me-1 badge-circle text-bg-success">3</span>
        <span className="badge me-1 badge-circle text-bg-danger">4</span>
        <span className="badge me-1 badge-circle text-bg-warning">5</span>
        <span className="badge me-1 badge-circle text-bg-info">6</span>
        <span className="badge me-1 badge-circle text-bg-light">7</span>
        <span className="badge me-1 badge-circle text-bg-dark">8</span>
        <span className="badge me-1 badge-circle text-bg-purple">9</span>
      </CardBody>
    </Card>
  )
}

const Positioned = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Positioned</CardTitle>
      </CardHeader>

      <CardBody>
        <p className="text-muted">
          Use utilities to modify a <code>.badge</code> and position it in the corner of a link or button.
        </p>

        <div className="d-flex flex-wrap gap-3">
          <Button className="btn btn-primary position-relative">
            Inbox
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              99+
              <span className="visually-hidden">unread messages</span>
            </span>
          </Button>

          <Button className="btn btn-primary position-relative">
            Profile
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
              <span className="visually-hidden">New alerts</span>
            </span>
          </Button>

          <Button className="btn btn-success">
            Notifications <span className="badge text-bg-light ms-1">4</span>
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

const HeadingswithBadges = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Headings with Badges</CardTitle>
      </CardHeader>

      <CardBody>
        <h1>
          h1.Example heading <span className="badge text-bg-primary">New</span>
        </h1>
        <h2>
          h2.Example heading <span className="badge text-bg-primary">New</span>
        </h2>
        <h3>
          h3.Example heading <span className="badge text-bg-primary">New</span>
        </h3>
        <h4>
          h4.Example heading <span className="badge text-bg-primary">New</span>
        </h4>
        <h5>
          h5.Example heading <span className="badge text-bg-primary">New</span>
        </h5>
        <h6>
          h6.Example heading <span className="badge text-bg-primary">New</span>
        </h6>
      </CardBody>
    </Card>
  )
}
