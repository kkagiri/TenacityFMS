import PageBreadcrumb from '@/components/PageBreadcrumb'
import Blog from './components/Blog'
import ViewSidebar from './components/ViewSidebar'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Forum" subtitle="Apps" />
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-base">
          <Blog />
          <ViewSidebar />
        </div>
      </div>
    </>
  )
}

export default Page
