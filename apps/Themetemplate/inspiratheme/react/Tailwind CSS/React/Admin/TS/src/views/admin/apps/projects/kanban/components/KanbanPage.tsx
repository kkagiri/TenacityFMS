import Icon from '@/components/wrappers/Icon'
import Board from './Board'
import { kanbanSectionsData, kanbanTaskData } from './data'
import { KanbanProvider } from './useKanbanContext'

const KanbanPage = () => {
  return (
    <KanbanProvider sectionsData={kanbanSectionsData} tasksData={kanbanTaskData}>
      <div className="card h-[calc(100vh-200px)]">
        <div className="card-header gap-base!">
          <div className="flex gap-base flex-wrap items-center">
            <div className="input-icon-group">
              <Icon icon="search" className="input-icon text-default-400" />
              <input type="text" className="form-input" placeholder="Search tasks..." />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="input-icon-group">
                <Icon icon="briefcase" className="input-icon text-default-400" />
                <select className="form-select">
                  <option>Department</option>
                  <option value="Design">Design</option>
                  <option value="Development">Development</option>
                  <option value="UI/UX">UI/UX</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="QA">QA</option>
                </select>
              </div>
              <div className="input-icon-group">
                <Icon icon="calendar-clock" className="input-icon" />
                <select className="form-select">
                  <option>Due Date</option>
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <button className="btn bg-secondary text-white hover:bg-secondary-hover" aria-haspopup="dialog" aria-expanded="false" aria-controls="addTaskModal" data-hs-overlay="#addTaskModal">
              <Icon icon="plus" />
              Add New Task
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <Board />
        </div>
      </div>
    </KanbanProvider>
  )
}

export default KanbanPage
