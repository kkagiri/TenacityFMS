import user3 from '@/assets/images/users/user-3.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user6 from '@/assets/images/users/user-6.jpg'
import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { Link } from 'react-router'
import { emailActionData } from './data'

const EmailDetail = () => {
  return (
    <>
      <div className="flex-1 min-w-0">
        <div className="card h-full w-full rounded-s-0! border-s-0!">
          <div className="card-header justify-between">
            <div className="flex flex-wrap items-center gap-1.25">
              <span className="hs-tooltip [--placement:top] inline-block">
                <Link to="/apps/email/inbox" className="hs-tooltip-toggle btn btn-icon size-8 border border-default-300">
                  <Icon icon="arrow-left" className="text-base text-default-800" />
                  <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-90 py-1 px-2 bg-dark text-xs font-medium text-white rounded" role="tooltip">
                    Back to Inbox
                  </span>
                </Link>
              </span>

              {emailActionData.map((item, idx) => (
                <span className="hs-tooltip [--placement:top] inline-block" key={idx}>
                  <Link to="/apps/email/inbox" className="hs-tooltip-toggle btn btn-icon size-8 border border-default-300">
                    <Icon icon={item.icon} className="text-base text-default-800" />
                    <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-1 px-2 bg-dark text-xs font-medium text-white rounded" role="tooltip">
                      {item.label}
                    </span>
                  </Link>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" className="btn btn-icon size-7.5 text-secondary hover:bg-secondary hover:text-white rounded-full">
                <Icon icon="corner-up-right-double" className="text-lg" />
              </button>
              <button type="button" className="btn btn-icon size-7.5 text-dark hover:bg-dark hover:text-white rounded-full">
                <Icon icon="dots-vertical" className="text-lg" />
              </button>
            </div>
          </div>
          <SimpleBar className="card-body py-0 lg:h-[calc(100vh-334px)] h-[calc(100vh-420px)]" data-simplebar>
            <h4 className="py-5 text-lg sticky top-0 card border-none! rounded-none! z-20">Design Reviews &amp; Feedback</h4>

            <div className="pb-base border-b border-dashed border-default-300">
              <div>
                <div className="flex justify-between items-center flex-wrap">
                  <button type="button" className="hs-collapse-toggle" id="EmailOne" aria-expanded="false" aria-controls="EmailOne-heading" data-hs-collapse="#EmailOne-heading">
                    <a className="flex items-center text-reset">
                      <img src={user3} className="size-9 rounded-full" alt="User Avatar" />
                      <div className="ms-2.5 overflow-hidden text-start">
                        <h5>John Maxwell</h5>
                        <p className="text-default-400">john.maxwell@uxstudio.com</p>
                      </div>
                    </a>
                  </button>
                  <div className="md:ms-auto flex items-center gap-1">
                    <button className="btn btn-icon hover:bg-default-100 size-8 rounded-full text-default-800">
                      <Icon icon="star-filled" className="text-warning text-base" />
                    </button>
                    <button className="btn btn-icon hover:bg-default-100 size-8 rounded-full text-default-800">
                      <Icon icon="mail-forward" className="text-base" />
                    </button>
                    <button className="btn btn-icon hover:bg-default-100 size-8 rounded-full text-default-800">
                      <Icon icon="mail-opened" className="text-base" />
                    </button>
                    <span className="text-default-400 text-xs ms-2">Apr 11, 07:47 AM</span>
                  </div>
                </div>
                <div id="EmailOne-heading" className="hs-collapse hidden w-full overflow-hidden transition-[height] duration-300" aria-labelledby="EmailOne">
                  <div className="mt-5">
                    <p className="mb-4">Hey team,</p>
                    <p className="mb-4">I reviewed the new dashboard layout and overall it&apos;s looking solid. The spacing and typography are much better than the previous version.</p>
                    <p className="mb-4">A couple of suggestions:</p>
                    <ul>
                      <li>Make the chart legends slightly smaller and lighter in color.</li>
                      <li>Try a softer drop shadow for the card components – they feel a bit harsh right now.</li>
                    </ul>
                    <p className="mb-4">Let me know if you need a quick call to discuss.</p>
                    <p className="mt-5">Cheers,</p>
                    <p className="font-medium">John</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="py-5 border-b border-dashed border-default-300">
              <div>
                <div className="flex justify-between items-center flex-wrap">
                  <button type="button" className="hs-collapse-toggle" id="EmailTwo" aria-expanded="false" aria-controls="EmailTwo-heading" data-hs-collapse="#EmailTwo-heading">
                    <a className="flex items-center text-reset">
                      <img src={user6} className="size-9 rounded-full" alt="User Avatar" />
                      <div className="ms-2.5 overflow-hidden text-start">
                        <h5>Anika Patel</h5>
                        <p className="text-default-400">anika@creativemix.net</p>
                      </div>
                    </a>
                  </button>
                  <div className="md:ms-auto flex items-center gap-1">
                    <button className="btn btn-icon hover:bg-default-100 size-8 rounded-full text-default-800">
                      <Icon icon="star-filled" className="text-warning text-base" />
                    </button>
                    <button className="btn btn-icon hover:bg-default-100 size-8 rounded-full text-default-800">
                      <Icon icon="mail-forward" className="text-base" />
                    </button>
                    <button className="btn btn-icon hover:bg-default-100 size-8 rounded-full text-default-800">
                      <Icon icon="mail-opened" className="text-base" />
                    </button>
                    <span className="text-default-400 text-xs ms-2">Apr 11, 09:05 AM</span>
                  </div>
                </div>
                <div id="EmailTwo-heading" className="hs-collapse hidden w-full overflow-hidden transition-[height] duration-300" aria-labelledby="EmailTwo">
                  <div className="mt-5">
                    <p className="mb-4">Hello team,</p>
                    <p className="mb-4">I did a final check on the landing page animations. Everything works smoothly except the testimonial slider – there&apos;s a tiny jitter on loop transition.</p>
                    <p className="mb-4">Maybe easing timing or delay tweaks can help fix it. Otherwise, great job!</p>
                    <p className="mb-5">Let me know once it&apos;s deployed to staging so I can do one last run-through.</p>
                    <p className="mt-5">Thanks,</p>
                    <p className="font-medium">Anika</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="py-5">
              <div>
                <div className="flex justify-between items-center flex-wrap">
                  <button type="button" className="hs-collapse-toggle" id="EmailThree" aria-expanded="false" aria-controls="EmailThree-heading" data-hs-collapse="#EmailThree-heading">
                    <a className="flex items-center text-reset">
                      <img src={user5} className="size-9 rounded-full" alt="User Avatar" />
                      <div className="ms-2.5 overflow-hidden text-start">
                        <h5>Laura Chen</h5>
                        <p className="text-default-400">laura.chen@designteam.co</p>
                      </div>
                    </a>
                  </button>
                  <div className="md:ms-auto flex items-center gap-1">
                    <button className="btn btn-icon hover:bg-default-100 size-8 rounded-full text-default-800">
                      <Icon icon="star-filled" className="text-warning text-base" />
                    </button>
                    <button className="btn btn-icon hover:bg-default-100 size-8 rounded-full text-default-800">
                      <Icon icon="mail-forward" className="text-base" />
                    </button>
                    <button className="btn btn-icon hover:bg-default-100 size-8 rounded-full text-default-800">
                      <Icon icon="mail-opened" className="text-base" />
                    </button>
                    <span className="text-default-400 text-xs ms-2">Apr 12, 11:42 AM</span>
                  </div>
                </div>
                <div id="EmailThree-heading" className="hs-collapse w-full overflow-hidden transition-[height] duration-300" aria-labelledby="EmailThree">
                  <div className="mt-7.5">
                    <p className="mb-4">Hi folks,</p>
                    <p className="mb-4">Thanks for sharing the prototype. The color scheme and layout look clean, but I think we can still refine the mobile responsiveness on the pricing page.</p>
                    <p className="mb-4">Also, the button contrast on the footer needs more WCAG-friendly contrast – it&apos;s currently a bit hard to read.</p>
                    <p className="mb-4">I’ve attached some screenshots with markup for clarity.</p>
                    <p className="mt-5">Regards,</p>
                    <p className="font-medium">Laura</p>
                  </div>
                  <div className="mt-5">
                    <div className="flex justify-between">
                      <h4 className="text-default-400 text-sm">2 Attachments</h4>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-base">
                      <div className="flex p-2.5 gap-2.5 items-center text-start relative border border-dashed border-default-300 rounded group">
                        <Icon icon="file" className="text-2xl text-danger" />
                        <div>
                          <h4 className="mb-1.25">
                            <a href="" className="group-hover:text-primary">
                              footer-contrast-notes.pdf
                            </a>
                          </h4>
                          <p>1.2 MB</p>
                        </div>
                        <Icon icon="download" className="text-default-400 text-2xl" />
                      </div>
                      <div className="flex p-2.5 gap-2.5 items-center text-start relative border border-dashed border-default-300 rounded group">
                        <Icon icon="photo" className="text-2xl text-secondary" />
                        <div>
                          <h4 className="mb-1.25">
                            <a href="" className="group-hover:text-primary">
                              responsive-issues.png
                            </a>
                          </h4>
                          <p>850 KB</p>
                        </div>
                        <Icon icon="download" className="text-default-400 text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div id="EmailReply-heading" className="hs-collapse hidden sticky bottom-0 z-10 w-full overflow-hidden transition-[height] duration-300" aria-labelledby="EmailReply">
              <div className="card border border-default-300 mb-4">
                <textarea className="form-textarea border-0!" id="exampleFormControlTextarea1" rows={6} placeholder="Enter message" defaultValue={''} />
                <div className="bg-light/15 border-t border-default-300 p-3">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="hs-tooltip [--placement:top] inline-block">
                      <button type="button" className="hs-tooltip-toggle btn btn-icon bg-default-100 size-8">
                        <Icon icon="bold" className="text-xs" />
                        <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-1 px-2 bg-dark text-xs font-medium text-white rounded" role="tooltip">
                          Bold
                        </span>
                      </button>
                    </span>
                    <span className="hs-tooltip [--placement:top] inline-block">
                      <button type="button" className="hs-tooltip-toggle btn btn-icon bg-default-100 size-8">
                        <Icon icon="italic" className="text-xs" />
                        <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-1 px-2 bg-dark text-xs font-medium text-white rounded" role="tooltip">
                          Italic
                        </span>
                      </button>
                    </span>
                    <span className="hs-tooltip [--placement:top] inline-block">
                      <button type="button" className="hs-tooltip-toggle btn btn-icon bg-default-100 size-8">
                        <Icon icon="paperclip" className="text-xs" />
                        <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-1 px-2 bg-dark text-xs font-medium text-white rounded" role="tooltip">
                          Attach files
                        </span>
                      </button>
                    </span>
                    <span className="hs-tooltip [--placement:top] inline-block">
                      <button type="button" className="hs-tooltip-toggle btn btn-icon bg-default-100 size-8">
                        <Icon icon="link" className="text-xs" />
                        <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-1 px-2 bg-dark text-xs font-medium text-white rounded" role="tooltip">
                          Insert link
                        </span>
                      </button>
                    </span>
                    <span className="hs-tooltip [--placement:top] inline-block">
                      <button type="button" className="hs-tooltip-toggle btn btn-icon bg-default-100 size-8">
                        <Icon icon="photo-up" className="text-xs" />
                        <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-1 px-2 bg-dark text-xs font-medium text-white rounded" role="tooltip">
                          Insert photo
                        </span>
                      </button>
                    </span>
                    <button type="button" className="btn btn-sm bg-light ms-auto">
                      <Icon icon="x" className="text-xs" />
                      Cancel
                    </button>
                    <button type="button" className="btn btn-sm bg-success text-white">
                      <Icon icon="send-2" className="text-xs" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SimpleBar>

          <div className="card-footer border-t border-dashed">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <button className="hs-collapse-toggle btn btn-sm border border-default-300 hover:border-default-400 hover:bg-default-50" id="EmailReply" aria-expanded="false" aria-controls="EmailReply-heading" data-hs-collapse="#EmailReply-heading">
                <Icon icon="corner-up-left" className="text-base" />
                <span className="font-medium">Reply</span>
              </button>
              <button className="btn btn-sm border border-default-300 hover:border-default-400 hover:bg-default-50" type="button">
                <Icon icon="corner-up-right-double" className="text-base" />
                <span className="font-medium">Forward</span>
              </button>
              <button className="btn btn-sm border border-default-300 hover:border-default-400 hover:bg-default-50" type="button">
                <Icon icon="printer" className="text-base" />
                <span className="font-medium">Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default EmailDetail
