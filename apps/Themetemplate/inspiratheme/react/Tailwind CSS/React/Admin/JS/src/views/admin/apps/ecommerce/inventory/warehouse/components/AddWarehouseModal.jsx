import Icon from '@/components/wrappers/Icon'
function AddWarehouseModal() {
  return (
    <div id="addWarehouseModal" className="hs-overlay pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="addWarehouseModalLabel">
      <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] scale-95 items-center opacity-0 transition-all duration-200 ease-in-out md:mx-auto md:w-full md:max-w-2xl lg:max-w-3xl">
        <div className="card pointer-events-auto flex w-full flex-col">
          <div className="card-body border-default-300 flex items-center justify-between border-b">
            <h3 id="addWarehouseModalLabel" className="flex items-center font-bold">
              <Icon icon="building" className="text-danger me-2" />
              Add New Warehouse
            </h3>
            <button type="button" aria-label="Close" data-hs-overlay="#addWarehouseModal">
              <span className="sr-only">Close</span>
              <Icon icon="x" className="text-2xl align-middle text-default-600" />
            </button>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
              <div>
                <label htmlFor="warehouseId" className="form-label">
                  Warehouse ID
                </label>
                <input type="text" id="warehouseId" className="form-input" placeholder="#WH-002" />
              </div>
              <div>
                <label htmlFor="warehouseName" className="form-label">
                  Warehouse Name
                </label>
                <input type="text" id="warehouseName" className="form-input" placeholder="North Region Hub" />
              </div>
              <div>
                <label htmlFor="warehouseLocation" className="form-label">
                  Location
                </label>
                <input type="text" id="warehouseLocation" className="form-input" placeholder="Los Angeles, USA" />
              </div>
              <div>
                <label htmlFor="warehouseManager" className="form-label">
                  Manager Name
                </label>
                <input type="text" id="warehouseManager" className="form-input" placeholder="Liam Parker" />
              </div>
              <div>
                <label htmlFor="warehouseEmail" className="form-label">
                  Manager Email
                </label>
                <input type="email" id="warehouseEmail" className="form-input" placeholder="liam.parker@company.com" />
              </div>
              <div>
                <label htmlFor="warehousePhone" className="form-label">
                  Contact Number
                </label>
                <input type="tel" id="warehousePhone" className="form-input" placeholder="+1 212 555 0184" />
              </div>
              <div>
                <label htmlFor="warehouseArea" className="form-label">
                  Total Area
                </label>
                <input type="text" id="warehouseArea" className="form-input" placeholder="85,000 sq.ft" />
              </div>
              <div>
                <label htmlFor="warehouseCapacity" className="form-label">
                  Total Capacity
                </label>
                <input type="text" id="warehouseCapacity" className="form-input" placeholder="40,000 units" />
              </div>
              <div>
                <label htmlFor="warehouseStock" className="form-label">
                  Current Stock
                </label>
                <input type="text" id="warehouseStock" className="form-input" placeholder="12,500 units" />
              </div>
              <div>
                <label htmlFor="warehouseValue" className="form-label">
                  Asset Value
                </label>
                <div className="flex">
                  <span className="bg-default-100 border-default-300 rounded-s border border-e-0 px-3 py-1.75">$</span>
                  <input type="number" id="warehouseValue" className="form-input rounded-s-none! border-s-0!" placeholder="1.25M" />
                </div>
              </div>
              <div>
                <label htmlFor="warehouseStatus" className="form-label">
                  Status
                </label>
                <select id="warehouseStatus" className="form-input">
                  <option>Operational</option>
                  <option>Under Maintenance</option>
                  <option>Closed</option>
                </select>
              </div>
            </div>
          </div>
          <div className="border-default-300 flex items-center justify-end gap-2 border-t p-5">
            <button type="button" className="btn bg-light hover:text-primary" data-hs-overlay="#addWarehouseModal">
              Close
            </button>
            <button type="button" className="btn bg-danger text-white hover:bg-danger-hover">
              <Icon icon="check" />
              Save Warehouse
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default AddWarehouseModal
