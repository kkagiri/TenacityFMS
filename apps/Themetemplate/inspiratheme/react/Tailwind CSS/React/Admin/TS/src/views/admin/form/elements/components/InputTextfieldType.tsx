import Icon from '@/components/wrappers/Icon'

const InputTextfieldType = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Input Textfield Type</h4>
      </div>

      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="simpleinput" className="form-label py-2 mb-0!">
                  Simple Input
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="text" id="simpleinput" className="form-input" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Floating Input</label>
              </div>

              <div className="lg:col-span-2">
                <div className="relative">
                  <input
                    type="text"
                    id="floatingInput"
                    placeholder=""
                    className="peer border-default-300 focus:border-default-500 block w-full rounded bg-transparent p-4 not-placeholder-shown:pt-6 not-placeholder-shown:pb-2 placeholder:text-transparent autofill:pt-6 autofill:pb-2 focus:pt-6 focus:pb-2 focus:ring-0 sm:text-sm"
                  />
                  <label
                    htmlFor="floatingInput"
                    className="text-default-500 peer-placeholder-shown:text-default-400 peer-placeholder-shown: absolute start-3 top-2 transition-all peer-placeholder-shown:top-3.5 peer-focus:top-1.5 peer-focus:border-0 peer-focus:text-xs peer-focus:ring-0"
                  >
                    Name
                  </label>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="validInput" className="form-label py-2 mb-0!">
                  Valid Input
                </label>
              </div>

              <div className="lg:col-span-2">
                <div className="relative">
                  <input type="text" id="validInput" name="hs-validation-name-success" className="form-input border-success!" required aria-describedby="hs-validation-name-success-helper" />
                  <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
                    <Icon icon="check" className="text-success text-base" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-rounded" className="form-label py-2 mb-0!">
                  Rounded Input
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="text" id="example-rounded" className="form-input rounded-full!" placeholder="Rounded Input" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-textarea" className="form-label py-2 mb-0!">
                  Text area
                </label>
              </div>

              <div className="lg:col-span-2">
                <textarea id="example-textarea" rows={5} className="form-textarea"></textarea>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-disable" className="form-label py-2 mb-0!">
                  Disabled
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="text" id="example-disable" value="Disabled value" disabled className="form-input" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-helping" className="form-label py-2 mb-0!">
                  Helping text
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="text" id="example-helping" placeholder="Helping text" className="form-input" />
                <small className="text-default-400 mt-1 block text-xs">A block of help text that breaks onto a new line and may extend beyond one line.</small>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="discount" className="form-label py-2 mb-0!">
                  Select with Icon
                </label>
              </div>

              <div className="lg:col-span-2">
                <div className="input-icon-group">
                  <Icon icon="discount" className="input-icon" />
                  <select id="discount" className="form-input">
                    <option defaultValue={''}>Choose Discount</option>
                    <option>No Discount</option>
                    <option>Flat Discount</option>
                    <option>Percentage Discount</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Label Input</label>
              </div>

              <div className="lg:col-span-2">
                <div>
                  <label htmlFor="labelInputInput1" className="form-label">
                    Label Input
                  </label>
                  <input type="email" className="form-input" id="labelInputInput1" placeholder="name@example.com" />
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="SearchInput" className="form-label py-2 mb-0!">
                  Search Style
                </label>
              </div>

              <div className="lg:col-span-2">
                <div className="input-icon-group">
                  <Icon icon="search" className="input-icon" />
                  <input type="search" id="SearchInput" placeholder="Search for something..." className="form-input" />
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="inValidationInput" className="form-label py-2 mb-0!">
                  Invalid Input
                </label>
              </div>

              <div className="lg:col-span-2">
                <div className="input-icon-group">
                  <input type="text" id="inValidationInput" name="hs-validation-name-success" className="form-input border-danger" required aria-describedby="hs-validation-name-success-helper" />
                  <Icon icon="info-circle" className="text-danger! input-icon text-base" />
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-placeholder" className="form-label py-2 mb-0!">
                  Placeholder
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="text" id="example-placeholder" className="form-input" placeholder="placeholder" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-readonly" className="form-label py-2 mb-0!">
                  Readonly
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="text" id="example-readonly" value="Readonly value" readOnly className="form-input cursor-not-allowed" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-static" className="form-label py-2 mb-0!">
                  Static control
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="text" id="example-static" value="email@example.com" readOnly className="form-input border-transparent! bg-transparent!" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Default Select</label>
              </div>

              <div className="lg:col-span-2">
                <select className="form-select">
                  <option defaultValue={''}>Open this select menu</option>
                  <option>One</option>
                  <option>Two</option>
                  <option>Three</option>
                </select>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="example-multiselect" className="form-label py-2 mb-0!">
                  Multiple Select
                </label>
              </div>

              <div className="lg:col-span-2">
                <select id="example-multiselect" multiple className="form-input h-auto!">
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>5</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InputTextfieldType
