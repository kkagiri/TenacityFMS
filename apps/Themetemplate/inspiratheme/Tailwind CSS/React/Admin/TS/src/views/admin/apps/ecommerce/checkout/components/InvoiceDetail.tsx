import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

const InvoiceDetail = () => {
  return (
    <div className="md:p-7.5">
      <div className="mb-5 flex flex-wrap items-center gap-base">
        <div>
          <div className="bg-success flex size-9 items-center justify-center rounded-full text-white">
            <Icon icon="check" className="size-5.5" />
          </div>
        </div>
        <div>
          <p className="text-default-400">Order #234000</p>
          <h4 className="text-lg">Thank you for your order!</h4>
        </div>
        <Link to="" className="hover:text-primary link-offset-2 ms-auto font-semibold underline">
          Track Order
        </Link>
      </div>
      <hr className="border-default-300 my-4 border-t border-dashed" />
      <div className="mt-9">
        <h6 className="text-default-400 text-xs mb-2 font-bold uppercase">Delivery Address</h6>
        <span className="mb-1.25 block font-semibold">Marcus Reynolds</span>
        500 Howard Street, Floor 8
        <br />
        San Francisco, CA 94105
        <br />
        <abbr title="Phone">P:</abbr>
        (415) 392-6400
        <br />
      </div>
      <div className="mt-9">
        <h6 className="text-default-400 text-xs mb-2 font-bold uppercase">Payment Info</h6>
        <p>Credit card: xxxx xxxx xxxx 8521</p>
      </div>
      <div className="mt-9">
        <Link to="" className="btn bg-success text-white">
          <Icon icon="download" className="me-1" />
          Download Invoice
        </Link>
        <Link to="/apps/ecommerce/products/grid" className="btn text-default-400 font-semibold">
          <Icon icon="arrow-left" className="me-1" />
          Continue Shopping
        </Link>
      </div>
      <div className="rounded alert bg-info/15 text-info mt-9 p-7.5">
        <h4 className="text-dark mb-1.25 pb-3 text-center text-lg">🎁 Great News! You’ve unlocked 25% off your next order!</h4>
        <p className="mb-7.5 text-center italic">Apply the code below at checkout or find it anytime in your account.</p>
        <div className="mx-auto flex gap-3">
          <input type="text" className="form-input" defaultValue="SAVE25NOW" readOnly />
          <button type="button" className="btn bg-dark text-white hover:bg-dark-hover text-nowrap">
            Copy Code
          </button>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetail
