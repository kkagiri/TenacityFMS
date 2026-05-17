import { Button, Col, FormCheck, FormControl, FormLabel, FormSelect, Row } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'

const CurrencyAndTax = () => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="border border-dashed rounded p-4">
      <Row>
        <Col xl={6} className="mb-3">
          <FormLabel>Default Currency</FormLabel>
          <FormSelect>
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>INR</option>
          </FormSelect>
        </Col>

        <Col xl={6} className="mb-3">
          <FormLabel>Tax Rate (%)</FormLabel>
          <FormControl type="number" placeholder="e.g., 7.5" />
        </Col>

        <Col xl={12}>
          <FormCheck type="switch" label="Enable Auto Tax Calculation" defaultChecked />
        </Col>
      </Row>

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" type="button" onClick={previousStep}>
          ← Back
        </Button>

        <Button variant="primary" type="button" onClick={nextStep}>
          Next: Shipping →
        </Button>
      </div>
    </div>
  )
}

export default CurrencyAndTax
