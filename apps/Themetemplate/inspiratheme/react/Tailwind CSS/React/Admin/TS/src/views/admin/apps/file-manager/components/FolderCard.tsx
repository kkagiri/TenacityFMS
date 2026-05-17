import user1 from '@/assets/images/users/user-1.jpg'
import Icon from '@/components/wrappers/Icon'
import { formatBytes } from '@/utils/helpers'
import { Link } from 'react-router'
import { FolderType } from './data'

const FolderCard = ({ folder }: { folder: FolderType }) => {
  return (
    <div className="card border-default-300 border border-dashed">
      <div className="card-body p-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="bg-light/50 text-default-400 flex size-9 items-center justify-center rounded-md">
            <Icon icon="folder" className="text-2xl" />
          </div>
          <div>
            <h5 className="mb-1.25 text-xs">
              <Link to="" className="hover:text-primary">
                {folder.name}
              </Link>
            </h5>
            <p className="text-default-400 text-xs">{formatBytes(folder.size)}</p>
          </div>

          <div className="relative ms-auto">
            <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
              <button type="button" className="hs-dropdown-toggle text-xl text-default-400" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                <Icon icon="dots-vertical" className="size-5" />
              </button>

              <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                <div className="space-y-0.5">
                  <Link className="dropdown-item" to="">
                    <Icon icon="share" />
                    Share
                  </Link>

                  <Link className="dropdown-item" to="">
                    <Icon icon="link" />
                    Get Sharable Link
                  </Link>

                  <Link className="dropdown-item" to={user1} download>
                    <Icon icon="download" />
                    Download
                  </Link>

                  <Link className="dropdown-item" to="">
                    <Icon icon="pin" />
                    Pin
                  </Link>

                  <Link className="dropdown-item" to="">
                    <Icon icon="edit" />
                    Edit
                  </Link>

                  <Link className="dropdown-item" to="">
                    <Icon icon="trash" />
                    Delete
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FolderCard
