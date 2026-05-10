import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="List Group" subtitle="Base UI" />

      <div className="container">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-base">
          <div className="col-span-1">
            <BasicExample />
          </div>
          <div className="col-span-1">
            <ActiveItems />
          </div>
          <div className="col-span-1">
            <DisabledItems />
          </div>
          <div className="col-span-1">
            <LinksAndButtons />
          </div>
          <div className="col-span-1">
            <Flush />
          </div>
          <div className="col-span-1">
            <Horizontal />
          </div>
          <div className="col-span-1">
            <ContextualClasses />
          </div>
          <div className="col-span-1">
            <ContextualClasseswithLink />
          </div>
          <div className="col-span-1">
            <CustomContent />
          </div>
          <div className="col-span-1">
            <WithBadges />
          </div>
          <div className="col-span-1">
            <CheckboxesandRadios />
          </div>
          <div className="col-span-1">
            <Numbered />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page

const BasicExample = () => {
  return (
    <ComponentCard title="Basic Example" isCollapsible>
      <p className="text-default-400 mb-4">The basic list group starts as a simple unordered list with list items. You can extend it using the options below or customize it further to suit your needs.</p>

      <ul className="border-default-300 divide-default-200 divide-y rounded border">
        <li className="flex items-center gap-1.5 px-4.75 py-3">Dropbox Cloud Storage</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Slack Team Collaboration</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Microsoft Windows OS</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Zendesk Customer Support</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Stripe Payment Integration</li>
      </ul>
    </ComponentCard>
  )
}

const ActiveItems = () => {
  return (
    <ComponentCard title="Active Items" isCollapsible>
      <p className="text-default-400 mb-4">Use the active state to highlight the currently selected item in the list.</p>
      <ul className="border-default-300 divide-default-200 divide-y rounded border">
        <li className="bg-default-100 flex items-center gap-1.5 px-4.75 py-3">GitHub Repository</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Figma Design Tool</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Notion Workspace</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Trello Task Manager</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">DigitalOcean Cloud</li>
      </ul>
    </ComponentCard>
  )
}

const DisabledItems = () => {
  return (
    <ComponentCard title="Disabled Items" isCollapsible>
      <p className="text-default-400 mb-4">Use the disabled state to visually indicate that a list item is unavailable or inactive.</p>
      <ul className="border-default-300 divide-default-200 divide-y rounded border">
        <li className="bg-default-100 text-default-400 flex items-center gap-1.5 px-4.75 py-3">Dropbox Cloud Storage</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Slack Team Collaboration</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Microsoft Windows OS</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Zendesk Customer Support</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Stripe Payment Integration</li>
      </ul>
    </ComponentCard>
  )
}

const LinksAndButtons = () => {
  return (
    <ComponentCard title="Links and Buttons" isCollapsible>
      <p className="text-default-400 mb-4">Use interactive elements to create actionable list items that support hover, active, and disabled states.</p>
      <div className="border-default-300 divide-default-200 divide-y rounded border">
        <a href="" className="bg-default-100 flex items-center gap-1.5 px-4.75 py-3">
          Stripe Payment Integration
        </a>
        <a href="" className="hover:bg-default-100 flex items-center gap-1.5 px-4.75 py-3">
          Dropbox Cloud Service
        </a>
        <button type="button" className="hover:bg-default-100 focus:bg-default-100 flex w-full items-center gap-1.5 px-4.75 py-3">
          Slack Communication
        </button>
        <button type="button" className="hover:bg-default-100 focus:bg-default-100 flex w-full items-center gap-1.5 px-4.75 py-3">
          Notion Productivity App
        </button>
        <a href="" className="bg-default-100 text-default-400 flex items-center gap-1.5 px-4.75 py-3">
          Zendesk Support Tool
        </a>
      </div>
    </ComponentCard>
  )
}

const Flush = () => {
  return (
    <ComponentCard title="Flush" isCollapsible>
      <p className="text-default-400 mb-4">Remove borders and rounded corners to allow list items to sit flush against the edges of their parent container, such as inside cards.</p>
      <ul>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Slack Collaboration Tool</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Dropbox Cloud Storage</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Notion Workspace Organizer</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Zendesk Customer Support</li>
        <li className="flex items-center gap-1.5 px-4.75 py-3">Stripe Payment Processor</li>
      </ul>
    </ComponentCard>
  )
}

const Horizontal = () => {
  return (
    <ComponentCard title="Horizontal" isCollapsible>
      <p className="text-default-400 mb-4">You can display list items horizontally instead of vertically. This layout can be applied across all screen sizes or enabled only at specific breakpoints.</p>
      <ul className="divide-default-200 border-default-300 mb-5 inline-flex divide-x rounded border">
        <li className="px-4.75 py-3">Slack</li>
        <li className="px-4.75 py-3">Notion</li>
        <li className="px-4.75 py-3">Dropbox</li>
      </ul>
      <ul className="divide-default-200 border-default-300 mb-5 inline-flex divide-x rounded border">
        <li className="px-4.75 py-3">Figma</li>
        <li className="px-4.75 py-3">Stripe</li>
        <li className="px-4.75 py-3">Zendesk</li>
      </ul>
      <ul className="divide-default-200 border-default-300 inline-flex divide-x rounded border">
        <li className="px-4.75 py-3">Trello</li>
        <li className="px-4.75 py-3">Asana</li>
        <li className="px-4.75 py-3">ClickUp</li>
      </ul>
    </ComponentCard>
  )
}

const ContextualClasses = () => {
  return (
    <ComponentCard title="Contextual Classes" isCollapsible>
      <p className="text-default-400 mb-4">Use contextual classes to style list items with a stateful background and color.</p>
      <ul className="border-default-300 rounded border">
        <li className="border-default-300 border border-t-0 px-4.75 py-3">Dapibus ac facilisis in</li>
        <li className="text-primary bg-primary/15 border-primary border border-t-0 px-4.75 py-3">A simple primary list group item</li>
        <li className="text-secondary bg-secondary/15 border-secondary border border-t-0 px-4.75 py-3">A simple secondary list group item</li>
        <li className="text-success bg-success/15 border-success border border-t-0 px-4.75 py-3">A simple success list group item</li>
        <li className="text-danger bg-danger/15 border-danger border border-t-0 px-4.75 py-3">A simple danger list group ite</li>
        <li className="text-warning bg-warning/15 border-warning border border-t-0 px-4.75 py-3">A simple warning list group item</li>
        <li className="text-info bg-info/15 border-info border border-t-0 px-4.75 py-3">A simple info list group item</li>
        <li className="bg-light/15 text-default-400 border-light border border-t-0 px-4.75 py-3">A simple light list group item</li>
        <li className="text-dark bg-dark/15 border-dark border border-t-0 px-4.75 py-3">A simple dark list group item</li>
      </ul>
    </ComponentCard>
  )
}

const ContextualClasseswithLink = () => {
  return (
    <ComponentCard title="Contextual Classes with Link" isCollapsible>
      <p className="text-default-400 mb-4">Use contextual classes to style list items with a stateful background and color.</p>
      <div className="border-default-300 rounded border">
        <a href="" className="border-default-300 block border border-t-0 px-4.75 py-3">
          Dapibus ac facilisis in
        </a>
        <a href="" className="hover:bg-primary/40 bg-primary/15 border-primary block border border-t-0 px-4.75 py-3">
          A simple primary list group item
        </a>
        <a href="" className="hover:bg-secondary/40 bg-secondary/15 border-secondary block border border-t-0 px-4.75 py-3">
          A simple secondary list group item
        </a>
        <a href="" className="hover:bg-success/40 bg-success/15 border-success block border border-t-0 px-4.75 py-3">
          A simple success list group item
        </a>
        <a href="" className="hover:bg-danger/40 bg-danger/15 border-danger block border border-t-0 px-4.75 py-3">
          A simple danger list group ite
        </a>
        <a href="" className="hover:bg-warning/40 bg-warning/15 border-warning block border border-t-0 px-4.75 py-3">
          A simple warning list group item
        </a>
        <a href="" className="hover:bg-info/40 bg-info/15 border-info block border border-t-0 px-4.75 py-3">
          A simple info list group item
        </a>
        <a href="" className="hover:bg-light/40 bg-light/15 border-light block border border-t-0 px-4.75 py-3">
          A simple light list group item
        </a>
        <a href="" className="hover:bg-dark/40 bg-dark/15 border-dark block border border-t-0 px-4.75 py-3">
          A simple dark list group item
        </a>
      </div>
    </ComponentCard>
  )
}

const CustomContent = () => {
  return (
    <ComponentCard title="Custom Content" isCollapsible>
      <p className="text-default-400 mb-4">Add nearly any HTML within, even for linked list groups like the one below, with the help of flexbox utilities.</p>
      <div className="border-default-300 divide-default-200 divide-y rounded border">
        <a href="" className="bg-default-100 block px-4.75 py-3">
          <div className="flex items-center justify-between">
            <h5 className="mb-2">List group item heading</h5>
            <small className="text-[10px]">3 days ago</small>
          </div>
          <p className="mb-1">Donec id elit non mi porta gravida at eget metus. Maecenas sed diam eget risus varius blandit.</p>
          <small className="text-[10px]">Donec id elit non mi porta.</small>
        </a>
        <a href="" className="hover:bg-default-100 focus:bg-default-100 block px-4.75 py-3">
          <div className="flex items-center justify-between">
            <h5 className="mb-2">List group item heading</h5>
            <small className="text-[10px]">3 days ago</small>
          </div>
          <p className="mb-1">Donec id elit non mi porta gravida at eget metus. Maecenas sed diam eget risus varius blandit.</p>
          <small className="text-[10px]">Donec id elit non mi porta.</small>
        </a>
        <a href="" className="hover:bg-default-100 focus:bg-default-100 block px-4.75 py-3">
          <div className="flex items-center justify-between">
            <h5 className="mb-2">List group item heading</h5>
            <small className="text-[10px]">3 days ago</small>
          </div>
          <p className="mb-1">Donec id elit non mi porta gravida at eget metus. Maecenas sed diam eget risus varius blandit.</p>
          <small className="text-[10px]">Donec id elit non mi porta.</small>
        </a>
      </div>
    </ComponentCard>
  )
}

const WithBadges = () => {
  return (
    <ComponentCard title="With Badges" isCollapsible>
      <p className="text-default-400 mb-4">Add badges to any list group item to show unread counts, activity, and more with the help of some utilities.</p>
      <ul className="divide-default-200 border-default-300 divide-y rounded border">
        <li className="flex items-center justify-between gap-1.25 px-4 py-2.5">
          Gmail Notifications
          <span className="badge bg-primary text-white rounded-full">14</span>
        </li>
        <li className="flex items-center justify-between gap-1.25 px-4 py-2.5">
          Unprocessed Orders
          <span className="badge bg-success text-white rounded-full">2</span>
        </li>
        <li className="flex items-center justify-between gap-1.25 px-4 py-2.5">
          Urgent Tickets
          <span className="badge bg-danger text-white rounded-full">99+</span>
        </li>
        <li className="flex items-center justify-between gap-1.25 px-4 py-2.5">
          Completed Transactions
          <span className="badge bg-success text-white rounded-full">20+</span>
        </li>
        <li className="flex items-center justify-between gap-1.25 px-4 py-2.5">
          Invoices Awaiting Approval
          <span className="badge bg-warning text-white rounded-full">12</span>
        </li>
      </ul>
    </ComponentCard>
  )
}

const CheckboxesandRadios = () => {
  return (
    <ComponentCard title="Checkboxes and Radios" isCollapsible>
      <p className="text-default-400 mb-4">You can place checkboxes and radio buttons inside list items and customize them as needed. For accessibility, be sure to provide proper labels so assistive technologies can interpret them correctly.</p>
      <div className="divide-default-200 border-default-300 divide-y rounded border">
        <div className="flex items-center gap-2 px-4.75 py-3">
          <input type="checkbox" className="form-checkbox size-4.25" id="newsletterCheckbox" />
          <label htmlFor="newsletterCheckbox">Subscribe to newsletter</label>
        </div>
        <div className="flex items-center gap-2 px-4.75 py-3">
          <input type="checkbox" className="form-checkbox size-4.25" id="termsCheckbox" />
          <label htmlFor="termsCheckbox">Accept terms and conditions</label>
        </div>
      </div>
      <div className="divide-default-200 border-default-300 mt-3 divide-y rounded border">
        <div className="flex items-center gap-2 px-4.75 py-3">
          <input type="radio" name="notificationOptions" className="form-checkbox size-4.25 rounded-full" id="emailRadio" defaultChecked />
          <label htmlFor="emailRadio">Notify by Email</label>
        </div>
        <div className="flex items-center gap-2 px-4.75 py-3">
          <input type="radio" name="notificationOptions" className="form-checkbox size-4.25 rounded-full" id="smsRadio" />
          <label htmlFor="smsRadio">Notify by SMS</label>
        </div>
      </div>
    </ComponentCard>
  )
}

const Numbered = () => {
  return (
    <ComponentCard title="Numbered" isCollapsible>
      <p className="text-default-400 mb-4">List numbers are automatically generated and styled using a built-in counting system, ensuring consistent numbering and alignment for each item.</p>
      <ul className="divide-default-200 border-default-300 divide-y rounded border">
        <li className="flex justify-between gap-1.25 px-4 py-2.5">
          <div className="flex gap-3">
            <div>1.</div>
            <div>
              <div className="font-bold">Admin Dashboard Pro</div>A premium admin dashboard with modern UI components.
            </div>
          </div>
          <div>
            <span className="badge bg-primary text-white rounded-full">865</span>
          </div>
        </li>
        <li className="flex justify-between gap-1.25 px-4 py-2.5">
          <div className="flex gap-3">
            <div>2.</div>
            <div>
              <div className="font-bold">Vue Admin Lite</div>
              Clean and minimal admin panel built with Vue.js.
            </div>
          </div>
          <div>
            <span className="badge bg-primary text-white rounded-full">140</span>
          </div>
        </li>
        <li className="flex justify-between gap-1.25 px-4 py-2.5">
          <div className="flex gap-3">
            <div>3.</div>
            <div>
              <div className="font-bold">Angular Admin Panel</div>
              Lightweight and powerful Angular-based admin template. 85
            </div>
          </div>
          <div>
            <span className="badge bg-primary text-white rounded-full">85</span>
          </div>
        </li>
      </ul>
    </ComponentCard>
  )
}
