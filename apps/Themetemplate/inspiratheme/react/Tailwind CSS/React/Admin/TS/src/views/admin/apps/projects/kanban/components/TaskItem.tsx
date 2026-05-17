import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import { KanbanTaskType } from './data'

const TaskItem = ({ item }: { item: KanbanTaskType }) => {
  return (
    <>
      <div className="card border border-light hover:shadow-lg!">
        <div className="card-body">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <span className={cn('badge', item.category.className)}>
                <Icon icon="circle-filled"></Icon>
                {item.category.name}
              </span>
            </div>
            <div className="relative ms-auto">
              <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
                <button type="button" className="hs-dropdown-toggle btn btn-icon size-7.75 text-default-400 hover:bg-default-100" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                  <Icon icon="dots-vertical" className="text-xl" />
                </button>
                <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                  <div className="space-y-0.5">
                    <Link className="dropdown-item" to="">
                      <Icon icon="share" className="me-2" />
                      Share
                    </Link>
                    <Link className="dropdown-item" to="">
                      <Icon icon="edit" className="me-2" />
                      Edit
                    </Link>
                    <Link className="dropdown-item" to="">
                      <Icon icon="ban" className="me-2"></Icon>
                      Block
                    </Link>
                    <Link className="dropdown-item text-danger" to="">
                      <Icon icon="trash" className="me-2" />
                      Delete
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <h5 className="mb-5">
            <Link to="" className="hover:text-primary" draggable="false">
              {item.title}
            </Link>
          </h5>
          {item.image && (
            <div className="mb-5">
              <img src={item.image} className="rounded" width={500} height={300} alt="" draggable="false" />
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="flex items-center -space-x-1.5">
              {item.users.map((user, i) => (
                <div key={i}>
                  <img src={user} alt="" className="transitio-all size-6 rounded-full duration-200 hover:-translate-y-1" draggable="false" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2.5">
              <Icon icon="calendar-clock" className="text-default-400 text-lg"></Icon>
              <h5 className="text-sm font-medium">{item.date}</h5>
            </div>
          </div>
          {item.progress && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-default-400 font-semibold text-2xs">Progress</p>
                <p className="font-semibold mb-0">{item.progress}%</p>
              </div>
              <div className="w-full bg-default-200 rounded-full h-1.25">
                <div className={cn('h-1.25 rounded-full', item.category.progressClassName)} style={{ width: `${item.progress}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default TaskItem
