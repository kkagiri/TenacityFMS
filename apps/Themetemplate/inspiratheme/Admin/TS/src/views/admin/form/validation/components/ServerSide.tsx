import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Form, FormCheck, FormControl, FormGroup, FormLabel, InputGroup } from 'react-bootstrap'
import Feedback from 'react-bootstrap/esm/Feedback'
import InputGroupText from 'react-bootstrap/esm/InputGroupText'

const ServerSide = () => {
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
          <CardTitle as="h4">Server-side </CardTitle>
        </CardHeader>
        <CardBody>
          <Form noValidate validated={validated} onSubmit={handleSubmit} className="row g-3">
            <Col md={4}>
              <FormGroup>
                <FormLabel>First name</FormLabel>
                <FormControl required type="text" placeholder="First name" defaultValue="Mark" />
                <Feedback>Looks good!</Feedback>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <FormLabel>Last name</FormLabel>
                <FormControl required type="text" placeholder="Last name" defaultValue="Otto" />
                <Feedback>Looks good!</Feedback>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <FormLabel>Username</FormLabel>
                <InputGroup hasValidation>
                  <InputGroupText id="inputGroupPrepend">@</InputGroupText>
                  <FormControl type="text" placeholder="Username" aria-describedby="inputGroupPrepend" required />
                  <Feedback type="invalid">Please choose a username.</Feedback>
                </InputGroup>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <FormLabel>City</FormLabel>
                <FormControl type="text" placeholder="City" required />
                <Feedback type="invalid">Please provide a valid city.</Feedback>
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <FormLabel>State</FormLabel>
                <FormControl type="text" placeholder="State" required />
                <Feedback type="invalid">Please provide a valid state.</Feedback>
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <FormLabel>Zip</FormLabel>
                <FormControl type="text" placeholder="Zip" required />
                <Feedback type="invalid">Please provide a valid zip.</Feedback>
              </FormGroup>
            </Col>
            <Col sm={12}>
              <FormGroup className="my-3">
                <FormCheck required label="I agree to the terms and conditions" feedback="You must agree before submitting." feedbackType="invalid" />
              </FormGroup>
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

export default ServerSide
