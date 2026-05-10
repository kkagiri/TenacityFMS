import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { actionData, emailData } from './data'

const Emails = () => {
  return (
    <>
      <div className="w-full min-w-0 flex-1">
        <div data-table data-table-rows-per-page="15" className="card rounded-none h-full">
          <div className="card-header">
            <div className="flex flex-wrap items-center gap-1.25">
              <input className="form-checkbox form-checkbox-light size-4.5 me-6" type="checkbox" id="select-all-email" />

              {actionData.map((item, idx) => (
                <span className="hs-tooltip inline-block [--placement:top]" key={idx}>
                  <button type="button" className="hs-tooltip-toggle btn btn-icon border-default-300 size-7.5! border">
                    <Icon icon={item.icon} className="text-default-800 text-base" />
                    <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible bg-dark invisible absolute z-10 inline-block rounded px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity" role="tooltip">
                      {item.label}
                    </span>
                  </button>
                </span>
              ))}
            </div>
            <div className="input-icon-group hidden lg:inline-flex">
              <Icon icon="search" className="input-icon" />
              <input data-table-search type="text" className="form-input" placeholder="Search mails..." />
            </div>
          </div>
          <SimpleBar className="lg:h-[calc(100vh-275px)] h-[calc(100vh-360px)]">
            <div className="table-wrapper">
              <table className="table table-hover table-select">
                <tbody>
                  {emailData.map((email) => (
                    <tr key={email.id} className={email.isRead ? 'mark-as-read opacity-75' : ''}>
                      <td className="ps-6 w-[1%]">
                        <div className="flex items-center gap-6">
                          <input className="form-checkbox form-checkbox-light size-4.5 z-10 email-item-check" type="checkbox" />
                          <button className={`flex ${email.isStarred ? 'text-warning' : 'text-default-400'}`}>
                            <Icon icon={email.isStarred ? 'star-filled' : 'star'} className="text-lg" />
                          </button>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-2.5">
                          {email.user.image ? (
                            <img src={email.user.image} alt="user avatar" className="size-6 rounded-full" />
                          ) : (
                            <div className="avatar-xs">
                              <span className={`btn btn-icon size-6! rounded-full font-semibold text-white ${email.className}`}>{email.user.name.charAt(0)}</span>
                            </div>
                          )}
                          <h5 className="font-medium">{email.user.name}</h5>
                        </div>
                      </td>

                      <td>
                        <a href="/apps/email/details" className="hover:text-primary font-semibold">
                          {email.subject}
                        </a>
                        <span className="hidden lg:inline-block">—</span>
                        <span className="text-default-400 hidden lg:inline-block">{email.snippet}</span>
                      </td>

                      <td style={{ width: '1%' }}>
                        <div className={`flex items-center gap-1.5 ${email.attachments === 0 ? 'opacity-25' : ''}`}>
                          <Icon icon="paperclip" />
                          <span className="font-semibold">{email.attachments}</span>
                        </div>
                      </td>

                      <td>
                        <p className="text-default-400 pe-3 text-end text-xs">
                          {email.date}, {email.time}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-center gap-3 p-6">
              <strong>Loading...</strong>
              <div className="text-danger inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="loading">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          </SimpleBar>
        </div>
      </div>
    </>
  )
}

export default Emails
