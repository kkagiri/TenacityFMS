import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { TeamType } from './data'

const TeamCard = ({ team, idx }: { team: TeamType; idx: number }) => {
  return (
    <div className="card h-full">
      <div className="card-header">
        <h4 className="card-title">
          IT-{(idx + 1).toString().padStart(2, '0')} - {team.name}
          {team.isNew && <span className="badge badge-label ms-2.5 text-white bg-primary">New</span>}
        </h4>

        <div className="relative ms-auto">
          <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
            <button type="button" className="hs-dropdown-toggle text-default-400 text-lg" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
              <Icon icon="dots-vertical" className="size-4.5" />
            </button>

            <div className="hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden min-w-44 px-0 py-1" role="menu" aria-orientation="vertical">
              <div className="space-y-0.5">
                <a className="flex items-center gap-x-2.5 py-1.5 px-3.75 text-default-600 hover:bg-default-100 focus:outline-hidden focus:bg-default-100" href="">
                  <Icon icon="eye"></Icon>
                  View
                </a>

                <a className="flex items-center gap-x-2.5 py-1.5 px-3.75 text-default-600 hover:bg-default-100 focus:outline-hidden focus:bg-default-100" href="">
                  <Icon icon="edit"></Icon>
                  Edit
                </a>

                <a className="flex items-center gap-x-2.5 py-1.5 px-3.75 text-danger hover:bg-default-100 focus:outline-hidden focus:bg-default-100" href="">
                  <Icon icon="trash"></Icon>
                  Remove
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        <div>
          <p className="mb-2.5 text-default-400 text-sm">Total {team.members.length} members</p>

          <div className="flex mb-5">
            {team.members.map((member, idx) => (
              <div key={idx} className={cn(idx !== 0 && '-ms-2')}>
                <img src={member} alt="" className="size-8 rounded-full transition-all hover:-translate-y-0.5 duration-200" />
              </div>
            ))}
          </div>

          <div className="pb-5">
            <h5 className="mb-2.5">About Team:</h5>
            <p className="text-default-400 mb-4">{team.description}</p>
          </div>

          <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-base">
            {team.stats.map((stat, index) => (
              <div key={index} className="flex gap-2.5">
                <div>
                  <span className="flex justify-center items-center size-8 bg-light rounded-full">
                    <Icon icon={stat.icon} className="text-primary size-4"></Icon>
                  </span>
                </div>
                <div>
                  <h6 className="mb-1.25 text-default-400 text-xs uppercase">{stat.name}</h6>
                  <p className="font-medium">
                    {stat.count?.prefix}
                    {stat.count?.value}
                    {stat.count?.suffix}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="my-5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-default-400 font-semibold text-xs">{team.progress.label}</p>
              <p className="font-semibold">{team.progress.value}%</p>
            </div>

            <div className="w-full h-2 bg-default-100 rounded-full overflow-hidden">
              <div className="bg-primary h-full" style={{ width: `${team.progress.value}%` }}></div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-default-400 text-xs flex items-center">
              <Icon icon="clock" className="me-1.25"></Icon>
              Updated {team.updatedTime}
            </span>
            <a href="" className="btn btn-sm bg-primary text-white rounded-full">
              Details
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
export default TeamCard
