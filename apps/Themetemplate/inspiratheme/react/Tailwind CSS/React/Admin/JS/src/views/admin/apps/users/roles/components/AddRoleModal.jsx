import Icon from '@/components/wrappers/Icon'
const AddRoleModal = () => {
  return (
    <div id="addRoleModal" className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="addRoleModalLabel">
      <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex max-w-sm scale-95 items-center opacity-0 transition-all duration-200 ease-in-out md:mx-auto md:w-full md:max-w-2xl lg:max-w-3xl">
        <div className="card pointer-events-auto flex w-full flex-col">
          <div className="border-default-300 flex items-center justify-between border-b p-6">
            <h3 id="addRoleModalLabel" className="text-sm">
              Add New Role
            </h3>
            <button type="button" aria-label="Close" data-hs-overlay="#addRoleModal">
              <Icon icon="x" className="text-xl" />
            </button>
          </div>
          <div className="card-body overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="roleName" className="form-label">
                  Role Name
                </label>
                <input type="text" className="form-input" id="roleName" placeholder="e.g. Developer, Project Manager" required />
              </div>
              <div>
                <label htmlFor="roleDescription" className="form-label">
                  Description
                </label>
                <input type="text" className="form-input" id="roleDescription" placeholder="Brief description" required />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="roleResponsibilities" className="form-label">
                  Key Responsibilities
                </label>
                <textarea className="form-textarea" id="roleResponsibilities" rows={4} placeholder="Enter responsibilities separated by commas or lines" required defaultValue={''} />
                <small className="text-default-400 text-xs">Example: Codebase Maintenance, API Integration, Unit Testing</small>
              </div>
              <div>
                <label htmlFor="roleUsers" className="form-label">
                  Assign Users
                </label>
                <select className="form-textarea" id="roleUsers" multiple>
                  <option value={1}>John Doe</option>
                  <option value={2}>Sarah Smith</option>
                  <option value={3}>Michael Brown</option>
                  <option value={4}>Emma Wilson</option>
                </select>
                <small className="text-default-400 text-xs">Hold Ctrl (Windows) or Cmd (Mac) to select multiple users</small>
              </div>
              <div>
                <label htmlFor="roleIcon" className="form-label">
                  Role Icon
                </label>
                <input type="text" className="form-input" id="roleIcon" placeholder="e.g. shield, briefcase" />
                <small className="text-default-400 text-xs">Use icon class from your icon library</small>
              </div>
            </div>
          </div>
          <div className="border-default-300 flex items-center justify-end gap-x-2 border-t p-5">
            <button type="button" className="btn bg-light hover:text-primary" data-hs-overlay="#addRoleModal">
              Cancel
            </button>
            <button type="button" className="btn bg-primary text-white hover:bg-primary-hover">
              Add Role
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default AddRoleModal
