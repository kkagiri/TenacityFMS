import { Button, Col, FormControl, FormLabel, Row } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'

const Branding = () => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="border border-dashed rounded p-4">
      <Row>
        <Col xl={6} className="mb-3">
          <FormLabel>Logo Upload</FormLabel>
          <FormControl type="file" />
        </Col>

        <Col xl={6} className="mb-3">
          <FormLabel>Favicon</FormLabel>
          <FormControl type="file" />
        </Col>

        <Col xl={6} className="mb-3">
          <FormLabel>Primary Color</FormLabel>
          <FormControl type="color" className="form-control-color" defaultValue="#4f46e5" />
        </Col>

        <Col xl={6} className="mb-3">
          <FormLabel>Accent Color</FormLabel>
          <FormControl type="color" className="form-control-color" defaultValue="#22c55e" />
        </Col>
      </Row>

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" type="button" onClick={previousStep}>
          ← Back
        </Button>

        <Button variant="primary" type="button" onClick={nextStep}>
          Next: Currency & Tax →
        </Button>
      </div>
    </div>
  )
}

export default Branding
