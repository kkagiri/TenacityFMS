import PageBreadcrumb from '@/components/PageBreadcrumb'
import Blog from './components/Blog'
import ListSidebar from './components/ListSidebar'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="List" subtitle="Blog" />
      <div className="card">
        <div className="p-7.5">
          <div className="grid xl:grid-cols-3 gap-base lg:gap-15">
            <Blog />
            <ListSidebar />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
