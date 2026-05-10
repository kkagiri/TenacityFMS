import Icon from '@/components/wrappers/Icon'

const AddAttributeModal = () => {
  return (
    <div id="addAttributeForm" className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="addAttributeFormLabel">
      <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] scale-95 items-center opacity-0 transition-all duration-200 ease-in-out md:mx-auto md:w-full md:max-w-2xl lg:max-w-3xl">
        <div className="card pointer-events-auto flex w-full flex-col">
          <div className="card-body border-default-300 flex items-center justify-between border-b">
            <h3 id="addAttributeFormLabel" className="flex items-center font-bold">
              <Icon icon="circle-dashed-plus" className="me-2.5" />
              Add New Attribute
            </h3>
            <button type="button" aria-label="Close" data-hs-overlay="#addAttributeForm">
              <span className="sr-only">Close</span>
              <Icon icon="x" className="size-5" />
            </button>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
              <div>
                <label htmlFor="attributeName" className="form-label">
                  Attribute Name
                </label>
                <input type="text" id="attributeName" className="form-input" placeholder="e.g. Color, Size, Material" required />
              </div>
              <div>
                <label htmlFor="attributeType" className="form-label">
                  Type
                </label>
                <select id="attributeType" className="form-input" required>
                  <option>Select Type</option>
                  <option value="Dropdown">Dropdown</option>
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="attributeValues" className="form-label">
                  Values
                </label>
                <textarea id="attributeValues" className="form-textarea" rows={2} placeholder="Separate multiple values with commas (e.g. Red, Blue, Green)" defaultValue={''} />
                <small className="text-default-400 mt-1 block">Applicable only for Dropdown or selectable attributes.</small>
              </div>
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2">
                  <input className="form-switch" type="checkbox" id="attributeStatus" defaultChecked />
                  <label className="form-check-label font-semibold" htmlFor="attributeStatus">
                    Active
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="border-default-300 flex items-center justify-end gap-2 border-t p-5">
            <button type="button" className="btn bg-light hover:text-primary" data-hs-overlay="#addAttributeForm">
              Close
            </button>
            <button type="button" className="btn bg-danger text-white hover:bg-danger-hover">
              <Icon icon="device-floppy" />
              Save Attribute
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddAttributeModal
