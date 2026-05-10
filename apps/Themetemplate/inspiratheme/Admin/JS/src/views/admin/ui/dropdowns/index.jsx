import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Container, Dropdown, DropdownDivider, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle, Form, FormCheck, FormControl, FormLabel, Row } from 'react-bootstrap'
import FormCheckInput from 'react-bootstrap/esm/FormCheckInput'
import FormCheckLabel from 'react-bootstrap/esm/FormCheckLabel'
import { Link } from 'react-router'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Dropdowns" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col xl={12}>
            <Card>
              <CardHeader>
                <CardTitle as={'h4'}>Examples</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-muted">Toggle contextual overlays for displaying lists of links and more with the Bootstrap dropdown plugin.</p>
                <Link className="btn btn-link p-0 fw-semibold" to="https://react-bootstrap.netlify.app/docs/components/dropdowns" target="_blank">
                  Dropdowns on React Bootstrap
                  <Icon icon="chevron-right" className="ms-1" />
                </Link>
              </CardBody>
            </Card>
            <SingleButtonDropdowns />
          </Col>
          <Col xl={12}>
            <MenuAlignment />
          </Col>
          <Col xl={12}>
            <CustomDropdownArrow />
          </Col>
          <Col xl={12}>
            <SplitButtonDropdowns />
          </Col>
          <Col xl={12}>
            <VariantDropDowns />
          </Col>
          <Col xl={12}>
            <Sizing />
          </Col>
          <Col xl={12}>
            <DropupVariation />
          </Col>
          <Col xl={12}>
            <DropstartVariation />
          </Col>
          <Col xl={12}>
            <DropendVariation />
          </Col>
          <Col xl={12}>
            <ActiveItem />
          </Col>
          <Col xl={12}>
            <DisabledItem />
          </Col>
          <Col xl={12}>
            <Headers />
          </Col>
          <Col xl={12}>
            <DarkDropdowns />
          </Col>
          <Col xl={12}>
            <CenteredDropdowns />
          </Col>
          <Col xl={12}>
            <DropdownOptions />
          </Col>
          <Col xl={12}>
            <AutoCloseBehavior />
          </Col>
          <Col xl={12}>
            <Text />
          </Col>
          <Col xl={12}>
            <FormsDropdown />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
const colorVariants = [
  {
    name: 'Primary',
    variant: 'btn-primary',
  },
  {
    name: 'Secondary',
    variant: 'btn-light',
  },
  {
    name: 'Success',
    variant: 'btn-soft-success',
  },
  {
    name: 'Info',
    variant: 'btn-info',
  },
  {
    name: 'Warning',
    variant: 'btn-warning',
  },
  {
    name: 'Danger',
    variant: 'btn-danger',
  },
]
const SingleButtonDropdowns = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Single Button Dropdowns</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Any single <code>.btn</code> can be turned into a dropdown toggle with some markup changes. Here’s how you can put them to work with either&nbsp;
          <code>&lt;button&gt;</code>&nbsp; elements:
        </p>
        <Row>
          <Col xs="auto">
            <Dropdown>
              <DropdownToggle as={'button'} className="btn btn-light">
                Choose Option
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem href="#">Profile Settings</DropdownItem>
                <DropdownItem href="#">Notifications</DropdownItem>
                <DropdownItem href="#">Logout</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </Col>
          <Col xs="auto">
            <Dropdown>
              <DropdownToggle as={'button'} className="btn btn-primary">
                Quick Actions
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem href="#">Create New</DropdownItem>
                <DropdownItem href="#">Upload File</DropdownItem>
                <DropdownItem href="#">View Reports</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}
const MenuAlignment = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex-grow-1">
            <CardTitle as="h4">Menu Alignment</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-muted">
            Add <code>.dropdown-menu-end</code>&nbsp; to a <code>.dropdown-menu</code> to right align the dropdown menu.
          </p>
          <Dropdown>
            <DropdownToggle variant="light">Right-aligned menu</DropdownToggle>
            <DropdownMenu align={'end'}>
              <DropdownItem href="#">Action</DropdownItem>
              <DropdownItem href="#">Another action</DropdownItem>
              <DropdownItem href="#">Something else here</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </CardBody>
      </Card>
    </>
  )
}
const CustomDropdownArrow = () => {
  return (
    <>
      <Card title="Custom Dropdown Arrow">
        <CardHeader>
          <div className="flex-grow-1">
            <CardTitle as="h4">Custom Dropdown Arrow</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-muted">
            Any single <code>.btn</code> can be turned into a dropdown toggle with some markup changes. Here’s how you can put them to work with either
            <code>&lt;button&gt;</code>
            elements:
          </p>
          <Row>
            <Col xs="auto">
              <Dropdown>
                <DropdownToggle variant="primary" className="drop-arrow-none">
                  Without Arrow
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem href="#">Download Report</DropdownItem>
                  <DropdownItem href="#">View Analytics</DropdownItem>
                  <DropdownItem href="#">Export Data</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </Col>
            <Col xs="auto">
              <Dropdown>
                <DropdownToggle variant="outline-primary" className="drop-arrow-none">
                  {' '}
                  Custome Icon
                  <Icon icon="chevron-down" className="ms-1" />
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem href="#">Edit Profile</DropdownItem>
                  <DropdownItem href="#">Account Settings</DropdownItem>
                  <DropdownItem href="#">Sign Out</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </>
  )
}
const SplitButtonDropdowns = () => {
  return (
    <>
      <Card title="Split Button Dropdowns">
        <CardHeader>
          <div className="flex-grow-1">
            <CardTitle as="h4">Split Button Dropdowns</CardTitle>
          </div>
        </CardHeader>

        <CardBody>
          <p className="text-muted">
            Similarly, create split button dropdowns with virtually the same markup as single button dropdowns, but with the addition of
            <code>.dropdown-toggle-split</code> for proper spacing around the dropdown caret.
          </p>
          <div className="d-flex flex-wrap gap-2">
            {colorVariants.slice(0, 6).map((item, idx) => {
              return (
                <Dropdown className="btn-group" key={idx}>
                  <Button className={`btn ${item.variant}`}>{item.name}</Button>
                  <DropdownToggle split className={`btn ${item.variant} drop-arrow-none`}>
                    <Icon icon="chevron-down" />
                  </DropdownToggle>
                  &nbsp;
                  <DropdownMenu>
                    <DropdownItem>Action</DropdownItem>
                    <DropdownItem>Another action</DropdownItem>
                    <DropdownItem>Something else here</DropdownItem>
                    <DropdownDivider />
                    <DropdownItem>Separated link</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              )
            })}
          </div>
        </CardBody>
      </Card>
    </>
  )
}
const VariantDropDowns = () => {
  return (
    <>
      <Card title="Variant">
        <CardHeader>
          <div className="flex-grow-1">
            <CardTitle as="h4">Variant</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-muted">The best part is you can do this with any button variant, too:</p>
          <div className="d-flex flex-wrap gap-2">
            {colorVariants.slice(0, 6).map((item, idx) => {
              return (
                <Dropdown className="btn-group mb-2" key={idx}>
                  <DropdownToggle as={'button'} className={`btn ${item.variant}`}>
                    {item.name}
                  </DropdownToggle>
                  &nbsp;
                  <DropdownMenu>
                    <DropdownItem>Action</DropdownItem>
                    <DropdownItem>Another action</DropdownItem>
                    <DropdownItem>Something else here</DropdownItem>
                    <DropdownDivider />
                    <DropdownItem>Separated link</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              )
            })}
          </div>
        </CardBody>
      </Card>
    </>
  )
}
const Sizing = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex-grow-1">
            <CardTitle as="h4">Sizing</CardTitle>
          </div>
        </CardHeader>

        <CardBody>
          <p className="text-muted">Button dropdowns work with buttons of all sizes, including default and split dropdown buttons.</p>
          <div className="d-flex flex-wrap gap-2">
            <Dropdown className="btn-group">
              <DropdownToggle variant="light" size="lg">
                Large button
              </DropdownToggle>
              &nbsp;
              <DropdownMenu>
                <DropdownItem>Action</DropdownItem>
                <DropdownItem>Another action</DropdownItem>
                <DropdownItem>Something else here</DropdownItem>
                <DropdownDivider />
                <DropdownItem>Separated link</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown className="btn-group">
              <button className="btn btn-light btn-lg" type="button">
                Large button
              </button>
              <DropdownToggle variant="light" size="lg" split>
                <span className="visually-hidden">Toggle Dropdown</span>
              </DropdownToggle>
              &nbsp;
              <DropdownMenu>
                <DropdownItem>Action</DropdownItem>
                <DropdownItem>Another action</DropdownItem>
                <DropdownItem>Something else here</DropdownItem>
                <DropdownDivider />
                <DropdownItem>Separated link</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown className="btn-group">
              <DropdownToggle variant="light" size="sm">
                Small button
              </DropdownToggle>
              &nbsp;
              <DropdownMenu>
                <DropdownItem>Action</DropdownItem>
                <DropdownItem>Another action</DropdownItem>
                <DropdownItem>Something else here</DropdownItem>
                <DropdownDivider />
                <DropdownItem>Separated link</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown className="btn-group">
              <Button variant="light" size="sm">
                Small button
              </Button>
              <DropdownToggle variant="light" size="sm" split>
                <span className="visually-hidden">Toggle Dropdown</span>
              </DropdownToggle>
              &nbsp;
              <DropdownMenu>
                <DropdownItem>Action</DropdownItem>
                <DropdownItem>Another action</DropdownItem>
                <DropdownItem>Something else here</DropdownItem>
                <DropdownDivider />
                <DropdownItem>Separated link</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
const DropupVariation = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex-grow-1">
            <CardTitle as="h4">Dropup Variation</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-muted">
            Trigger dropdown menus above elements by adding <code>.dropup</code> to the parent element.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <Dropdown drop="up" className="btn-group dropup">
              <DropdownToggle variant="light">Dropup</DropdownToggle>
              &nbsp;
              <DropdownMenu>
                <DropdownItem>Action</DropdownItem>
                <DropdownItem>Another action</DropdownItem>
                <DropdownItem>Something else here</DropdownItem>
                <DropdownDivider />
                <DropdownItem>Separated link</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown drop="up" className="btn-group dropup">
              <Button variant="light">Split dropup</Button>
              <DropdownToggle variant="light" split>
                <span className="visually-hidden">Toggle Dropdown</span>
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem>Action</DropdownItem>
                <DropdownItem>Another action</DropdownItem>
                <DropdownItem>Something else here</DropdownItem>
                <DropdownDivider />
                <DropdownItem>Separated link</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
const DropstartVariation = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex-grow-1">
            <CardTitle as="h4">Dropstart Variation</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-muted">
            Trigger dropdown menus at the right of the elements by adding
            <code>.dropleft</code> to the parent element.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <Dropdown drop="start">
              <DropdownToggle className="btn-secondary">Dropstart</DropdownToggle>
              &nbsp;
              <DropdownMenu>
                <DropdownItem>Action</DropdownItem>
                <DropdownItem>Another action</DropdownItem>
                <DropdownItem>Something else here</DropdownItem>
                <DropdownDivider />
                <DropdownItem>Separated link</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown drop="start" className="btn-group">
              <DropdownToggle className="btn btn-secondary" split variant="secondary">
                <span className="visually-hidden">Toggle Dropdown</span>
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem>Action</DropdownItem>
                <DropdownItem>Another action</DropdownItem>
                <DropdownItem>Something else here</DropdownItem>
                <DropdownDivider />
                <DropdownItem>Separated link</DropdownItem>
              </DropdownMenu>
              <Button variant="secondary">Split Dropstart</Button>
            </Dropdown>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
const DropendVariation = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex-grow-1">
            <CardTitle as="h4">Dropend Variation</CardTitle>
          </div>
        </CardHeader>

        <CardBody>
          <p className="text-muted">
            Trigger dropdown menus at the right of the elements by adding
            <code>.dropend</code> to the parent element.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <Dropdown drop="end">
              <DropdownToggle variant="primary">Dropend</DropdownToggle>
              &nbsp;
              <DropdownMenu>
                <DropdownItem>Action</DropdownItem>
                <DropdownItem>Another action</DropdownItem>
                <DropdownItem>Something else here</DropdownItem>
                <DropdownDivider />
                <DropdownItem>Separated link</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown drop="end" className="btn-group">
              <Button variant="primary">Split Dropend</Button>
              <DropdownToggle variant="primary" split>
                <span className="visually-hidden">Toggle Dropright</span>
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem>Action</DropdownItem>
                <DropdownItem>Another action</DropdownItem>
                <DropdownItem>Something else here</DropdownItem>
                <DropdownDivider />
                <DropdownItem>Separated link</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
const ActiveItem = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Active Item</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Add <code>.active</code> to item in the dropdown to <strong>style them as active</strong>.
        </p>
        <Dropdown className="btn-group">
          <DropdownToggle variant="secondary">Active Item</DropdownToggle>
          <DropdownMenu>
            <DropdownItem>Regular link</DropdownItem>
            <DropdownItem active>Active link</DropdownItem>
            <DropdownItem>Another link</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardBody>
    </Card>
  )
}
const DisabledItem = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Disabled Item</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Add <code>.disabled</code> to items in the dropdown to
          <strong>style them as disabled</strong>.
        </p>
        <Dropdown className="btn-group">
          <DropdownToggle variant="primary">Disabled</DropdownToggle>
          <DropdownMenu>
            <DropdownItem>Regular link</DropdownItem>
            <DropdownItem disabled>Disabled link</DropdownItem>
            <DropdownItem>Another link</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardBody>
    </Card>
  )
}
const Headers = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Headers</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">Add a header to label sections of actions in any dropdown menu.</p>
        <Dropdown className="btn-group">
          <DropdownToggle variant="secondary">Header</DropdownToggle>
          <DropdownMenu>
            <DropdownHeader as={'h6'}>Dropdown header</DropdownHeader>
            <DropdownItem>Action</DropdownItem>
            <DropdownItem>Another action</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardBody>
    </Card>
  )
}
const DarkDropdowns = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Dark dropdowns</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Opt into darker dropdowns to match a dark navbar or custom style by adding <code>.dropdown-menu-dark</code> onto an existing
          <code>.dropdown-menu</code>. No changes are required to the dropdown items.
        </p>
        <Dropdown>
          <DropdownToggle variant="dark">Dark Dropdown</DropdownToggle>
          <DropdownMenu data-bs-theme="dark">
            <DropdownItem active>Action</DropdownItem>
            <DropdownItem href="">Another action</DropdownItem>
            <DropdownItem href="">Something else here</DropdownItem>
            <DropdownDivider />
            <DropdownItem href="">Separated link</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardBody>
    </Card>
  )
}
const CenteredDropdowns = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Centered dropdowns</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Make the dropdown menu centered below the toggle with
          <code>.dropdown-center</code> on the parent element.
        </p>
        <div className="hstack gap-2">
          <Dropdown drop="down-centered">
            <DropdownToggle variant="secondary">Centered dropdown</DropdownToggle>
            <DropdownMenu>
              <DropdownItem>Action</DropdownItem>
              <DropdownItem>Action two</DropdownItem>
              <DropdownItem>Action three</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Dropdown drop="up-centered">
            <DropdownToggle variant="secondary">Centered dropup</DropdownToggle>
            <DropdownMenu>
              <DropdownItem>Action</DropdownItem>
              <DropdownItem>Action two</DropdownItem>
              <DropdownItem>Action three</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </CardBody>
    </Card>
  )
}
const DropdownOptions = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex-grow-1">
            <CardTitle as="h4">Dropdown Options</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-muted">
            Use <code>data-bs-offset</code> or <code>data-bs-reference</code>
            to change the location of the dropdown.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <Dropdown drop="end" className="btn-group">
              <DropdownToggle variant="secondary">Offset</DropdownToggle>
              &nbsp;
              <DropdownMenu>
                <DropdownItem>Profile Settings</DropdownItem>
                <DropdownItem>Privacy Settings</DropdownItem>
                <DropdownItem>Notification Preferences</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown drop="end" className="btn-group">
              <Button variant="secondary">Reference</Button>
              <DropdownToggle split variant="secondary">
                <span className="visually-hidden">Toggle Dropdown</span>
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem>Manage Subscription</DropdownItem>
                <DropdownItem>Account Preferences</DropdownItem>
                <DropdownItem>Help & Support</DropdownItem>
                <DropdownDivider />
                <DropdownItem>Log Out</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
const AutoCloseBehavior = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Auto close behavior</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          By default, the dropdown menu is closed when clicking inside or outside the dropdown menu. You can use the <code>autoClose</code> option to change this behavior of the dropdown.
        </p>
        <div className="hstack gap-2">
          <Dropdown autoClose className="btn-group">
            <DropdownToggle variant="secondary">Default dropdown</DropdownToggle>
            <DropdownMenu>
              <DropdownItem>Menu item</DropdownItem>
              <DropdownItem>Menu item</DropdownItem>
              <DropdownItem>Menu item</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Dropdown autoClose="outside" className="btn-group">
            <DropdownToggle variant="secondary">Clickable inside</DropdownToggle>
            <DropdownMenu>
              <DropdownItem>Menu item</DropdownItem>
              <DropdownItem>Menu item</DropdownItem>
              <DropdownItem>Menu item</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Dropdown autoClose="inside" className="btn-group">
            <DropdownToggle variant="secondary">Clickable outside</DropdownToggle>
            <DropdownMenu>
              <DropdownItem>Menu item</DropdownItem>
              <DropdownItem>Menu item</DropdownItem>
              <DropdownItem>Menu item</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Dropdown autoClose="inside" className="btn-group">
            <DropdownToggle variant="secondary">Manual close</DropdownToggle>
            <DropdownMenu>
              <DropdownItem>Menu item</DropdownItem>
              <DropdownItem>Menu item</DropdownItem>
              <DropdownItem>Menu item</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </CardBody>
    </Card>
  )
}
const Text = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Text</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">Place any freeform text within a dropdown menu with text and use spacing utilities. Note that you’ll likely need additional sizing styles to constrain the menu width.</p>
        <Dropdown className="btn-group">
          <DropdownToggle variant="primary">Text Dropdown</DropdownToggle>
          <DropdownMenu
            className="p-3 text-muted"
            style={{
              maxWidth: 200,
            }}
          >
            <p>Some example text that&apos;s free-flowing within the dropdown menu.</p>
            <p className="mb-0">And this is more example text.</p>
          </DropdownMenu>
        </Dropdown>
      </CardBody>
    </Card>
  )
}
const FormsDropdown = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Forms</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">Put a form within a dropdown menu, or make it into a dropdown menu, and use margin or padding utilities to give it the negative space you require.</p>
        <Dropdown>
          <DropdownToggle variant="secondary">Form</DropdownToggle>
          <DropdownMenu>
            <Form className="px-4 py-3">
              <div className="mb-3">
                <FormLabel htmlFor="exampleDropdownFormEmail1">Email address</FormLabel>
                <FormControl type="email" id="exampleDropdownFormEmail1" placeholder="email@example.com" />
              </div>
              <div className="mb-3">
                <FormLabel htmlFor="exampleDropdownFormPassword1">Password</FormLabel>
                <FormControl type="password" id="exampleDropdownFormPassword1" placeholder="Password" />
              </div>
              <div className="mb-2">
                <FormCheck>
                  <FormCheckInput type="checkbox" id="dropdownCheck" />
                  <FormCheckLabel htmlFor="dropdownCheck">Remember me</FormCheckLabel>
                </FormCheck>
              </div>
              <Button variant="primary" type="submit">
                Sign in
              </Button>
            </Form>
            <DropdownDivider />
            <DropdownItem>New around here? Sign up</DropdownItem>
            <DropdownItem>Forgot password?</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardBody>
    </Card>
  )
}
