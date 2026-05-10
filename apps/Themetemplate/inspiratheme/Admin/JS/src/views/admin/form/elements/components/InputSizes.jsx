import { Card, CardBody, CardHeader, CardTitle, Col, FormControl, FormSelect, Row } from 'react-bootstrap'
const InputSizes = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex-grow-1">
            <CardTitle as="h4">Input Sizes</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label" htmlFor="example-input-small">
                Small
              </label>
            </Col>
            <Col lg={5}>
              <FormControl size="sm" type="text" id="example-input-small" name="example-input-small" placeholder=".input-sm" />
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label" htmlFor="example-input-normal">
                Normal
              </label>
            </Col>
            <Col lg={5}>
              <FormControl type="text" id="example-input-normal" name="example-input-normal" placeholder="Normal" />
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label" htmlFor="example-input-large">
                Large
              </label>
            </Col>
            <Col lg={5}>
              <FormControl size="lg" type="text" id="example-input-large" name="example-input-large" placeholder=".input-lg" />
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />
          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label" htmlFor="example-gridsize">
                Grid Sizes
              </label>
            </Col>
            <Col lg={5}>
              <Row>
                <Col sm={4}>
                  <FormControl type="text" id="example-gridsize" placeholder=".col-sm-4" />
                </Col>
              </Row>
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Large Select</label>
            </Col>
            <Col lg={5}>
              <FormSelect size="lg">
                <option>Open this select menu</option>
                <option value="1">One</option>
                <option value="2">Two</option>
                <option value="3">Three</option>
              </FormSelect>
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Small Select</label>
            </Col>
            <Col lg={5}>
              <FormSelect size="sm">
                <option>Open this select menu</option>
                mb-2
                <option value="1">One</option>
                <option value="2">Two</option>
                <option value="3">Three</option>
              </FormSelect>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </>
  )
}
export default InputSizes
