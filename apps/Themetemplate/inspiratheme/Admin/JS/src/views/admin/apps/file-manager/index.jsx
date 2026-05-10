import PageBreadcrumb from '@/components/PageBreadcrumb'
import FileManagerPage from './components/FileManagerPage'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="File Manager" subtitle="Apps" />
      <FileManagerPage />
    </>
  )
}
export default Page
