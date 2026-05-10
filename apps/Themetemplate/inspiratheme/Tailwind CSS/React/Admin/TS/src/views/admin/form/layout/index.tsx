import PageBreadcrumb from '@/components/PageBreadcrumb'
import LayoutForm from './components/LayoutForm'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Layouts" subtitle="Forms" />
      <div className="container">
        <LayoutForm />
      </div>
    </>
  )
}

export default Page
