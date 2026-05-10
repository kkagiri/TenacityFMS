import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { Link } from 'react-router'
import { ProjectType } from './data'

const ProjectCard = ({ project }: { project: ProjectType }) => {
  const { comments, dueDate, icon, progress, members, status, task, title, updatedTime, iconClassName, files } = project
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-5 pb-6 border-b border-default-300 flex">
          <div className="me-6">
            <span className={cn('text-white flex size-12 items-center justify-center rounded', iconClassName)}>
              <Icon icon={icon} className="text-2xl" />
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-start gap-3">
              <h5 className="hover:text-primary mb-1.25 text-md flex items-center">
                <Link to="/apps/projects/details" className="leading-tight hover:text-primary">
                  {title}
                </Link>
              </h5>
              <span
                className={cn(
                  'badge badge-label  whitespace-nowrap',
                  status === 'critical'
                    ? 'bg-danger/15 text-danger'
                    : status === 'pending'
                      ? 'bg-warning/15 text-warning'
                      : status === 'on-hold'
                        ? 'bg-secondary/15 text-secondary'
                        : status === 'monitoring'
                          ? 'bg-dark/15 text-dark'
                          : status === 'stable'
                            ? 'bg-success/15 text-success'
                            : status === 'review'
                              ? 'bg-info/15 text-info'
                              : 'bg-success/15 text-success'
                )}
              >
                {toPascalCase(status)}
              </span>
            </div>
            <p className="text-default-400 text-2xs">Updated {updatedTime}</p>
          </div>

          <div className="relative ms-3">
            <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
              <button type="button" className="hs-dropdown-toggle btn btn-icon text-default-400 hover:bg-default-100" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                <Icon icon="dots-vertical" className="text-lg" />
              </button>

              <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                <div className="space-y-0.5">
                  <Link className="dropdown-item" to="">
                    <Icon icon="share" />
                    Share
                  </Link>

                  <Link className="dropdown-item" to="">
                    <Icon icon="edit" />
                    Edit
                  </Link>

                  <Link className="dropdown-item" to="">
                    <Icon icon="ban" />
                    Block
                  </Link>

                  <Link className="dropdown-item text-danger" to="">
                    <Icon icon="trash" />
                    Delete
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-base mb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <Icon icon="list-check" className="text-default-400 text-base" />
              <div>
                <div className="font-medium">
                  {task.completed}/{task.total}
                </div>
                <small className="text-default-400 text-xs">{task.label}</small>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <Icon icon="paperclip" className="text-default-400 text-base" />
              <div>
                <div className="font-medium">
                  {files.count} {files.type ? files.type : 'Files'}
                </div>
                <small className="text-default-400 text-xs">{files.description}</small>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <Icon icon="message" className="text-default-400 text-base"></Icon>
              <div>
                <div className="font-medium">{comments.count} Comments</div>
                <small className="text-default-400 text-xs">{comments.description}</small>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <Icon icon="calendar-clock" className="text-default-400 text-base"></Icon>
              <div>
                <div className="font-medium">{dueDate.date}</div>
                <small className="text-default-400 text-xs">{dueDate.description}</small>
              </div>
            </div>
          </div>
        </div>

        <p className="text-default-400 text-xs mb-2.5 pt-2.5 font-semibold">Team Members:</p>
        <div className="mb-5 flex">
          {members.map((member, idx) => (
            <div key={idx} className={cn('', idx === 0 ? '' : '-ms-1.5')}>
              <img src={member.image} alt="" className="size-6 rounded-full transition-all duration-200 hover:-translate-y-0.5" />
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-default-400 text-xs font-semibold">Progress</p>
            <p className="font-semibold">{progress}%</p>
          </div>

          <div className="bg-default-100 h-1.25 w-full overflow-hidden rounded-full">
            <div
              className={cn(
                'h-full w-[' + progress + '%]',
                status === 'critical' ? 'bg-danger' : status === 'pending' ? 'bg-warning' : status === 'on-hold' ? 'bg-secondary' : status === 'monitoring' ? 'bg-dark' : status === 'stable' ? 'bg-success' : status === 'review' ? 'bg-info' : 'bg-success'
              )}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ProjectCard
