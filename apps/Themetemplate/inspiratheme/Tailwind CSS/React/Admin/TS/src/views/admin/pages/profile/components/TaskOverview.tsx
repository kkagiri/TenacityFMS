import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { Link } from 'react-router'
import { taskData } from './data'

const TaskOverview = () => {
  return (
    <>
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">My Tasks</h4>
        </div>
        <div className="card-body p-0">
          <div className="table-wrapper whitespace-nowrap">
            <table className="table table-hover w-full text-sm">
              <thead className="bg-light/25 thead-sm">
                <tr className="uppercase text-2xs">
                  <th>Task</th>
                  <th>Status</th>
                  <th>Assigned By</th>
                  <th>Start Date</th>
                  <th>Priority</th>
                  <th>Progress</th>
                  <th style={{ width: 30 }}>Total Time Spent</th>
                </tr>
              </thead>

              <tbody>
                {taskData.map((task, idx) => (
                  <tr key={idx}>
                    <td>
                      <h5 className="my-1.25">
                        <Link to="">{task.title}</Link>
                      </h5>
                      <span className="text-xs text-default-400">Due in {task.dueDays} days</span>
                    </td>
                    <td>
                      <span className={`badge ${task.status === 'out-dated' ? 'bg-danger/15 text-danger' : task.status === 'in-progress' ? 'bg-warning/15 text-warning' : task.status === 'on-hold' ? 'bg-default-200 text-default-700' : 'bg-success/15 text-success'}`}>
                        {toPascalCase(task.status)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <img src={task.assignBy.image} alt={task.assignBy.name} className="size-8 rounded-full object-cover" />
                        <div>
                          <h5>{task.assignBy.name}</h5>
                          <p className="text-xs text-default-400">{task.assignBy.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{task.startDate}</td>
                    <td>
                      <span className={`badge ${task.priority === 'high' ? 'bg-danger/15 text-danger' : task.priority === 'medium' ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'}`}>{toPascalCase(task.priority)}</span>
                    </td>
                    <td>{task.progress}%</td>
                    <td>{task.time}</td>
                    <td>
                      <Link to="">
                        <Icon icon="edit" className="size-4.5 text-default-400"></Icon>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default TaskOverview
