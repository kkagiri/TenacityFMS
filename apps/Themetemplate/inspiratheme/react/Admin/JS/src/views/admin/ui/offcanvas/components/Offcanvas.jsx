import { Button, Card, CardBody, CardHeader, CardTitle, Offcanvas, OffcanvasBody, OffcanvasHeader, OffcanvasTitle } from 'react-bootstrap'
import { useToggle } from 'usehooks-ts'
const backdropOptions = [
  {
    name: 'Enable body scrolling',
    scroll: true,
    backdrop: false,
    variant: 'primary',
  },
  {
    name: 'Enable backdrop (default)',
    scroll: false,
    backdrop: true,
    variant: 'secondary',
  },
  {
    name: 'Enable both scrolling & backdrop',
    scroll: true,
    backdrop: true,
    variant: 'success',
  },
]
const placementOptions = [
  {
    name: 'Left',
    placement: 'start',
    variant: 'primary',
  },
  {
    name: 'Right',
    placement: 'end',
    variant: 'secondary',
  },
  {
    name: 'Top',
    placement: 'top',
    variant: 'success',
  },
  {
    name: 'Bottom',
    placement: 'bottom',
    variant: 'info',
  },
]
export default Offcanvas
export const DefaultOffcanvas = () => {
  const [isTrue, ToggleShow] = useToggle(false)
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle>Offcanvas</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted fs-base">
          You can trigger an offcanvas using a button. React-Bootstrap manages the toggle via the <code>show</code> prop and <code>onHide</code> callback.
        </p>

        <div className="d-flex flex-wrap gap-2">
          <Button variant="primary" onClick={ToggleShow}>
            Link with href
          </Button>
          <Button variant="primary" onClick={ToggleShow}>
            data with data-bs-target
          </Button>
        </div>

        <Offcanvas show={isTrue} onHide={ToggleShow} className="offcanvas-start">
          <OffcanvasHeader closeButton>
            <OffcanvasTitle>Offcanvas</OffcanvasTitle>
          </OffcanvasHeader>
          <OffcanvasBody>
            <div>Some text as placeholder. You can put anything here: text, images, lists, etc.</div>
            <h5 className="mt-3">List</h5>
            <ul className="ps-3">
              <li>Nemo enim ipsam voluptatem quia aspernatur</li>
              <li>Neque porro quisquam est, qui dolorem</li>
              <li>Quis autem vel eum iure qui in ea</li>
            </ul>
            <ul className="ps-3">
              <li>At vero eos et accusamus et iusto odio dignissimos</li>
              <li>Et harum quidem rerum facilis</li>
              <li>Temporibus autem quibusdam et aut officiis</li>
            </ul>
          </OffcanvasBody>
        </Offcanvas>
      </CardBody>
    </Card>
  )
}
export const OffcanvasBackdrop = () => {
  const OffCanvasWithBackdrop = ({ name, ...props }) => {
    const [isTrue, toggle] = useToggle()
    return (
      <>
        <Button onClick={toggle} className="mt-2 me-1 mt-md-0">
          {name}
        </Button>
        &nbsp;
        <Offcanvas placement="start" show={isTrue} onHide={toggle} {...props}>
          <OffcanvasHeader closeButton>
            <OffcanvasTitle as="h5" className="mt-0" id="offcanvasScrollingLabel">
              {name}
            </OffcanvasTitle>
          </OffcanvasHeader>
          <OffcanvasBody>
            <div>Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.</div>
            <h5 className="mt-3">List</h5>
            <ul className="ps-3">
              <li>Nemo enim ipsam voluptatem quia aspernatur</li>
              <li>Neque porro quisquam est, qui dolorem</li>
              <li>Quis autem vel eum iure qui in ea</li>
            </ul>
            <ul className="ps-3">
              <li>At vero eos et accusamus et iusto odio dignissimos</li>
              <li>Et harum quidem rerum facilis</li>
              <li>Temporibus autem quibusdam et aut officiis</li>
            </ul>
          </OffcanvasBody>
        </Offcanvas>
      </>
    )
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle>Offcanvas Backdrop</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted fs-base">
          When an offcanvas and its backdrop are visible,
          <code>&lt;body&gt;</code> scrolling is disabled. Use <code>data-bs-scroll</code> to enable scrolling and <code>data-bs-backdrop</code> to control the backdrop visibility.
        </p>
        {backdropOptions.map((offcanvas, idx) => (
          <OffCanvasWithBackdrop {...offcanvas} key={idx} />
        ))}
      </CardBody>
    </Card>
  )
}
export const OffcanvasPlacement = () => {
  const OffcanvasPlacement = ({ name, ...props }) => {
    const [isTrue, toggle] = useToggle()
    return (
      <>
        <Button onClick={toggle}>Toggle {name} offcanvas</Button>
        <Offcanvas show={isTrue} onHide={toggle} {...props}>
          <OffcanvasHeader closeButton>
            <OffcanvasTitle as="h5" className="mt-0">
              Offcanvas {name}
            </OffcanvasTitle>
          </OffcanvasHeader>
          <OffcanvasBody>
            <div>Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.</div>
            <h5 className="mt-3">List</h5>
            <ul className="ps-3">
              <li>Nemo enim ipsam voluptatem quia aspernatur</li>
              <li>Neque porro quisquam est, qui dolorem</li>
              <li>Quis autem vel eum iure qui in ea</li>
            </ul>
          </OffcanvasBody>
        </Offcanvas>
      </>
    )
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle>Offcanvas Placement</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <div>
          <div className="d-flex flex-wrap gap-2">
            {placementOptions.map((props, idx) => (
              <OffcanvasPlacement {...props} key={idx} />
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
export const DarkOffcanvas = () => {
  const [isTrue, toggle] = useToggle()
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle>Dark Offcanvas</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted fs-sm">
          Customize the look of offcanvases using utility classes to suit different themes, such as dark navbars. Add <code>.text-bg-dark</code> to
          <code>.offcanvas</code> and <code>.btn-close-white</code> to <code>.btn-close</code>
          for dark styling.
        </p>
        <Button variant="primary" onClick={toggle} className="mt-2 mt-md-0" data-bs-toggle="offcanvas" data-bs-target="#offcanvasDark" aria-controls="offcanvasDark">
          Dark offcanvas
        </Button>
        <Offcanvas show={isTrue} onHide={toggle} className="offcanvas-start text-bg-dark" tabIndex={-1} id="offcanvasDark" aria-labelledby="offcanvasDarkLabel">
          <OffcanvasHeader>
            <h5 id="offcanvasDarkLabel">Dark Offcanvas</h5>
            <Button className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close" />
          </OffcanvasHeader>
          <OffcanvasBody>
            <div>Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.</div>
            <h5 className="mt-3">List</h5>
            <ul className="ps-3">
              <li>Nemo enim ipsam voluptatem quia aspernatur</li>
              <li>Neque porro quisquam est, qui dolorem</li>
              <li>Quis autem vel eum iure qui in ea</li>
            </ul>
          </OffcanvasBody>
        </Offcanvas>
      </CardBody>
    </Card>
  )
}
