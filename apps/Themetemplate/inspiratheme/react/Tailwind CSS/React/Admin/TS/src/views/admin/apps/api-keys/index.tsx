import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiKeyTable from './components/ApiKeyTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="API Keys" subtitle="Apps" />
      <ApiKeyTable />
    </>
  )
}

export default Page
