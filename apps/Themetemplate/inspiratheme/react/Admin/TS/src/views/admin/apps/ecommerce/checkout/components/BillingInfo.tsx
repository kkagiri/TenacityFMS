import Icon from '@/components/wrappers/Icon'
import { Button, Col, Form, FormControl, FormLabel, FormSelect, Row } from 'react-bootstrap'
import FormCheckInput from 'react-bootstrap/esm/FormCheckInput'
import FormCheckLabel from 'react-bootstrap/esm/FormCheckLabel'
import { PatternFormat } from 'react-number-format'
import { useWizard } from 'react-use-wizard'

const BillingInfo = () => {
  const { nextStep } = useWizard()
  return (
    <>
      <h5 className="my-1 fs-md">Billing Information</h5>
      <p className="text-muted fs-sm mb-4">Fill the form below in order to send you the order&apos;s invoice.</p>
      <Form>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <FormLabel htmlFor="billing-first-name" className="form-label">
                First Name
              </FormLabel>
              <FormControl type="text" placeholder="Enter your first name" id="billing-first-name" />
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <FormLabel htmlFor="billing-last-name" className="form-label">
                Last Name
              </FormLabel>
              <FormControl type="text" placeholder="Enter your last name" id="billing-last-name" />
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <div className="mb-3">
              <FormLabel htmlFor="billing-email-address" className="form-label">
                Email <span className="text-danger">*</span>
              </FormLabel>
              <FormControl type="email" placeholder="Enter your email" id="billing-email-address" />
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <FormLabel htmlFor="billing-phone" className="form-label">
                Phone <span className="text-danger">*</span>
              </FormLabel>
              <PatternFormat mask="_" format="(##) ### #### ###" className="form-control" placeholder="(xx) xxx xxxx xxx" />
            </div>
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <div className="mb-3">
              <FormLabel htmlFor="billing-address" className="form-label">
                Address <span className="text-danger">*</span>
              </FormLabel>
              <textarea className="form-control" id="billing-address" rows={2} placeholder="Enter your address" />
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <div className="mb-3">
              <FormLabel htmlFor="billing-town-city" className="form-label">
                Town / City
              </FormLabel>
              <FormControl type="text" placeholder="Enter your city name" id="billing-town-city" />
            </div>
          </Col>
          <Col md={4}>
            <div className="mb-3">
              <FormLabel htmlFor="billing-state" className="form-label">
                State
              </FormLabel>
              <FormControl type="text" placeholder="Enter your state" id="billing-state" />
            </div>
          </Col>
          <Col md={4}>
            <div className="mb-3">
              <FormLabel htmlFor="billing-zip-postal" className="form-label">
                Zip / Postal Code
              </FormLabel>
              <PatternFormat mask="_" format="### ###" className="form-control" placeholder="Enter your zip code" />
            </div>
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <div className="mb-3">
              <FormLabel className="form-label">Country</FormLabel>
              <FormSelect>
                <option value="0">Select Country</option>
                <option value="AF">Afghanistan</option>
                <option value="AL">Albania</option>
                <option value="DZ">Algeria</option>
                <option value="AS">American Samoa</option>
                <option value="In">India</option>
              </FormSelect>
            </div>
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <div className="mb-3">
              <div className="form-check">
                <FormCheckInput type="checkbox" id="customCheck2" />
                <FormCheckLabel htmlFor="customCheck2">Ship to different address ?</FormCheckLabel>
              </div>
            </div>
            <div className="mb-3 mt-3">
              <FormLabel htmlFor="example-textarea" className="form-label">
                Order Notes:
              </FormLabel>
              <textarea className="form-control" id="example-textarea" rows={3} placeholder="Write some note.." />
            </div>
          </Col>
        </Row>
      </Form>
      <div className="d-flex justify-content-end mt-3">
        <Button type="button" className="btn btn-primary" onClick={nextStep}>
          Proceed to Shipping <Icon icon="truck" className="ms-1 fs-lg"></Icon>
        </Button>
      </div>
    </>
  )
}

export default BillingInfo
