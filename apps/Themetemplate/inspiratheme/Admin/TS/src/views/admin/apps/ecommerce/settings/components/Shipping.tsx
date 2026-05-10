import { Button, Col, FormControl, FormLabel, FormSelect, Row } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'

const Shipping = () => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="border border-dashed rounded p-4">
      <Row>
        <Col xl={6} className="mb-3">
          <FormLabel>Default Origin</FormLabel>
          <FormControl type="text" placeholder="California, USA" />
        </Col>

        <Col xl={6} className="mb-3">
          <FormLabel>Free Shipping Threshold</FormLabel>
          <FormControl type="number" placeholder="e.g., 100" />
        </Col>

        <Col xl={12} className="mb-3">
          <FormLabel>Available Methods</FormLabel>
          <FormSelect multiple>
            <option>Standard Delivery</option>
            <option>Express</option>
            <option>Pickup</option>
          </FormSelect>
        </Col>
      </Row>

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" type="button" onClick={previousStep}>
          ← Back
        </Button>

        <Button variant="primary" type="button" onClick={nextStep}>
          Next: Payments →
        </Button>
      </div>
    </div>
  )
}

export default Shipping
