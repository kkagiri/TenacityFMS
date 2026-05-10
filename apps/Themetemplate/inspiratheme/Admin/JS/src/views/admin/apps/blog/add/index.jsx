import PageBreadcrumb from '@/components/PageBreadcrumb'
import CreateArticle from './components/CreateArticle'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Create Article" subtitle="Blog" />
      <CreateArticle />
    </>
  )
}
export default Page
