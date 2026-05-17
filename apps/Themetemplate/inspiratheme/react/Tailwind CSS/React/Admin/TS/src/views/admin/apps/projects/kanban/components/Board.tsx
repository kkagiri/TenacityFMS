import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import TaskItem from './TaskItem'
import { useKanbanContext } from './useKanbanContext'

const Board = () => {
  const { onDragEnd, sections, getAllTasksPerSection } = useKanbanContext()

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="bg-light/40 flex items-stretch overflow-x-auto relative">
          {sections.map((section) => (
            <Droppable key={section.id} droppableId={section.id}>
              {(provided) => (
                <div className="w-85 min-w-84 border-default-300 border-e border-dashed" ref={provided.innerRef}>
                  <div className="flex items-center px-5 py-2.5">
                    <h5>
                      &nbsp;
                      {section.title} ({getAllTasksPerSection(section.id).length})
                    </h5>
                    <button type="button" className="bg-primary ms-auto inline-flex size-7.75 items-center justify-center rounded-full text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="addTaskModal" data-hs-overlay="#addTaskModal">
                      <Icon icon="plus" className="text-white" />
                    </button>
                  </div>
                  <SimpleBar className="h-[calc(100vh-332px)] px-5 pb-5" data-simplebar data-simplebar-md>
                    <ul className="space-y-2.5">
                      {getAllTasksPerSection(section.id).map((task, idx) => (
                        <Draggable draggableId={task.id} index={idx} key={task.id}>
                          {(provided) => (
                            <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <TaskItem item={task} />
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  </SimpleBar>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </>
  )
}

export default Board
