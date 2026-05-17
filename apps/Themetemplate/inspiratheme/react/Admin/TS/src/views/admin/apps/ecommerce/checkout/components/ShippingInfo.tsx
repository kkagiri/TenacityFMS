import { Button, Col, FormControl, FormSelect, Row } from 'react-bootstrap'
import FormCheckInput from 'react-bootstrap/esm/FormCheckInput'
import FormCheckLabel from 'react-bootstrap/esm/FormCheckLabel'
import { PatternFormat } from 'react-number-format'
import { useWizard } from 'react-use-wizard'

const ShippingInfo = () => {
  const { nextStep, previousStep } = useWizard()
  return (
    <>
      <h5 className="my-1 fs-md">Saved Address</h5>
      <p className="text-muted fs-sm mb-4">Provide your address details to receive the order invoice.</p>

      <Row>
        <Col xl={6}>
          <div className="mb-3">
            <div className="form-check card-radio card-radio-bordered">
              <FormCheckInput type="radio" name="deli-address" id="add-home" defaultChecked />
              <FormCheckLabel className="p-3 w-100" htmlFor="add-home">
                <span className="fw-bold text-muted mb-1 d-block text-uppercase">Home</span>
                <span className="fw-semibold d-block">Evelyn Carter</span>
                2418 Maple Street, Apt 12B
                <br />
                Brooklyn, NY 11215
                <br />
                <abbr title="Phone">P:</abbr> (917) 432-7784 <br />
              </FormCheckLabel>
            </div>
          </div>
        </Col>
        <Col xl={6}>
          <div className="mb-3">
            <div className="form-check card-radio card-radio-bordered">
              <FormCheckInput type="radio" name="deli-address" id="add-office" />
              <FormCheckLabel className="p-3 w-100" htmlFor="add-office">
                <span className="fw-bold text-muted mb-1 d-block text-uppercase">Office</span>
                <span className="fw-semibold d-block">Marcus Reynolds</span>
                500 Howard Street, Floor 8
                <br />
                San Francisco, CA 94105
                <br />
                <abbr title="Phone">P:</abbr> (415) 392-6400 <br />
              </FormCheckLabel>
            </div>
          </div>
        </Col>
      </Row>

      <h5 className="my-1 fs-md">Add New Address</h5>
      <p className="text-muted fs-sm mb-4">Provide your address details to receive the order invoice.</p>

      <form>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <label htmlFor="shipping-add-first-name" className="form-label">
                First Name
              </label>
              <FormControl type="text" placeholder="Enter your first name" id="shipping-add-first-name" />
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label htmlFor="shipping-add-last-name" className="form-label">
                Last Name
              </label>
              <FormControl type="text" placeholder="Enter your last name" id="shipping-add-last-name" />
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <div className="mb-3">
              <label htmlFor="shipping-add-email-address" className="form-label">
                Email <span className="text-danger">*</span>
              </label>
              <FormControl type="email" placeholder="Enter your email" id="shipping-add-email-address" />
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label htmlFor="shipping-add-phone" className="form-label">
                Phone <span className="text-danger">*</span>
              </label>
              <PatternFormat mask="_" format="(##) ### #### ###" className="form-control" placeholder="(xx) xxx xxxx xxx" />
            </div>
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <div className="mb-3">
              <label htmlFor="shipping-add-address" className="form-label">
                Address <span className="text-danger">*</span>
              </label>
              <textarea className="form-control" id="shipping-add-address" rows={3} placeholder="Enter your address" />
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <div className="mb-3">
              <label htmlFor="shipping-add-town-city" className="form-label">
                Town / City
              </label>
              <FormControl type="text" placeholder="Enter your city name" id="shipping-add-town-city" />
            </div>
          </Col>
          <Col md={4}>
            <div className="mb-3">
              <label htmlFor="shipping-add-state" className="form-label">
                State
              </label>
              <FormControl type="text" placeholder="Enter your state" id="shipping-add-state" />
            </div>
          </Col>
          <Col md={4}>
            <div className="mb-3">
              <label htmlFor="shipping-add-zip-postal" className="form-label">
                Zip / Postal Code
              </label>
              <PatternFormat mask="_" format="### ###" className="form-control" placeholder="Enter your zip code" />
            </div>
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <div className="mb-3">
              <label className="form-label">Country</label>
              <FormSelect>
                <option value="0">Select Country</option>
                <option value="AF">Afghanistan</option>
                <option value="AL">Albania</option>
                <option value="DZ">Algeria</option>
                <option value="AS">American Samoa</option>
                <option value="AD">Andorra</option>
                <option value="AO">Angola</option>
                <option value="AI">Anguilla</option>
                <option value="AQ">Antarctica</option>
                <option value="AR">Argentina</option>
                <option value="AM">Armenia</option>
                <option value="AW">Aruba</option>
                <option value="AU">Australia</option>
                <option value="IN">India</option>
              </FormSelect>
            </div>
          </Col>
        </Row>

        <div className="d-flex justify-content-end">
          <Button type="button" className="btn-sm btn-success">
            Save
          </Button>
        </div>
      </form>

      <h5 className="my-1 fs-md">Shipping Method</h5>
      <p className="text-muted fs-sm mb-3">Choose your preferred shipping method to receive your order on time.</p>

      <Row>
        <Col md={6}>
          <div className="border p-3 rounded mb-3 mb-md-0">
            <div className="form-check">
              <FormCheckInput type="radio" id="shippingMethodRadio1" name="shippingOptions" defaultChecked />
              <FormCheckLabel className="font-16 fw-bold" htmlFor="shippingMethodRadio1">
                Standard Delivery - FREE
              </FormCheckLabel>
            </div>
            <p className="mb-0 ps-3 pt-1 text-muted">Estimated 5-7 days shipping (Duties and tax may be due upon delivery)</p>
          </div>
        </Col>
        <Col md={6}>
          <div className="border p-3 rounded">
            <div className="form-check">
              <FormCheckInput type="radio" id="shippingMethodRadio2" name="shippingOptions" />
              <FormCheckLabel className="font-16 fw-bold" htmlFor="shippingMethodRadio2">
                Fast Delivery - $25
              </FormCheckLabel>
            </div>
            <p className="mb-0 ps-3 pt-1 text-muted">Estimated 1-2 days shipping (Duties and tax may be due upon delivery)</p>
          </div>
        </Col>
      </Row>

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" onClick={previousStep}>
          ← Billing Info
        </Button>
        <Button variant="primary" onClick={nextStep}>
          Payment Info →
        </Button>
      </div>
    </>
  )
}

export default ShippingInfo
