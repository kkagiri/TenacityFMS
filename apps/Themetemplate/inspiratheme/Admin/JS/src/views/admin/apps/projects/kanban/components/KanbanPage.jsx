import { Card } from 'react-bootstrap'
import Board from './Board'
import { kanbanSectionsData, kanbanTaskData } from './data'
import KanbanHeader from './KanbanHeader'
import { KanbanProvider } from './useKanbanContext'
const KanbanPage = () => {
  return (
    <KanbanProvider sectionsData={kanbanSectionsData} tasksData={kanbanTaskData}>
      <div className="outlook-box kanban-app">
        <Card className="h-100 mb-0 flex-grow-1">
          <KanbanHeader />
          <Board />
        </Card>
      </div>
    </KanbanProvider>
  )
}
export default KanbanPage
