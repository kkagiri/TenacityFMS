import { Button, Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import { Link } from 'react-router'
const OrderSummary = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Order Summary</CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="list-unstyled mb-3">
          <li className="d-flex justify-content-between mb-2">
            <span className="text-muted">Subtotal (3 items):</span>
            <span>$2,427.00</span>
          </li>
          <li className="d-flex justify-content-between mb-2">
            <span className="text-muted">Saving:</span>
            <span className="text-danger">- $110.00</span>
          </li>
          <li className="d-flex justify-content-between mb-2">
            <span className="text-muted">Tax collected:</span>
            <span>$73.40</span>
          </li>
          <li className="d-flex justify-content-between border-bottom pb-3 mb-3">
            <span className="text-muted">Shipping:</span>
            <span>Calculated at checkout</span>
          </li>
          <li className="d-flex justify-content-between">
            <h6 className="text-uppercase text-muted">Estimated total:</h6>
            <h5 className="fw-bold">$2,390.40</h5>
          </li>
        </ul>

        <Button href="/apps/ecommerce/checkout" variant="danger" size="lg" className="w-100 mb-3">
          Proceed to Checkout
        </Button>
        <p className="text-muted text-center mb-0">
          <Link to="" className="fw-semibold">
            Create an account
          </Link>{' '}
          and get 239 bonuses
        </p>
      </CardBody>
    </Card>
  )
}
export default OrderSummary
