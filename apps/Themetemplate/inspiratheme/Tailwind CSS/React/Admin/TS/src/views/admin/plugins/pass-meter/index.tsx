import PageBreadcrumb from '@/components/PageBreadcrumb'
import PasswordMeters from './components/PasswordMeters'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Password Meter" subtitle="Plugins" />

      <div className="container">
        <div className="grid lg:grid-cols-2 gap-base">
          <PasswordMeters />
        </div>
      </div>
    </>
  )
}

export default Page
