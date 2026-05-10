import { Card, CardBody, CardHeader, CardTitle, Col, FloatingLabel, FormControl, FormSelect, Row } from 'react-bootstrap'

const FloatingLabels = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex-grow-1">
            <CardTitle as="h4">Floating Labels</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Email address</label>
            </Col>
            <Col lg={5}>
              <FloatingLabel label="Email address">
                <FormControl type="email" id="floatingInputEmail" placeholder="name@example.com" />
              </FloatingLabel>
            </Col>
          </Row>

          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Password</label>
            </Col>
            <Col lg={5}>
              <FloatingLabel label="Password">
                <FormControl type="password" id="floatingPassword" placeholder="Password" />
              </FloatingLabel>
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Comments</label>
            </Col>
            <Col lg={5}>
              <FloatingLabel label="Comments">
                <FormControl as="textarea" placeholder="Leave a comment here" id="floatingTextarea" style={{ height: '100px' }}></FormControl>
              </FloatingLabel>
            </Col>
          </Row>

          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label htmlFor="floatingSelect" className="col-form-label">
                Select Menu
              </label>
            </Col>
            <Col lg={5}>
              <FloatingLabel label="Works with selects">
                <FormSelect id="floatingSelect" aria-label="Floating label select example">
                  <option>Open this select menu</option>
                  <option value="1">One</option>
                  <option value="2">Two</option>
                  <option value="3">Three</option>
                </FormSelect>
              </FloatingLabel>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </>
  )
}

export default FloatingLabels
