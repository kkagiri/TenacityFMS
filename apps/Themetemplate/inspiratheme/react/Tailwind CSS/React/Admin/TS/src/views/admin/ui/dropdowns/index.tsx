import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Dropdowns" subtitle="Base UI" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <SingleButtonDropdowns />

          <MenuAlignment />

          <CustomDropdownArrow />

          <SplitButtonDropdowns />

          <Variant />

          <Sizing />

          <DropupVariation />

          <DropstartVariation />

          <DropendVariation />

          <ActiveItem />

          <DisabledItem />

          <Headers />

          <DarkDropdowns />

          <CenteredDropdowns />

          <AutoCloseBehavior />

          <Text />

          <Forms />
        </div>
      </div>
    </>
  )
}

export default Page

const SingleButtonDropdowns = () => {
  return (
    <ComponentCard title="Single Button Dropdowns" isCollapsible>
      <p className="text-default-400 mb-4">You can turn any button or link into a dropdown toggle with minimal markup changes, using the appropriate toggle class and menu structure.</p>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="hs-dropdown relative inline-flex">
          <button type="button" className="hs-dropdown-toggle btn bg-light text-dark" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Choose Option
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Profile Settings
            </a>
            <a className="dropdown-item" href="">
              Notifications
            </a>
            <a className="dropdown-item" href="">
              Logout
            </a>
          </div>
        </div>
        <div className="hs-dropdown relative inline-flex">
          <a className="hs-dropdown-toggle btn bg-primary hover:bg-primary-hover text-white" href="" role="button" id="dropdownMenuLink" aria-haspopup="true" aria-expanded="false">
            Quick Actions
            <Icon icon="chevron-down" className="hs-dropdown-open:rotate-180 transition-transform text-base" />
          </a>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Create New
            </a>
            <a className="dropdown-item" href="">
              Upload File
            </a>
            <a className="dropdown-item" href="">
              View Reports
            </a>
          </div>
        </div>
        <div className="hs-dropdown relative inline-flex [--trigger:hover]">
          <button type="button" className="hs-dropdown-toggle btn bg-light text-dark" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Hover Me
            <Icon icon="chevron-down" className="hs-dropdown-open:rotate-180 transition-transform text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu">
            <a className="dropdown-item" href="">
              Profile Settings
            </a>
            <a className="dropdown-item" href="">
              Notifications
            </a>
            <a className="dropdown-item" href="">
              Logout
            </a>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const MenuAlignment = () => {
  return (
    <ComponentCard title="Menu Alignment" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the
        <code>[--placement:bottom-right]</code>
        class to position the dropdown menu on the right side of the element.
      </p>
      <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
        <button type="button" className="hs-dropdown-toggle btn bg-light text-dark" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
          Right-aligned menu
          <Icon icon="chevron-down" className="text-base" />
        </button>
        <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
          <a className="dropdown-item" href="">
            Action
          </a>
          <a className="dropdown-item" href="">
            Another action
          </a>
          <a className="dropdown-item" href="">
            Something else here
          </a>
        </div>
      </div>
    </ComponentCard>
  )
}

const CustomDropdownArrow = () => {
  return (
    <ComponentCard title="Custom Dropdown Arrow" isCollapsible>
      <p className="text-default-400 mb-4">Dropdown buttons can be customized to include or exclude icons, allowing you to create clean text-only toggles or visually enhanced ones with custom icons.</p>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="hs-dropdown relative inline-flex">
          <button type="button" className="hs-dropdown-toggle btn bg-primary hover:bg-primary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Without Arrow
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Download Report
            </a>
            <a className="dropdown-item" href="">
              View Analytics
            </a>
            <a className="dropdown-item" href="">
              Export Data
            </a>
          </div>
        </div>
        <div className="hs-dropdown relative inline-flex">
          <button type="button" className="hs-dropdown-toggle btn border-primary hover:bg-primary text-primary flex items-center border hover:text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Custom Icon
            <Icon icon="edit" className="size-3.5" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Edit Profile
            </a>
            <a className="dropdown-item" href="">
              Account Settings
            </a>
            <a className="dropdown-item" href="">
              Sign Out
            </a>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const SplitButtonDropdowns = () => {
  return (
    <ComponentCard title="Split Button Dropdowns" isCollapsible>
      <p className="text-default-400 mb-4">Create split button dropdowns by pairing a regular button with a separate toggle. This layout provides quick actions on the main button and additional options in the dropdown.</p>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex">
          <button type="button" className="btn bg-primary hover:bg-primary-hover rounded-e-none text-white">
            Primary
          </button>
          <div className="hs-dropdown relative inline-flex [--placement:bottom-left]">
            <button type="button" className="hs-dropdown-toggle btn bg-primary/90 hover:bg-primary-hover rounded-s-none px-2 text-white">
              <Icon icon="chevron-down" className="text-base" />
            </button>
            <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
              <a className="dropdown-item" href="">
                Action
              </a>
              <a className="dropdown-item" href="">
                Another action
              </a>
              <a className="dropdown-item" href="">
                Something else here
              </a>
              <hr className="dropdown-divider" />
              <a className="dropdown-item" href="">
                Separated link
              </a>
            </div>
          </div>
        </div>
        <div className="inline-flex">
          <button type="button" className="btn bg-light hover:text-primary text-default-700 rounded-s-sm rounded-e-none">
            Secondary
          </button>
          <div className="hs-dropdown relative inline-flex [--placement:bottom-left]">
            <button type="button" className="hs-dropdown-toggle btn bg-light hover:text-primary rounded-s-none px-2">
              <Icon icon="chevron-down" className="text-base" />
            </button>
            <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
              <a className="dropdown-item" href="">
                Action
              </a>
              <a className="dropdown-item" href="">
                Another action
              </a>
              <a className="dropdown-item" href="">
                Something else here
              </a>
              <hr className="dropdown-divider" />
              <a className="dropdown-item" href="">
                Separated link
              </a>
            </div>
          </div>
        </div>
        <div className="inline-flex">
          <button type="button" className="btn bg-success/15 text-success hover:bg-success rounded-s rounded-e-none hover:text-white">
            Success
          </button>
          <div className="hs-dropdown relative inline-flex [--placement:bottom-left]">
            <button type="button" className="hs-dropdown-toggle btn bg-success/15 text-success hover:bg-success rounded-s-none px-2 hover:text-white">
              <Icon icon="chevron-down" className="text-base" />
            </button>
            <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
              <a className="dropdown-item" href="">
                Action
              </a>
              <a className="dropdown-item" href="">
                Another action
              </a>
              <a className="dropdown-item" href="">
                Something else here
              </a>
              <hr className="dropdown-divider" />
              <a className="dropdown-item" href="">
                Separated link
              </a>
            </div>
          </div>
        </div>
        <div className="inline-flex">
          <button type="button" className="btn bg-info hover:bg-info-hover rounded-s-sm rounded-e-none text-white">
            Info
          </button>
          <div className="hs-dropdown relative inline-flex [--placement:bottom-left]">
            <button type="button" className="hs-dropdown-toggle btn bg-info/85 hover:bg-info-hover rounded-s-none px-2 text-white">
              <Icon icon="chevron-down" className="text-base" />
            </button>
            <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
              <a className="dropdown-item" href="">
                Action
              </a>
              <a className="dropdown-item" href="">
                Another action
              </a>
              <a className="dropdown-item" href="">
                Something else here
              </a>
              <hr className="dropdown-divider" />
              <a className="dropdown-item" href="">
                Separated link
              </a>
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const Variant = () => {
  return (
    <ComponentCard title="Variant" isCollapsible>
      <p className="text-default-400 mb-4">Dropdown menus can be used with any button variant, allowing you to match different colors or styles such as primary, secondary, or success buttons.</p>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="hs-dropdown relative inline-flex">
          <button type="button" className="hs-dropdown-toggle btn bg-primary hover:bg-primary-hover text-white disabled:pointer-events-none disabled:opacity-50" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Primary
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Create New
            </a>
            <a className="dropdown-item" href="">
              Save Changes
            </a>
            <a className="dropdown-item" href="">
              Publish Now
            </a>
            <hr className="dropdown-divider" />
            <a className="dropdown-item" href="">
              View Drafts
            </a>
          </div>
        </div>
        <div className="hs-dropdown relative inline-flex">
          <button type="button" className="hs-dropdown-toggle btn bg-light text-default-700" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Secondary
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Settings
            </a>
            <a className="dropdown-item" href="">
              Preferences
            </a>
            <a className="dropdown-item" href="">
              Account Info
            </a>
            <hr className="dropdown-divider" />
            <a className="dropdown-item" href="">
              Logout
            </a>
          </div>
        </div>
        <div className="hs-dropdown relative inline-flex">
          <button type="button" className="hs-dropdown-toggle btn bg-success hover:bg-info-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Success
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Mark as Complete
            </a>
            <a className="dropdown-item" href="">
              Download Report
            </a>
            <a className="dropdown-item" href="">
              Submit Review
            </a>
            <hr className="dropdown-divider" />
            <a className="dropdown-item" href="">
              Archive Task
            </a>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const Sizing = () => {
  return (
    <ComponentCard title="Sizing" isCollapsible>
      <p className="text-default-400 mb-4">Dropdown menus can be paired with buttons of any size, including large, small, or split button variations for flexible design options.</p>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="hs-dropdown relative inline-flex">
          <button type="button" className="hs-dropdown-toggle btn bg-light text-default-700 px-6 py-2 text-lg" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Large Button
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Action
            </a>
            <a className="dropdown-item" href="">
              Another action
            </a>
            <a className="dropdown-item" href="">
              Something else here
            </a>
            <hr className="dropdown-divider" />
            <a className="dropdown-item" href="">
              Separated link
            </a>
          </div>
        </div>
        <div className="inline-flex">
          <button type="button" className="bg-light hover:text-primary text-default-700 relative rounded-s-sm px-6 py-2 text-lg">
            Large button
          </button>
          <div className="hs-dropdown relative inline-flex [--placement:bottom-left]">
            <button type="button" className="hs-dropdown-toggle bg-light hover:text-primary relative flex items-center justify-center rounded-e-sm px-4 py-2">
              <Icon icon="chevron-down" className="text-base" />
            </button>
            <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
              <a className="dropdown-item" href="">
                Action
              </a>
              <a className="dropdown-item" href="">
                Another action
              </a>
              <a className="dropdown-item" href="">
                Something else here
              </a>
              <hr className="dropdown-divider" />
              <a className="dropdown-item" href="">
                Separated link
              </a>
            </div>
          </div>
        </div>
        <div className="hs-dropdown relative inline-flex">
          <button type="button" className="hs-dropdown-toggle btn btn-sm bg-light text-default-700" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Small Button
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Action
            </a>
            <a className="dropdown-item" href="">
              Another action
            </a>
            <a className="dropdown-item" href="">
              Something else here
            </a>
            <hr className="dropdown-divider" />
            <a className="dropdown-item" href="">
              Separated link
            </a>
          </div>
        </div>
        <div className="inline-flex">
          <button type="button" className="btn btn-sm bg-light text-default-700 hover:text-primary rounded-e-none">
            Small Button
          </button>
          <div className="hs-dropdown relative inline-flex [--placement:bottom-left]">
            <button type="button" className="hs-dropdown-toggle btn btn-sm bg-light text-default-700 hover:text-primary rounded-s-none px-2">
              <Icon icon="chevron-down" className="text-base" />
            </button>
            <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
              <a className="dropdown-item" href="">
                Action
              </a>
              <a className="dropdown-item" href="">
                Another action
              </a>
              <a className="dropdown-item" href="">
                Something else here
              </a>
              <hr className="dropdown-divider" />
              <a className="dropdown-item" href="">
                Separated link
              </a>
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const DropupVariation = () => {
  return (
    <ComponentCard title="Dropup Variation" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the
        <code>[--placement:top]</code>
        or
        <code>[--placement:top-left]</code>
        class on the parent element to display the dropdown menu above the toggle button.
      </p>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="hs-dropdown relative inline-flex [--placement:top]">
          <button type="button" className="hs-dropdown-toggle btn bg-light text-default-700" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Dropup
            <Icon icon="chevron-up" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Action
            </a>
            <a className="dropdown-item" href="">
              Another action
            </a>
            <a className="dropdown-item" href="">
              Something else here
            </a>
            <hr className="dropdown-divider" />
            <a className="dropdown-item" href="">
              Separated link
            </a>
          </div>
        </div>
        <div className="inline-flex">
          <button type="button" className="btn bg-light text-default-700 hover:text-primary rounded-e-none">
            Split Dropup
          </button>
          <div className="hs-dropdown relative inline-flex [--placement:top-left]">
            <button type="button" className="hs-dropdown-toggle btn bg-light/90 text-default-700 hover:text-primary rounded-s-none px-2">
              <Icon icon="chevron-down" className="text-base" />
            </button>
            <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
              <a className="dropdown-item" href="">
                New Task
              </a>
              <a className="dropdown-item" href="">
                Assign User
              </a>
              <a className="dropdown-item" href="">
                Set Deadline
              </a>
              <hr className="dropdown-divider" />
              <a className="dropdown-item" href="">
                Project Settings
              </a>
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const DropstartVariation = () => {
  return (
    <ComponentCard title="Dropstart Variation" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the
        <code>[--placement:left-start]</code>
        class on the parent element to position the dropdown menu on the left side of the toggle button.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="hs-dropdown relative inline-flex [--placement:left-start]">
          <button type="button" className="hs-dropdown-toggle btn bg-secondary hover:bg-secondary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            <Icon icon="chevron-left" className="text-base" />
            Dropstart
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Action
            </a>
            <a className="dropdown-item" href="">
              Another action
            </a>
            <a className="dropdown-item" href="">
              Something else here
            </a>
            <hr className="dropdown-divider" />
            <a className="dropdown-item" href="">
              Separated link
            </a>
          </div>
        </div>
        <div className="inline-flex">
          <div className="hs-dropdown relative inline-flex [--placement:left-start]">
            <button type="button" className="hs-dropdown-toggle btn sky-700 bg-secondary/90 hover:bg-secondary-hover rounded-e-none px-2 text-white">
              <Icon icon="chevron-left" className="text-base" />
            </button>
            <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
              <a className="dropdown-item" href="">
                Action
              </a>
              <a className="dropdown-item" href="">
                Another action
              </a>
              <a className="dropdown-item" href="">
                Something else here
              </a>
              <hr className="dropdown-divider" />
              <a className="dropdown-item" href="">
                Separated link
              </a>
            </div>
          </div>
          <button type="button" className="btn bg-secondary hover:bg-secondary-hover rounded-s-none text-white">
            Split dropstart
          </button>
        </div>
      </div>
    </ComponentCard>
  )
}

const DropendVariation = () => {
  return (
    <ComponentCard title="Dropend Variation" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the
        <code>[--placement:right-end]</code>
        class on the parent element to display the dropdown menu on the right side of the toggle button.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="hs-dropdown relative inline-flex [--placement:right-end]">
          <button type="button" className="hs-dropdown-toggle btn bg-primary hover:bg-primary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Dropend
            <Icon icon="chevron-right" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              View Profile
            </a>
            <a className="dropdown-item" href="">
              Message User
            </a>
            <a className="dropdown-item" href="">
              Report Issue
            </a>
            <hr className="dropdown-divider" />
            <a className="dropdown-item" href="">
              Block User
            </a>
          </div>
        </div>
        <div className="inline-flex">
          <button type="button" className="bg-primary hover:bg-primary-hover relative rounded-s px-4 py-2 font-medium text-white">
            Split dropstart
          </button>
          <div className="hs-dropdown relative inline-flex [--placement:right-end]">
            <button type="button" className="hs-dropdown-toggle bg-primary/90 hover:bg-primary-hover relative flex items-center justify-center rounded-e px-2 py-2 text-white">
              <Icon icon="chevron-right" className="text-base" />
            </button>
            <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
              <a className="dropdown-item" href="">
                Action
              </a>
              <a className="dropdown-item" href="">
                Another action
              </a>
              <a className="dropdown-item" href="">
                Something else here
              </a>
              <hr className="dropdown-divider" />
              <a className="dropdown-item" href="">
                Separated link
              </a>
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const ActiveItem = () => {
  return (
    <ComponentCard title="Active Item" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the
        <code>.active</code>
        class on a dropdown item to highlight it as the currently selected or active option.
      </p>

      <div className="hs-dropdown relative inline-flex [--placement:bottom-end]">
        <button type="button" className="hs-dropdown-toggle btn bg-secondary hover:bg-secondary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
          Active Item
          <Icon icon="chevron-down" className="text-base" />
        </button>
        <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
          <a className="dropdown-item" href="">
            Regular link
          </a>
          <a className="dropdown-item active" href="">
            Active link
          </a>
          <a className="dropdown-item" href="">
            Another link
          </a>
        </div>
      </div>
    </ComponentCard>
  )
}

const DisabledItem = () => {
  return (
    <ComponentCard title="Disabled Item" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the
        <code>.disabled</code>
        class on dropdown items to indicate unavailable or inactive options within the menu.
      </p>
      <div className="hs-dropdown relative inline-flex [--placement:bottom-end]">
        <button type="button" className="hs-dropdown-toggle btn bg-primary hover:bg-primary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
          Disabled
          <Icon icon="chevron-down" className="text-base" />
        </button>
        <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
          <a className="dropdown-item" href="">
            Regular link
          </a>
          <a className="dropdown-item active" href="">
            Disabled link
          </a>
          <a className="dropdown-item" href="">
            Another link
          </a>
        </div>
      </div>
    </ComponentCard>
  )
}

const Headers = () => {
  return (
    <ComponentCard title="Headers" isCollapsible>
      <p className="text-default-400 mb-4">Add a header inside the dropdown menu to group or label related menu items clearly.</p>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="hs-dropdown relative inline-flex [--placement:bottom-end]">
          <button type="button" className="hs-dropdown-toggle btn bg-secondary hover:bg-primary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Header
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <h6 className="px-2.75 py-2 font-semibold">Dropdown header</h6>
            <a className="dropdown-item" href="">
              Action
            </a>
            <a className="dropdown-item" href="">
              Another Action
            </a>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const DarkDropdowns = () => {
  return (
    <ComponentCard title="Dark Dropdowns" isCollapsible>
      <p className="text-default-400 mb-4">
        Apply a dark theme to your dropdown menu by adding
        <code>data-theme="dark"</code>
        to the menu element. This helps match dark navbars or layouts without changing individual items.
      </p>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="hs-dropdown relative inline-flex [--placement:bottom-end]">
          <button type="button" className="hs-dropdown-toggle btn bg-dark text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Dark Dropdown
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div data-theme="dark" className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Dashboard
            </a>
            <a className="dropdown-item" href="">
              My Orders
            </a>
            <a className="dropdown-item" href="">
              Billing Settings
            </a>
            <hr className="dropdown-divider" />
            <a className="dropdown-item" href="">
              Logout
            </a>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const CenteredDropdowns = () => {
  return (
    <ComponentCard title="Centered Dropdowns" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the
        <code>[--placement:bottom]</code>
        or
        <code>[--placement:top]</code>
        class to position the dropdown menu centered below or above the toggle button.
      </p>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="hs-dropdown relative inline-flex [--placement:bottom]">
          <button type="button" className="hs-dropdown-toggle btn bg-secondary hover:bg-secondary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Centered dropdown
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <div className="space-y-0.5">
              <a className="dropdown-item" href="">
                Action
              </a>
              <a className="dropdown-item" href="">
                Action two
              </a>
              <a className="dropdown-item" href="">
                Action three
              </a>
            </div>
          </div>
        </div>
        <div className="hs-dropdown relative inline-flex [--placement:top]">
          <button type="button" className="hs-dropdown-toggle btn bg-secondary hover:bg-secondary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Centered dropdowup
            <Icon icon="chevron-up" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Action
            </a>
            <a className="dropdown-item" href="">
              Action two
            </a>
            <a className="dropdown-item" href="">
              Action three
            </a>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const AutoCloseBehavior = () => {
  return (
    <ComponentCard title="Auto Close Behavior" isCollapsible>
      <p className="text-default-400 mb-4">
        By default, the dropdown menu is closed when clicking inside or outside the dropdown menu. You can use the
        <code>autoClose</code>
        option to change this behavior of the dropdown.
      </p>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="hs-dropdown relative inline-flex">
          <button type="button" className="hs-dropdown-toggle btn bg-secondary hover:bg-secondary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Default dropdown
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Menu item
            </a>
            <a className="dropdown-item" href="">
              Menu item
            </a>
            <a className="dropdown-item" href="">
              Menu item
            </a>
          </div>
        </div>
        <div className="hs-dropdown relative inline-flex [--auto-close:inside]">
          <button type="button" className="hs-dropdown-toggle btn bg-secondary hover:bg-secondary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Clickable inside
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Menu item
            </a>
            <a className="dropdown-item" href="">
              Menu item
            </a>
            <a className="dropdown-item" href="">
              Menu item
            </a>
          </div>
        </div>
        <div className="hs-dropdown relative inline-flex [--auto-close:outside]">
          <button type="button" className="hs-dropdown-toggle btn bg-secondary hover:bg-secondary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Clickable outside
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Menu item
            </a>
            <a className="dropdown-item" href="">
              Menu item
            </a>
            <a className="dropdown-item" href="">
              Menu item
            </a>
          </div>
        </div>
        <div className="hs-dropdown relative inline-flex [--auto-close:false]">
          <button type="button" className="hs-dropdown-toggle btn bg-secondary hover:bg-secondary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Manual close
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
            <a className="dropdown-item" href="">
              Menu item
            </a>
            <a className="dropdown-item" href="">
              Menu item
            </a>
            <a className="dropdown-item" href="">
              Menu item
            </a>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const Text = () => {
  return (
    <ComponentCard title="Text" isCollapsible>
      <p className="text-default-400 mb-4">Place any freeform text within a dropdown menu with text and use spacing utilities. Note that you’ll likely need additional sizing styles to constrain the menu width.</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="hs-dropdown relative inline-flex [--placement:bottom-end]">
          <button type="button" className="hs-dropdown-toggle btn bg-primary hover:bg-primary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Text Dropdown
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu p-4" role="menu" aria-orientation="vertical">
            <p className="text-default-400 mb-4">Some example text that&apos;s free-flowing within the dropdown menu.</p>
            <p className="text-default-400">And this is more example text.</p>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const Forms = () => {
  return (
    <ComponentCard title="Forms" isCollapsible>
      <p className="text-default-400 mb-4">Put a form within a dropdown menu, or make it into a dropdown menu, and use margin or padding utilities to give it the negative space you require.</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="hs-dropdown relative inline-flex [--auto-close:inside] [--placement:bottom-end]">
          <button type="button" className="hs-dropdown-toggle btn bg-secondary hover:bg-secondary-hover text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Form
            <Icon icon="chevron-down" className="text-base" />
          </button>
          <div className="hs-dropdown-menu min-w-44" role="menu">
            <form className="px-7.5 py-5">
              <div className="mb-5">
                <label className="form-label">Email address</label>
                <input className="form-input text-sm" type="email" placeholder="email@example.com" />
              </div>
              <div className="mb-5">
                <label className="form-label">Password</label>
                <input className="form-input text-sm" type="password" placeholder="Password" />
              </div>
              <div className="mb-4 flex items-center gap-2.5">
                <input type="checkbox" className="form-checkbox shrink-0" id="dropdownCheck" />
                <label htmlFor="dropdownCheck" className="text-default-500 ms-1 text-sm">
                  Remember me
                </label>
              </div>
              <button type="submit" className="btn bg-primary text-white hover:bg-primary-hover">
                Sign in
              </button>
            </form>
            <hr className="dropdown-divider" />
            <a className="dropdown-item" href="">
              New around here? Sign up
            </a>
            <a className="dropdown-item" href="">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}
