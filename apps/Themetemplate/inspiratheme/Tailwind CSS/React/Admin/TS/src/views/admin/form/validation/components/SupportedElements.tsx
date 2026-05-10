const SupportedElements = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Supported Elements</h4>
      </div>
      <div className="card-body">
        <form className="space-y-6" noValidate>
          <div>
            <label htmlFor="validationTextarea" className="form-label">
              Textarea
            </label>
            <textarea id="validationTextarea" placeholder="Required example textarea" required className="form-textarea border-danger!"></textarea>
            <p className="text-danger mt-1 text-2xs">Please enter a message in the textarea.</p>
          </div>

          <div className="flex items-start gap-2">
            <input id="validationFormCheck1" type="checkbox" required className="form-checkbox checked:bg-danger! border-danger! mt-0.5" />
            <div>
              <label htmlFor="validationFormCheck1" className="text-danger">
                Check this checkbox
              </label>
              <p className="text-danger mt-1 text-2xs">Example invalid feedback text</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input id="validationFormCheck2" type="radio" name="radio-stacked" required className="form-radio checked:bg-danger! border-danger!" />
              <label htmlFor="validationFormCheck2" className="text-danger">
                Toggle this radio
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input id="validationFormCheck3" type="radio" name="radio-stacked" required className="form-radio checked:bg-danger! border-danger!" />
              <label htmlFor="validationFormCheck3" className="text-danger">
                Or toggle this other radio
              </label>
              <p className="text-danger mt-1 text-2xs">More example invalid feedback text</p>
            </div>
          </div>

          <div>
            <select required className="form-input border-success!">
              <option value="">Open this select menu</option>
              <option value="1">One</option>
              <option value="2">Two</option>
              <option value="3">Three</option>
            </select>
          </div>

          <div>
            <input type="file" required className="form-input block w-full text-sm" />
            <p className="text-danger mt-1 text-2xs">Example invalid form file feedback</p>
          </div>

          <div>
            <button type="submit" disabled className="btn bg-primary hover:bg-primary-hover cursor-not-allowed text-white">
              Submit form
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SupportedElements
