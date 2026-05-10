import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Modals" subtitle="Base UI" />

      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <div className="card">
            <Modals />
          </div>

          <div className="card">
            <ModalPosition />
          </div>

          <div className="card">
            <MultipleModal />
          </div>

          <div className="card">
            <ToggleBetweenModals />
          </div>

          <div className="card">
            <FullScreenModal />
          </div>

          <div className="card">
            <StaticBackdrop />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page

const Modals = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Modals</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">A rendered modal with header, body, and set of actions in the footer.</p>
        <div className="flex flex-wrap gap-3">
          <div>
            <button type="button" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="standard-modal" data-hs-overlay="#standard-modal">
              Standard Modal
            </button>
            <div
              id="standard-modal"
              className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto opacity-0 transition-all"
              role="dialog"
              tabIndex={-1}
              aria-labelledby="standard-modal-label"
            >
              <div className="hs-overlay-animation-target m-3 sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="border-default-300 pointer-events-auto flex flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="standard-modal-label" className="text-base font-semibold">
                      Modal Heading
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#standard-modal">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-5">
                    <h5 className="mb-2">Text in a modal</h5>
                    <p className="mb-4">Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
                    <hr className="border-default-300 my-4" />
                    <h5 className="mb-2">Overflowing text to show scroll behavior</h5>
                    <p className="mb-4">Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
                    <p className="mb-4">Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
                    <p>Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
                  </div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-light hover:text-primary m-1" data-hs-overlay="#standard-modal">
                      Close
                    </button>
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="button" className="btn bg-info hover:bg-info-500 rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="bs-example-modal-lg" data-hs-overlay="#bs-example-modal-lg">
              Large Modal
            </button>
            <div
              id="bs-example-modal-lg"
              className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto opacity-0 transition-all"
              role="dialog"
              tabIndex={-1}
              aria-labelledby="bs-example-modal-lg-label"
            >
              <div className="m-3 sm:mx-auto lg:w-full lg:max-w-3xl">
                <div className="border-default-300 pointer-events-auto flex flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="bs-example-modal-lg-label" className="text-base font-semibold">
                      Large modal
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#bs-example-modal-lg">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-5">...</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="button" className="btn bg-success rounded text-white hover:bg-emerald-500" aria-haspopup="dialog" aria-expanded="false" aria-controls="bs-example-modal-sm" data-hs-overlay="#bs-example-modal-sm">
              Small Modal
            </button>
            <div
              id="bs-example-modal-sm"
              className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto opacity-0 transition-all"
              role="dialog"
              tabIndex={-1}
              aria-labelledby="bs-example-modal-sm-label"
            >
              <div className="m-3 sm:mx-auto lg:w-full lg:max-w-xs">
                <div className="border-default-300 pointer-events-auto flex flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="bs-example-modal-sm-label" className="text-base font-semibold">
                      Small modal
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#bs-example-modal-sm">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-5">...</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="button" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="full-width-modal" data-hs-overlay="#full-width-modal">
              Full width Modal
            </button>
            <div
              id="full-width-modal"
              className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto opacity-0 transition-all"
              role="dialog"
              tabIndex={-1}
              aria-labelledby="full-width-modal-label"
            >
              <div className="m-3 sm:mx-auto lg:w-full lg:max-w-full">
                <div className="border-default-300 pointer-events-auto flex flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="full-width-modal-label" className="text-base font-semibold">
                      Modal Heading
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#full-width-modal">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-5">
                    <h5 className="mb-2">Text in a modal</h5>
                    <p className="mb-4">Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
                    <hr className="border-default-300 my-4" />
                    <h5 className="mb-2">Overflowing text to show scroll behavior</h5>
                    <p className="mb-4">Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
                    <p className="mb-4">Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
                    <p>Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
                  </div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-light hover:text-primary m-1" data-hs-overlay="#full-width-modal">
                      Close
                    </button>
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="button" className="btn bg-secondary hover:bg-secondary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="scrollable-modal" data-hs-overlay="#scrollable-modal">
              Scrollable Modal
            </button>
            <div
              id="scrollable-modal"
              className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto opacity-0 transition-all"
              role="dialog"
              tabIndex={-1}
              aria-labelledby="scrollable-modal-label"
            >
              <div className="m-3 sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="border-default-300 pointer-events-auto flex flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="scrollable-modal-label" className="text-base font-semibold">
                      Modal Heading
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#scrollable-modal">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="h-150 overflow-y-auto p-5">
                    <p className="mb-4">Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
                    <p className="mb-4">Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
                    <p className="mb-4">Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
                    <p className="mb-4">Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
                    <p className="mb-4">Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
                    <p className="mb-4">Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
                    <p className="mb-4">Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
                    <p className="mb-4">Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
                    <p className="mb-4">Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
                    <p className="mb-4">Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
                    <p className="mb-4">Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
                    <p className="mb-4">Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
                    <p className="mb-4">Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
                    <p className="mb-4">Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
                    <p className="mb-4">Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
                    <p className="mb-4">Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
                    <p className="mb-4">Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
                    <p className="mb-0">Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
                  </div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-secondary hover:bg-secondary-hover m-1 rounded text-white" data-hs-overlay="#scrollable-modal">
                      Close
                    </button>
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const ModalPosition = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Modal Position</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Specify the position for the modal. You can display modal at top, bottom, or center of page.</p>
        <div className="flex flex-wrap gap-3">
          <div>
            <button type="button" className="btn bg-secondary hover:bg-secondary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="top-modal" data-hs-overlay="#top-modal">
              Top Modal
            </button>
            <div
              id="top-modal"
              className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto opacity-0 transition-all"
              role="dialog"
              tabIndex={-1}
              aria-labelledby="top-modal-label"
            >
              <div className="m-3 sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="border-default-300 pointer-events-auto flex flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="top-modal-label" className="text-base font-semibold">
                      Modal Heading
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#top-modal">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-5">
                    <h5 className="mb-2">Text in a modal</h5>
                    <p>Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
                  </div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-light hover:text-primary m-1" data-hs-overlay="#top-modal">
                      Close
                    </button>
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="button" className="btn bg-secondary hover:bg-secondary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="bottom-modal" data-hs-overlay="#bottom-modal">
              Bottom Modal
            </button>
            <div id="bottom-modal" className="hs-overlay pointer-events-none fixed start-0 bottom-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="bottom-modal-label">
              <div className="m-3 flex min-h-[calc(100%-56px)] items-end sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="border-default-300 pointer-events-auto flex flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="bottom-modal-label" className="text-base font-semibold">
                      Modal Heading
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#bottom-modal">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-5">
                    <h5 className="mb-2">Text in a modal</h5>
                    <p>Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
                  </div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-light hover:text-primary m-1" data-hs-overlay="#bottom-modal">
                      Close
                    </button>
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="button" className="btn bg-secondary hover:bg-secondary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="centermodal" data-hs-overlay="#centermodal">
              Center modal
            </button>
            <div id="centermodal" className="hs-overlay pointer-events-none fixed start-0 bottom-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="centermodal-label">
              <div className="m-3 flex min-h-[calc(100%-56px)] items-center sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="border-default-300 pointer-events-auto flex flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="centermodal-label" className="text-base font-semibold">
                      Modal Heading
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#centermodal">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-5">
                    <h5 className="mb-2">Text in a modal</h5>
                    <p>Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
                  </div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-light hover:text-primary m-1" data-hs-overlay="#centermodal">
                      Close
                    </button>
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const MultipleModal = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Multiple Modal</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Display a series of modals one by one to guide your users on multiple aspects or take step wise input.</p>
        <div className="flex flex-wrap gap-3">
          <div>
            <button type="button" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="multiple-one" data-hs-overlay="#multiple-one">
              Multiple Modal
            </button>
            <div
              id="multiple-one"
              className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto opacity-0 transition-all"
              role="dialog"
              tabIndex={-1}
              aria-labelledby="multiple-one-label"
            >
              <div className="m-3 sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="border-default-300 pointer-events-auto flex flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="multiple-one-label" className="text-base font-semibold">
                      Modal Heading
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#multiple-one">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-5">
                    <h5 className="mb-2">Text in a modal</h5>
                    <p>Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
                  </div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="multiple-two" data-hs-overlay="#multiple-two">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              id="multiple-two"
              className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto opacity-0 transition-all"
              role="dialog"
              tabIndex={-1}
              aria-labelledby="multiple-two-label"
            >
              <div className="m-3 sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="border-default-300 pointer-events-auto flex flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="multiple-two-label" className="text-base font-semibold">
                      Modal Heading
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#multiple-two">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-5">
                    <h5 className="mb-2">Text in a modal</h5>
                    <p>Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
                  </div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white" data-hs-overlay="#multiple-two">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const ToggleBetweenModals = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Toggle Between Modals</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">
          Toggle between multiple modals with some clever placement of the
          <code>data-hs-overlay</code> attributes.
        </p>
        <div className="flex flex-wrap gap-3">
          <div>
            <button type="button" className="btn bg-secondary hover:bg-secondary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="exampleModalToggle1" data-hs-overlay="#exampleModalToggle1">
              Open first modal
            </button>
            <div
              id="exampleModalToggle1"
              className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto opacity-0 transition-all"
              role="dialog"
              tabIndex={-1}
              aria-labelledby="exampleModalToggle1-label"
            >
              <div className="m-3 flex min-h-[calc(100%-56px)] items-center sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="border-default-300 pointer-events-auto flex flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="exampleModalToggle1-label" className="text-base font-semibold">
                      Modal 1
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#exampleModalToggle1">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-5">
                    <p>Show a second modal and hide this one with the button below.</p>
                  </div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="exampleModalToggle2" data-hs-overlay="#exampleModalToggle2">
                      Open second modal
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              id="exampleModalToggle2"
              className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto opacity-0 transition-all"
              role="dialog"
              tabIndex={-1}
              aria-labelledby="exampleModalToggle2-label"
            >
              <div className="m-3 flex min-h-[calc(100%-56px)] items-center sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="border-default-300 pointer-events-auto flex flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="exampleModalToggle2-label" className="text-base font-semibold">
                      Modal 2
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#exampleModalToggle2">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-5">
                    <p>Hide this modal and show the first with the button below.</p>
                  </div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white" data-hs-overlay="#exampleModalToggle1">
                      Back to first
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const FullScreenModal = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Fullscreen Modal</h4>
      </div>
      <div className="card-body">
        <p className="text-defa mb-4">Another override is the option to pop up a modal that covers the user viewport.</p>
        <div className="flex flex-wrap gap-3">
          <div>
            <button type="button" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="fullscreeexampleModal" data-hs-overlay="#fullscreeexampleModal">
              Fullscreen Modal
            </button>
            <div
              id="fullscreeexampleModal"
              className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto opacity-0 transition-all"
              role="dialog"
              tabIndex={-1}
              aria-labelledby="fullscreeexampleModal-label"
            >
              <div className="m-3 h-full max-h-full sm:mx-auto sm:w-full sm:max-w-full">
                <div className="border-default-300 pointer-events-auto flex h-full max-h-full max-w-full flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="fullscreeexampleModal-label" className="text-base font-semibold">
                      Full Screen Modal
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#fullscreeexampleModal">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="h-full overflow-y-auto p-5">...</div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-light hover:text-primary m-1" data-hs-overlay="#fullscreeexampleModal">
                      Close
                    </button>
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="button" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="exampleModalFullscreenSm" data-hs-overlay="#exampleModalFullscreenSm">
              Full Screen Below sm
            </button>
            <div id="exampleModalFullscreenSm" className="hs-overlay pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="exampleModalFullscreenSm-label">
              <div className="hs-overlay-open:mt-0 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 sm:hs-overlay-open:mt-10 mt-10 h-full max-h-full max-w-full opacity-0 transition-all sm:mx-auto sm:mt-0 sm:h-auto sm:max-h-none sm:max-w-lg">
                <div className="border-default-300 pointer-events-auto flex h-full max-h-full max-w-full flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="exampleModalFullscreenSm-label" className="text-base font-semibold">
                      Full screen below sm
                    </h3>
                    <button type="button" aria-label="Close" data-hs-overlay="exampleModalFullscreenSm">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="h-full overflow-y-auto p-5">...</div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-light hover:text-primary m-1" data-hs-overlay="#exampleModalFullscreenSm">
                      Close
                    </button>
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="button" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="exampleModalFullscreenMd" data-hs-overlay="#exampleModalFullscreenMd">
              Full Screen Below md
            </button>
            <div id="exampleModalFullscreenMd" className="hs-overlay pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="exampleModalFullscreenMd-label">
              <div className="hs-overlay-open:mt-0 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 md:hs-overlay-open:mt-10 mt-10 h-full max-h-full max-w-full opacity-0 transition-all md:mx-auto md:mt-0 md:h-auto md:max-h-none md:max-w-lg">
                <div className="border-default-300 md: pointer-events-auto flex h-full max-h-full max-w-full flex-col bg-white md:h-auto md:max-h-none md:max-w-lg md:rounded-xl md:border md:shadow-2xs">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="exampleModalFullscreenMd-label" className="text-base font-semibold">
                      Full Screen Below md
                    </h3>
                    <button type="button" aria-label="Close" data-hs-overlay="exampleModalFullscreenMd">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="h-full overflow-y-auto p-5">...</div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-light hover:text-primary m-1" data-hs-overlay="#exampleModalFullscreenMd">
                      Close
                    </button>
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="button" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="exampleModalFullscreenLg" data-hs-overlay="#exampleModalFullscreenLg">
              Full Screen Below lg
            </button>
            <div id="exampleModalFullscreenLg" className="hs-overlay pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="exampleModalFullscreenLg-label">
              <div className="hs-overlay-open:mt-0 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 lg:hs-overlay-open:mt-10 mt-10 h-full max-h-full max-w-full opacity-0 transition-all lg:mx-auto lg:mt-0 lg:h-auto lg:max-h-none lg:max-w-lg">
                <div className="border-default-300 lg: pointer-events-auto flex h-full max-h-full max-w-full flex-col bg-white lg:h-auto lg:max-h-none lg:max-w-lg lg:rounded-xl lg:border lg:shadow-2xs">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="exampleModalFullscreenLg-label" className="text-base font-semibold">
                      Full Screen Below lg
                    </h3>
                    <button type="button" aria-label="Close" data-hs-overlay="exampleModalFullscreenLg">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="h-full overflow-y-auto p-5">...</div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-light hover:text-primary m-1" data-hs-overlay="#exampleModalFullscreenLg">
                      Close
                    </button>
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="button" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="exampleModalFullscreenXl" data-hs-overlay="#exampleModalFullscreenXl">
              Full Screen Below xl
            </button>
            <div id="exampleModalFullscreenXl" className="hs-overlay pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="exampleModalFullscreenXl-label">
              <div className="hs-overlay-open:mt-0 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 xl:hs-overlay-open:mt-10 mt-10 h-full max-h-full max-w-full opacity-0 transition-all xl:mx-auto xl:mt-0 xl:h-auto xl:max-h-none xl:max-w-xl">
                <div className="xl: border-default-300 pointer-events-auto flex h-full max-h-full max-w-full flex-col bg-white xl:h-auto xl:max-h-none xl:max-w-lg xl:rounded-xl xl:border xl:shadow-2xs">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="exampleModalFullscreenXl-label" className="text-base font-semibold">
                      Full Screen Below xl
                    </h3>
                    <button type="button" aria-label="Close" data-hs-overlay="exampleModalFullscreenXl">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="h-full overflow-y-auto p-5">...</div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-light hover:text-primary m-1" data-hs-overlay="#exampleModalFullscreenXl">
                      Close
                    </button>
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="button" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="exampleModalFullscreenXxl" data-hs-overlay="#exampleModalFullscreenXxl">
              Full Screen Below xxl
            </button>
            <div id="exampleModalFullscreenXxl" className="hs-overlay pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="exampleModalFullscreenXxl-label">
              <div className="hs-overlay-open:mt-0 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 xl:hs-overlay-open:mt-10 mt-10 h-full max-h-full max-w-full opacity-0 transition-all xl:mx-auto xl:mt-0 xl:h-auto xl:max-h-none xl:max-w-xl">
                <div className="xl: border-default-300 pointer-events-auto flex h-full max-h-full max-w-full flex-col bg-white xl:h-auto xl:max-h-none xl:max-w-lg xl:rounded-xl xl:border xl:shadow-2xs">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="exampleModalFullscreenXxl-label" className="text-base font-semibold">
                      Full Screen Below xxl
                    </h3>
                    <button type="button" aria-label="Close" data-hs-overlay="exampleModalFullscreenXxl">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="h-full overflow-y-auto p-5">...</div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-light hover:text-primary m-1" data-hs-overlay="#exampleModalFullscreenXxl">
                      Close
                    </button>
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const StaticBackdrop = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Static Backdrop</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">When backdrop is set to static, the modal will not close when clicking outside it. Click the button below to try it.</p>
        <div className="flex flex-wrap gap-3">
          <div>
            <button type="button" className="btn bg-info hover:bg-info-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="staticBackdrop" data-hs-overlay="#staticBackdrop">
              Static Backdrop
            </button>
            <div
              id="staticBackdrop"
              className="hs-overlay [--overlay-backdrop:static] hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto opacity-0 transition-all"
              role="dialog"
              tabIndex={-1}
              aria-labelledby="staticBackdrop-label"
            >
              <div className="m-3 sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="border-default-300 pointer-events-auto flex flex-col rounded-md border bg-white">
                  <div className="border-default-300 flex items-center justify-between border-b p-5">
                    <h3 id="staticBackdrop-label" className="text-base font-semibold">
                      Modal title
                    </h3>
                    <button type="button" aria-label=" Close" data-hs-overlay="#staticBackdrop">
                      <span className="sr-only">Close</span>
                      <Icon icon="x" className="size-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-5">
                    <p>I will not close if you click outside me. Don&apos;t even try to press escape key.</p>
                  </div>
                  <div className="border-default-300 flex items-center justify-end border-t p-4">
                    <button type="button" className="btn bg-secondary hover:bg-secondary-hover m-1 rounded text-white" data-hs-overlay="#staticBackdrop">
                      Close
                    </button>
                    <button type="button" className="btn bg-primary hover:bg-primary-hover m-1 rounded text-white">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
