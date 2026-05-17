import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

import { MemberRoleType } from './data'

const MemberRoleCard = ({ member }: { member: MemberRoleType }) => {
  const { icon, title, users, features, description, time } = member
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-7.5 flex items-start">
          <div>
            <div className="bg-primary/15 text-primary flex size-12 items-center justify-center rounded-full">
              <Icon icon={icon} className="text-2xl"></Icon>
            </div>
          </div>

          <div className="ms-6">
            <h5 className="mb-1.25 text-sm">{title}</h5>
            <p className="text-default-400">{description}</p>
          </div>

          <div className="relative ms-auto">
            <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
              <button type="button" className="hs-dropdown-toggle text-lg text-default-400" aria-haspopup="menu" aria-expanded="false">
                <Icon icon="dots-vertical" className="text-xl"></Icon>
              </button>

              <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                <div className="space-y-0.5">
                  <a className="dropdown-item" href="">
                    <Icon icon="eye"></Icon>
                    View
                  </a>

                  <a className="dropdown-item" href="">
                    <Icon icon="edit"></Icon>
                    Edit
                  </a>

                  <a className="dropdown-item text-danger" href="">
                    <Icon icon="trash"></Icon>
                    Remove
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul className="mb-5 flex flex-col gap-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <Icon icon="check" className="text-success text-base"></Icon>
              {feature}
            </li>
          ))}
        </ul>

        <p className="text-default-400 mb-3 text-sm">Total {users.length} users</p>

        <div className="mb-5 flex items-center -space-x-2">
          {(users.length <= 5 ? users : users.slice(0, 4)).map((user, idx) => (
            <img key={idx} src={user.image} alt="" width={32} height={32} className="transition-all rounded-full duration-200 hover:-translate-y-1" />
          ))}
          {users.length > 5 && (
            <div className="hs-tooltip transitio-all inline-block duration-200 [--placement:top] hover:-translate-y-1">
              <button type="button" className="hs-tooltip-toggle bg-primary flex size-8 items-center justify-center rounded-full text-white">
                <span className="font-bold"> +{users.length - 4}</span>
                <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible bg-default-900 text-default-100 invisible absolute z-10 inline-block w-14 rounded-md px-2 py-1 text-xs font-medium opacity-0 shadow-2xs transition-opacity" role="tooltip">
                  {users.length - 4} More
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <span className="text-default-400 flex items-center gap-1.5 text-xs">
            <Icon icon="clock"></Icon>
            Updated {time}
          </span>

          <div>
            <Link to="/apps/users/role-details" className="btn btn-sm border-primary text-primary hover:bg-primary rounded-full border hover:text-white">
              Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberRoleCard
