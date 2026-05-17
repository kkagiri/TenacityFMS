import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { cn } from '@/utils/helpers'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MessageType, messageData } from './data'

const OutlookPage = () => {
  return (
    <div className="flex lg:gap-1.25 h-[calc(100vh-200px)]">
      <div
        id="outlookSidebaroffcanvas"
        className="hs-overlay hs-overlay-open:translate-x-0 fixed start-0 top-0 bottom-0 z-20 h-full w-70 -translate-x-full transform transition-all duration-300 [--auto-close:lg] lg:static lg:end-auto lg:bottom-0 lg:block! lg:translate-x-0"
        role="dialog"
        tabIndex={-1}
        aria-label="Sidebar"
      >
        <SideBar messages={messageData} />
      </div>
      <div className="card h-full min-w-0 flex-1">
        <div className="card-header lg:hidden">
          <div className="text-start">
            <button className="btn btn-sm btn-icon border-default-300" aria-haspopup="dialog" aria-expanded="false" aria-controls="outlookSidebaroffcanvas" aria-label="Toggle navigation" data-hs-overlay="#outlookSidebaroffcanvas">
              <Icon icon="menu-4" className="text-default-600 text-2xl" />
            </button>
          </div>
        </div>
        <div className="card-body h-[calc(100vh-200px)]" data-simplebar>
          {messageData.map((message, idx) => (
            <div id={`outlook-tab-${idx}`} role="tabpanel" className={idx !== 1 ? 'hidden' : ''} aria-labelledby="outlook-view-1" key={idx}>
              <div className="mb-5 flex flex-wrap items-start justify-between md:mb-0">
                <div>
                  <div className="text-default-400 mb-2.5 flex items-center gap-1">
                    <Icon icon="clock" />
                    {message.body.timestamp}
                  </div>
                  <h2 className="mb-5 text-lg">{message.body.title}</h2>
                </div>
                <div className="flex items-center gap-1">
                  <div className="hs-tooltip flex [--placement:left]">
                    <button className="hs-tooltip-toggle">
                      <div className="btn btn-sm border-default-300 text-default-800 hover:border-default-400">
                        <Icon icon="plug" />
                        Plug it
                      </div>
                      <span className="hs-tooltip-content hs-tooltip-shown:visible hs-tooltip-shown:opacity-100 bg-default-800 text-default-50 invisible absolute z-10 rounded-md px-3 py-1.5 text-xs opacity-0">Plug this message</span>
                    </button>
                  </div>
                  <div className="hs-tooltip flex [--placement:top]">
                    <button className="hs-tooltip-toggle">
                      <div className="btn btn-icon border-default-300 text-default-800 hover:border-default-400 size-7.5">
                        <Icon icon="eye" />
                      </div>
                      <span className="hs-tooltip-content hs-tooltip-shown:visible hs-tooltip-shown:opacity-100 bg-default-800 text-default-50 invisible absolute z-10 rounded-md px-3 py-1.5 text-xs opacity-0">Mark as read</span>
                    </button>
                  </div>
                  <div className="hs-tooltip flex [--placement:top]">
                    <button className="hs-tooltip-toggle">
                      <div className="btn btn-icon border-default-300 text-default-800 hover:border-default-400 size-7.5">
                        <Icon icon="alert-circle" />
                      </div>
                      <span className="hs-tooltip-content hs-tooltip-shown:visible hs-tooltip-shown:opacity-100 bg-default-800 text-default-50 invisible absolute z-10 rounded-md px-3 py-1.5 text-xs opacity-0">Mark as important</span>
                    </button>
                  </div>
                  <div className="hs-tooltip flex [--placement:top]">
                    <button className="hs-tooltip-toggle">
                      <div className="btn btn-icon border-default-300 text-default-800 hover:border-default-400 size-7.5">
                        <Icon icon="trash" />
                      </div>
                      <span className="hs-tooltip-content hs-tooltip-shown:visible hs-tooltip-shown:opacity-100 bg-default-800 text-default-50 invisible absolute z-10 rounded-md px-3 py-1.5 text-xs opacity-0">Move to trash</span>
                    </button>
                  </div>
                </div>
              </div>
              <span className="prose-sm dark:text-body-color">
                <Markdown remarkPlugins={[remarkGfm]}>{message.body.content}</Markdown>
              </span>

              <form action="#" className="my-base">
                <div className="mb-5">
                  <textarea className="form-textarea" rows={4} placeholder="Enter your reply..."></textarea>
                </div>

                <div className="text-end">
                  <button type="submit" className="btn bg-secondary text-white hover:bg-secondary-hover">
                    Submit
                    <Icon icon="send-2"></Icon>
                  </button>
                </div>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OutlookPage

const SideBar = ({ messages }: { messages: MessageType[] }) => {
  return (
    <SimpleBar className="card lg:h-[calc(100vh-200px)] h-full rounded-none" data-simplebar>
      <nav className="divide-default-300 flex flex-col divide-y" aria-label="Tabs" role="tablist" aria-orientation="vertical">
        {messages.map((item, idx) => (
          <a href="" className={cn('hs-tab-active:bg-light/45 p-5', { active: idx === 1 })} id={`outlook-view-${idx}`} aria-selected="true" data-hs-tab={`#outlook-tab-${idx}`} aria-controls={`outlook-tab-${idx}`} role="tab" key={idx}>
            <span className="flex items-center justify-between mb-1.25">
              <span className="text-sm font-semibold">{item.name}</span>
              <small className="text-default-400 float-end text-2xs">{item.date}</small>
            </span>
            <span className="text-default-400 mb-2.5 block text-xs">{item.summary}</span>
            <span className="flex justify-between">
              <span className="flex items-center gap-1">
                <Icon icon="map-pin" />
                {item.location}
              </span>
              {item.badge && <button className={cn('badge badge-label text-white', item.badge.className)}>{item.badge.label}</button>}
            </span>
          </a>
        ))}
      </nav>
    </SimpleBar>
  )
}
