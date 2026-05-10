import PageBreadcrumb from '@/components/PageBreadcrumb'
import KanbanPage from './components/KanbanPage'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Kanban Board" subtitle="Apps" />

      <KanbanPage />
    </>
  )
}

export default Page
