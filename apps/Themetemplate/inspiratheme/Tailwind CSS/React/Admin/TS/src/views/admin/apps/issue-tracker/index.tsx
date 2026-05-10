import PageBreadcrumb from '@/components/PageBreadcrumb'
import IssueTrackerTable from './components/IssueTrackerTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Issue List" subtitle="Apps" />
      <IssueTrackerTable />
    </>
  )
}

export default Page
