import clsx from 'clsx'
import { Link } from 'react-router'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import { productData } from './data'

const OrderSummary = () => {
  return (
    <Card>
      <CardHeader className="d-flex align-items-center">
        <CardTitle as="h4">Order Summary</CardTitle>
        <span className="badge badge-soft-success ms-auto">03 Items</span>
      </CardHeader>
      <CardBody>
        {productData.map((product, idx) => (
          <div key={idx} className={clsx('d-flex align-items-center gap-3', { 'mb-3': idx != productData.length - 1 })}>
            <img src={product.image} className="me-1 rounded" width={42} alt={product.name} />
            <div>
              <p className="mb-1 fw-semibold">
                <Link to="/apps/ecommerce/product-details" className="link-reset">
                  {product.name}
                </Link>
              </p>
              <p className="text-muted d-block mb-0">
                {product.quantity} x ${product.price}
              </p>
            </div>
            <h5 className="mb-0 ms-auto">${product.price * product.quantity}</h5>
          </div>
        ))}

        <hr />

        <ul className="list-unstyled mb-0">
          <li className="d-flex justify-content-between mb-2">
            <span className="text-muted">Subtotal:</span>
            <span>$1,947.00</span>
          </li>
          <li className="d-flex justify-content-between mb-2">
            <span className="text-muted">Discount:</span>
            <span className="text-danger">- $120.00</span>
          </li>
          <li className="d-flex justify-content-between mb-2">
            <span className="text-muted">Tax collected:</span>
            <span>$65.85</span>
          </li>
          <li className="d-flex justify-content-between border-bottom pb-3 mb-3">
            <span className="text-muted">Shipping:</span>
            <span>Free</span>
          </li>
          <li className="d-flex justify-content-between align-items-center">
            <h6 className="text-uppercase text-muted mb-0">Estimated total:</h6>
            <h4 className="fw-bold mb-0">$1,892.85</h4>
          </li>
        </ul>
      </CardBody>
    </Card>
  )
}

export default OrderSummary
