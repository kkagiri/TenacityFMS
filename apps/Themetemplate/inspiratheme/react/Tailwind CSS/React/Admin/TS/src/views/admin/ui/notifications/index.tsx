import logoSm from '@/assets/images/logo-sm.png'
import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Notifications" subtitle="Base UI" />

      <div className="container">
        <div className="grid xl:grid-cols-2 gap-base">
          <BasicNotification />

          <PlacementNotification />

          <CustomContent />

          <Stacking />
        </div>
      </div>
    </>
  )
}

export default Page

const BasicNotification = () => {
  return (
    <ComponentCard title="Basic" isCollapsible>
      <p className="text-default-400 mb-4">Toasts are as flexible as you need and have very little required markup. At a minimum, we require a single element to contain your “toasted” content and strongly encourage a dismiss button.</p>
      <div id="dismiss-toast" className="hs-removing:translate-x-5 hs-removing:opacity-0 bg-default-100 border-default-300 max-w-xs rounded-md border shadow transition duration-300" role="alert" tabIndex={-1} aria-labelledby="dismiss-button-label">
        <div className="border-default-300 flex items-center border-b px-3 py-2">
          <p id="dismiss-button-label" className="text-default-600 flex items-center gap-1.5 text-sm">
            <img src={logoSm} alt="brand-logo" className="size-4" />
            <strong className="me-auto font-semibold">BRAND</strong>
          </p>
          <div className="ms-auto flex items-center gap-2">
            <span className="text-default-400 text-xs">11 mins ago</span>
            <button type="button" className="flex items-center justify-center opacity-50 hover:opacity-100 focus:opacity-100 focus:outline-hidden" aria-label="Close" data-hs-remove-element="#dismiss-toast">
              <Icon icon="x" className="text-default-800 size-6" />
            </button>
          </div>
        </div>
        <div className="p-3 text-sm">Hello, world! This is a toast message.</div>
      </div>
    </ComponentCard>
  )
}

const PlacementNotification = () => {
  return (
    <ComponentCard title="Placement" isCollapsible>
      <p className="text-default-400 mb-4">Place toasts with custom CSS as you need them. The top right is often used for notifications, as is the top middle. If you’re only ever going to show one toast at a time, put the positioning styles right on the toast.</p>
      <div className="p-20">
        <div className="absolute start-1/2 top-45 -translate-x-1/2 transform">
          <div id="placement-toast" className="hs-removing:translate-x-5 hs-removing:opacity-0 bg-default-100 border-default-300 w-60 rounded-md border shadow transition duration-300 md:w-80" role="alert" tabIndex={-1} aria-labelledby="placement-label">
            <div className="border-default-300 flex items-center border-b px-3 py-2">
              <p id="placement-label" className="text-default-600 flex items-center gap-1.5 text-sm">
                <img src={logoSm} alt="brand-logo" className="size-4" />
                <strong className="me-auto font-semibold">BRAND</strong>
              </p>
              <div className="ms-auto flex items-center gap-2">
                <span className="text-default-400 text-xs">11 mins ago</span>
                <button type="button" className="flex items-center justify-center opacity-50 hover:opacity-100 focus:opacity-100 focus:outline-hidden" aria-label="Close" data-hs-remove-element="#placement-toast">
                  <Icon icon="x" className="text-default-800 size-6" />
                </button>
              </div>
            </div>
            <div className="p-3 text-sm">Hello, world! This is a toast message.</div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const CustomContent = () => {
  return (
    <ComponentCard title="Custom content" isCollapsible>
      <div className="space-y-3">
        <div id="Custom-toast" className="hs-removing:translate-x-5 hs-removing:opacity-0 bg-default-100 border-default-300 max-w-xs rounded-md border shadow transition duration-300" role="alert" tabIndex={-1} aria-labelledby="Custom-label">
          <div className="border-default-300 flex items-center border-b p-3">
            <p id="Custom-label" className="text-default-600 flex items-center gap-1.5 text-sm">
              Hello, world! This is a toast message.
            </p>
            <div className="ms-auto flex items-center gap-2">
              <button type="button" className="flex items-center justify-center opacity-50 hover:opacity-100 focus:opacity-100 focus:outline-hidden" aria-label="Close" data-hs-remove-element="#Custom-toast">
                <Icon icon="x" className="text-default-800 size-6" />
              </button>
            </div>
          </div>
        </div>
        <div id="Custom-toast2" className="hs-removing:translate-x-5 hs-removing:opacity-0 bg-primary border-default-300 max-w-xs rounded-md border transition duration-300" role="alert" tabIndex={-1} aria-labelledby="Custom-label2">
          <div className="border-default-300 flex items-center border-b p-3 text-white">
            <p id="Custom-label2" className="flex items-center gap-1.5 text-sm">
              Hello, world! This is a toast message.
            </p>
            <div className="ms-auto flex items-center gap-2">
              <button type="button" className="flex items-center justify-center opacity-50 hover:opacity-100 focus:opacity-100 focus:outline-hidden" aria-label="Close" data-hs-remove-element="#Custom-toast2">
                <Icon icon="x" className="size-6" />
              </button>
            </div>
          </div>
        </div>
        <div id="Custom-toast3" className="hs-removing:translate-x-5 hs-removing:opacity-0 bg-default-100 border-default-300 max-w-xs rounded-md border p-3 transition duration-300" role="alert" tabIndex={-1} aria-labelledby="Custom-label3">
          <div className="border-default-300 text-default-600 flex items-center border-b pb-3">
            <p id="Custom-label3" className="flex items-center gap-1.5 text-sm">
              Hello, world! This is a toast message.
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1">
            <button className="btn btn-sm bg-primary hover:bg-primary-hover text-white">Take action</button>
            <button className="btn btn-sm bg-secondary hover:bg-secondary-hover text-white" aria-label="Close" data-hs-remove-element="#Custom-toast3">
              Close
            </button>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const Stacking = () => {
  return (
    <ComponentCard title="Stacking" isCollapsible>
      <p className="text-default-400 mb-4">When you have multiple toasts, we default to vertiaclly stacking them in a readable manner.</p>
      <div className="flex justify-end">
        <div className="space-y-base p-5">
          <div>
            <div id="Stacking-1" className="hs-removing:translate-x-5 hs-removing:opacity-0 bg-default-100 border-default-300 max-w-xs rounded-md border shadow transition duration-300" role="alert" tabIndex={-1} aria-labelledby="Stacking-label">
              <div className="border-default-300 flex items-center border-b px-3 py-2">
                <p id="Stacking-label" className="text-default-600 flex items-center gap-1.5 text-sm">
                  <img src={logoSm} alt="brand-logo" className="size-4" />
                  <strong className="me-auto font-semibold">BRAND</strong>
                </p>
                <div className="ms-auto flex items-center gap-2">
                  <span className="text-default-400 text-xs">Just Now</span>
                  <button type="button" className="flex items-center justify-center opacity-50 hover:opacity-100 focus:opacity-100 focus:outline-hidden" aria-label="Close" data-hs-remove-element="#Stacking-1">
                    <Icon icon="x" className="text-default-800 size-6" />
                  </button>
                </div>
              </div>
              <div className="p-3 text-sm">See? Just like this.</div>
            </div>
          </div>
          <div>
            <div id="Stacking-2" className="hs-removing:translate-x-5 hs-removing:opacity-0 bg-default-100 border-default-300 max-w-xs rounded-md border shadow transition duration-300" role="alert" tabIndex={-1} aria-labelledby="Stacking-label-2">
              <div className="border-default-300 flex items-center border-b px-3 py-2">
                <p id="Stacking-label-2" className="text-default-600 flex items-center gap-1.5 text-sm">
                  <img src={logoSm} alt="brand-logo" className="size-4" />
                  <strong className="me-auto font-semibold">BRAND</strong>
                </p>
                <div className="ms-auto flex items-center gap-2">
                  <span className="text-default-400 text-xs">2 seconds ago</span>
                  <button type="button" className="flex items-center justify-center opacity-50 hover:opacity-100 focus:opacity-100 focus:outline-hidden" aria-label="Close" data-hs-remove-element="#Stacking-2">
                    <Icon icon="x" className="text-default-800 size-6" />
                  </button>
                </div>
              </div>
              <div className="p-3 text-sm">Heads up, toasts will stack automatically</div>
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}
