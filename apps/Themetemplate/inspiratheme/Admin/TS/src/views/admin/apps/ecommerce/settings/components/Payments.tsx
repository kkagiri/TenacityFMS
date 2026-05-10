import { Button, Col, FormCheck, FormControl, FormLabel, Row } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'

const Payments = () => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="border border-dashed rounded p-4">
      <Row>
        <Col xl={6} className="mb-3">
          <FormCheck type="switch" label="Enable Stripe" defaultChecked />
        </Col>

        <Col xl={6} className="mb-3">
          <FormCheck type="switch" label="Enable PayPal" />
        </Col>

        <Col xl={6} className="mb-3">
          <FormLabel>Stripe Key</FormLabel>
          <FormControl type="text" placeholder="pk_live_..." />
        </Col>

        <Col xl={6} className="mb-3">
          <FormLabel>PayPal Client ID</FormLabel>
          <FormControl type="text" placeholder="e.g., Abcd1234" />
        </Col>
      </Row>

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" type="button" onClick={previousStep}>
          ← Back
        </Button>

        <Button variant="primary" type="button" onClick={nextStep}>
          Next: Notifications →
        </Button>
      </div>
    </div>
  )
}

export default Payments
