import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import { skillData, socialFeedData } from './data'

const ProfileCard = () => {
  return (
    <>
      <div className="card mb-5">
        <div className="card-header">
          <h4 className="card-title">Personal Information</h4>
        </div>

        <div className="card-body">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="btn btn-icon size-8 bg-light">
                <Icon icon="briefcase" className="text-secondary size-4.5"></Icon>
              </div>
              <p className="text-default-800">UI/UX Designer & Full-Stack Developer</p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="btn btn-icon size-8 bg-light">
                <Icon icon="school" className="text-secondary size-4.5"></Icon>
              </div>
              <p className="text-default-800">
                Studied at <span className="font-semibold text-default-800">Stanford University</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="btn btn-icon size-8 bg-light">
                <Icon icon="map-pin" className="text-secondary size-4.5"></Icon>
              </div>
              <p className="text-default-800">
                Lives in <span className="font-semibold text-default-800">San Francisco, CA</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="btn btn-icon size-8 bg-light">
                <Icon icon="users" className="text-secondary size-4.5"></Icon>
              </div>
              <p className="text-default-800">
                Followed by <span className="font-semibold text-default-800">25.3k People</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="btn btn-icon size-8 bg-light">
                <Icon icon="mail" className="size-4.5 text-secondary"></Icon>
              </div>
              <p className="text-default-800">
                Email&nbsp;
                <a href="mailto:hello@example.com" className="text-primary font-semibold">
                  hello@example.com
                </a>
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="btn btn-icon size-8 bg-light">
                <Icon icon="link" className="text-secondary size-4.5"></Icon>
              </div>
              <p className="text-default-800">
                Website&nbsp;
                <a href="https://www.example.dev" className="text-primary font-semibold">
                  www.example.dev
                </a>
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="btn btn-icon size-8 bg-light">
                <Icon icon="world" className="text-secondary size-4.5"></Icon>
              </div>
              <p className="text-default-800">
                Languages <span className="font-semibold text-default-800">English, Hindi, Japanese</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5 mt-7.5 mb-2.5">
            <Link to="" className="btn btn-icon bg-primary hover:bg-primary-hover text-white rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-facebook">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3" />
              </svg>
            </Link>

            <Link to="" className="btn btn-icon bg-info hover:bg-info-hover text-white rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-x">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
              </svg>
            </Link>

            <Link to="" className="btn btn-icon bg-danger hover:bg-danger-hover text-white rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-instagram">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
                <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                <path d="M16.5 7.5v.01" />
              </svg>
            </Link>

            <Link to="" className="btn btn-icon bg-success hover:bg-success-hover text-white rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-dribbble">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M9 3.6c5 6 7 10.5 7.5 16.2" />
                <path d="M6.4 19c3.5 -3.5 6 -6.5 14.5 -6.4" />
                <path d="M3.1 10.75c5 0 9.814 -.38 15.314 -5" />
              </svg>
            </Link>

            <Link to="" className="btn btn-icon bg-secondary hover:bg-secondary-hover text-white rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-linkedin">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M8 11v5" />
                <path d="M8 8v.01" />
                <path d="M12 16v-5" />
                <path d="M16 16v-3a2 2 0 1 0 -4 0" />
                <path d="M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4z" />
              </svg>
            </Link>

            <Link to="" className="btn btn-icon bg-danger hover:bg-danger-hover text-white rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-youtube">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z" />
                <path d="M10 9l5 3l-5 3z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="card mb-5">
        <div className="card-header">
          <h4 className="card-title">Skills</h4>
        </div>

        <div className="card-body">
          <div className="flex flex-wrap itmes-center gap-1.25">
            {skillData.map((skill, index) => (
              <Link key={index} to="" className="btn btn-sm bg-light text-sm hover:text-primary">
                {skill}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">My Social Feed</h4>
        </div>
        <div className="card-body">
          {socialFeedData.map((item, index) => (
            <div key={index} className={`flex justify-between items-center  ${index === 0 ? 'border-b border-default-200 pb-2.5' : index === socialFeedData.length - 1 ? 'pt-2' : 'border-b border-default-200 py-2.5'}`}>
              <div className="flex items-center gap-2.5">
                <img src={item.image} alt={item.name} className="size-8 rounded-md object-cover" />
                <div>
                  <h5 className="font-medium text-default-800 text-sm">{item.name}</h5>
                  {item.text && <p className="text-xs text-default-400">{item.text}</p>}
                </div>
                {item.badge && <span className={cn('badge', item.badge.className)}>{item.badge.text}</span>}
              </div>
              <div className="flex items-center gap-0.75">
                {item.time && <small className="text-[11px] text-default-400">{item.time}</small>}
                {item.actionIcons &&
                  item.actionIcons.map((action, i) => (
                    <a key={i} href="" className={cn('btn btn-icon size-8', action.className)} title="Message">
                      <Icon icon={action.icon} className="text-lg"></Icon>
                    </a>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default ProfileCard
