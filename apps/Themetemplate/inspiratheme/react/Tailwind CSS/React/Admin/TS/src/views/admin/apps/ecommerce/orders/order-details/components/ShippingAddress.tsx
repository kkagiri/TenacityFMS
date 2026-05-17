import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

const ShippingAddress = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Shipping Address</h4>
        <Link to="" className="btn btn-icon border-default-300 size-8! rounded-full border">
          <Icon icon="pencil" className="text-lg" />
        </Link>
      </div>
      <div className="card-body">
        <iframe src="https://www.google.com/maps/embed/v1/place?q=New+York+University&key=AIzaSyBSFRN6WWGYwmFi498qXXsD2UwkbmD74v4" style={{ width: '100%', height: 180, overflow: 'hidden', border: 0 }} />
        <div className="my-5">
          <div className="flex items-center justify-between">
            <div className="mb-2.5">
              <h5 className="text-default-800">John Doe</h5>
            </div>
            <div>
              <span className="badge bg-success/15 font-semibold text-success">Primary Address</span>
            </div>
          </div>
          <p className="text-default-400 mb-1.25">
            1234 Elm Street,
            <br />
            Apt 567,
            <br />
            Springfield, IL 62704,
            <br />
            United States
          </p>
          <p className="text-default-400 mb-5">
            <strong>Phone:</strong>
            (123) 456-7890
            <br />
            <strong>Email:</strong>
            john.doe@example.com
          </p>
        </div>
        <div className="bg-warning/15 rounded px-4 py-3 text-warning">
          <h6 className="mb-2.5 text-xs">Delivery Instructions:</h6>
          <p className="italic">Please leave the package at the front door if no one is home. Call upon arrival.</p>
        </div>
      </div>
    </div>
  )
}

export default ShippingAddress
