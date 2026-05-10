import PageBreadcrumb from '@/components/PageBreadcrumb'
import Feeds from './components/Feeds'
import Sidebar from './components/Sidebar'
import SocialProfile from './components/SocialProfile'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Social Feed" subtitle="Apps" />
      <div className="container">
        <div className="lg:gap-base grid grid-cols-1 lg:grid-cols-4">
          <div>
            <SocialProfile />
          </div>

          <div className="mb-base lg:col-span-2 lg:mb-0">
            <Feeds />
          </div>

          <div>
            <Sidebar />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
