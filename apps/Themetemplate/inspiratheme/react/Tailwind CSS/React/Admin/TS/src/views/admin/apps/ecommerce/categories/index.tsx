import PageBreadcrumb from '@/components/PageBreadcrumb'
import CategoryTable from './components/CategoryTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Categories" subtitle="Ecommerce" />
      <CategoryTable />
    </>
  )
}

export default Page
