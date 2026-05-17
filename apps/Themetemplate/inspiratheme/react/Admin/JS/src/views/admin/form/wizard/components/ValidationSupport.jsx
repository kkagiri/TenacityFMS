import Flatpickr from '@/components/wrappers/Flatpickr'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Form, FormControl, FormGroup, FormLabel, FormSelect, ProgressBar, Row } from 'react-bootstrap'
import { useWizard, Wizard } from 'react-use-wizard'
const ValidationSupport = () => {
  return (
    <>
      <Card>
        <CardHeader className="justify-content-between">
          <CardTitle as="h4">Validation Support</CardTitle>
          <span className="badge badge-soft-success badge-label fs-xxs py-1">Exclusive</span>
        </CardHeader>
        <CardBody>
          <div className="ins-wizard" data-wizard>
            <Wizard header={<Header />}>
              <Step1 />
              <Step2 />
              <Step3 />
              <Step4 />
              <Step5 />
            </Wizard>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
const Header = ({ className, withProgress }) => {
  const { goToStep, activeStep, stepCount } = useWizard()
  return (
    <>
      {withProgress && (
        <ProgressBar
          now={(activeStep + 1) * (100 / stepCount)}
          className="mb-3"
          style={{
            height: '6px',
          }}
        />
      )}

      <ul className={clsx('nav nav-tabs wizard-tabs', className)} data-wizard-nav role="tablist">
        <li className="nav-item">
          <button className={clsx('nav-link', activeStep === 0 && 'active', activeStep > 0 && 'wizard-item-done')} onClick={() => goToStep(0)}>
            <span className="d-flex align-items-center">
              <Icon icon="user-circle" className="fs-32" />
              <span className="flex-grow-1 ms-2 text-truncate">
                <span className="mb-0 lh-base d-block fw-semibold text-body fs-base">Student Info</span>
                <span className="fs-xxs mb-0">Personal details</span>
              </span>
            </span>
          </button>
        </li>

        <li className="nav-item">
          <button className={clsx('nav-link', activeStep === 1 && 'active', activeStep > 1 && 'wizard-item-done')} onClick={() => goToStep(1)}>
            <span className="d-flex align-items-center">
              <Icon icon="map-pin" className="fs-32" />
              <span className="flex-grow-1 ms-2 text-truncate">
                <span className="mb-0 lh-base d-block fw-semibold text-body fs-base">Address Info</span>
                <span className="fs-xxs mb-0">Where you live</span>
              </span>
            </span>
          </button>
        </li>

        <li className="nav-item">
          <button className={clsx('nav-link', activeStep === 2 && 'active', activeStep > 2 && 'wizard-item-done')} onClick={() => goToStep(2)}>
            <span className="d-flex align-items-center">
              <Icon icon="book" className="fs-32" />
              <span className="flex-grow-1 ms-2 text-truncate">
                <span className="mb-0 lh-base d-block fw-semibold text-body fs-base">Course Info</span>
                <span className="fs-xxs mb-0">Select your course</span>
              </span>
            </span>
          </button>
        </li>

        <li className="nav-item">
          <button className={clsx('nav-link', activeStep === 3 && 'active', activeStep > 3 && 'wizard-item-done')} onClick={() => goToStep(3)}>
            <span className="d-flex align-items-center">
              <Icon icon="users" className="fs-32" />
              <span className="flex-grow-1 ms-2 text-truncate">
                <span className="mb-0 lh-base d-block fw-semibold text-body fs-base">Parent Info</span>
                <span className="fs-xxs mb-0">Guardian details</span>
              </span>
            </span>
          </button>
        </li>

        <li className="nav-item">
          <button className={clsx('nav-link', activeStep === 4 && 'active', activeStep > 4 && 'wizard-item-done')} onClick={() => goToStep(4)}>
            <span className="d-flex align-items-center">
              <Icon icon="folder-open" className="fs-32" />
              <span className="flex-grow-1 ms-2 text-truncate">
                <span className="mb-0 lh-base d-block fw-semibold text-body fs-base">Documents</span>
                <span className="fs-xxs mb-0">Upload certificates</span>
              </span>
            </span>
          </button>
        </li>
      </ul>
    </>
  )
}
const useValidatedForm = (onValid) => {
  const [validated, setValidated] = useState(false)
  const handleSubmit = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    if (form.checkValidity() === false) {
      e.stopPropagation()
      setValidated(true)
      return
    }
    setValidated(true)
    onValid()
  }
  return {
    validated,
    handleSubmit,
  }
}
const Step1 = ({ className }) => {
  const { nextStep } = useWizard()
  const { validated, handleSubmit } = useValidatedForm(nextStep)
  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit} className={`pt-3 ${className}`}>
      <Row>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Full Name</FormLabel>
            <FormControl required type="text" placeholder="Enter your full name" name="fullname" />
          </FormGroup>
        </Col>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Email</FormLabel>
            <FormControl required type="email" placeholder="Enter your email" name="email" />
          </FormGroup>
        </Col>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Phone Number</FormLabel>
            <FormControl required type="tel" placeholder="Enter your phone number" name="phone" />
          </FormGroup>
        </Col>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Date of Birth</FormLabel>
            <Flatpickr
              className="form-control"
              placeholder="Select DOB"
              options={{
                dateFormat: 'd M, Y',
                defaultDate: '03 Oct, 2025',
              }}
              name="dob"
              required
            />
            <Form.Control.Feedback type="invalid">Date of Birth is required.</Form.Control.Feedback>
          </FormGroup>
        </Col>
      </Row>
      <div className="d-flex justify-content-end mt-3">
        <Button type="submit" variant="primary">
          Next: Address Info →
        </Button>
      </div>
    </Form>
  )
}
const Step2 = ({ className }) => {
  const { previousStep, nextStep } = useWizard()
  const { validated, handleSubmit } = useValidatedForm(nextStep)
  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit} className={`pt-3 ${className}`}>
      <Row>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Street Address</FormLabel>
            <FormControl required type="text" placeholder="123 Main St" name="street" />
          </FormGroup>
        </Col>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>City</FormLabel>
            <FormControl required type="text" placeholder="e.g., New York" name="city" />
          </FormGroup>
        </Col>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>State</FormLabel>
            <FormControl required type="text" placeholder="e.g., California" name="state" />
          </FormGroup>
        </Col>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Zip Code</FormLabel>
            <FormControl required type="text" placeholder="e.g., 10001" name="zip" />
          </FormGroup>
        </Col>
      </Row>
      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" onClick={previousStep}>
          ← Back: Student Info
        </Button>
        <Button type="submit" variant="primary">
          Next: Course Info →
        </Button>
      </div>
    </Form>
  )
}
const Step3 = ({ className }) => {
  const { previousStep, nextStep } = useWizard()
  const { validated, handleSubmit } = useValidatedForm(nextStep)
  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit} className={`pt-3 ${className}`}>
      <Row>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Choose Course</FormLabel>
            <FormSelect required name="course">
              <option value="">Select</option>
              <option value="Engineering">Engineering</option>
              <option value="Medical">Medical</option>
              <option value="Business">Business</option>
            </FormSelect>
          </FormGroup>
        </Col>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Enrollment Type</FormLabel>
            <FormSelect required name="enrollment">
              <option value="">Select</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
            </FormSelect>
          </FormGroup>
        </Col>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Preferred Batch Time</FormLabel>
            <FormSelect name="batch_time" required>
              <option value="">Select Time</option>
              <option value="Morning">Morning (8am – 12pm)</option>
              <option value="Afternoon">Afternoon (1pm – 5pm)</option>
              <option value="Evening">Evening (6pm – 9pm)</option>
            </FormSelect>
          </FormGroup>
        </Col>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Mode of Study</FormLabel>
            <FormSelect name="mode" required>
              <option value="">Select Mode</option>
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
              <option value="Hybrid">Hybrid</option>
            </FormSelect>
          </FormGroup>
        </Col>
      </Row>
      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" onClick={previousStep}>
          ← Back: Address Info
        </Button>
        <Button type="submit" variant="primary">
          Next: Parent Info →
        </Button>
      </div>
    </Form>
  )
}
const Step4 = ({ className }) => {
  const { previousStep, nextStep } = useWizard()
  const { validated, handleSubmit } = useValidatedForm(nextStep)
  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit} className={`pt-3 ${className}`}>
      <Row>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Parent/Guardian Name</FormLabel>
            <FormControl type="text" placeholder="e.g., John Doe" name="parent_name" required />
          </FormGroup>
        </Col>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Relation</FormLabel>
            <FormControl type="text" placeholder="e.g., Father, Mother" name="relation" required />
          </FormGroup>
        </Col>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Parent Phone</FormLabel>
            <FormControl type="tel" placeholder="e.g., +1 555 123 4567" name="parent_phone" required />
          </FormGroup>
        </Col>
        <Col xl={6}>
          <FormGroup className="mb-3">
            <FormLabel>Parent Email</FormLabel>
            <FormControl type="email" placeholder="e.g., parent@example.com" name="parent_email" required />
          </FormGroup>
        </Col>
      </Row>
      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" onClick={previousStep}>
          ← Back: Course Info
        </Button>
        <Button variant="primary" type="submit">
          Next: Documents →
        </Button>
      </div>
    </Form>
  )
}
const Step5 = ({ className }) => {
  const { previousStep } = useWizard()
  const { validated, handleSubmit } = useValidatedForm(() => {
    alert('Form submitted successfully ✅')
  })
  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit} className={`pt-3 ${className}`}>
      <FormGroup className="mb-3">
        <FormLabel>Upload ID Proof</FormLabel>
        <FormControl type="file" name="id_proof" required />
      </FormGroup>
      <FormGroup className="mb-3">
        <FormLabel>Upload Previous Marksheet</FormLabel>
        <FormControl type="file" name="marksheet" required />
      </FormGroup>
      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" onClick={previousStep}>
          ← Back: Parent Info
        </Button>
        <Button variant="success" type="submit">
          Submit Application
        </Button>
      </div>
    </Form>
  )
}
export default ValidationSupport
