import Icon from '@/components/wrappers/Icon'

const AddCategoryModal = () => {
  return (
    <div id="addCategoryModal" className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 hidden size-full fixed top-0 start-0 z-80 overflow-x-hidden overflow-y-auto pointer-events-none" role="dialog" tabIndex={-1} aria-labelledby="addCategoryModalLabel">
      <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 scale-95 opacity-0 ease-in-out transition-all duration-200 lg:max-w-3xl md:max-w-2xl md:w-full m-3 md:mx-auto min-h-[calc(100%-56px)] flex items-center">
        <div className="w-full flex flex-col card pointer-events-auto">
          <div className="card-header">
            <h3 id="addCategoryModalLabel" className="font-bold text-sm">
              Add New Category
            </h3>

            <button type="button" aria-label="Close" data-hs-overlay="#addCategoryModal">
              <Icon icon="x" className="text-xl"></Icon>
            </button>
          </div>

          <div className="card-body overflow-y-auto">
            <div className="grid grid-cols-2 gap-base">
              <div>
                <label htmlFor="categoryName" className="form-label">
                  Category Name
                </label>
                <input type="text" className="form-input" id="categoryName" placeholder="e.g. Electronics" required />
              </div>

              <div>
                <label htmlFor="categorySlug" className="form-label">
                  Slug
                </label>
                <input type="text" className="form-input" id="categorySlug" placeholder="e.g. electronics" required />
              </div>

              <div className="lg:col-span-2 col-span-1">
                <label htmlFor="categoryImage" className="form-label">
                  Category Image
                </label>
                <input type="file" name="file-input" id="categoryImage" className="block w-full border border-default-300 rounded disabled:opacity-50 disabled:pointer-events-none file:bg-default-100 file:border-0 file:me-4 file:py-2 file:px-3" />
              </div>

              <div>
                <label htmlFor="categoryStatus" className="form-label">
                  Status
                </label>
                <select id="categoryStatus" className="form-input" required>
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="lg:col-span-2 col-span-1">
                <label htmlFor="categoryDescription" className="form-label">
                  Description (Optional)
                </label>
                <textarea id="categoryDescription" className="form-textarea" rows={3} placeholder="Brief description of the category..."></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-x-2 border-t border-default-300 card-body">
            <button type="button" className="btn bg-light hover:text-primary" data-hs-overlay="#addCategoryModal">
              Cancel
            </button>

            <button type="button" className="btn bg-primary text-white hover:bg-primary-hover">
              Add Category
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddCategoryModal
