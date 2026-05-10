import PageBreadcrumb from '@/components/PageBreadcrumb'
import NewEmail from './component/NewEmail'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Compose" subtitle="Email" />
      <div className="outlook-box email-app">
        <NewEmail />
      </div>
    </>
  )
}
export default Page
