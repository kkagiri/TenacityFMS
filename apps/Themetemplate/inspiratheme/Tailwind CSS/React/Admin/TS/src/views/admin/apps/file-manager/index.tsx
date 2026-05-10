import PageBreadcrumb from '@/components/PageBreadcrumb'
import FilesTable from './components/FilesTable'
import Sidebar from './components/Sidebar'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="File Manager" subtitle="Apps" />
      <div className="flex h-[calc(100vh-200px)]">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <FilesTable />
        </div>
      </div>
    </>
  )
}

export default Page
