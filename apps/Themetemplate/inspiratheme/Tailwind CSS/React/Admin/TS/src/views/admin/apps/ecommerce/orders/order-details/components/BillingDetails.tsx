import Icon from '@/components/wrappers/Icon'

import mastercard from '@/assets/images/cards/mastercard.svg'
import { Link } from 'react-router'

const BillingDetails = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Billing Details</h4>
        <Link to="" className="btn btn-icon border-default-300 size-8! rounded-full border">
          <Icon icon="pencil" className="text-lg" />
        </Link>
      </div>
      <div className="card-body">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <h5 className="text-default-800">John Doe</h5>
          </div>
          <div>
            <span className="badge bg-primary/15 font-semibold text-primary">Billing Details</span>
          </div>
        </div>
        <p className="text-default-400 border-default-300 border-b pb-4">
          5678 Oak Avenue,
          <br />
          Suite 101,
          <br />
          Chicago, IL 60611,
          <br />
          United States
        </p>
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2.5">
            &nbsp;
            <img src={mastercard} alt="Mastercard" className="size-8 rounded" />
            <div>
              <h5 className="mb-1.25 text-xs">Mastercard Ending in 4242</h5>
              <p className="text-default-400 text-xs">Expiry: 08/26</p>
            </div>
          </div>
          <div>
            <span className="badge bg-success/15 text-success">Paid</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BillingDetails
