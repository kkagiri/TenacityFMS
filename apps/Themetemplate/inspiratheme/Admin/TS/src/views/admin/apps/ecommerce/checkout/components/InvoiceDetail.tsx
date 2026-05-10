import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Button, FormControl } from 'react-bootstrap'

const InvoiceDetail = () => {
  return (
    <div className="p-4">
      <div className="d-flex align-items-center gap-3 mb-3">
        <div className="avatar-md flex-shrink-0">
          <span className="avatar-title text-bg-success rounded-circle fs-22">
            <Icon icon="check" />
          </span>
        </div>
        <div>
          <p className="text-muted mb-0">Order #234000</p>
          <h4 className="m-0">Thank you for your order!</h4>
        </div>
        <Link to="" className="link-reset text-decoration-underline link-offset-2 fw-semibold ms-auto">
          Track Order
        </Link>
      </div>

      <hr className="border-top border-dashed" />

      <div className="mt-4">
        <h6 className="text-uppercase text-muted fw-bold">Delivery Address</h6>
        <span className="fw-semibold d-block mb-1">Marcus Reynolds</span>
        500 Howard Street, Floor 8
        <br />
        San Francisco, CA 94105
        <br />
        <abbr title="Phone">P:</abbr> (415) 392-6400 <br />
      </div>

      <div className="mt-4">
        <h6 className="text-uppercase text-muted fw-bold">Payment Info</h6>
        <p>Credit card: xxxx xxxx xxxx 8521</p>
      </div>

      <div className="mt-4">
        <Button variant="success">
          <Icon icon="download" className="me-1" /> Download Invoice
        </Button>
        <Link to="/apps/ecommerce/products-grid" className="btn btn-link fw-semibold text-muted">
          <Icon icon="arrow-left" className="me-1" /> Continue Shopping
        </Link>
      </div>

      <div className="p-4 alert alert-info mt-4 mb-0">
        <h4 className="text-center pb-2 mb-1 text-dark">🎁 Great News! You’ve unlocked 25% off your next order!</h4>
        <p className="text-center fst-italic mb-4">Apply the code below at checkout or find it anytime in your account.</p>
        <div className="d-flex gap-2 mx-auto">
          <FormControl type="text" className="form-control border-0" value="SAVE25NOW" readOnly />
          <Button type="button" variant="dark" className="text-nowrap">
            Copy Code
          </Button>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetail
