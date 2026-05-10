import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { Link } from 'react-router'
import { taskData } from './data'

const TaskList = () => {
  return (
    <>
      {taskData.map((task, idx) => (
        <div className="card mb-1.25" key={idx}>
          <div className="card-body p-2.5">
            <div className="grid grid-cols-1 items-center justify-between lg:grid-cols-2 gap-base">
              <div className="col-span-1">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="form-checkbox size-5.5! rounded-full" id={`task-${idx}`} />
                  <Link to="" className="hover:text-primary font-medium">
                    {task.title}
                  </Link>
                </div>
              </div>
              <div className="col-span-1">
                <div className="flex gap-base flex-wrap items-center justify-start lg:justify-end">
                  <div className="flex items-center gap-1.5">
                    <div>
                      <img src={task.user.image} alt="avatar-2" className="size-6 rounded-full" />
                    </div>
                    <div>
                      <h5 className="text-nowrap">
                        <Link to="" className="hover:text-primary">
                          {task.user.name}
                        </Link>
                      </h5>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={cn(
                        'badge badge-label  text-white',
                        task.status === 'in-progress' ? 'bg-warning' : task.status === 'review' ? 'bg-info' : task.status === 'delayed' ? 'bg-danger' : task.status === 'pending' ? 'bg-primary' : task.status === 'planned' ? 'bg-secondary' : 'bg-success'
                      )}
                    >
                      {toPascalCase(task.status)}
                    </span>
                  </div>

                  <ul className="flex shrink-0 flex-wrap items-center gap-3.5 text-end">
                    <li className="flex items-center">
                      <Icon icon="calendar" className="text-default-400 me-1.25 text-base align-middle"></Icon>
                      <span className="font-semibold">{task.time}</span>
                    </li>
                    <li className="flex items-center">
                      <Icon icon="list-details" className="text-default-400 me-1.25 text-base align-middle"></Icon>
                      <span className="font-medium">
                        {task.tasks.completed}/{task.tasks.total}
                      </span>
                    </li>
                    <li className="flex items-center">
                      <Icon icon="message" className="text-default-400 me-1.25 text-base align-middle"></Icon>
                      <span className="font-medium">{task.comments}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default TaskList
