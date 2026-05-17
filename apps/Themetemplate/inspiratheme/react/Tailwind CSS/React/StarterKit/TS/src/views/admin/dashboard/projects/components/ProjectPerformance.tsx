import ComponentCard from '@/components/cards/ComponentCard'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { projectStats } from './data'

const ProjectPerformance = () => {
  return (
    <>
      <ComponentCard title="Project Performance" bodyClassName="p-0" isCollapsible isRefreshable isCloseable>
        <div className="card-body">
          {projectStats.map((stat, index) => (
            <div key={index} className={index !== projectStats.length - 1 ? 'mb-7.5' : ''}>
              <div className="flex justify-between">
                <h5 className="text-sm mb-2.5">{stat.title}</h5>
                <div className="flex gap-8">
                  <span>{stat.count}</span>
                  <span className="flex gap-1">
                    <Icon icon="circle-filled" className="text-light mx-5 mt-1.5 text-[10px]" />
                    {stat.percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-default-200 rounded-full h-1.25 mb-1.25">
                <div className={clsx('h-1.25 rounded-full', stat.variant)} style={{ width: `${stat.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      </ComponentCard>
    </>
  )
}

export default ProjectPerformance
