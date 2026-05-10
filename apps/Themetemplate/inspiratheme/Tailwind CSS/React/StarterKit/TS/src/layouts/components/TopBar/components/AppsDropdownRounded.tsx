import dropboxLogo from '@/assets/images/logos/dropbox.svg'
import figmaLogo from '@/assets/images/logos/figma.svg'
import googleLogo from '@/assets/images/logos/google.svg'
import slackLogo from '@/assets/images/logos/slack.svg'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

const AppsDropdown = () => {
  return (
    <div id="apps-dropdown-rounded" className="topbar-item hs-dropdown relative inline-flex [--auto-close:inside] [--placement:bottom-right]">
      <button className="topbar-link hs-dropdown-toggle relative flex items-center" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
        <Icon icon="apps" className="topbar-link-icon" />
      </button>

      <div className="hs-dropdown-menu w-80 p-3" role="menu" aria-orientation="vertical" aria-labelledby="dropdown-menu">
        <div className="grid grid-cols-3 items-center gap-1.5">
          <Link to="" className="dropdown-item flex-col gap-0 text-center py-3">
            <span className="size-8 rounded-full bg-light flex items-center justify-center mx-auto mb-1.25">
              <img src={googleLogo} alt="Google Logo" className="h-4.5" />
            </span>
            <span className="align-middle font-medium">Google</span>
          </Link>

          <Link to="" className="dropdown-item flex-col gap-0 text-center py-3">
            <span className="size-8 rounded-full bg-light flex items-center justify-center mx-auto mb-1.25">
              <img src={figmaLogo} alt="Figma Logo" className="h-4.5" />
            </span>
            <span className="align-middle font-medium">Figma</span>
          </Link>

          <Link to="" className="dropdown-item flex-col gap-0 text-center py-3">
            <span className="size-8 rounded-full bg-light flex items-center justify-center mx-auto mb-1.25">
              <img src={slackLogo} alt="Slack Logo" className="h-4.5" />
            </span>
            <span className="align-middle font-medium">Slack</span>
          </Link>

          <Link to="" className="dropdown-item flex-col gap-0 text-center py-3">
            <span className="size-8 rounded-full bg-light flex items-center justify-center mx-auto mb-1.25">
              <img src={dropboxLogo} alt="Dropbox Logo" className="h-4.5" />
            </span>
            <span className="align-middle font-medium">Dropbox</span>
          </Link>

          <Link to="" className="dropdown-item flex-col gap-0 text-center py-3">
            <span className="size-8 rounded-full flex items-center justify-center bg-primary/15 text-primary mx-auto mb-1.25">
              <Icon icon="calendar" className="text-lg" />
            </span>
            <span className="align-middle font-medium">Calendar</span>
          </Link>

          <Link to="" className="dropdown-item flex-col gap-0 text-center py-3">
            <span className="size-8 rounded-full flex items-center justify-center bg-primary/15 text-primary mx-auto mb-1.25">
              <Icon icon="message-circle" className="text-lg" />
            </span>
            <span className="align-middle font-medium">Chat</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AppsDropdown
