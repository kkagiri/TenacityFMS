import { toPascalCase } from '@/utils/helpers'
import { Link } from 'react-router'
import { Button, Card, CardBody, CardHeader, CardTitle, OverlayTrigger, Tooltip } from 'react-bootstrap'

const colorVariants = ['primary', 'danger', 'info', 'success', 'secondary', 'warning', 'dark', 'purple']

export const BasicTooltips = () => {
  return (
    <Card title="Basic">
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Basic</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">Hover over the links below to see tooltips.</p>
        <p className="mb-0">
          Powerful admin features like
          <OverlayTrigger placement="top" overlay={<Tooltip className="danger-tooltip">Manage your dashboard easily</Tooltip>}>
            <Link to="" className="fw-medium" data-bs-title="Manage your dashboard easily">
              custom dashboards
            </Link>
          </OverlayTrigger>
          &nbsp; and UI components help you build scalable web applications efficiently. This template includes pre-built pages, clean layouts, and reusable code blocks to boost your development workflow. From user management to analytics and settings, everything is modular and
          developer-friendly. Create modern admin panels with&nbsp;
          <OverlayTrigger placement="top" overlay={<Tooltip className="danger-tooltip">Built with Bootstrap 5</Tooltip>}>
            <Link to="" className="fw-medium" data-bs-title="Built with Bootstrap 5">
              responsive design
            </Link>
          </OverlayTrigger>
          &nbsp; and seamless UX. Get started quickly with a professional-grade&nbsp;
          <OverlayTrigger placement="top" overlay={<Tooltip className="danger-tooltip">Tailored for developers</Tooltip>}>
            <Link to="" className="fw-medium" data-bs-title="Tailored for developers">
              UI toolkit
            </Link>
          </OverlayTrigger>
          &nbsp; and supercharge your app with&nbsp;
          <OverlayTrigger placement="top" overlay={<Tooltip className="danger-tooltip">Includes charts, tables, forms and more</Tooltip>}>
            <Link to="" className="fw-medium" data-bs-title="Includes charts, tables, forms and more">
              powerful components
            </Link>
          </OverlayTrigger>
          &nbsp; and flexible layouts.
        </p>
      </CardBody>
    </Card>
  )
}

export const DisabledElements = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Disabled Elements</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Elements with the <code>disabled</code> attribute aren’t interactive, meaning users cannot focus, hover, or click them to trigger a tooltip (or popover). As a workaround, you’ll want to trigger the tooltip from a wrapper <code>&lt;div&gt;</code> or{' '}
          <code>&lt;span&gt;</code>, ideally made keyboard-focusable using <code>tabindex={0}</code>, and override the
          <code>pointer-events</code> on the disabled element.
        </p>
        <OverlayTrigger placement="top" overlay={<Tooltip>Disabled tooltip</Tooltip>}>
          <span className="d-inline-block" tabIndex={0} data-bs-title="Disabled tooltip">
            <Button variant="primary" className="pe-none" disabled>
              Disabled button
            </Button>
          </span>
        </OverlayTrigger>
      </CardBody>
    </Card>
  )
}

export const HoverElements = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Hover Elements</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          Elements with the <code>disabled</code> attribute aren’t interactive, meaning users cannot focus, hover, or click them to trigger a tooltip (or popover). As a workaround, you’ll want to trigger the tooltip from a wrapper <code>&lt;div&gt;</code> or{' '}
          <code>&lt;span&gt;</code>, ideally made keyboard-focusable using <code>tabindex={0}</code>, and override the
          <code>pointer-events</code> on the disabled element.
        </p>
        <OverlayTrigger placement="top" overlay={<Tooltip>Tooltip appears on hover only</Tooltip>}>
          <Button variant="primary" data-bs-trigger="hover">
            Hover to See Info
          </Button>
        </OverlayTrigger>
      </CardBody>
    </Card>
  )
}

export const FourDirections = () => {
  return (
    <Card title="Four Directions">
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Four Directions</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">Hover over the buttons below to see the four tooltips directions: top, right, bottom, and left.</p>
        <div className="d-flex flex-wrap gap-2">
          <OverlayTrigger overlay={<Tooltip className="primary-tooltip">Tooltip on top</Tooltip>}>
            <Button variant="info" data-bs-placement="top">
              Tooltip ontop
            </Button>
          </OverlayTrigger>
          <OverlayTrigger placement="bottom" overlay={<Tooltip className="danger-tooltip">Tooltip on bottom</Tooltip>}>
            <Button variant="info" data-bs-placement="bottom">
              Tooltip on bottom
            </Button>
          </OverlayTrigger>
          <OverlayTrigger placement="left" overlay={<Tooltip className="danger-tooltip">Tooltip on left</Tooltip>}>
            <Button variant="info" data-bs-placement="left">
              Tooltip on left
            </Button>
          </OverlayTrigger>
          <OverlayTrigger placement="right" overlay={<Tooltip className="danger-tooltip">Tooltip on right</Tooltip>}>
            <Button variant="info" data-bs-placement="right" data-bs-title="Tooltip on right">
              Tooltip on right
            </Button>
          </OverlayTrigger>
        </div>
      </CardBody>
    </Card>
  )
}

export const HTMLTags = () => {
  return (
    <Card title="HTML Tags">
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">HTML Tags</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">And with custom HTML added:</p>
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip className="danger-tooltip">
              <em>New</em> <u>Tooltip</u> <b>with</b> <i>HTML</i> <br />
              Custom message here!
            </Tooltip>
          }
        >
          <Button variant="secondary" data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="<em>New</em> <u>Tooltip</u> <b>with</b> <i>HTML</i> <br/>Custom message here!">
            Tooltip with HTML
          </Button>
        </OverlayTrigger>
      </CardBody>
    </Card>
  )
}

export const ColorTooltips = () => {
  return (
    <Card title="Color Tooltips">
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Color Tooltips</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">
          We set a custom class with ex.
          <code>data-bs-custom-class=&quot;primary-tooltip&quot;</code> to scope our background-color primary appearance and use it to override a local CSS variable.
        </p>
        <div className="d-flex flex-wrap gap-2">
          {colorVariants.map((color, idx) => {
            return (
              <OverlayTrigger placement="top" key={idx} overlay={<Tooltip className={`tooltip-${color}`}>This top tooltip {color} is themed via CSS variables.</Tooltip>}>
                <Button variant={color}>{toPascalCase(color)} tooltip</Button>
              </OverlayTrigger>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}
