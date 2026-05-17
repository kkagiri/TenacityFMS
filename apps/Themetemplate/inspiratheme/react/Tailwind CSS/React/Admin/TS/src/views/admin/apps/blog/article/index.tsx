import PageBreadcrumb from '@/components/PageBreadcrumb'
import Blog from './components/Blog'
import DetailSidebar from './components/DetailSidebar'


const Page = () => {
  return (
    <>
      <PageBreadcrumb subtitle="Blog" title="Article" />

      <div className="container">
        <div className="card">
          <div className="card-body lg:p-15">
            <div className="grid 2xl:grid-cols-3 grid-cols-1 gap-15">
              <Blog />
              <DetailSidebar />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
