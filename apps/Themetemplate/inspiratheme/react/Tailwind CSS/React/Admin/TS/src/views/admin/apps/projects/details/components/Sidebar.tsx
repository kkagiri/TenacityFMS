import Icon from '@/components/wrappers/Icon'
import { cn, formatBytes } from '@/utils/helpers'
import { Link } from 'react-router'
import { fileData, teamMemberData } from './data'

const Sidebar = () => {
  return (
    <div className="card h-full lg:rounded-s-none shadow-none">
      <div className="border-default-300 border-b border-dashed p-5">
        <h5 className="mb-3">Status</h5>
        <div className="input-icon-group">
          <Icon icon="calendar-clock" className="input-icon" />
          <select className="form-select">
            <option disabled>Status</option>
            <option value="On Track">On Track</option>
            <option value="Delayed">Delayed</option>
            <option value="At Risk">At Risk</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="border-default-300 border-b border-dashed p-5">
        <div className="mb-5 flex items-center justify-between">
          <h5 className="font-semibold">Team Members:</h5>
          <Link to="" className="btn bg-light btn-icon size-7.75 rounded-full">
            <Icon icon="plus" />
          </Link>
        </div>

        {teamMemberData.map((member, idx) => (
          <div className={cn('flex items-center justify-between', { 'pb-2.5': idx != teamMemberData.length - 1 })} key={idx}>
            <div className={cn('flex items-center gap-2.5', { 'py-1.25': idx != teamMemberData.length - 1 })}>
              <div className="size-8">
                <img src={member.image} alt={member.name} className="img-fluid rounded-full" />
              </div>
              <div>
                <h5 className="text-nowrap">
                  <Link to="" className="hover:text-primary">
                    {member.name}
                  </Link>
                </h5>
                <p className="text-default-400 text-2xs">{member.role}</p>
              </div>
            </div>
            <div>
              <Link to="" className="btn btn-sm btn-icon btn-default border-default-300 hover:border-default-400 hover:bg-default-100 size-7.75 border" title="Message">
                <Icon icon="message" className="text-default-400 text-base" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="border-default-300 border-b border-dashed px-5 pt-5">
        <div className="mb-5 flex items-center justify-between">
          <h5 className="font-semibold">Files:</h5>
          <Link to="" className="btn bg-light btn-icon size-7.75 rounded-full">
            <Icon icon="plus" />
          </Link>
        </div>

        {fileData.map(({ name, size, icon }, idx) => (
          <div className="flex items-center justify-between pb-2.5" key={idx}>
            <div className="flex items-center gap-2.5 py-1.25">
              <div className="btn bg-light btn-icon size-9">
                <Icon icon={icon} className="text-default-400 text-lg" />
              </div>
              <div>
                <h5 className="text-nowrap">
                  <Link to="" className="hover:text-primary">
                    {name}
                  </Link>
                </h5>
                <p className="text-default-400 text-2xs">{formatBytes(size)}</p>
              </div>
            </div>
            <div>
              <Link to="" className="btn btn-sm btn-icon btn-default border-default-300 hover:border-default-400 hover:bg-default-100 size-7.75 border" title="Download">
                <Icon icon="download" className="text-base" />
              </Link>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-center gap-2.5 p-2.5 md:p-5">
          <strong>Loading...</strong>
          <div className="text-danger inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="loading">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
