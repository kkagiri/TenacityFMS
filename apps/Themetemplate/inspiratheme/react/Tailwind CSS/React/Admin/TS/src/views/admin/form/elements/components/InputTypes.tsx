import Icon from '@/components/wrappers/Icon'

const InputTypes = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Input Types</h4>
      </div>

      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-email" className="form-label py-2 mb-0!">
                  Email
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="email" id="example-email" placeholder="Email" className="form-input" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="password" className="form-label py-2 mb-0!">
                  Show/Hide Password
                </label>
              </div>

              <div className="lg:col-span-2">
                <div className="relative flex items-center">
                  <input id="password" type="password" className="form-input w-full" placeholder="Enter password" />
                  <button type="button" data-hs-toggle-password='{"target":"#password"}' className="bg-default-100 border-default-300 absolute inset-y-0 end-0 flex items-center rounded rounded-s-none! border px-3 py-1.75">
                    <Icon icon="eye" className="hs-password-active:hidden block text-sm" />
                    <Icon icon="eye-off" className="hs-password-active:block hidden text-sm" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-time" className="form-label py-2 mb-0!">
                  Time
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="time" id="example-time" className="form-input" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-number" className="form-label py-2 mb-0!">
                  Number
                </label>
              </div>

              <div className="lg:col-span-2">
                <input id="example-number" type="number" name="number" className="form-input" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-range" className="form-label py-2 mb-0!">
                  Range
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="range" className="form-range" id="example-range" min="0" max="100" />
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-password" className="form-label py-2 mb-0!">
                  Password
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="password" id="example-password" defaultValue="password" className="form-input" onChange={() => {}} />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-month" className="form-label py-2 mb-0!">
                  Month
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="month" id="example-month" className="form-input" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-week" className="form-label py-2 mb-0!">
                  Week
                </label>
              </div>

              <div className="lg:col-span-2">
                <input id="example-week" type="week" name="week" className="form-input" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-color" className="form-label py-2 mb-0!">
                  Color
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="color" id="example-color" defaultValue="#2563eb" className="form-input h-10 p-1" onChange={() => {}} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InputTypes
