import * as Ladda from 'ladda'
import { useRef } from 'react'
import { Button, Card, CardBody, CardHeader, CardTitle, Table } from 'react-bootstrap'
const LaddaButton = ({ variant, children, className = '', ...props }) => {
  const buttonRef = useRef(null)
  const handleClick = () => {
    if (!buttonRef.current) return
    const instance = Ladda.create(buttonRef.current)
    instance.start()
    let progress = 0
    const interval = setInterval(() => {
      progress = Math.min(progress + Math.random() * 0.1, 1)
      instance.setProgress(progress)
      if (progress === 1) {
        instance.stop()
        clearInterval(interval)
      }
    }, 200)
  }
  return (
    <Button ref={buttonRef} variant={variant} className={`ladda-button ${className}`} {...props} onClick={handleClick}>
      {children}
    </Button>
  )
}
const LoadingButtons = () => {
  return (
    <Card>
      <CardHeader className="d-block">
        <CardTitle as="h4" className="mb-1">
          Ladda
        </CardTitle>
        <p className="text-muted mb-0">
          A UI concept which merges loading indicators into the action that invoked them. Primarily intended for use with forms where it gives users immediate feedback upon submit rather than leaving them wondering while the browser does its thing.
        </p>
      </CardHeader>
      <CardBody>
        <Table responsive className="mb-0">
          <tbody>
            <tr>
              <td
                style={{
                  width: '50%',
                }}
              >
                <h5 className="mb-0">Expand Left</h5>
              </td>
              <td>
                <LaddaButton variant="primary" data-style="expand-left">
                  Submit
                </LaddaButton>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-0">Expand Right</h5>
              </td>
              <td>
                <LaddaButton variant="primary" data-style="expand-right">
                  Submit
                </LaddaButton>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-0">Expand Up</h5>
              </td>
              <td>
                <LaddaButton variant="primary" data-style="expand-up">
                  Submit
                </LaddaButton>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-0">Expand Down</h5>
              </td>
              <td>
                <LaddaButton variant="primary" data-style="expand-down">
                  Submit
                </LaddaButton>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-0">Contract</h5>
              </td>
              <td>
                <LaddaButton variant="warning" data-style="contract">
                  Submit
                </LaddaButton>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-0">Zoom In</h5>
              </td>
              <td>
                <LaddaButton variant="warning" data-style="zoom-in">
                  Submit
                </LaddaButton>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-0">Zoom Out</h5>
              </td>
              <td>
                <LaddaButton variant="warning" data-style="zoom-out">
                  Submit
                </LaddaButton>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-0">Slide Left</h5>
              </td>
              <td>
                <LaddaButton variant="info" data-style="slide-left">
                  Submit
                </LaddaButton>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-0">Slide Right</h5>
              </td>
              <td>
                <LaddaButton variant="info" data-style="slide-right">
                  Submit
                </LaddaButton>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-0">Slide Up</h5>
              </td>
              <td>
                <LaddaButton variant="info" data-style="slide-up">
                  Submit
                </LaddaButton>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-0">Slide Down</h5>
              </td>
              <td>
                <LaddaButton variant="info" data-style="slide-down">
                  Submit
                </LaddaButton>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-0">Expand Right (Progress)</h5>
              </td>
              <td>
                <LaddaButton className="btn btn-danger" data-style="expand-right">
                  Submit
                </LaddaButton>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-0">Contract (Progress)</h5>
              </td>
              <td>
                <LaddaButton className="btn btn-danger" data-style="contract">
                  Submit
                </LaddaButton>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-0">Zoom In (API demo)</h5>
              </td>
              <td>
                <LaddaButton className="ladda-button-demo btn btn-primary" data-style="zoom-in">
                  Submit
                </LaddaButton>
              </td>
            </tr>
          </tbody>
        </Table>
      </CardBody>
    </Card>
  )
}
export default LoadingButtons
