import user10 from '@/assets/images/users/user-10.jpg'
import user7 from '@/assets/images/users/user-7.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
import user9 from '@/assets/images/users/user-9.jpg'

import Icon from '@/components/wrappers/Icon'

const MemberRoleCard = () => {
  return (
    <>
      <div className="card">
        <div className="card-body">
          <div className="flex items-start mb-7.5">
            <div>
              <div className="size-12 bg-primary/15 text-primary flex justify-center items-center rounded-full">
                <Icon icon="shield-lock" className="size-6" />
              </div>
            </div>
            <div className="ms-6">
              <h5 className="text-sm mb-1.25">Security Officer</h5>
              <p className="text-default-400">Handles platform safety and protocol reviews.</p>
            </div>
            <div className="ms-auto relative">
              <div className="hs-dropdown [--placement:bottom-right] relative inline-flex">
                <button type="button" className="hs-dropdown-toggle text-lg text-default-400" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                  <Icon icon="dots-vertical" className="text-lg" />
                </button>
                <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                  <a className="dropdown-item" href="">
                    <Icon icon="edit" /> Edit
                  </a>
                  <a className="dropdown-item text-danger" href="">
                    <Icon icon="trash" /> Remove
                  </a>
                </div>
              </div>
            </div>
          </div>
          <ul className="flex flex-col gap-y-3 mb-base">
            <li className="flex items-center gap-3">
              <Icon icon="check" className="text-base text-success" />
              Daily Risk Assessment
            </li>
            <li className="flex items-center gap-3">
              <Icon icon="check" className="text-base text-success" />
              Manage Security Logs
            </li>
            <li className="flex items-center gap-3">
              <Icon icon="check" className="text-base text-success" />
              Control Access Rights
            </li>
            <li className="flex items-center gap-3">
              <Icon icon="check" className="text-base text-success" />
              Emergency Protocols
            </li>
          </ul>
          <p className="text-sm text-default-400 mb-3">Total 17 users</p>
          <div className="flex -space-x-2 items-center mb-base">
            <img src={user7} alt="user" className="size-8 rounded-full hover:-translate-y-1 transition-all duration-200" />
            <img src={user8} alt="user" className="size-8 rounded-full hover:-translate-y-1 transition-all duration-200" />
            <img src={user9} alt="user" className="size-8 rounded-full hover:-translate-y-1 transition-all duration-200" />
            <img src={user10} alt="user" className="size-8 rounded-full hover:-translate-y-1 transition-all duration-200" />
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5 text-default-400 text-xs">
              <Icon icon="clock" />
              Updated 1 hour ago
            </span>
            <div>
              <button className="btn btn-sm border border-primary text-primary hover:bg-primary hover:text-white rounded-full" aria-haspopup="dialog" aria-expanded="false" aria-controls="editRoleModal" data-hs-overlay="#editRoleModal">
                Edit Role
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="editRoleModal" className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 hidden fixed inset-0 z-80 overflow-x-hidden overflow-y-auto pointer-events-none">
        <div className="flex items-start justify-center min-h-screen p-4 pointer-events-none">
          <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 scale-95 opacity-0 transition-all duration-200 pointer-events-auto w-full max-w-3xl">
            <div className="flex flex-col card">
              <div className="card-header flex justify-between items-center">
                <h3 id="editRoleModal-label" className="font-semibold text-default-600">
                  Edit Role
                </h3>
                <button type="button" className="text-default-800" aria-label="Close" data-hs-overlay="#editRoleModal">
                  <Icon icon="x" className="size-6" />
                </button>
              </div>

              <div className="card-body">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="editRoleName" className="form-label">
                      Role Name
                    </label>
                    <input type="text" className="form-input" id="editRoleName" defaultValue="Developer" required />
                  </div>

                  <div>
                    <label htmlFor="editRoleDescription" className="form-label">
                      Description
                    </label>
                    <input type="text" className="form-input" id="editRoleDescription" defaultValue="Builds and maintains the platform core features." required />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="editRoleResponsibilities" className="form-label">
                      Responsibilities
                    </label>
                    <textarea
                      className="form-textarea"
                      id="editRoleResponsibilities"
                      rows={4}
                      required
                      defaultValue={`                      Codebase Maintenance
                      API Integration
                      Unit Testing
                      Feature Deployment`}
                    />

                    <small className="text-default-400">Separate each item by comma or line</small>
                  </div>

                  <div className="md:col-span-1">
                    <label htmlFor="editRoleUsers" className="form-label">
                      Assign Users
                    </label>
                    <select className="form-input min-h-20" id="editRoleUsers" multiple>
                      <option value="1">Leah Kim</option>
                      <option value="2">David Tran</option>
                      <option value="3">Michael Brown</option>
                      <option value="4">Emma Wilson</option>
                    </select>
                    <small className="text-default-400">Hold Ctrl (Windows) or Cmd (Mac) to select multiple users</small>
                  </div>

                  <div className="md:col-span-1">
                    <label htmlFor="editRoleIcon" className="form-label">
                      Role Icon
                    </label>
                    <input type="text" className="form-input" id="editRoleIcon" defaultValue="ti ti-code" readOnly />
                    <small className="text-default-400">Use icon class from your icon library</small>
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center gap-x-2 border-t border-dashed border-default-300 p-4">
                <button type="button" className="btn bg-light hover:text-primary" data-hs-overlay="#editRoleModal">
                  Cancel
                </button>
                <button type="button" className="btn bg-primary text-white m-1">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MemberRoleCard
