import PageBreadcrumb from '@/components/PageBreadcrumb'
import SweetAlerts from './components/SweetAlerts'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="SweetAlert2" subtitle="Plugins" />
      <div className="container">
        <SweetAlerts />
      </div>
    </>
  )
}

export default Page
