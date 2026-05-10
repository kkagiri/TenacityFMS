import Icon from '@/components/wrappers/Icon'
import { useState } from 'react'
import { Alert, Button, Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
export const LiveAlert = () => {
  const [show, setShow] = useState(false)
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Live Alert</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <Alert className="alert-success" dismissible onClick={() => setShow(false)} id="liveAlertPlaceholder" show={show}>
          Nice, you triggered this alert message!
        </Alert>
        <Button variant="primary" onClick={() => setShow(true)} id="liveAlertBtn">
          Show live alert
        </Button>
      </CardBody>
    </Card>
  )
}
export const CustomButton = () => {
  const [show, setShow] = useState(true)
  return (
    <>
      {show && (
        <Alert variant="warning" className="d-flex align-items-center" role="alert">
          <div>A warning alert with a custom close button!</div>
          <button type="button" className="ms-auto btn btn-sm btn-warning btn-icon rounded-circle" onClick={() => setShow(false)}>
            <Icon icon="x" className="fs-xl" />
          </button>
        </Alert>
      )}
    </>
  )
}
