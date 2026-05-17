import { Link } from 'react-router'

const OrderSummary = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Order Summary</h4>
      </div>
      <div className="card-body">
        <ul className="list-unstyled mb-6.5">
          <li className="mb-2.5 flex justify-between">
            <span className="text-default-400">Subtotal (3 items):</span>
            <span>$2,427.00</span>
          </li>
          <li className="mb-2.5 flex justify-between">
            <span className="text-default-400">Saving:</span>
            <span className="text-danger">- $110.00</span>
          </li>
          <li className="mb-2.5 flex justify-between">
            <span className="text-default-400">Tax collected:</span>
            <span>$73.40</span>
          </li>
          <li className="border-default-300 mb-5 flex justify-between border-b pb-base">
            <span className="text-default-400">Shipping:</span>
            <span>Calculated at checkout</span>
          </li>
          <li className="mb-2.5 flex justify-between">
            <h6 className="text-default-400 text-xs uppercase">Estimated total:</h6>
            <h5 className="font-bold">$2,390.40</h5>
          </li>
        </ul>
        <Link to="/apps/ecommerce/checkout" className="mb-5 btn btn-lg bg-danger text-base w-full text-white hover:bg-danger-hover">
          &nbsp; Proceed to Checkout
        </Link>
        <p className="text-default-400 text-center">
          <Link to="" className="text-primary font-semibold">
            Create an account&nbsp;
          </Link>
          and get 239 bonuses
        </p>
      </div>
    </div>
  )
}

export default OrderSummary
