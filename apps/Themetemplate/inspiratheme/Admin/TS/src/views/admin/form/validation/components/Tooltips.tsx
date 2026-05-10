import Icon from '@/components/wrappers/Icon'
import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Form, FormCheck, FormControl, FormGroup, FormLabel, InputGroup } from 'react-bootstrap'
import Feedback from 'react-bootstrap/esm/Feedback'
import InputGroupText from 'react-bootstrap/esm/InputGroupText'

const Tooltips = () => {
  const [validated, setValidated] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget
    if (!form.checkValidity()) {
      event.preventDefault()
      event.stopPropagation()
    }

    setValidated(true)
  }
  return (
    <>
      <Card>
        <CardHeader className="justify-content-between">
          <CardTitle as="h4">Tooltips</CardTitle>
        </CardHeader>
        <CardBody>
          <Form className="row g-3" noValidate validated={validated} onSubmit={handleSubmit}>
            <Col md={4}>
              <FormGroup className="position-relative">
                <FormLabel>First name</FormLabel>
                <FormControl required type="text" placeholder="First name" defaultValue="Mark" />
                <Feedback tooltip>Looks good!</Feedback>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup className="position-relative">
                <FormLabel>Last name</FormLabel>
                <FormControl required type="text" placeholder="Last name" defaultValue="Otto" />
                <Feedback tooltip>Looks good!</Feedback>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup className="position-relative">
                <FormLabel>Stanford ID</FormLabel>
                <InputGroup hasValidation>
                  <InputGroupText id="inputGroupPrepend">@</InputGroupText>
                  <FormControl type="text" placeholder="Username" aria-describedby="inputGroupPrepend" required />
                  <Feedback type="invalid" tooltip>
                    Please enter a valid Stanford ID.
                  </Feedback>
                </InputGroup>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup className="position-relative">
                <FormLabel>City</FormLabel>
                <FormControl required type="text" placeholder="Palo Alto" defaultValue="Mark" />
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup className="position-relative">
                <FormLabel>Department</FormLabel>
                <Form.Select id="studentDepartment" required>
                  <option value="" disabled>
                    Choose...
                  </option>
                  <option>Computer Science</option>
                  <option>Engineering</option>
                  <option>Biology</option>
                  <option>Economics</option>
                  <option>Psychology</option>
                </Form.Select>
                <Feedback type="invalid" tooltip>
                  Please select your department.
                </Feedback>
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup className="position-relative">
                <FormLabel>Zip</FormLabel>
                <FormControl type="text" placeholder="Zip" required />
                <Feedback type="invalid" tooltip>
                  Please provide a valid zip.
                </Feedback>
              </FormGroup>
            </Col>
            <Col xs={12}>
              <FormGroup>
                <FormCheck required label="I agree to the terms and conditions" feedback="You must agree before submitting." feedbackType="invalid" feedbackTooltip />
              </FormGroup>
            </Col>
            <Col xs={12}>
              <Button variant="primary" type="submit">
                <Icon icon="users-group" className="me-2" /> Submit Enrollment
              </Button>
            </Col>
          </Form>
        </CardBody>
      </Card>
    </>
  )
}

export default Tooltips
