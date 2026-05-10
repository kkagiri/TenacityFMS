const FloatingLabels = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Floating Labels</h4>
      </div>

      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Email address</label>
              </div>

              <div className="lg:col-span-2">
                <div className="relative">
                  <input
                    type="email"
                    id="hs-floating-input-email"
                    className="peer border-default-300 focus:border-default-500 block w-full rounded bg-transparent p-4 not-placeholder-shown:pt-6 not-placeholder-shown:pb-2 placeholder:text-transparent autofill:pt-6 autofill:pb-2 focus:pt-6 focus:pb-2 focus:ring-0 sm:text-sm"
                    placeholder="you@email.com"
                  />
                  <label
                    htmlFor="hs-floating-input-email"
                    className="peer-focus:text-default-500 peer-not-placeholder-shown:text-default-500 pointer-events-none absolute start-0 top-0 h-full origin-top-left truncate border border-transparent p-4 transition duration-100 ease-in-out peer-not-placeholder-shown:translate-x-0.5 peer-not-placeholder-shown:-translate-y-1.5 peer-not-placeholder-shown:scale-90 peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5 peer-focus:scale-90 sm:text-sm"
                  >
                    Email
                  </label>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Comments</label>
              </div>

              <div className="lg:col-span-2">
                <div className="relative">
                  <textarea
                    id="floatingTextarea"
                    rows={4}
                    placeholder=""
                    className="peer border-default-300 focus:border-default-500 block w-full rounded bg-transparent p-4 not-placeholder-shown:pt-6 not-placeholder-shown:pb-2 placeholder:text-transparent autofill:pt-6 autofill:pb-2 focus:pt-6 focus:pb-2 focus:ring-0 sm:text-sm"
                  ></textarea>
                  <label
                    htmlFor="floatingTextarea"
                    className="peer-focus:text-default-500 peer-not-placeholder-shown:text-default-500 pointer-events-none absolute start-0 top-0 h-full origin-top-left truncate border border-transparent p-4 transition duration-100 ease-in-out peer-not-placeholder-shown:translate-x-0.5 peer-not-placeholder-shown:-translate-y-1.5 peer-not-placeholder-shown:scale-90 peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5 peer-focus:scale-90 sm:text-sm"
                  >
                    Comments
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Password</label>
              </div>

              <div className="lg:col-span-2">
                <div className="relative">
                  <input
                    type="password"
                    id="floatingPassword"
                    placeholder=""
                    className="peer border-default-300 focus:border-default-500 block w-full rounded bg-transparent p-4 not-placeholder-shown:pt-6 not-placeholder-shown:pb-2 placeholder:text-transparent autofill:pt-6 autofill:pb-2 focus:pt-6 focus:pb-2 focus:ring-0 sm:text-sm"
                  />
                  <label
                    htmlFor="floatingPassword"
                    className="peer-focus:text-default-500 peer-not-placeholder-shown:text-default-500 pointer-events-none absolute start-0 top-0 h-full origin-top-left truncate border border-transparent p-4 transition duration-100 ease-in-out peer-not-placeholder-shown:translate-x-0.5 peer-not-placeholder-shown:-translate-y-1.5 peer-not-placeholder-shown:scale-90 peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5 peer-focus:scale-90 sm:text-sm"
                  >
                    Password
                  </label>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Select Menu</label>
              </div>

              <div className="lg:col-span-2">
                <div className="relative">
                  <select
                    id="floatingSelect"
                    className="peer border-default-300 focus:border-default-500 block w-full rounded bg-transparent p-4 not-placeholder-shown:pt-6 not-placeholder-shown:pb-2 placeholder:text-transparent autofill:pt-6 autofill:pb-2 focus:pt-6 focus:pb-2 focus:ring-0 sm:text-sm"
                  >
                    <option value="" defaultValue="">
                      Open this select menu
                    </option>
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                  </select>
                  <label
                    htmlFor="floatingSelect"
                    className="peer-focus:text-default-500 peer-not-placeholder-shown:text-default-500 pointer-events-none absolute start-0 top-0 h-full origin-top-left truncate border border-transparent p-4 transition duration-100 ease-in-out peer-not-placeholder-shown:translate-x-0.5 peer-not-placeholder-shown:-translate-y-1.5 peer-not-placeholder-shown:scale-90 peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5 peer-focus:scale-90 sm:text-sm"
                  >
                    Works with selects
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default FloatingLabels
