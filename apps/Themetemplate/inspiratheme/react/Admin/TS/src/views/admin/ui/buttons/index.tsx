import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Buttons" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col xl={12}>
            <ButtonExample />
          </Col>

          <Col xl={12}>
            <DefultButton />
          </Col>

          <Col xl={12}>
            <ButtonRounded />
          </Col>

          <Col xl={12}>
            <ButtonOutline />
          </Col>

          <Col xl={12}>
            <ButtonOutlineRounded />
          </Col>

          <Col xl={12}>
            <SoftButtons />
          </Col>

          <Col xl={12}>
            <SoftRoundedButtons />
          </Col>

          <Col xl={12}>
            <GhostButtons />
          </Col>

          <Col xl={12}>
            <GhostRoundedButtons />
          </Col>

          <Col xl={12}>
            <ButtonSizes />
          </Col>

          <Col xl={12}>
            <DisabledButtons />
          </Col>

          <Col xl={12}>
            <BlockButtons />
          </Col>

          <Col xl={12}>
            <ToggleButtons />
          </Col>

          <Col xl={12}>
            <ButtonTags />
            <IconButtons />
          </Col>

          <Col xl={12}>
            <ButtonGroup />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page

const ButtonExample = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Examples</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-muted mb-2">Use Bootstrap’s custom button styles for actions in forms, dialogs, and more with support for multiple sizes, states, and more.</p>
        <Link className="btn-link p-0 fw-semibold" to="https://getbootstrap.com/docs/5.3/components/buttons/" target="_blank">
          Buttons on Bootstrap
          <Icon icon="chevron-right" className="ms-1" />
        </Link>
      </CardBody>
    </Card>
  )
}

const DefultButton = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Default Buttons</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use any of the available <code>&lt;a&gt;</code>, <code>&lt;button&gt;</code>, or <code>&lt;input&gt;</code> classes <code>.btn</code> to quickly create a styled button.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="default">Default</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="info">Info</Button>
          <Button variant="purple">Purple</Button>
          <Button variant="light">Light</Button>
          <Button variant="dark">Dark</Button>
        </div>
      </CardBody>
    </Card>
  )
}
const ButtonRounded = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Button Rounded</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use <code>.rounded-pill</code> with a default button to give it pill-shaped rounded corners.
        </p>

        <div className="d-flex flex-wrap gap-2">
          <Button variant="default" className="rounded-pill">
            Default
          </Button>
          <Button variant="primary" className="rounded-pill">
            Primary
          </Button>
          <Button variant="secondary" className="rounded-pill">
            Secondary
          </Button>
          <Button variant="success" className="rounded-pill">
            Success
          </Button>
          <Button variant="danger" className="rounded-pill">
            Danger
          </Button>
          <Button variant="warning" className="rounded-pill">
            Warning
          </Button>
          <Button variant="info" className="rounded-pill">
            Info
          </Button>
          <Button variant="purple" className="rounded-pill">
            Purple
          </Button>
          <Button variant="light" className="rounded-pill">
            Light
          </Button>
          <Button variant="dark" className="rounded-pill">
            Dark
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

const ButtonOutline = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Button Outline</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use the <code>.btn-outline-**</code> classes to quickly create buttons with borders.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-primary">Primary</Button>
          <Button variant="outline-secondary">Secondary</Button>
          <Button variant="outline-success">Success</Button>
          <Button variant="outline-danger">Danger</Button>
          <Button variant="outline-warning">Warning</Button>
          <Button variant="outline-info">Info</Button>
          <Button variant="outline-purple">Purple</Button>
          <Button variant="outline-light">Light</Button>
          <Button variant="outline-dark">Dark</Button>
        </div>
      </CardBody>
    </Card>
  )
}

const ButtonOutlineRounded = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Button Outline Rounded</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use <code>.rounded-pill</code> with an outline button to give it pill-shaped rounded corners.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-primary" className="rounded-pill">
            Primary
          </Button>
          <Button variant="outline-secondary" className="rounded-pill">
            Secondary
          </Button>
          <Button variant="outline-success" className="rounded-pill">
            Success
          </Button>
          <Button variant="outline-danger" className="rounded-pill">
            Danger
          </Button>
          <Button variant="outline-warning" className="rounded-pill">
            Warning
          </Button>
          <Button variant="outline-info" className="rounded-pill">
            Info
          </Button>
          <Button variant="outline-purple" className="rounded-pill">
            Purple
          </Button>
          <Button variant="outline-light" className="rounded-pill">
            Light
          </Button>
          <Button variant="outline-dark" className="rounded-pill">
            Dark
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

const SoftButtons = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Soft Buttons</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use <code>btn-soft-**</code> class with the below-mentioned variation to create a button with the soft background.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <Button className="btn-soft-primary">Primary</Button>
          <Button className="btn-soft-secondary">Secondary</Button>
          <Button className="btn-soft-success">Success</Button>
          <Button className="btn-soft-danger">Danger</Button>
          <Button className="btn-soft-warning">Warning</Button>
          <Button className="btn-soft-info">Info</Button>
          <Button className="btn-soft-purple">Purple</Button>
          <Button className="btn-soft-dark">Dark</Button>
        </div>
      </CardBody>
    </Card>
  )
}

const SoftRoundedButtons = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Soft Rounded Buttons</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use the <code>btn-soft-**</code> class along with <code>.rounded-pill</code> to create a softly styled button with rounded corners.
        </p>

        <div className="d-flex flex-wrap gap-2">
          <Button className="btn-soft-primary rounded-pill">Primary</Button>
          <Button className="btn-soft-secondary rounded-pill">Secondary</Button>
          <Button className="btn-soft-success rounded-pill">Success</Button>
          <Button className="btn-soft-danger rounded-pill">Danger</Button>
          <Button className="btn-soft-warning rounded-pill">Warning</Button>
          <Button className="btn-soft-info rounded-pill">Info</Button>
          <Button className="btn-soft-purple rounded-pill">Purple</Button>
          <Button className="btn-soft-dark rounded-pill">Dark</Button>
        </div>
      </CardBody>
    </Card>
  )
}
const GhostButtons = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Ghost Buttons</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use the <code>btn-ghost-**</code> class to create buttons with a transparent background that highlight with color on hover.
        </p>

        <div className="d-flex flex-wrap gap-2">
          <Button className="btn-ghost-primary">Primary</Button>
          <Button className="btn-ghost-secondary">Secondary</Button>
          <Button className="btn-ghost-success">Success</Button>
          <Button className="btn-ghost-danger">Danger</Button>
          <Button className="btn-ghost-warning">Warning</Button>
          <Button className="btn-ghost-info">Info</Button>
          <Button className="btn-ghost-purple">Purple</Button>
          <Button className="btn-ghost-dark">Dark</Button>
        </div>
      </CardBody>
    </Card>
  )
}

const GhostRoundedButtons = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Ghost Rounded Buttons</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use <code>btn-ghost-**</code> with <code>.rounded-pill</code> for rounded ghost buttons that highlight on hover.
        </p>

        <div className="d-flex flex-wrap gap-2">
          <Button className="btn-ghost-primary rounded-pill">Primary</Button>
          <Button className="btn-ghost-secondary rounded-pill">Secondary</Button>
          <Button className="btn-ghost-success rounded-pill">Success</Button>
          <Button className="btn-ghost-danger rounded-pill">Danger</Button>
          <Button className="btn-ghost-warning rounded-pill">Warning</Button>
          <Button className="btn-ghost-info rounded-pill">Info</Button>
          <Button className="btn-ghost-purple rounded-pill">Purple</Button>
          <Button className="btn-ghost-dark rounded-pill">Dark</Button>
        </div>
      </CardBody>
    </Card>
  )
}

const ButtonSizes = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Button Sizes</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Want larger or smaller buttons? Use <code>.btn-lg</code> or <code>.btn-sm</code> to adjust the button size.
        </p>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Button variant="primary" size="lg">
            Large
          </Button>
          <Button variant="info" className="">
            Normal
          </Button>
          <Button variant="purple" size="sm">
            Small
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
const DisabledButtons = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Disabled Buttons</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use the <code>disabled</code> attribute on a <code>&lt;button&gt;</code> to make it inactive and non-interactive.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="info" disabled>
            Info
          </Button>
          <Button variant="purple" disabled>
            Purple
          </Button>
          <Button variant="danger" disabled>
            Danger
          </Button>
          <Button variant="dark" disabled>
            Dark
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

const BlockButtons = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Block Button</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted font-14">
          To create block-level buttons, add the <code>.d-grid</code> class to the parent <code>&lt;div&gt;</code>.
        </p>
        <div className="d-grid gap-2">
          <Button variant="primary" size="sm">
            Block Button
          </Button>
          <Button variant="success" size="lg">
            Block Button
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

const ToggleButtons = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Toggle Button</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Add <code>data-bs-toggle=&quot;button&quot;</code> to toggle a button’s <code>active</code> state. For pre-toggled buttons, also add <code>.active</code> and <code>aria-pressed=&quot;true&quot;</code>.
        </p>

        <div className="d-flex flex-wrap gap-2">
          <Button variant="primary">Toggle button</Button>
          <Button variant="primary" active>
            Active toggle button
          </Button>
          <Button variant="primary" disabled>
            Disabled toggle button
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

const ButtonTags = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Button Tags</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Use <code>.btn</code> classes with <code>&lt;button&gt;</code>, <code>&lt;a&gt;</code>, or <code>&lt;input&gt;</code> elements, though rendering may vary slightly across browsers.
        </p>

        <div className="d-flex flex-wrap gap-2">
          <Link className="btn btn-primary" to="" role="button">
            Link
          </Link>
          <Button variant="primary" type="submit">
            Button
          </Button>
          <input className="btn btn-primary" type="button" value="Input" />
          <input className="btn btn-primary" type="submit" value="Submit" />
          <input className="btn btn-primary" type="reset" value="Reset" />
        </div>
      </CardBody>
    </Card>
  )
}

const IconButtons = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Icon Buttons</CardTitle>
      </CardHeader>

      <CardBody>
        <p className="text-muted">Icon only button. Use it when you want a button with just an icon and no text, ideal for compact UI elements or toolbars.</p>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="primary" className="btn-icon">
            <Icon icon="star" className="fs-xl" />
          </Button>
          <Button variant="secondary" className="btn-icon">
            <Icon icon="leaf" className="fs-xl" />
          </Button>
          <Button variant="warning" className="btn-icon">
            <Icon icon="settings" className="fs-xl" />
          </Button>
          <Button variant="soft-info" className="rounded-circle btn-icon">
            <Icon icon="bell" className="fs-xl" />
          </Button>
          <Button variant="secondary" className="rounded-circle btn-icon">
            <Icon icon="rocket" className="fs-xl" />
          </Button>
          <Button variant="outline-dark" className="rounded-circle btn-icon">
            <Icon icon="plane" className="fs-xl" />
          </Button>
          <Button variant="soft-secondary" className="btn-icon">
            <Icon icon="microphone" className="fs-xl" />
          </Button>

          <Button variant="light">
            <Icon icon="hand-stop" className="fs-xl me-1" />
            Stop
          </Button>
          <Button variant="dark">
            <Icon icon="bolt" className="fs-xl me-1" />
            Boost
          </Button>

          <Button variant="outline-info">
            <Icon icon="credit-card" className="fs-xl me-1" />
            Payment
          </Button>
          <Button variant="danger">
            <Icon icon="tools" className="fs-xl me-1" />
            Tools
          </Button>
        </div>

        <div className="d-flex flex-wrap gap-2 mt-3">
          <Button variant="outline-secondary" size="sm" className="btn-icon">
            <Icon icon="star" />
          </Button>
          <Button variant="primary" size="sm" className="btn-icon">
            <Icon icon="leaf" />
          </Button>
          <Button variant="success" size="sm" className="btn-icon rounded-circle">
            <Icon icon="settings" />
          </Button>
          <Button variant="outline-secondary" size="lg" className="btn-icon">
            <Icon icon="bell" className="fs-xxl" />
          </Button>
          <Button variant="primary" size="lg" className="btn-icon rounded-circle">
            <Icon icon="rocket" className="fs-xxl" />
          </Button>
          <Button variant="success" size="lg" className="btn btn-icon rounded-circle">
            <Icon icon="share" className="fs-xxl" />
          </Button>
          <Button variant="info" size="lg" className="btn-icon">
            <Icon icon="star" className="fs-xxl" />
          </Button>
          <Button variant="warning" size="lg" className="btn-icon">
            <Icon icon="alert-octagon" className="fs-xxl" />
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

const ButtonGroup = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Button Group</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Group multiple buttons together by wrapping them with the <code>.btn</code> class inside a <code>.btn-group</code> container. This helps align buttons side by side with consistent spacing and styling.
        </p>
        <div className="btn-group mb-2">
          <Button variant="light">Left</Button>
          <Button variant="light">Middle</Button>
          <Button variant="light">Right</Button>
        </div>
        <br />
        <div className="btn-group mb-2">
          <Button variant="light">1</Button>
          <Button variant="light">2</Button>
          <Button variant="light">3</Button>
          <Button variant="light">4</Button>
        </div>
        &nbsp;
        <div className="btn-group mb-2">
          <Button variant="light">5</Button>
          <Button variant="light">6</Button>
          <Button variant="light">7</Button>
        </div>
        &nbsp;
        <div className="btn-group mb-2">
          <Button variant="light">8</Button>
        </div>
        <br />
        <div className="btn-group mb-2">
          <Button variant="light">1</Button>
          <Button variant="primary">2</Button>
          <Button variant="light">3</Button>
          <div className="btn-group">
            <Dropdown>
              <DropdownToggle variant="light">
                Dropdown <span className="caret" />
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem href="#">Dropdown link</DropdownItem>
                <DropdownItem href="#">Dropdown link</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <Row>
          <Col md={3}>
            <div className="btn-group-vertical mb-2">
              <Button variant="light">Top</Button>
              <Button variant="light">Middle</Button>
              <Button variant="light">Bottom</Button>
            </div>
          </Col>
          <Col md={3}>
            <div className="btn-group-vertical mb-2">
              <Button variant="light">Button 1</Button>
              <Button variant="light">Button 2</Button>
              <Dropdown>
                <DropdownToggle type="button" variant="light">
                  Button 3 <span className="caret" />
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem href="#">Dropdown link</DropdownItem>
                  <DropdownItem href="#">Dropdown link</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}
