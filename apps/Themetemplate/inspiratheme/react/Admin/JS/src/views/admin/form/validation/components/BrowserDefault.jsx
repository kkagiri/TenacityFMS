import { Button, Card, CardBody, CardHeader, CardTitle, Col, Form, FormCheck, FormControl, FormLabel, FormSelect } from 'react-bootstrap'
const BrowserDefault = () => {
  return (
    <>
      <Card>
        <CardHeader className="justify-content-between">
          <CardTitle as="h4">Browser Defaults</CardTitle>
        </CardHeader>
        <CardBody>
          <Form className="row g-3">
            <Col md={4}>
              <FormLabel>First name</FormLabel>
              <input type="text" className="form-control" id="validationDefault01" defaultValue="Mark" required />
            </Col>
            <Col md={4}>
              <FormLabel>Last name</FormLabel>
              <input type="text" className="form-control" id="validationDefault02" defaultValue="Otto" required />
            </Col>
            <Col md={4}>
              <FormLabel>Username</FormLabel>
              <div className="input-group">
                <span className="input-group-text" id="inputGroupPrepend2">
                  @
                </span>
                <input type="text" className="form-control" id="validationDefaultUsername" aria-describedby="inputGroupPrepend2" required />
              </div>
            </Col>
            <Col md={6}>
              <FormLabel>City</FormLabel>
              <input type="text" className="form-control" id="validationDefault03" required />
            </Col>
            <Col md={3}>
              <FormLabel>State</FormLabel>
              <FormSelect id="validationDefault04" required>
                <option value="" disabled>
                  Choose...
                </option>
                <option>...</option>
              </FormSelect>
            </Col>
            <Col md={3}>
              <FormLabel>Zip</FormLabel>
              <FormControl type="text" id="validationDefault05" required />
            </Col>
            <Col xs={12}>
              <FormCheck>
                <input className="form-check-input" type="checkbox" id="invalidCheck2" required />
                &nbsp;
                <label className="form-check-label" htmlFor="invalidCheck2">
                  Agree to terms and conditions
                </label>
              </FormCheck>
            </Col>
            <Col xs={12}>
              <Button variant="primary" type="submit">
                Submit form
              </Button>
            </Col>
          </Form>
        </CardBody>
      </Card>
    </>
  )
}
export default BrowserDefault
