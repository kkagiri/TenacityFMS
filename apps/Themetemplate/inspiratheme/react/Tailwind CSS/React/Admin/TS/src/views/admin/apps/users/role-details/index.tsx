import Icon from '@/components/wrappers/Icon'
import MemberRoleCard from './components/MemberRoleCard'
import UsersTable from './components/UsersTable'


const page = () => {
  return (
    <>
      <div className="container">
        <div className="flex flex-wrap justify-between items-center gap-3 my-5">
          <div>
            <h4 className="page-main-title mb-1.25">Role Details</h4>
            <p className="text-default-400">Define and manage roles to streamline operations and ensure secure access control.</p>
          </div>

          <div>
            <button className="btn bg-success text-white" aria-haspopup="dialog" aria-expanded="false" data-hs-overlay="#addRoleModal">
              <Icon icon="plus" />
              Add New Role
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 grid-cols-1 gap-base">
          <div className="col-span-1">
            <MemberRoleCard />
          </div>
          <div className="lg:col-span-3">
            <UsersTable />
          </div>
        </div>
      </div>
    </>
  )
}

export default page
