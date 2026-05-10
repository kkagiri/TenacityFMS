import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Alerts" subtitle="Base UI" />

      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <DefaultAlert />

          <DismissingAlert />

          <LinkColor />

          <AdditionalContent />

          <CustomAlerts />

          <LiveAlert />
        </div>
      </div>
    </>
  )
}

export default Page

const DefaultAlert = () => {
  return (
    <ComponentCard title="Default Alert" isCollapsible>
      <div className="space-y-4">
        <div className="bg-primary/15 text-primary flex items-center rounded px-4 py-3" role="alert">
          This is a primary alert—something important you should know!
        </div>
        <div className="bg-secondary/15 text-secondary flex items-center rounded px-4 py-3" role="alert">
          This is a secondary alert—some additional context.
        </div>
        <div className="bg-success/15 text-success flex items-center rounded px-4 py-3" role="alert">
          Success! Your operation was completed successfully.
        </div>
        <div className="bg-danger/15 text-danger flex items-center rounded px-4 py-3" role="alert">
          Error! Something went wrong—please try again.
        </div>
        <div className="bg-warning/15 text-warning flex items-center rounded px-4 py-3" role="alert">
          Warning! Please double-check your inputs.
        </div>
        <div className="bg-info/15 text-info flex items-center rounded px-4 py-3" role="alert">
          Info: Here&apos;s something you might find useful.
        </div>
        <div className="bg-light/40 text-dark flex items-center rounded px-4 py-3" role="alert">
          Light alert—just a subtle notification.
        </div>
        <div className="bg-dark/15 text-dark flex items-center rounded px-4 py-3" role="alert">
          Dark alert—use for general-purpose messages.
        </div>
      </div>
    </ComponentCard>
  )
}

const DismissingAlert = () => {
  return (
    <ComponentCard title="Dismissing Alert with Solid Colors" isCollapsible>
      <div className="space-y-4">
        <div className="bg-primary flex items-center rounded px-4 py-3 text-white" role="alert">
          Heads up! This is a primary alert with important information.
        </div>
        <div className="bg-secondary flex items-center rounded px-4 py-3 text-white" role="alert">
          Notice: This is a secondary alert with supporting details.
        </div>
        <div className="bg-success flex items-center rounded px-4 py-3 text-white" role="alert">
          Success! Your action was completed successfully.
        </div>
        <div className="bg-danger flex items-center rounded px-4 py-3 text-white" role="alert">
          Error! Something went wrong—please try again later.
        </div>
        <div className="bg-warning flex items-center rounded px-4 py-3 text-white" role="alert">
          Warning! Please review your input before proceeding.
        </div>
        <div className="bg-info flex items-center rounded px-4 py-3 text-white" role="alert">
          Info: Here’s something you might find helpful.
        </div>
        <div className="bg-light text-dark flex items-center rounded px-4 py-3" role="alert">
          Note: This is a light alert with a subtle message.
        </div>
        <div className="bg-dark flex items-center rounded px-4 py-3 text-white" role="alert">
          Notice: This dark alert is great for general messages.
        </div>
      </div>
    </ComponentCard>
  )
}

const LinkColor = () => {
  return (
    <ComponentCard title="Link Color" isCollapsible>
      <div className="space-y-4">
        <div className="bg-primary/15 text-primary flex items-center gap-1 rounded px-4 py-3" role="alert">
          Need more info? Check out
          <a href="" className="font-bold">
            this primary link
          </a>
          for important details.
        </div>
        <div className="bg-secondary/15 text-secondary flex items-center gap-1 rounded px-4 py-3" role="alert">
          Here&apos; s a secondary message with
          <a href="" className="font-bold">
            a helpful link
          </a>
          for additional context.
        </div>
        <div className="bg-success/15 text-success flex items-center gap-1 rounded px-4 py-3" role="alert">
          Operation successful! View the results
          <a href="" className="font-bold">
            by clicking here.
          </a>
        </div>
        <div className="bg-danger/15 text-danger flex items-center gap-1 rounded px-4 py-3" role="alert">
          Something went wrong. Learn more
          <a href="" className="font-bold">
            through this alert link.
          </a>
        </div>
        <div className="bg-info/15 text-info flex items-center gap-1 rounded px-4 py-3" role="alert">
          Here’s some information that may help—click
          <a href="" className="font-bold">
            this link
          </a>
          to read more.
        </div>
        <div className="bg-light text-dark flex items-center gap-1 rounded px-4 py-3" role="alert">
          Just a light reminder with
          <a href="" className="font-bold">
            a gentle link
          </a>
          to explore.
        </div>
        <div className="bg-dark/15 text-dark flex items-center gap-1 rounded px-4 py-3" role="alert">
          This is a general dark alert. Find out more
          <a href="" className="font-bold">
            by clicking here.
          </a>
        </div>
      </div>
    </ComponentCard>
  )
}

const AdditionalContent = () => {
  return (
    <ComponentCard title="Additional Content" isCollapsible>
      <div className="space-y-4">
        <div className="bg-success/15 text-success rounded p-6" role="alert">
          <h4 className="text-success mb-2 text-lg">Great job!</h4>
          <p className="mb-4">You’ve successfully read this important alert message. The text is intentionally a bit longer to demonstrate how spacing behaves in this kind of layout.</p>
          <hr className="border-success/20 my-4" />
          <p>Use margin utilities to keep your content clean and organized.</p>
        </div>
        <div className="bg-secondary/15 text-secondary flex gap-3 rounded p-6" role="alert">
          <Icon icon="alarm-snooze" className="size-8" />
          <div>
            <h4 className="text-secondary mb-2 text-lg">Heads up!</h4>
            <p className="mb-4">This alert message gives additional information with a longer message to show content spacing within an alert.</p>
            <hr className="border-secondary/20 my-4" />
            <p>Apply spacing classes wisely to maintain structure and clarity.</p>
          </div>
        </div>
        <div className="bg-danger/15 text-danger flex gap-3 rounded p-6" role="alert">
          <Icon icon="phone-ringing" className="size-8" />
          <div>
            <h4 className="text-danger mb-2 text-lg">Notice!</h4>
            <p className="mb-4">You’ve just read through a primary alert message. The extra length helps show how well the layout handles content spacing.</p>
            <button type="button" className="btn bg-danger btn-sm text-white">
              Got it
            </button>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const CustomAlerts = () => {
  return (
    <ComponentCard title="Custom Alerts" isCollapsible>
      <div className="space-y-4">
        <div id="dark-alert" className="hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300 border-b-2 border-dark bg-dark/15 text-dark flex items-center rounded px-4 py-3" role="alert">
          A dark alert with a bottom border!
          <button className="ms-auto" data-hs-remove-element="#dark-alert">
            <Icon icon="x" className="text-2xl text-default-700" />
          </button>
        </div>
        <div id="success-alert" className="hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300 border-2 border-dashed border-success bg-success/15 text-success flex items-center rounded px-4 py-3" role="alert">
          A success alert with a dashed border!
          <button className="ms-auto" data-hs-remove-element="#success-alert">
            <Icon icon="x" className="text-2xl text-default-700" />
          </button>
        </div>
        <div id="danger-alert" className="hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300 border-2 border-danger bg-danger/15 text-danger flex items-center rounded px-4 py-3" role="alert">
          A danger alert with a thick border!
          <button className="ms-auto" data-hs-remove-element="#danger-alert">
            <Icon icon="x" className="text-2xl text-default-700" />
          </button>
        </div>
        <div id="warning-alert" className="hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300 bg-warning/15 text-warning flex items-center rounded px-4 py-3" role="alert">
          A warning alert with a custom close button!
          <button className="ms-auto size-7.5 flex justify-center items-center rounded-full bg-warning text-white" data-hs-remove-element="#warning-alert">
            <Icon icon="x" className="text-xl" />
          </button>
        </div>
        <div id="info-alert" className="hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300 bg-info/15 text-info flex items-center rounded px-4 py-3" role="alert">
          <div className="flex gap-3 items-center">
            <Icon icon="alert-octagon" className="text-xl" />
            An info alert with a custom icon!
          </div>
          <button className="ms-auto" data-hs-remove-element="#info-alert">
            <Icon icon="x" className="size-6 text-default-700" />
          </button>
        </div>
        <div className="border-light bg-light/20 text-light flex items-center gap-base rounded border-2 p-6" role="alert">
          <Icon icon="phone-ringing" className="text-success size-7" />
          <div className="text-default-400">
            <h4 className="text-default-400 mb-2 text-lg font-semibold">Notice!</h4>
            <p>You’ve just read through a primary alert message. The extra length helps show how well the layout handles content spacing.</p>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const LiveAlert = () => {
  return (
    <ComponentCard title="Dismiss Alerts" isCollapsible>
      <div className="space-y-4">
        <div id="dismiss-alert" className="hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300 border-primary bg-primary/15 text-primary flex items-center rounded border px-4 py-3" role="alert">
          A primary alert with a Dismiss Alerts!
          <button className="ms-auto" data-hs-remove-element="#dismiss-alert">
            <Icon icon="x" className="size-6 text-default-700" />
          </button>
        </div>
      </div>
    </ComponentCard>
  )
}
