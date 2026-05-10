import Flatpickr from '@/components/wrappers/Flatpickr'
import Icon from '@/components/wrappers/Icon'

const AddPurchaseModal = () => {
  return (
    <div id="addPurchaseOrderModal" className="hs-overlay pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="addPurchaseOrderModalLabel">
      <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] scale-95 items-center opacity-0 transition-all duration-200 ease-in-out md:mx-auto md:w-full md:max-w-2xl lg:max-w-3xl">
        <div className="card pointer-events-auto flex w-full flex-col">
          <div className="card-body border-default-300 flex items-center justify-between border-b">
            <h3 id="addPurchaseOrderModalLabel" className="flex items-center font-bold">
              <Icon icon="file-text" className="text-danger me-2" />
              Add New Purchase Order
            </h3>
            <button type="button" aria-label="Close" data-hs-overlay="#addPurchaseOrderModal">
              <span className="sr-only">Close</span>
              <Icon icon="x" className="size-5" />
            </button>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
              <div>
                <label htmlFor="poNumber" className="form-label">
                  PO Number
                </label>
                <input type="text" id="poNumber" className="form-input" placeholder="PO-2025-0149" />
              </div>
              <div>
                <label htmlFor="supplierName" className="form-label">
                  Supplier Name
                </label>
                <input type="text" id="supplierName" className="form-input" placeholder="Global Tech Supplies" />
              </div>
              <div>
                <label htmlFor="supplierEmail" className="form-label">
                  Supplier Email
                </label>
                <input type="email" id="supplierEmail" className="form-input" placeholder="globaltech@email.com" />
              </div>
              <div>
                <label htmlFor="poItems" className="form-label">
                  Items Count
                </label>
                <input type="number" id="poItems" className="form-input" placeholder="10" />
              </div>
              <div>
                <label htmlFor="orderDate" className="form-label">
                  Order Date
                </label>
                <Flatpickr options={{ defaultDate: 'today', dateFormat: 'd M, Y' }} className="form-input" />
              </div>
              <div>
                <label htmlFor="deliveryDate" className="form-label">
                  Delivery Date
                </label>
                <Flatpickr options={{ defaultDate: 'today', dateFormat: 'd M, Y' }} className="form-input" />
              </div>
              <div>
                <label htmlFor="totalAmount" className="form-label">
                  Total Amount
                </label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input type="number" id="totalAmount" className="form-input" placeholder="3480.00" step="0.01" />
                </div>
              </div>
              <div>
                <label htmlFor="paymentStatus" className="form-label">
                  Payment Status
                </label>
                <select id="paymentStatus" className="form-input">
                  <option>Paid</option>
                  <option>Pending</option>
                  <option>Partially Paid</option>
                  <option>Unpaid</option>
                </select>
              </div>
              <div>
                <label htmlFor="orderStatus" className="form-label">
                  Order Status
                </label>
                <select id="orderStatus" className="form-input">
                  <option>Received</option>
                  <option>Processing</option>
                  <option>Dispatched</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="poNotes" className="form-label">
                  Additional Notes
                </label>
                <textarea id="poNotes" className="form-textarea" rows={2} placeholder="Add any special instructions or remarks here..." defaultValue={''} />
              </div>
            </div>
          </div>
          <div className="border-default-300 flex items-center justify-end gap-2 border-t p-5">
            <button type="button" className="btn bg-light hover:text-primary" data-hs-overlay="#addPurchaseOrderModal">
              Close
            </button>
            <button type="button" className="btn bg-danger text-white hover:bg-danger-hover">
              <Icon icon="check" />
              Save Purchase Order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddPurchaseModal
