import user3 from '@/assets/images/users/user-3.jpg'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

const ChatToolbar = () => {
  return (
    <div>
      <div className="flex gap-1.25">
        <button className="btn btn-icon border-default-300 hover:border-default-400/75 hover:bg-default-50" aria-haspopup="dialog" aria-expanded="false" aria-controls="videoCallModal" data-hs-overlay="#videoCallModal">
          <Icon icon="video" className="size-4.25" />
        </button>

        <button className="btn btn-icon border-default-300 hover:border-default-400/75 hover:bg-default-50" aria-haspopup="dialog" aria-expanded="false" aria-controls="audioCallModal" data-hs-overlay="#audioCallModal">
          <Icon icon="phone-call" className="size-4.25" />
        </button>

        <div className="relative">
          <div className="hs-dropdown inline-flex [--placement:bottom-right]">
            <button type="button" className="hs-dropdown-toggle btn btn-icon border-default-300 hover:border-default-400/75 hover:bg-default-50" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
              <Icon icon="dots-vertical" className="text-sm" />
            </button>

            <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
              <div className="space-y-0.5">
                <Link className="dropdown-item" to="">
                  <Icon icon="user" />
                  Export as PDF
                </Link>

                <Link className="dropdown-item" to="">
                  <Icon icon="bell-off" />
                  Export as CSV
                </Link>

                <Link className="dropdown-item" to="">
                  <Icon icon="trash" />
                  Export as Excel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div id="videoCallModal" className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="videoCallModalLabel">
          <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] max-w-sm scale-95 items-center opacity-0 transition-all duration-200 ease-in-out md:mx-auto md:max-w-xl lg:max-w-5xl">
            <div className="card bg-dark pointer-events-auto flex w-full flex-col">
              <div className="card-header border-0!">
                <h3 id="videoCallModalLabel" className="text-sm font-bold text-white">
                  Starting Video Call
                </h3>
                <button type="button" aria-label="Close" data-hs-overlay="#videoCallModal">
                  <Icon icon="x" className="size-5 text-white" />
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-18">
                <div className="mb-7.5">
                  <img src={user3} className="mx-auto size-37.5 rounded-full" alt="User Photo" />
                </div>
                <h3 className="mb-1.25 text-center text-2xl font-semibold text-white">Alex Johnson</h3>
                <p className="text-default-400 mb-7.5 text-center">Connecting to call...</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button type="button" className="btn bg-light hover:text-primary">
                    <Icon icon="video" />
                    Camera On
                  </button>
                  <button type="button" className="btn bg-light hover:text-primary">
                    <Icon icon="microphone" />
                    Mic On
                  </button>
                  <button type="button" className="btn bg-danger text-white hover:bg-danger-hover" data-hs-overlay="#videoCallModal">
                    <Icon icon="phone-call" />
                    End Call
                  </button>
                </div>
              </div>
              <div className="card-footer flex justify-center border-0!">
                <span className="text-default-300 text-center italic">Make sure your devices are connected before starting the call</span>
              </div>
            </div>
          </div>
        </div>
        <div id="audioCallModal" className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="audioCallModalLabel">
          <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] scale-95 items-center opacity-0 transition-all duration-200 ease-in-out md:mx-auto md:w-full md:max-w-lg">
            <div className="card bg-dark pointer-events-auto flex w-full flex-col">
              <div className="card-header border-0!">
                <h3 id="audioCallModalLabel" className="text-sm font-bold text-white">
                  Starting Audio Call
                </h3>
                <button type="button" aria-label="Close" data-hs-overlay="#audioCallModal">
                  <Icon icon="x" className="text-xl text-white" />
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-18">
                <div className="mb-7.5">
                  <img src={user3} className="mx-auto size-37.5 rounded-full" alt="User Photo" />
                </div>
                <h3 className="mb-1.25 text-center text-2xl font-semibold text-white">Alex Johnson</h3>
                <p className="text-default-400 mb-7.5 text-center">Calling...</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button type="button" className="btn bg-light hover:text-primary">
                    <Icon icon="microphone" />
                    Mic On
                  </button>
                  <button type="button" className="btn bg-light hover:text-primary">
                    <Icon icon="volume" />
                    Speaker On
                  </button>
                  <button type="button" className="btn bg-danger text-white hover:bg-danger-hover" data-hs-overlay="#audioCallModal">
                    <Icon icon="phone-call" />
                    End Call
                  </button>
                </div>
              </div>
              <div className="card-footer flex justify-center border-0!">
                <span className="text-default-300 text-center italic">Ensure your microphone is working properly</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatToolbar
