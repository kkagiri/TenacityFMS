import PageBreadcrumb from '@/components/PageBreadcrumb'
import PermissionTable from './components/PermissionTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Permissions" subtitle="Users" />
      <div className="container">
        <PermissionTable />
      </div>
    </>
  )
}

export default Page
