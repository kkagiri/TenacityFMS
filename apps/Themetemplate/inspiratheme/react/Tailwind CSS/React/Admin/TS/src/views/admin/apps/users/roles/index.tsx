import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import MemberRoleCard from './components/MemberRoleCard'
import UsersTable from './components/UsersTable'
import { memberRoleData } from './components/data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Roles" subtitle="Users" />
      <div className="container">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="page-main-title mb-1.25">Manage Roles</h4>
            <p className="text-default-400">Manage roles for smoother operations and secure access.</p>
          </div>
          <div>
            <Link to="" className="btn bg-success text-white hover:bg-success-hover" aria-haspopup="dialog" aria-expanded="false" aria-controls="addRoleModal" data-hs-overlay="#addRoleModal">
              <Icon icon="plus" />
              Add New Role
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-base mb-base">
          {memberRoleData.map((member, idx) => (
            <MemberRoleCard key={idx} member={member} />
          ))}
        </div>

        <UsersTable />
      </div>
    </>
  )
}

export default Page
