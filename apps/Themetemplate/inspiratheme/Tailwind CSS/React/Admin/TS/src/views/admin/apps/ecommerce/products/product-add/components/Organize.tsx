import Icon from '@/components/wrappers/Icon'

const Organize = () => {
  return (
    <div className="card">
      <div className="card-header p-5">
        <div>
          <h4 className="card-title mb-1.25">Organize</h4>
          <p className="text-default-400">Organize your product by selecting the appropriate brand, category, sub-category, status, and tags.</p>
        </div>
      </div>
      <div className="card-body">
        <div className="space-y-base">
          <div>
            <label htmlFor="brand" className="form-label">
              Brand
            </label>
            <div className="input-icon-group">
              <Icon icon="stack-2" className="input-icon" />
              <input type="text" className="form-input" id="brand" placeholder="Enter brand name" required />
            </div>
          </div>
          <div>
            <label htmlFor="category" className="form-label">
              Category <span className="text-danger ms-1">*</span>
            </label>
            <div className="input-icon-group">
              <Icon icon="category" className="input-icon" />
              <select className="form-select" id="category">
                <option>Choose Category</option>
                <option value="Furniture">Furniture</option>
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="subCategory" className="form-label">
              Sub Category<span className="text-danger ms-1">*</span>
            </label>
            <div className="input-icon-group">
              <Icon icon="list-check" className="input-icon" />
              <select className="form-select" id="subCategory">
                <option>Choose Sub Category</option>
                <option value="Chairs">Chairs</option>
                <option value="Sofas">Sofas</option>
                <option value="Tables">Tables</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="statusOne" className="form-label">
              Status
              <span className="text-danger ms-1">*</span>
            </label>
            <div className="input-icon-group">
              <Icon icon="wand" className="input-icon" />
              <select className="form-select" id="statusOne">
                <option>Choose Status</option>
                <option value="Published">Published</option>
                <option value="Inactive">Inactive</option>
                <option value="Schedule">Schedule</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="tags" className="form-label">
              Tags
            </label>
            <div className="input-icon-group">
              <Icon icon="tag" className="input-icon" />
              <input type="text" className="form-input" id="tags" placeholder="Enter tags separated by commas" required />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Organize
