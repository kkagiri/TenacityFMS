import Flatpickr from '@/components/wrappers/Flatpickr'
import Icon from '@/components/wrappers/Icon'

const AddCustomerModal = () => {
  return (
    <div id="addCustomerModal" className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 hidden size-full fixed top-0 start-0 z-80 overflow-x-hidden overflow-y-auto pointer-events-none" role="dialog" tabIndex={-1} aria-labelledby="addCustomerModalLabel">
      <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 scale-95 opacity-0 ease-in-out transition-all duration-200 lg:max-w-3xl md:max-w-2xl md:w-full m-3 md:mx-auto min-h-[calc(100%-56px)] flex items-center">
        <div className="w-full flex flex-col card pointer-events-auto">
          <div className="flex justify-between items-center card-body border-b border-default-300">
            <h3 id="addCustomerModalLabel" className="font-bold flex items-center">
              Add New Customer
            </h3>
            <button type="button" aria-label="Close" data-hs-overlay="#addCustomerModal">
              <span className="sr-only">Close</span>
              <Icon icon="x" className="text-2xl align-middle text-default-600" />
            </button>
          </div>
          <div className="card-body">
            <div className="grid lg:grid-cols-2 grid-cols-1 gap-base">
              <div>
                <label htmlFor="customerName" className="block mb-2">
                  Full Name
                </label>
                <input type="text" className="form-input" id="customerName" placeholder="e.g. Carlos Méndez" required />
              </div>

              <div>
                <label htmlFor="customerEmail" className="block mb-2">
                  Email
                </label>
                <input type="email" className="form-input" id="customerEmail" placeholder="e.g. carlos@domain.com" required />
              </div>

              <div>
                <label htmlFor="customerPhone" className="block mb-2">
                  Phone
                </label>
                <input type="tel" className="form-input" id="customerPhone" placeholder="+1 (415) 992-3412" required />
              </div>

              <div>
                <label htmlFor="customerCountry" className="block mb-2">
                  Country
                </label>
                <select className="form-input" id="customerCountry" required>
                  <option value="">Select Country</option>
                  <option value="United States">🇺🇸 United States</option>
                  <option value="Canada">🇨🇦 Canada</option>
                  <option value="United Kingdom">🇬🇧 United Kingdom</option>
                  <option value="India">🇮🇳 India</option>
                </select>
              </div>

              <div>
                <label htmlFor="customerAvatar" className="block mb-2">
                  Avatar
                </label>
                <input type="file" name="file-input" id="customerAvatar" className="block w-full border border-default-300 rounded disabled:opacity-50 disabled:pointer-events-none file:bg-default-100 file:border-0 file:me-4 file:py-2 file:px-3" />
              </div>

              <div>
                <label htmlFor="joinedDate" className="block mb-2">
                  Join Date
                </label>
                <Flatpickr className="form-input" options={{ defaultDate: 'today', dateFormat: 'd M, Y' }} required />
              </div>
            </div>
          </div>
          <div className="flex justify-end items-center gap-2 p-5 border-t border-default-300">
            <button type="button" className="btn bg-light hover:text-primary" data-hs-overlay="#addCustomerModal">
              Close
            </button>
            <button type="button" className="btn bg-primary text-white hover:bg-primary-hover">
              Add Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddCustomerModal
