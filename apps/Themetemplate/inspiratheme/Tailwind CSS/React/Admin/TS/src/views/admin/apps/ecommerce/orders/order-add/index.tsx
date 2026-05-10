import PageBreadcrumb from '@/components/PageBreadcrumb'
import Flatpickr from '@/components/wrappers/Flatpickr'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Add/Edit Order" subtitle="Ecommerce" />
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Create Order</h4>
          </div>
          <div className="card-body">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="orderId" className="form-label">
                  Order ID
                </label>
                <input type="text" className="form-input bg-default-100! font-semibold!" id="orderId" placeholder="#WB20100" disabled />
              </div>
              <div>
                <label htmlFor="orderDate" className="form-label">
                  Order Date
                </label>
                <Flatpickr
                  className="form-input flatpickr-input"
                  options={{
                    dateFormat: 'F j, Y',
                    defaultDate: 'today',
                  }}
                  required
                />
              </div>
              <div>
                <label htmlFor="customerName" className="form-label">
                  Customer Name
                </label>
                <input type="text" className="form-input" id="customerName" placeholder="Mason Carter" />
              </div>
              <div>
                <label htmlFor="customerEmail" className="form-label">
                  Customer Email
                </label>
                <input type="email" className="form-input" id="customerEmail" placeholder="mason.carter@shopmail.com" />
              </div>
              <div>
                <label htmlFor="productName" className="form-label">
                  Product Name
                </label>
                <select className="form-select" id="productName">
                  <option defaultValue={''}>Select Product</option>
                  <option value="iPhone 15 Pro">iPhone 15 Pro</option>
                  <option value="MacBook Air M3">MacBook Air M3</option>
                  <option value="iPad Pro 13″ (M4)">iPad Pro 13″ (M4)</option>
                  <option value="Apple Watch Ultra 2">Apple Watch Ultra 2</option>
                  <option value="AirPods Pro (2nd Gen)">AirPods Pro (2nd Gen)</option>
                </select>
              </div>
              <div>
                <label htmlFor="quantity" className="form-label">
                  Quantity
                </label>
                <input type="text" className="form-input" id="quantity" defaultValue={1} min={1} />
              </div>
              <div>
                <label htmlFor="amount" className="form-label">
                  Amount ($)
                </label>
                <input type="text" className="form-input" id="amount" placeholder="129.45" />
              </div>
              <div>
                <label htmlFor="paymentStatus" className="form-label">
                  Payment Status
                </label>
                <select className="form-select" id="paymentStatus">
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              <div>
                <label htmlFor="orderStatus" className="form-label">
                  Order Status
                </label>
                <select className="form-select" id="orderStatus">
                  <option value="Ordered">Ordered</option>
                  <option value="Processing">Processing</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>
              <div>
                <label htmlFor="paymentMethod" className="form-label">
                  Payment Method
                </label>
                <select className="form-select" id="paymentMethod">
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="PayPal">PayPal</option>
                  <option value="COD">Cash on Delivery</option>
                </select>
              </div>
              <div>
                <label htmlFor="cardNumber" className="form-label">
                  Card Last 4 Digits
                </label>
                <input type="text" className="form-input" id="cardNumber" placeholder="7832" />
              </div>
            </div>
            <div className="mt-5">
              <div className="text-center">
                <button type="button" className="btn bg-light me-2.5 hover:text-primary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn bg-primary text-white hover:bg-primary-hover">
                  Save Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
