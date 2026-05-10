import PageBreadcrumb from '@/components/PageBreadcrumb'
import ExamplesCard from './components/VectorMaps'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Vector" subtitle="Maps" />

      <div className="grid xl:grid-cols-2 gap-base">
        <ExamplesCard />
      </div>
    </>
  )
}

export default Page
