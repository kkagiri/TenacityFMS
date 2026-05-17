import PageBreadcrumb from '@/components/PageBreadcrumb'
import ClientsTable from './components/ClientsTable'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Clients" subtitle="Apps" />
      <div className="container">
        <ClientsTable />
      </div>
    </>
  )
}

export default Page
