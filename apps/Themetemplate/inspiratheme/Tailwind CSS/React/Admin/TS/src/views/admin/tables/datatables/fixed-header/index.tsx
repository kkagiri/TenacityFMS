import PageBreadcrumb from '@/components/PageBreadcrumb'
import FixHeader from './components/FixHeader'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Fixed Header" subtitle="DataTables" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <FixHeader />
        </div>
      </div>
    </>
  )
}

export default Page
