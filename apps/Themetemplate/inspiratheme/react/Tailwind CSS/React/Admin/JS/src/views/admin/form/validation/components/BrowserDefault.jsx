const BrowserDefault = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Browser Defaults</h4>
      </div>
      <div className="card-body">
        <form action="">
          <div className="grid md:grid-cols-3 grid-cols-1 gap-base mb-base">
            <div>
              <label htmlFor="validationDefault01" className="form-label">
                First name
              </label>
              <input type="text" className="form-input" id="validationDefault01" defaultValue="Mark" required />
            </div>

            <div>
              <label htmlFor="validationDefault02" className="form-label">
                Last name
              </label>
              <input type="text" className="form-input" id="validationDefault02" defaultValue="Otto" required />
            </div>

            <div>
              <label htmlFor="validationDefaultUsername" className="form-label">
                Username
              </label>
              <div className="input-group">
                <span className="input-group-text" id="inputGroupPrepend2">
                  @
                </span>
                <input type="text" className="form-input" id="validationDefaultUsername" aria-describedby="inputGroupPrepend2" required />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 grid-cols-1 gap-base mb-base">
            <div className="md:col-span-2 col-span-1">
              <label htmlFor="validationDefault03" className="form-label">
                City
              </label>
              <input type="text" className="form-input" id="validationDefault03" required />
            </div>

            <div>
              <label htmlFor="validationDefault04" className="form-label">
                State
              </label>
              <select className="form-input" id="validationDefault04" required>
                <option defaultValue="" value="">
                  Choose...
                </option>
                <option>...</option>
              </select>
            </div>

            <div>
              <label htmlFor="validationDefault05" className="form-label">
                Zip
              </label>
              <input type="text" className="form-input" id="validationDefault05" required />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" id="invalidCheck2" required className="form-checkbox" />
              <span className="text-default-700">Agree to terms and conditions</span>
            </label>
          </div>

          <div className="mt-base">
            <button className="btn bg-primary text-white hover:bg-primary-hover" type="submit">
              Submit form
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default BrowserDefault
