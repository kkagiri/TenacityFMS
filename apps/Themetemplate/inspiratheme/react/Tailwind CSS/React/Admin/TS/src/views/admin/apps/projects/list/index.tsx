import PageBreadcrumb from '@/components/PageBreadcrumb'
import ProjectsList from './components/ProjectsList'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Projects List" subtitle="Apps" />
      <ProjectsList />
    </>
  )
}

export default Page
