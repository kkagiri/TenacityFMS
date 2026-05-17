import Flatpickr from '@/components/wrappers/Flatpickr'
import Icon from '@/components/wrappers/Icon'

const AddClientModal = () => {
  return (
    <div id="addClientModal" className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="addClientModalLabel">
      <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] max-w-sm scale-95 items-center opacity-0 transition-all duration-200 ease-in-out md:mx-auto md:w-full md:max-w-2xl lg:max-w-3xl">
        <div className="card pointer-events-auto flex w-full flex-col">
          <div className="card-header p-5">
            <h3 id="addClientModalLabel" className="card-title uppercase font-bold text-sm">
              Add New Client
            </h3>
            <button type="button" aria-label="Close" data-hs-overlay="#addClientModal">
              <Icon icon="x" className="text-xl" />
            </button>
          </div>

          <div className="card-body overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
              <div>
                <label htmlFor="clientName" className="form-label">
                  Client Name
                </label>
                <input type="text" className="form-input" id="clientName" name="client_name" placeholder="Enter full name" required />
              </div>

              <div>
                <label htmlFor="clientEmail" className="form-label">
                  Email
                </label>
                <input type="email" className="form-input" id="clientEmail" name="email" placeholder="client@example.com" required />
              </div>

              <div>
                <label htmlFor="clientPhone" className="form-label">
                  Phone
                </label>
                <input type="tel" className="form-input" id="clientPhone" name="phone" placeholder="+1 (000) 000-0000" />
              </div>

              <div>
                <label htmlFor="clientCountry" className="form-label">
                  Country
                </label>
                <select className="form-input" id="clientCountry" name="country" required>
                  <option value="">Select country...</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="MX">Mexico</option>
                  <option value="IN">India</option>
                </select>
              </div>

              <div>
                <label htmlFor="clientEnrolled" className="form-label">
                  Enrolled Date
                </label>
                <Flatpickr className="form-input" options={{ dateFormat: 'F j, Y', defaultDate: 'today' }} name="enrolled_date" />
              </div>

              <div>
                <label htmlFor="clientType" className="form-label">
                  Type
                </label>
                <select className="form-input" id="clientType" name="type" required>
                  <option value="">Select type...</option>
                  <option value="Project">Project</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div>
                <label htmlFor="clientJobTitle" className="form-label">
                  Job Title
                </label>
                <input type="text" className="form-input" id="clientJobTitle" name="job_title" placeholder="Frontend Developer" />
              </div>

              <div>
                <label htmlFor="clientStatus" className="form-label">
                  Status
                </label>
                <select className="form-input" id="clientStatus" name="status">
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-default-300 flex items-center justify-end gap-x-2 border-t p-5">
            <button type="button" className="btn bg-light hover:text-primary" data-hs-overlay="#addClientModal">
              cancel
            </button>

            <button type="button" className="btn bg-primary text-white hover:bg-primary-hover">
              Add Client
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddClientModal
