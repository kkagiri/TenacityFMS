import Icon from '@/components/wrappers/Icon'

const Pricing = () => {
  return (
    <div className="card">
      <div className="card-header p-5">
        <div>
          <h4 className="card-title mb-1.25">Pricing</h4>
          <p className="text-default-400">Set the base price and applicable discount for the product using the options below.</p>
        </div>
      </div>
      <div className="card-body">
        <div className="space-y-base">
          <div>
            <label htmlFor="basePrice" className="form-label">
              Base Price <span className="text-danger">*</span>
            </label>
            <div className="input-icon-group">
              <Icon icon="currency-dollar" className="input-icon" />
              <input type="text" className="form-input" id="basePrice" placeholder="Enter base price (e.g., 199.99)" required />
            </div>
          </div>
          <div>
            <label htmlFor="discount" className="form-label">
              Discount Type
              <span className="text-default-400 ms-1">(Optional)</span>
            </label>
            <div className="input-icon-group">
              <Icon icon="discount" className="input-icon" />
              <select className="form-select" id="discount">
                <option>Choose Discount</option>
                <option value="No Discount">No Discount</option>
                <option value="Flat Discount">Flat Discount</option>
                <option value="Percentage Discount">Percentage Discount</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="discountValue" className="form-label">
              Discount Value<span className="text-default-400 ms-1">(Optional)</span>
            </label>
            <div className="input-icon-group">
              <Icon icon="tag" className="input-icon" />
              <input type="text" className="form-input" id="discountValue" placeholder="Enter discount amount or percentage" required />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pricing
