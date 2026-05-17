import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { Card, CardBody, CardHeader, CardTitle, Table } from 'react-bootstrap'
import { Link } from 'react-router'
import { taskData } from './data'
const TaskOverview = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle as="h4">My Tasks</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <Table responsive className="table-centered table-custom table-sm table-nowrap table-hover mb-0">
            <thead className="bg-light bg-opacity-25 thead-sm">
              <tr className="text-uppercase fs-xxs">
                <th>Task</th>
                <th>Status</th>
                <th>Assigned By</th>
                <th>Start Date</th>
                <th>Priority</th>
                <th>Progress</th>
                <th>Total Time Spent</th>
                <th
                  style={{
                    width: 30,
                  }}
                />
              </tr>
            </thead>
            <tbody>
              {taskData.map((task, idx) => (
                <tr key={idx}>
                  <td>
                    <h5 className="fs-sm my-1">
                      <Link to="" className="text-body">
                        {task.title}
                      </Link>
                    </h5>
                    <span className="text-muted fs-xs">Due in {task.dueDays} days</span>
                  </td>
                  <td>
                    <span className={`badge ${task.status === 'out-dated' ? 'badge-soft-danger' : task.status === 'in-progress' ? 'badge-soft-warning' : task.status === 'on-hold' ? 'badge-soft-dark' : 'badge-soft-success'}`}>{toPascalCase(task.status)}</span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar avatar-sm">
                        <img src={task.assignBy.image} alt={task.assignBy.name} className="img-fluid rounded-circle" />
                      </div>
                      <div>
                        <h5 className="text-nowrap fs-sm mb-0">{task.assignBy.name}</h5>
                        <p className="text-muted fs-xs mb-0">{task.assignBy.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{task.startDate}</td>
                  <td>
                    <span className={`badge ${task.priority === 'high' ? 'badge-soft-danger' : task.priority === 'medium' ? 'badge-soft-primary' : 'badge-soft-secondary'}`}>{toPascalCase(task.priority)}</span>
                  </td>
                  <td>{task.progress}%</td>
                  <td>{task.time}</td>
                  <td>
                    <Link to="" className="text-muted fs-xxl">
                      <Icon icon="edit" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  )
}
export default TaskOverview
