import { Button, Col, FormControl, FormLabel, Row } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'

const StoreDetails = () => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="border border-dashed rounded p-4">
      <Row>
        <Col xl={6} className="mb-3">
          <FormLabel>Business Name</FormLabel>
          <FormControl type="text" placeholder="e.g., Acme Retail LLC" />
        </Col>
        <Col xl={6} className="mb-3">
          <FormLabel>Registration Number</FormLabel>
          <FormControl type="text" placeholder="e.g., 123456789" />
        </Col>
        <Col xl={12} className="mb-3">
          <FormLabel>Business Address</FormLabel>
          <textarea className="form-control" rows={2} placeholder="123 Main Street, City, Country" />
        </Col>
      </Row>

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" type="button" onClick={previousStep}>
          ← Back
        </Button>
        <Button variant="primary" type="button" onClick={nextStep}>
          Next: Branding →
        </Button>
      </div>
    </div>
  )
}

export default StoreDetails
