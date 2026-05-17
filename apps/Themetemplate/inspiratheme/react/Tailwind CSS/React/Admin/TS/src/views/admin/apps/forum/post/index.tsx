import PageBreadcrumb from '@/components/PageBreadcrumb'
import Blog from './components/Blog'
import PostSidebar from './components/PostSidebar'


const Page = () => {
  return (
    <>
      <PageBreadcrumb subtitle="Apps" title="Forum Post" />

      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-base">
          <Blog />
          <PostSidebar />
        </div>
      </div>
    </>
  )
}

export default Page
