import Icon from '@/components/wrappers/Icon'
import { formatBytes } from '@/utils/helpers'
import { fileItems } from './data'

const FileManageCard = () => {
  return (
    <div className="card">
      <div className="card-header justify-between">
        <h4 className="card-title">File Manage</h4>
        <a href="" className="btn bg-light btn-sm btn-icon rounded-full hover:text-primary hover:bg-primary/15">
          <Icon icon="plus" />
        </a>
      </div>

      <div className="card-body">
        {fileItems.map((file, idx) => {
          const isLast = idx === fileItems.length - 1
          return (
            <div key={idx} className={`flex justify-between items-center ${!isLast ? ' pb-2.5' : ''}`}>
              <div className="flex items-center py-1.25 gap-2.5">
                <div className="size-9 bg-light/50 text-default-400 rounded-md flex justify-center items-center">
                  <Icon icon={file.icon} className="text-xl"></Icon>
                </div>
                <div className="grow">
                  <h5 className="mb-1.25 text-sm">
                    <a href="" className="link-reset">
                      {file.name}
                    </a>
                  </h5>
                  <p className="text-default-400 text-xs">{formatBytes(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center -space-x-2 transition-all duration-300">
                {file.users.map((user, i) => (
                  <div key={i}>
                    <img src={user} className="transitio-all size-6 rounded-full duration-200 hover:-translate-y-1" alt="" />
                  </div>
                ))}
              </div>
              <div>
                <a href="" className="btn btn-sm size-8 border border-default-300 hover:border-default-400 hover:bg-default-50 transition-all duration-400" title="Download">
                  <Icon icon="download" className="text-lg"></Icon>
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FileManageCard
