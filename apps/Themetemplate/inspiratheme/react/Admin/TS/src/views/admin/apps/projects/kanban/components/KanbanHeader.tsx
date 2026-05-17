import Icon from '@/components/wrappers/Icon'
import { Button, CardHeader, FormControl, FormSelect } from 'react-bootstrap'
import { useKanbanContext } from './useKanbanContext'

const KanbanHeader = () => {
  const { newTaskModal } = useKanbanContext()
  return (
    <CardHeader className="border-light align-items-center gap-2">
      <div className="app-search">
        <FormControl type="search" placeholder="Search tasks..." />
        <Icon icon="search" className="app-search-icon text-muted" />
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2">
        <div className="app-search">
          <FormSelect className="form-control">
            <option>Department</option>
            <option value="Design">Design</option>
            <option value="Development">Development</option>
            <option value="UI/UX">UI/UX</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
            <option value="QA">QA</option>
          </FormSelect>
          <Icon icon="briefcase" className="app-search-icon text-muted" />
        </div>

        <div className="app-search">
          <FormSelect className="form-control">
            <option>Due Date</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </FormSelect>
          <Icon icon="calendar-clock" className="app-search-icon text-muted" />
        </div>
      </div>

      <Button variant="secondary" type="submit" className="ms-lg-auto" onClick={() => newTaskModal.toggle()}>
        <Icon icon="plus" className="me-1" /> Add New Card
      </Button>
    </CardHeader>
  )
}

export default KanbanHeader
