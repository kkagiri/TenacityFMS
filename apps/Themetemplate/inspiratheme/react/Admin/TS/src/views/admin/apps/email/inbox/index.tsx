import PageBreadcrumb from '@/components/PageBreadcrumb'
import Emails from './components/Emails'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Email" subtitle="Email" />
      <div className="outlook-box email-app ">
        <Emails />
      </div>
    </>
  )
}

export default Page
