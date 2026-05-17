import { Button, Card, CardBody, CardHeader, CardTitle, Col, Form, FormCheck, FormControl, FormGroup, FormLabel, InputGroup } from 'react-bootstrap'
import Feedback from 'react-bootstrap/esm/Feedback'
import InputGroupText from 'react-bootstrap/esm/InputGroupText'
import { useForm } from 'react-hook-form'
const CustomValidation = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()
  const onSubmit = (data) => {
    console.log('Form Data:', data)
  }
  return (
    <>
      <Card>
        <CardHeader className="justify-content-between">
          <CardTitle as="h4">Custom styles Validation</CardTitle>
        </CardHeader>
        <CardBody>
          <Form noValidate onSubmit={handleSubmit(onSubmit)} className="row g-3">
            <Col md={4}>
              <FormGroup>
                <FormLabel>First name</FormLabel>
                <FormControl
                  type="text"
                  placeholder="John"
                  isInvalid={!!errors.firstName}
                  {...register('firstName', {
                    required: 'First name is required',
                  })}
                />
                <Feedback type="invalid">{errors.firstName?.message}</Feedback>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <FormLabel>Last name</FormLabel>
                <FormControl
                  type="text"
                  placeholder="Doe"
                  isInvalid={!!errors.lastName}
                  {...register('lastName', {
                    required: 'Last name is required',
                  })}
                />
                <Feedback type="invalid">{errors.lastName?.message}</Feedback>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <FormLabel>Username</FormLabel>
                <InputGroup hasValidation>
                  <InputGroupText id="inputGroupPrepend">@</InputGroupText>
                  <FormControl
                    type="text"
                    placeholder="Username"
                    aria-describedby="inputGroupPrepend"
                    isInvalid={!!errors.username}
                    {...register('username', {
                      required: 'Please choose a valid username.',
                    })}
                  />
                  <Feedback type="invalid">{errors.username?.message}</Feedback>
                </InputGroup>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <FormLabel>City</FormLabel>
                <FormControl
                  type="text"
                  placeholder="City"
                  isInvalid={!!errors.city}
                  {...register('city', {
                    required: 'Please provide a valid city name.',
                  })}
                />
                <Feedback type="invalid">{errors.city?.message}</Feedback>
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <FormLabel>State</FormLabel>
                <FormControl
                  type="text"
                  placeholder="State"
                  isInvalid={!!errors.state}
                  {...register('state', {
                    required: 'Please select your state.',
                  })}
                />
                <Feedback type="invalid">{errors.state?.message}</Feedback>
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <FormLabel>Zip</FormLabel>
                <FormControl
                  type="text"
                  placeholder="Zip"
                  isInvalid={!!errors.zip}
                  {...register('zip', {
                    required: 'Please enter a valid zip code.',
                  })}
                />
                <Feedback type="invalid">{errors.zip?.message}</Feedback>
              </FormGroup>
            </Col>
            <Col xs={12}>
              <FormGroup>
                <FormCheck
                  type="checkbox"
                  label="I agree to the terms and conditions"
                  isInvalid={!!errors.terms}
                  feedbackType="invalid"
                  feedback={errors.terms?.message}
                  {...register('terms', {
                    required: 'You must agree before submitting.',
                  })}
                />
              </FormGroup>
            </Col>
            <Col xs={12}>
              <Button variant="primary" type="submit">
                Submit Form
              </Button>
            </Col>
          </Form>
        </CardBody>
      </Card>
    </>
  )
}
export default CustomValidation
