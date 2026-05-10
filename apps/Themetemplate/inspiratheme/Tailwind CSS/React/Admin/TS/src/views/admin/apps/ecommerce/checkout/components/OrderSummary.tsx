import { Link } from 'react-router'
import { productData } from './data'

const OrderSummary = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Order Summary</h4>
        <span className="badge bg-success/15 text-success font-semibold ms-auto">03 Items</span>
      </div>
      <div className="card-body">
        {productData.map((product, idx) => (
          <div className={`flex items-center gap-base ${idx !== productData.length - 1 ? 'mb-5' : ''}`} key={idx}>
            <img src={product.image} className="me-1.25 rounded" width={42} alt="MacBook Air" />
            <div>
              <p className="mb-1.25 font-semibold">
                <Link to="/apps/ecommerce/product-details" className="hover:text-primary">
                  {product.name}
                </Link>
              </p>
              <p className="text-default-400 block">1 x ${product.price}</p>
            </div>
            <h5 className="ms-auto">${product.price}</h5>
          </div>
        ))}
        <hr className="border-default-300 my-3.25" />
        <ul className="list-unstyled">
          <li className="mb-2.5 flex justify-between">
            <span className="text-default-400">Subtotal:</span>
            <span>$1,947.00</span>
          </li>
          <li className="mb-2.5 flex justify-between">
            <span className="text-default-400">Discount:</span>
            <span className="text-danger">- $120.00</span>
          </li>
          <li className="mb-2.5 flex justify-between">
            <span className="text-default-400">Tax collected:</span>
            <span>$65.85</span>
          </li>
          <li className="border-default-300 mb-5 flex justify-between border-b pb-5   ">
            <span className="text-default-400">Shipping:</span>
            <span>Free</span>
          </li>
          <li className="flex items-center justify-between">
            <h6 className="text-default-400 text-xs uppercase">Estimated total:</h6>
            <h5 className="text-lg font-bold">$1,892.85</h5>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default OrderSummary
