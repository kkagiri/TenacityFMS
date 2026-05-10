import Flatpickr from '@/components/wrappers/Flatpickr'
import Icon from '@/components/wrappers/Icon'

const CreateRefundModal = () => {
  return (
    <div id="createRefundModal" className="hs-overlay pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="createRefundModalLabel">
      <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] scale-95 items-center opacity-0 transition-all duration-200 ease-in-out md:mx-auto md:w-full md:max-w-lg lg:max-w-lg">
        <div className="card pointer-events-auto flex w-full flex-col">
          <div className="card-body border-default-300 flex items-center justify-between border-b">
            <h3 id="createRefundModalLabel" className="flex items-center font-bold">
              <Icon icon="credit-card" className="text-primary me-2.5" />
              Create Refund
            </h3>
            <button type="button" aria-label="Close" data-hs-overlay="#createRefundModal">
              <span className="sr-only">Close</span>
              <Icon icon="x" className="text-2xl align-middle text-default-600" />
            </button>
          </div>
          <div className="card-body">
            <div>
              <div className="mb-5">
                <label htmlFor="refundOrderId" className="form-label">
                  Order ID
                </label>
                <select id="refundOrderId" className="form-select">
                  <option disabled>Select Order</option>
                  <option>#INV-10423</option>
                  <option>#INV-10424</option>
                  <option>#INV-10425</option>
                </select>
              </div>
              <div className="mb-5">
                <label htmlFor="refundCustomer" className="form-label">
                  Customer
                </label>
                <input id="refundCustomer" type="text" className="form-input" defaultValue="Mason Carter" readOnly />
              </div>
              <div className="mb-5">
                <label htmlFor="refundReason" className="form-label">
                  Reason
                </label>
                <textarea id="refundReason" className="form-textarea" rows={2} placeholder="Enter refund reason (e.g., damaged item, wrong product, etc.)" defaultValue={''} />
              </div>
              <div className="mb-5">
                <label htmlFor="refundMethod" className="form-label">
                  Refund Method
                </label>
                <select id="refundMethod" className="form-select">
                  <option>Original Payment Method (Visa ****7832)</option>
                  <option>Store Credit</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
              <div className="mb-5">
                <label htmlFor="refundAmount" className="form-label">
                  Refund Amount
                </label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input id="refundAmount" type="number" className="form-input" placeholder="129.45" defaultValue="129.45" />
                </div>
              </div>
              <div>
                <label htmlFor="refundDate" className="form-label">
                  Refund Date
                </label>
                <Flatpickr options={{ dateFormat: 'd M, Y', defaultDate: 'today' }} className="form-input" />
              </div>
            </div>
          </div>
          <div className="border-default-300 flex items-center justify-end gap-2 border-t p-5">
            <button type="button" className="btn bg-default-200" data-hs-overlay="#createRefundModal">
              Close
            </button>
            <button type="button" className="btn bg-primary text-white hover:bg-primary-hover">
              <Icon icon="check" />
              Confirm Refund
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateRefundModal
