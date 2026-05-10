import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import { AppType, IntegrationType, authorizedAppData, integrationData } from './data'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Manage Apps" subtitle="Apps" />
      <div className="container">
        <div className="mb-4">
          <h5 className="mb-1.25 text-base">Authorized Apps</h5>
          <p className="text-default-400">
            You’re currently using
            <strong> 3 of 3 </strong>
            free integrations. Upgrade to&nbsp;
            <a href="" className="text-primary underline">
              PRO
            </a>
            &nbsp; to unlock more integrations and supercharge your workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base mb-base">
          {authorizedAppData.map((app, idx) => (
            <AuthorizedAppCard app={app} key={idx} />
          ))}
        </div>
        <div className="py-2.5 text-center">
          <h5 className="mb-1.25 text-base">Explore More Integrations</h5>
          <p className="text-default-400 mb-5">Discover over 200 integrations to enhance your workflow</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base mb-base">
          {integrationData.map((item, idx) => (
            <IntegrationCard integration={item} key={idx} />
          ))}
        </div>

        <div className="mb-4">
          <nav className="mx-auto flex items-center justify-center gap-1.5" aria-label="Pagination">
            <button type="button" className="btn btn-icon size-8.75 bg-card border-default-300 hover:bg-default-50 hover:text-primary rounded-full" aria-label="Previous">
              <span>«</span>
            </button>
            <button type="button" className="btn btn-icon size-8.75 bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
              1
            </button>
            <button type="button" className="btn btn-icon size-8.75 bg-primary rounded-full text-white">
              2
            </button>
            <button type="button" className="btn btn-icon size-8.75 bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
              3
            </button>
            <button type="button" className="btn btn-icon size-8.75 bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
              4
            </button>
            <button type="button" className="btn btn-icon size-8.75 bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
              5
            </button>
            <button type="button" className="btn btn-icon size-8.75 bg-card border-default-300 hover:bg-default-50 hover:text-primary rounded-full" aria-label="Next">
              <span>»</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  )
}

export default Page

const AuthorizedAppCard = ({ app }: { app: AppType }) => {
  const { name, description, image, usagePercent, plan, syncTime, account, isActive, status, lastSync } = app
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-base">
            <img src={image} alt={name} className="size-12 rounded" />
            <div>
              <h5 className="card-title mb-1.25">{name}</h5>
              <p className="text-default-400 text-sm mb-0.5">{description}</p>
            </div>
          </div>
          <div>
            <input type="checkbox" className="form-switch" defaultChecked={isActive} />
          </div>
        </div>
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <span className="badge font-semibold bg-light text-primary rounded-full px-2.5 py-1.25">{plan}</span>
          <span className="badge font-semibold bg-success/15 text-success rounded-full px-2.5 py-1.25">{status}</span>
          <span className="badge font-semibold bg-info/15 text-info rounded-full px-2.5 py-1.25">Sync: {syncTime}</span>
        </div>
        <div className="mb-5 grid grid-cols-2 gap-base">
          <div>
            <p className="text-2xs text-default-400 font-bold uppercase">Connected Account</p>
            <span>{account}</span>
          </div>
          <div>
            <p className="text-2xs text-default-400 font-bold uppercase">Last Sync</p>
            <span>{lastSync}</span>
          </div>
        </div>
        <div className="mb-5">
          <div className="flex justify-between mb-2.5">
            <span className="text-xs font-bold">Usage</span>
            <small className="text-success font-bold">{usagePercent}% of quota</small>
          </div>
          <div className="bg-default-200 flex h-1.5 w-full overflow-hidden rounded-full" role="progressbar" aria-valuenow={usagePercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="bg-success flex flex-col justify-center overflow-hidden rounded-full text-center text-xs whitespace-nowrap text-white transition duration-500" style={{ width: `${usagePercent}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <button className="btn border-danger text-danger hover:bg-danger w-full hover:text-white">Remove</button>
          </div>
          <div className="hs-tooltip inline-block [--placement:top]">
            <button type="button" className="hs-tooltip-toggle btn border-primary text-primary hover:bg-primary w-full hover:text-white">
              Details
              <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible bg-default-900 text-default-50 invisible absolute z-10 inline-block rounded-md px-2 py-1 text-sm font-medium opacity-0 shadow-2xs transition-opacity" role="tooltip">
                View integration details
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const IntegrationCard = ({ integration }: { integration: IntegrationType }) => {
  const { name, description, image, isFree, website } = integration
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-6.25 flex items-center justify-between">
          <div className="bg-light/75 flex size-12 items-center justify-center rounded">
            <img src={image} alt={name} className="h-7.5" />
          </div>
          <div>
            <span className={cn('badge badge-label ', isFree ? 'bg-light/75 text-default-800' : 'bg-warning text-white')}>
              {!isFree && <Icon icon="medal" />}
              {isFree ? 'Free' : 'Premium'}
            </span>
          </div>
        </div>
        <h5 className="card-title mb-1.25">{name}</h5>
        <p className="text-default-400 mb-4">{description}</p>
        <div className="mb-5">
          <div className="flex items-center gap-1.25 text-sm">
            <Icon icon="world" className="text-sm" />
            <Link to="" className="hover:text-primary">
              {website}
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn bg-success w-full text-white">Connect</button>
          <div className="hs-tooltip inline-block [--placement:top]">
            <button type="button" className="hs-tooltip-toggle btn border-secondary text-secondary hover:bg-secondary w-full hover:text-white">
              Learn More
              <Icon icon="arrow-right" />
              <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible bg-default-900 text-default-50 invisible absolute z-10 inline-block rounded-md px-2 py-1 text-sm font-medium opacity-0 shadow-2xs transition-opacity" role="tooltip">
                View more information
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
