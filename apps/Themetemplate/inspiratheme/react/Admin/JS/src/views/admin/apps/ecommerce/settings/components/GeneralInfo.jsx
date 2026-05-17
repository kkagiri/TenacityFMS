import { Button, Col, FormControl, FormLabel, Row } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'
const GeneralInfo = () => {
  const { nextStep } = useWizard()
  return (
    <div className="border border-dashed rounded p-4">
      <Row>
        <Col xl={6} className="mb-3">
          <FormLabel>Shop Name</FormLabel>
          <FormControl type="text" placeholder="e.g., Vona Store" required />
        </Col>

        <Col xl={6} className="mb-3">
          <FormLabel>Support Email</FormLabel>
          <FormControl type="email" placeholder="support@vona.com" required />
        </Col>

        <Col xl={6} className="mb-3">
          <FormLabel>Phone</FormLabel>
          <FormControl type="tel" placeholder="+1 234 567 8901" />
        </Col>

        <Col xl={6} className="mb-3">
          <FormLabel>Business Hours</FormLabel>
          <FormControl type="text" placeholder="Mon-Fri, 9 AM - 6 PM" />
        </Col>
      </Row>

      <div className="d-flex justify-content-end mt-3">
        <Button type="button" className="btn btn-primary" onClick={nextStep}>
          Next: Store Details →
        </Button>
      </div>
    </div>
  )
}
export default GeneralInfo
