import PageBreadcrumb from '@/components/PageBreadcrumb'
import BasicActivity from './components/BasicActivity'
import ExpandedActivity from './components/ExpandedActivity'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Activity Stream" subtitle="Projects" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
        <BasicActivity />

        <ExpandedActivity />
      </div>
    </>
  )
}

export default Page
