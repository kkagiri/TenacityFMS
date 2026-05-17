const InputSizes = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Input Sizes</h4>
      </div>

      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="input-small" className="form-label py-2 mb-0!">
                  Small
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="text" id="input-small" placeholder=".input-sm" className="form-input form-input-sm" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="input-large" className="form-label py-2 mb-0!">
                  Large
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="text" id="input-large" placeholder=".input-lg" className="form-input form-input-lg" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Large Select</label>
              </div>

              <div className="lg:col-span-2">
                <select className="form-input form-input-lg">
                  <option defaultValue={'One'}>Open this select menu</option>
                  <option value="1">One</option>
                  <option value="2">Two</option>
                  <option value="3">Three</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="input-normal" className="form-label py-2 mb-0!">
                  Normal
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="text" id="input-normal" placeholder="Normal" className="form-input" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="input-gridsize" className="form-label py-2 mb-0!">
                  Grid Sizes
                </label>
              </div>

              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                  <div>
                    <input type="text" id="input-gridsize" placeholder="col-span-4" className="form-input" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Small Select</label>
              </div>

              <div className="lg:col-span-2">
                <select className="form-input form-input-sm">
                  <option defaultValue={''}>Open this select menu</option>
                  <option value="1">One</option>
                  <option value="2">Two</option>
                  <option value="3">Three</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InputSizes
