import PageBreadcrumb from '@/components/PageBreadcrumb'
import IdleTracker from './components/IdleTracker'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Idle Timer" subtitle="Plugins" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <IdleTracker />
        </div>
      </div>
    </>
  )
}

export default Page
