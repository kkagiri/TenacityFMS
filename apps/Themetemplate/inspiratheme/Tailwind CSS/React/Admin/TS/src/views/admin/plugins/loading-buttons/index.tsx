import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingButtons from './components/LoadingButtons'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Loading Buttons" subtitle="Plugins" />

      <div className="container">
        <LoadingButtons />
      </div>
    </>
  )
}

export default Page
