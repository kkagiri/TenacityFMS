import PageBreadcrumb from '@/components/PageBreadcrumb'
import EmailSidebar from '../components/EmailSidebar'
import EmailDetail from './components/EmailDetail'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Email Details" subtitle="Apps" />
      <div className="lg:flex lg:h-[calc(100vh-200px)]">
        <EmailSidebar />
        <EmailDetail />
      </div>
    </>
  )
}

export default Page
