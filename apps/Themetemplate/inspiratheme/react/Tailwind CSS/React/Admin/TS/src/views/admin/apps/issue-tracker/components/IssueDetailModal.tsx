import user1 from '@/assets/images/users/user-1.jpg'
import Icon from '@/components/wrappers/Icon'

const IssueDetailModal = () => {
  const files = [{ name: 'profile-update-bug.txt' }, { name: 'screenshot-mobile.png' }]
  return (
    <div id="taskDetailsModal" className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="taskDetailsModalLabel">
      <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] scale-95 items-center opacity-0 transition-all duration-200 ease-in-out md:mx-auto md:w-full md:max-w-2xl lg:max-w-3xl">
        <div className="card pointer-events-auto flex w-full flex-col">
          <div className="card-header py-5">
            <h3 id="taskDetailsModalLabel" className="text-md">
              Issue Details
            </h3>
            <button type="button" aria-label="Close" data-hs-overlay="#taskDetailsModal">
              <Icon icon="x" className="text-xl" />
            </button>
          </div>
          <div className="card-body overflow-y-auto">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="badge bg-warning/10 text-warning rounded-full py-1.5 px-3 text-xs">In Progress</span>
              <h5 className="font-semibold">ISSUE-104 — User profile update not saving on mobile devices</h5>
            </div>
            <div className="flex items-center mb-6">
              <img src={user1} className="rounded-full me-3" width={40} height={40} alt="User" />
              <div>
                <h5>Jason Lee</h5>
                <small className="text-default-400 text-2xs">Assigned User</small>
              </div>
            </div>
            <div className="grid md:grid-cols-3 mb-6">
              <div>
                <strong>Created:</strong>
                10 Feb 2025
              </div>
              <div>
                <strong>Due:</strong>
                15 Feb 2025
              </div>
              <div>
                <div className="mb-1.25">
                  <span className="badge badge-label bg-light me-1">Mobile</span>
                  <span className="badge badge-label bg-light me-1">UI</span>
                  <span className="badge bg-light text-danger">Urgent</span>
                </div>
              </div>
            </div>
            <p className="text-default-400 mb-4">User profile update is not saving correctly on mobile devices. This issue occurs on iOS Safari and Android Chrome. Needs urgent fix before next release.</p>
            <div className="mb-6">
              <div className="flex justify-between">
                <small className="mb-3 uppercase text-2xs">Progress</small>
                <small className="font-bold text-warning text-2xs">60% Complete</small>
              </div>
              <div className="h-1.5 w-full rounded bg-default-200">
                <div className="h-full w-[60%] rounded bg-warning" />
              </div>
            </div>
            <div className="grid grid-cols-2 text-center mb-6">
              <div className="flex items-center justify-center">
                <Icon icon="message" className="me-1.5" />
                <strong>12 Comments</strong>
              </div>
              <div className="flex items-center justify-center">
                <Icon icon="paperclip" className="me-1.5" />
                <strong>3 Files Attached</strong>
              </div>
            </div>
            <ul className="list-group mb-6 border border-default-300">
              {files.map((file, idx) => (
                <li className="py-3 px-5 border-b border-default-300 flex justify-between items-center" key={idx}>
                  <span>{file.name}</span>
                  <a href="" className="btn btn-sm border border-primary text-primary">
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-default-300 flex items-center justify-end gap-x-2 border-t p-5">
            <button type="button" className="btn bg-default-200 hover:text-primary" data-hs-overlay="#taskDetailsModal">
              Close
            </button>
            <button type="button" className="btn bg-primary text-white hover:bg-primary-hover">
              Edit Issue
            </button>
            <button type="button" className="btn bg-danger text-white hover:bg-danger-hover">
              Delete Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IssueDetailModal
