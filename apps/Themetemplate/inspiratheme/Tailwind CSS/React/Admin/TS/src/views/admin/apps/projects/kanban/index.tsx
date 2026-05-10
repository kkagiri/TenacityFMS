import PageBreadcrumb from '@/components/PageBreadcrumb'
import KanbanPage from './components/KanbanPage'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Kanban" subtitle="Projects" />

      <KanbanPage />
    </>
  )
}

export default Page
