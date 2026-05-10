import gbFlag from '@/assets/images/flags/gb.svg'
import user5 from '@/assets/images/users/user-5.jpg'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

const CustomerDetails = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Customer Details</h4>
        <Link to="" className="btn btn-icon border-default-300 size-8! rounded-full border">
          <Icon icon="pencil" className="text-lg" />
        </Link>
      </div>
      <div className="card-body">
        <div className="mb-7.5 flex items-center">
          <div className="relative me-2.5">
            <img src={user5} alt="avatar-5" className="size-11 rounded-full object-cover" />
          </div>
          <div>
            <h5 className="flex items-center mb-1.25">
              <a href="" className="text-default-800 hover:text-primary text-sm font-medium transition">
                Sophia Carter
              </a>
              <img src={gbFlag} alt="UK" className="ms-2.5 size-4 rounded-full" />
            </h5>
            <p className="text-default-400 text-sm">Since 2020</p>
          </div>
          <div className="relative ms-auto">
            <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
              <button type="button" className="hs-dropdown-toggle btn btn-icon text-default-400 hover:bg-default-100" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                <Icon icon="dots-vertical" className="size-5" />
              </button>
              <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                <div className="space-y-0.5">
                  <a className="dropdown-item" href="">
                    <Icon icon="share" />
                    Share
                  </a>
                  <a className="dropdown-item" href="">
                    <Icon icon="edit" />
                    Edit
                  </a>
                  <a className="dropdown-item" href="">
                    <Icon icon="ban" />
                    Block
                  </a>
                  <a className="dropdown-item text-danger" href="">
                    <Icon icon="trash" />
                    Delete
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ul className="text-default-400 space-y-2.5">
          <li>
            <div className="flex items-center gap-2.5">
              <span className="btn btn-icon bg-light text-default-800 size-6! rounded-full">
                <Icon icon="mail" className="text-sm" />
              </span>
              <h5>
                <Link to="" className="text-default-400 hover:text-primary font-medium text-sm transition-all">
                  sophia@designhub.com
                </Link>
              </h5>
            </div>
          </li>
          <li>
            <div className="flex items-center gap-2.5">
              <span className="btn btn-icon bg-light text-default-800 size-6! rounded-full">
                <Icon icon="phone" className="text-sm" />
              </span>
              <h5>
                <Link to="" className="text-default-400 hover:text-primary font-medium text-sm transition-all">
                  +44 7911 123456
                </Link>
              </h5>
            </div>
          </li>
          <li>
            <div className="flex items-center gap-2.5">
              <span className="btn btn-icon bg-light text-default-800 size-6! rounded-full">
                <Icon icon="map-pin" className="text-sm" />
              </span>
              <h5>
                <span className="text-default-400 font-medium">London, UK</span>
              </h5>
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default CustomerDetails
