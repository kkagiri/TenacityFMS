import logoSm from '@/assets/images/logo-sm.png'
import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Form, FormSelect, Toast, ToastBody, ToastContainer, ToastHeader } from 'react-bootstrap'
import { useToggle } from 'usehooks-ts'
const BasicNotifications = () => {
  const [show, ToggleShow] = useToggle(true)
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Basic</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">Toasts are as flexible as you need and have very little required markup. At a minimum, we require a single element to contain your “toasted” content and strongly encourage a dismiss button.</p>
        <div className="p-3">
          <Toast className="fade" show={show} onClose={ToggleShow}>
            <ToastHeader>
              <img src={logoSm} alt="brand-logo" height="16" className="me-1" />
              <strong className="me-auto text-body">BRAND</strong>
              <small>11 mins ago</small>
            </ToastHeader>
            <ToastBody>Hello, world! This is a toast message.</ToastBody>
          </Toast>
        </div>
      </CardBody>
    </Card>
  )
}
const PlacementNotifications = () => {
  const [tostShow, ToggleShow] = useToggle(true)
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Placement</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">
          Place toasts with custom CSS as you need them. The top right is often used for notifications, as is the top middle. If you&apos;re only ever going to show one toast at a time, put the positioning styles right on the <code>.toast</code>.
        </p>
        <div className="p-3">
          <div
            aria-live="polite"
            aria-atomic="true"
            className="d-flex justify-content-center align-items-center"
            style={{
              minHeight: '200px',
            }}
          >
            <Toast className="fade" show={tostShow} onClose={ToggleShow}>
              <ToastHeader>
                <img src={logoSm} alt="brand-logo" height="16" className="me-1" />
                <strong className="me-auto text-body">BRAND</strong>
                <small>11 mins ago</small>
              </ToastHeader>
              <ToastBody>Hello, world! This is a toast message.</ToastBody>
            </Toast>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
const PlacementSelectorNotifications = () => {
  const [position, setPosition] = useState('top-start')
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Placement</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">
          Place toasts with custom CSS as you need them. The top right is often used for notifications, as is the top middle. If you’re only ever going to show one toast at a time, put the positioning styles right on the
          <code>.toast</code>.
        </p>
        <Form>
          <div className="mb-3">
            <label htmlFor="selectToastPlacement">Toast placement</label>
            <FormSelect className="mt-2" onChange={(e) => setPosition(e?.currentTarget.value)} id="selectToastPlacement">
              <option>Select a position...</option>
              <option value="top-start">Top left</option>
              <option value="top-center">Top center</option>
              <option value="top-end">Top right</option>
              <option value="middle-start">Middle left</option>
              <option value="middle-center">Middle center</option>
              <option value="middle-end">Middle right</option>
              <option value="bottom-start">Bottom left</option>
              <option value="bottom-center">Bottom center</option>
              <option value="bottom-end">Bottom right</option>
            </FormSelect>
          </div>
        </Form>
        <div
          aria-live="polite"
          aria-atomic="true"
          className="bg-light position-relative"
          style={{
            minHeight: 350,
          }}
        >
          <ToastContainer position={position} className="position-absolute p-3" id="toastPlacement">
            <Toast>
              <ToastHeader closeButton>
                <img className="me-1" src={logoSm} alt="logo-dark" height={16} />
                &nbsp;
                <strong className="me-auto text-body">BRAND</strong>
                <small>11 mins ago</small>
              </ToastHeader>
              <ToastBody>Hello, world! This is a toast message.</ToastBody>
            </Toast>
          </ToastContainer>
        </div>
      </CardBody>
    </Card>
  )
}
const LiveToast = () => {
  const [isShow, ToggleShow] = useToggle(false)
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Live Toast</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">Click the button below to show a toast (positioned with our utilities in the Toop Right corner) that has been hidden by default.</p>
        <Button variant="primary" onClick={ToggleShow}>
          Show live toast
        </Button>
        <ToastContainer className="position-fixed top-0 end-0 p-3">
          <Toast onClose={ToggleShow} show={isShow} delay={3000} autohide>
            <ToastHeader>
              <img src={logoSm} alt="brand-logo" height={16} className="me-1" />
              <strong className="me-auto text-body">BRAND</strong>
              <small>11 mins ago</small>
            </ToastHeader>
            <ToastBody>Hello, world! This is a toast message.</ToastBody>
          </Toast>
        </ToastContainer>
      </CardBody>
    </Card>
  )
}
const Translucent = () => {
  const [isShow, ToggleShow] = useToggle(true)
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Translucent</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">Toasts are slightly translucent, too, so they blend over whatever they might appear over. For browsers that support the backdrop-filter CSS property, we&apos;ll also attempt to blur the elements under a toast.</p>

        <div className="p-3 bg-light bg-opacity-50">
          <Toast className="fade" onClose={ToggleShow} autohide delay={8000} show={isShow} role="alert" aria-live="assertive" aria-atomic="true">
            <ToastHeader>
              <img src={logoSm} alt="brand-logo" height={16} className="me-1" />
              <strong className="me-auto text-body">BRAND</strong>
              <small>11 mins ago</small>
            </ToastHeader>
            <ToastBody>Hello, world! This is a toast message.</ToastBody>
          </Toast>
        </div>
      </CardBody>
    </Card>
  )
}
const Stacking = () => {
  const [isShow1, ToggleShow1] = useToggle(true)
  const [isShow2, ToggleShow2] = useToggle(true)
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Stacking</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">When you have multiple toasts, we default to vertiaclly stacking them in a readable manner.</p>
        <div className="p-3">
          <div
            aria-live="polite"
            aria-atomic="true"
            style={{
              position: 'relative',
              minHeight: 200,
            }}
          >
            <ToastContainer
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
              }}
            >
              <Toast show={isShow1} onClose={ToggleShow1} className="fade">
                <ToastHeader>
                  <img src={logoSm} alt="brand-logo" height={16} className="me-1" />
                  <strong className="me-auto text-body">BRAND</strong>
                  <small className="text-muted">just now</small>
                </ToastHeader>
                <ToastBody>See? Just like this.</ToastBody>
              </Toast>
              <Toast delay={2000} show={isShow2} onClose={ToggleShow2} className="fade">
                <ToastHeader>
                  <img src={logoSm} alt="brand-logo" height={16} className="me-1" />
                  <strong className="me-auto text-body">BRAND</strong>
                  <small className="text-muted">2 seconds ago</small>
                </ToastHeader>
                <ToastBody>Heads up, toasts will stack automatically</ToastBody>
              </Toast>
            </ToastContainer>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
const Customcontent = () => {
  const [isOpenCustom1, toggleCustom1] = useToggle(true)
  const [isOpenCustom2, toggleCustom2] = useToggle(true)
  const [isOpenCustom3, toggleCustom3] = useToggle(true)
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Custom content</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <Toast show={isOpenCustom1} onClose={toggleCustom1} className="align-items-center mb-2">
          <div className="d-flex">
            <ToastBody>Hello, world! This is a toast message.</ToastBody>
            <button className="btn-close me-2 m-auto" onClick={toggleCustom1}></button>
          </div>
        </Toast>
        <Toast show={isOpenCustom2} onClose={toggleCustom2} className="align-items-center text-white bg-primary border-0 mb-2">
          <div className="d-flex">
            <ToastBody>Hello, world! This is a toast message.</ToastBody>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={toggleCustom2}></button>
          </div>
        </Toast>
        <Toast show={isOpenCustom3} onClose={toggleCustom3} className="mb-2" role="alert" aria-live="assertive" aria-atomic="true">
          <ToastBody>
            Hello, world! This is a toast message.
            <div className="mt-2 pt-2 border-top">
              <Button type="button" className="btn btn-primary btn-sm">
                Take action
              </Button>
              <Button type="button" className="btn btn-secondary btn-sm ms-1" onClick={toggleCustom3}>
                Close
              </Button>
            </div>
          </ToastBody>
        </Toast>
      </CardBody>
    </Card>
  )
}
const AllToast = () => {
  return (
    <>
      <Col lg={6}>
        <BasicNotifications />
        <PlacementNotifications />
        <PlacementSelectorNotifications />
      </Col>

      <Col lg={6}>
        <LiveToast />
        <Translucent />
        <Stacking />
        <Customcontent />
      </Col>
    </>
  )
}
export default AllToast
