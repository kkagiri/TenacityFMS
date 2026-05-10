import PageBreadcrumb from '@/components/PageBreadcrumb'
import EmailDetails from './components/EmailDetails'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Email Details" subtitle="Email" />
      <div className="outlook-box email-app">
        <EmailDetails />
      </div>
    </>
  )
}
export default Page
