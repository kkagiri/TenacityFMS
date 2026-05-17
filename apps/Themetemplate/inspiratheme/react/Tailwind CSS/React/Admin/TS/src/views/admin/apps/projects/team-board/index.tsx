import Icon from '@/components/wrappers/Icon'
import TeamCard from './components/TeamCard'
import { teamData } from './components/data'


const Page = () => {
  return (
    <>
      <div className="container-fluid">
        <div className="xl:w-5/6 mx-auto">
          <div className="my-5 flex items-center justify-between">
            <div className="grow">
              <h4 className="mb-1.25 page-main-title">Manage Teams</h4>
              <p className="text-default-400">Assign roles to streamline teamwork and secure access.</p>
            </div>
            <div className="text-end">
              <a href="#addTeamModal" className="btn bg-success text-white hover:bg-success-hover" aria-haspopup="dialog" aria-expanded="false" aria-controls="addTeamModal" data-hs-overlay="#addTeamModal">
                <Icon icon="plus"></Icon> Add New Team
              </a>
            </div>
          </div>

          <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-base">
            {teamData.map((team, idx) => (
              <TeamCard key={idx} team={team} idx={idx} />
            ))}
          </div>
        </div>
      </div>
      <div id="addTeamModal" className="hs-overlay pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="addTeamModalLabel">
        <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] scale-95 items-center opacity-0 transition-all duration-200 ease-in-out md:mx-auto md:w-full md:max-w-lg">
          <div className="card pointer-events-auto flex w-full flex-col">
            <div className="card-body border-default-300 flex items-center justify-between rounded-t border-b">
              <h3 id="addTeamModalLabel" className="font-bold">
                Add New Team
              </h3>
              <button type="button" aria-label="Close" data-hs-overlay="#addTeamModal">
                <span className="sr-only">Close</span>
                <Icon icon="x" className="text-xl" />
              </button>
            </div>
            <div className="card-body">
              <div className="mb-5">
                <label className="form-label">Team Name</label>
                <input type="text" className="form-input" placeholder="e.g., Creative Design Team" required />
              </div>
              <div className="mb-5">
                <label className="form-label">Team Code</label>
                <input type="text" className="form-input" placeholder="e.g., IT-01" required />
              </div>
              <div className="mb-5">
                <label className="form-label">Status</label>
                <select className="form-select" defaultValue={'New'}>
                  <option value="New">New</option>
                  <option value="Active">Active</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Busy">Busy</option>
                  <option value="Stable">Stable</option>
                </select>
              </div>
              <div className="mb-5">
                <label className="form-label">Team Members</label>
                <select className="form-select" multiple>
                  <option value={1}>Liam Carter</option>
                  <option value={2}>Ava Mitchell</option>
                  <option value={3}>Noah Parker</option>
                  <option value={4}>Emma Scott</option>
                  <option value={5}>Logan Brooks</option>
                  <option value={6}>Sophie Adams</option>
                  <option value={7}>Ethan Hall</option>
                </select>
                <div className="text-2xs text-default-400 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple users.</div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} placeholder="Brief team responsibilities..." defaultValue={''} />
              </div>
            </div>
            <div className="border-default-300 flex items-center justify-end gap-2 border-t p-5">
              <button type="button" className="btn bg-light hover:text-primary" data-hs-overlay="#addTeamModal">
                Cancel
              </button>
              <button type="button" className="btn bg-success text-white hover:bg-success-hover">
                <Icon icon="check" />
                Save Team
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
