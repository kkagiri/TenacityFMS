import Quill from '@/components/wrappers/Quill'
import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { useState } from 'react'


const NewEmail = () => {
  const modules = {
    toolbar: [[{ header: [false, 1, 2, 3, 4, 5, 6] }], ['bold', 'italic', 'underline', 'strike'], [{ color: [] }, { background: [] }], ['blockquote', 'code-block'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'image', 'video']],
  }
  const [value, setValue] = useState<string>(
    `    <p>
                  Hi
                  <strong>
                    <em>James</em>
                  </strong>
                  ,
                </p>
                <p>I hope you're doing well.</p>
                <p>I'm reaching out regarding the latest updates on our project. Please find the summary below:</p>
                <ul>
                  <li>All UI components have been reviewed and finalized.</li>
                  <li>The mobile responsiveness is now optimized across all breakpoints.</li>
                  <li>We’re awaiting final client feedback before deployment.</li>
                </ul>
                <p>Let me know if you need anything else or if there's anything you'd like us to adjust.</p>
                <p>
                  <br />
                </p>
                <p>Best regards,</p>
                <p>
                  <em>Damian</em>
                </p>`
  )
  return (
    <>
      <div className="w-full min-w-0 flex-1">
        <div className="card h-full rounded-none">
          <div className="card-header lg:hidden">
            <button className="btn btn-icon border-default-300 rounded border">
              <Icon icon="menu" className="text-default-600 size-6" aria-haspopup="dialog" aria-expanded="false" aria-controls="emailSidebaroffcanvas" aria-label="Toggle navigation" data-hs-overlay="#emailSidebaroffcanvas" />
            </button>
            <div className="input-icon-group lg:hidden inline-flex">
              <Icon icon="search" className="input-icon" />
              <input type="text" className="form-input" placeholder="Search mails..." />
            </div>
          </div>

          <div className="card-header">
            <h4 className="card-title">Compose Message</h4>
          </div>
          <SimpleBar className="lg:h-[calc(100vh-270px)] h-[calc(100vh-360px)]" data-simplebar data-simplebar-md>
            <div className="card-body border-default-300 border-b border-dashed py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-semibold">To:</span>
                  <input type="text" className="form-input border-0! focus:border-0!" placeholder="Enter emails.." />
                </div>
                <div className="flex gap-4">
                  <button type="button" className="hs-collapse-toggle underline disabled:pointer-events-none disabled:opacity-50" id="email-cc" aria-expanded="false" aria-controls="email-cc-heading" data-hs-collapse="#email-cc-heading">
                    Cc
                  </button>
                  <button type="button" className="hs-collapse-toggle underline disabled:pointer-events-none disabled:opacity-50" id="email-bcc" aria-expanded="false" aria-controls="email-bcc-heading" data-hs-collapse="#email-bcc-heading">
                    Bcc
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <div id="email-cc-heading" className="hs-collapse card-body border-default-300 hidden w-full overflow-hidden border-b border-dashed py-4! transition-[height] duration-300" aria-labelledby="email-cc">
                <div className="flex items-center">
                  <span className="text-sm font-semibold">Cc:</span>
                  <input type="text" className="form-input border-0! py-3 focus:border-0!" placeholder="Enter emails.." />
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <div id="email-bcc-heading" className="hs-collapse card-body border-default-300 hidden w-full overflow-hidden border-b border-dashed py-4! transition-[height] duration-300" aria-labelledby="email-bcc">
                <div className="flex items-center">
                  <span className="text-sm font-semibold">Bcc:</span>
                  <input type="text" className="form-input border-0! py-3 focus:border-0!" placeholder="Enter emails.." />
                </div>
              </div>
            </div>
            <div className="card-body py-3 border-default-300 border-b border-dashed">
              <div className="flex items-center justify-start">
                <input type="text" className="form-input border-0! focus:border-0! font-semibold ps-0" placeholder="Subject" />
              </div>
            </div>
            <div className="email-editor">
              <Quill theme="snow" modules={modules} value={value} onChange={setValue} />
            </div>
            <div className="bg-light/15 border-light border-b p-2.5">
              <div className="flex items-center justify-between gap-1.25">
                <div className="inline-flex">
                  <button type="button" className="btn bg-primary hover:bg-primary-hover relative rounded-e-none! text-white">
                    <Icon icon="send-2" className="text-base" />
                    Send
                  </button>
                  <div className="hs-dropdown relative inline-flex [--placement:bottom-left]">
                    <button type="button" className="hs-dropdown-toggle btn btn-icon bg-primary/85 hover:bg-primary-hover relative rounded-s-none! text-white">
                      <Icon icon="chevron-down" className="text-base" />
                    </button>
                    <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                      <a className="dropdown-item" href="">
                        Send &amp; Archive
                      </a>
                      <a className="dropdown-item" href="">
                        Schedule Send
                      </a>
                      <a className="dropdown-item" href="">
                        Save as Draft
                      </a>
                      <hr className="dropdown-divider" />
                      <a className="dropdown-item" href="">
                        Discard
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.25">
                  <span className="hs-tooltip inline-block [--placement:top]">
                    <button type="button" className="hs-tooltip-toggle btn btn-icon bg-default-200 size-7.5!">
                      <Icon icon="settings" className="text-sm" />
                      <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible bg-dark invisible absolute z-10 inline-block rounded px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity" role="tooltip">
                        Settings
                      </span>
                    </button>
                  </span>
                  <span className="hs-tooltip inline-block [--placement:top]">
                    <button type="button" className="hs-tooltip-toggle btn btn-icon bg-danger/15 text-danger hover:bg-danger size-7.5! hover:text-white">
                      <Icon icon="trash" className="text-sm" />
                      <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible bg-dark invisible absolute z-10 inline-block rounded px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity" role="tooltip">
                        Delete
                      </span>
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </SimpleBar>
        </div>
      </div>
    </>
  )
}

export default NewEmail
