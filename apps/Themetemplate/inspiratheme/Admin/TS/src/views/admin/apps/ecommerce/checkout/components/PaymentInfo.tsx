import codImg from '@/assets/images/cards/cod.png'
import discoverCard from '@/assets/images/cards/discover-card.svg'
import masterCard from '@/assets/images/cards/mastercard.svg'
import payoneerCard from '@/assets/images/cards/payoneer.svg'
import paypal from '@/assets/images/cards/paypal.svg'
import stripeCard from '@/assets/images/cards/stripe.svg'
import visaCard from '@/assets/images/cards/visa.svg'
import { Button, Col, FormControl, Row } from 'react-bootstrap'
import FormCheckInput from 'react-bootstrap/esm/FormCheckInput'
import FormCheckLabel from 'react-bootstrap/esm/FormCheckLabel'
import { PatternFormat } from 'react-number-format'
import { useWizard } from 'react-use-wizard'

const PaymentInfo = () => {
  const { nextStep, previousStep } = useWizard()
  return (
    <>
      <h5 className="my-1 fs-md">Payment Method</h5>
      <p className="text-muted fs-sm mb-3">Select your preferred payment method to complete your purchase securely.</p>

      <div className="border p-3 mb-3 rounded">
        <Row>
          <Col sm={8}>
            <div className="form-check">
              <FormCheckInput type="radio" id="BillingOptRadio2" name="billingOptions" className="form-check-input" />
              <FormCheckLabel className="font-16 fw-bold" htmlFor="BillingOptRadio2">
                Pay with Paypal
              </FormCheckLabel>
            </div>
            <p className="mb-0 ps-3 pt-1 text-muted">You will be redirected to PayPal website to complete your purchase securely.</p>
          </Col>
          <Col sm={4} className="text-sm-end mt-3 mt-sm-0">
            <img src={paypal} height="32" alt="paypal-img" />
          </Col>
        </Row>
      </div>

      <div className="border p-3 mb-3 rounded">
        <Row>
          <Col sm={8}>
            <div className="form-check">
              <FormCheckInput type="radio" id="BillingOptRadio1" name="billingOptions" className="form-check-input" defaultChecked />
              <FormCheckLabel className="font-16 fw-bold" htmlFor="BillingOptRadio1">
                Credit / Debit Card
              </FormCheckLabel>
            </div>
            <p className="mb-0 ps-3 pt-1 text-muted">Safe money transfer using your bank account. We support Mastercard, Visa, Discover and Stripe.</p>
          </Col>
          <Col sm={4} className="text-sm-end mt-3 mt-sm-0">
            <img src={masterCard} height="32" alt="master-card-img" />
            <img src={discoverCard} height="32" alt="discover-card-img" />
            <img src={visaCard} height="32" alt="visa-card-img" />
            <img src={stripeCard} height="32" alt="stripe-card-img" />
          </Col>
        </Row>

        <Row className="mt-4">
          <Col md={12}>
            <div className="alert alert-warning fs-xs py-2">
              Enjoy an extra <span className="fw-bold">10% discount</span> when you pay with your <span className="fw-bold">Credit Card</span>.
            </div>

            <div className="mb-3">
              <label htmlFor="card-number" className="form-label">
                Card Number
              </label>
              <PatternFormat className="form-control" placeholder="4242 4242 4242 4242" valueIsNumericString format="#### #### #### ####" mask="_" />
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <div className="mb-3 mb-md-0">
              <label htmlFor="card-name-on" className="form-label">
                Name on card
              </label>
              <FormControl type="text" id="card-name-on" placeholder="Master Dhanu" />
            </div>
          </Col>
          <Col md={3}>
            <div className="mb-3 mb-md-0">
              <label htmlFor="card-expiry-date" className="form-label">
                Expiry date
              </label>
              <PatternFormat className="form-control" placeholder="MM/YY" valueIsNumericString format="##/##" mask="_" />
            </div>
          </Col>
          <Col md={3}>
            <div className="mb-0">
              <label htmlFor="card-cvv" className="form-label">
                CVV code
              </label>
              <PatternFormat className="form-control" placeholder="012" valueIsNumericString format="###" mask="_" />
            </div>
          </Col>
        </Row>
      </div>

      <div className="border p-3 mb-3 rounded">
        <Row>
          <Col sm={8}>
            <div className="form-check">
              <FormCheckInput type="radio" id="BillingOptRadio3" name="billingOptions" className="form-check-input" />
              <FormCheckLabel className="font-16 fw-bold" htmlFor="BillingOptRadio3">
                Pay with Payoneer
              </FormCheckLabel>
            </div>
            <p className="mb-0 ps-3 pt-1 text-muted">You will be redirected to Payoneer website to complete your purchase securely.</p>
          </Col>
          <Col sm={4} className="text-sm-end mt-3 mt-sm-0">
            <img src={payoneerCard} height="32" alt="payoneer" />
          </Col>
        </Row>
      </div>

      <div className="border p-3 mb-3 rounded">
        <Row>
          <Col sm={8}>
            <div className="form-check">
              <FormCheckInput type="radio" id="BillingOptRadio4" name="billingOptions" className="form-check-input" />
              <FormCheckLabel className="font-16 fw-bold" htmlFor="BillingOptRadio4">
                Cash on Delivery
              </FormCheckLabel>
            </div>
            <p className="mb-0 ps-3 pt-1 text-muted">Pay with cash when your order is delivered.</p>
          </Col>
          <Col sm={4} className="text-sm-end mt-3 mt-sm-0">
            <img src={codImg} height="24" alt="COD-img" />
          </Col>
        </Row>
      </div>

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" onClick={previousStep}>
          ← Shipping Info
        </Button>
        <Button variant="primary" onClick={nextStep}>
          Proceed →
        </Button>
      </div>
    </>
  )
}

export default PaymentInfo
