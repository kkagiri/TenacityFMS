import PageBreadcrumb from '@/components/PageBreadcrumb'
import EmailSidebar from '../components/EmailSidebar'
import Emails from './components/Emails'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Email" subtitle="Apps" />

      <div className="lg:flex lg:h-[calc(100vh-200px)]">
        <EmailSidebar />
        <Emails />
      </div>
    </>
  )
}

export default Page
