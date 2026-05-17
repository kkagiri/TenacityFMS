import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Tabs" subtitle="Base UI" />

      <div className="container">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <DefaultTabs />

          <TabsJustified />

          <TabsVerticalLeft />

          <TabsWithColoredNav />

          <TabsBordered />

          <BorderedTabsWithColoredBorder />

          <IconsTabs />

          <div className="card">
            <CardWithTabs />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page

const DefaultTabs = () => {
  return (
    <ComponentCard title="Default Tabs" isCollapsible>
      <p className="text-default-400 mb-4">Simple widget of tabbable panes of local content.</p>
      <div>
        <nav className="flex flex-wrap" aria-label="Tabs" role="tablist" data-hs-tab-select="#tab-select">
          <button
            type="button"
            className="hs-tab-active:border-b-transparent hs-tab-active:bg-white border-default-300 hs-tab-active:border hs-tab-active:text-primary hover:text-primary inline-flex items-center rounded-t border-b px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="overview"
            aria-selected="true"
            data-hs-tab="#default-overview"
            aria-controls="default-overview"
            role="tab"
          >
            Overview
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b-transparent hs-tab-active:bg-white border-default-300 hs-tab-active:border hs-tab-active:text-primary hover:text-primary active inline-flex items-center rounded-t border-b px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="activity"
            aria-selected="false"
            data-hs-tab="#default-activity"
            aria-controls="default-activity"
            role="tab"
          >
            Activity
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b-transparent hs-tab-active:bg-white border-default-300 hs-tab-active:border hs-tab-active:text-primary hover:text-primary inline-flex items-center rounded-t border-b px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="settings"
            aria-selected="false"
            data-hs-tab="#default-settings"
            aria-controls="default-settings"
            role="tab"
          >
            Settings
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b-transparent hs-tab-active:bg-white border-default-300 hs-tab-active:border hs-tab-active:text-primary hover:text-primary inline-flex items-center rounded-t border-b px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="disabled"
            aria-selected="false"
            data-hs-tab="#default-Disabled"
            aria-controls="default-Disabled"
            role="tab"
            disabled
          >
            Disabled
          </button>
        </nav>
      </div>
      <div className="mt-5">
        <div id="default-overview" role="tabpanel" className="hidden" aria-labelledby="overview">
          <p>This dashboard provides a quick overview of your recent activity, performance metrics, and system status. You can easily monitor key indicators, recent logins, pending tasks, and overall user engagement.</p>
        </div>
        <div id="default-activity" role="tabpanel" aria-labelledby="activity">
          <p>View your latest interactions and actions taken across the platform. This includes recent file uploads, comments, status updates, and notification history to keep you up to date with ongoing changes.</p>
        </div>
        <div id="default-settings" className="hidden" role="tabpanel" aria-labelledby="settings">
          <p>Customize your account preferences including theme options, notification settings, and privacy controls. Adjust layout configurations to suit your workflow and manage integration with third-party services.</p>
        </div>
      </div>
    </ComponentCard>
  )
}

const TabsJustified = () => {
  return (
    <ComponentCard title="Tabs Justified" isCollapsible>
      <p className="text-default-400 mb-4">Justified navigation items stretch to fill the full available width, ensuring all tabs are evenly spaced across the container.</p>
      <div>
        <nav className="flex flex-wrap md:flex-nowrap" aria-label="Tabs" role="tablist" data-hs-tab-select="#tab-select">
          <button
            type="button"
            className="hs-tab-active:border-b-transparent hs-tab-active:bg-white border-default-300 hs-tab-active:border hs-tab-active:text-primary hover:text-primary inline-flex w-auto items-center justify-center rounded-t border-b px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 md:w-full"
            aria-selected="true"
            data-hs-tab="#overview1"
            aria-controls="overview1"
            role="tab"
          >
            Overview
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b-transparent hs-tab-active:bg-white border-default-300 hs-tab-active:border hs-tab-active:text-primary hover:text-primary active inline-flex w-auto items-center justify-center rounded-t border-b px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 md:w-full"
            id="profile-1"
            aria-selected="false"
            data-hs-tab="#profile1"
            aria-controls="profile1"
            role="tab"
          >
            Profile
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b-transparent hs-tab-active:bg-white border-default-300 hs-tab-active:border hs-tab-active:text-primary hover:text-primary inline-flex w-auto items-center justify-center rounded-t border-b px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 md:w-full"
            id="settings-1"
            aria-selected="false"
            data-hs-tab="#settings1"
            aria-controls="settings1"
            role="tab"
          >
            Settings
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b-transparent hs-tab-active:bg-white border-default-300 hs-tab-active:border hs-tab-active:text-primary hover:text-primary inline-flex w-auto items-center justify-center rounded-t border-b px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 md:w-full"
            id="projects-1"
            aria-selected="false"
            data-hs-tab="#projects1"
            aria-controls="projects1"
            role="tab"
          >
            Projects
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b-transparent hs-tab-active:bg-white border-default-300 hs-tab-active:border hs-tab-active:text-primary hover:text-primary inline-flex w-auto items-center justify-center rounded-t border-b px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 md:w-full"
            id="Support-1"
            aria-selected="false"
            data-hs-tab="#Support1"
            aria-controls="Support1"
            role="tab"
          >
            Support
          </button>
        </nav>
      </div>
      <div className="mt-5">
        <div id="overview1" role="tabpanel" className="hidden" aria-labelledby="overview-1">
          <p>Get a high-level summary of recent activity, key performance indicators, and important announcements. Stay informed and make quick decisions based on real-time insights.</p>
        </div>
        <div id="profile1" role="tabpanel" aria-labelledby="profile-1">
          <p>Customize your profile, update personal information, and manage security settings like passwords and 2FA. Keep your account secure and up to date with your latest details.</p>
        </div>
        <div id="settings1" className="hidden" role="tabpanel" aria-labelledby="settings-1">
          <p>Configure system preferences, theme options, and notification settings. Easily adapt the platform to fit your workflow and preferences.</p>
        </div>
        <div id="projects1" className="hidden" role="tabpanel" aria-labelledby="projects-1">
          <p>View and manage all ongoing projects, tasks, and milestones. Collaborate with your team and track progress in real-time.</p>
        </div>
        <div id="Support1" className="hidden" role="tabpanel" aria-labelledby="Support-1">
          <p>Need help? Reach out to our support team or browse the help center for common questions, guides, and documentation.</p>
        </div>
      </div>
    </ComponentCard>
  )
}

const TabsVerticalLeft = () => {
  return (
    <ComponentCard title="Tabs Vertical Left" isCollapsible>
      <p className="text-default-400 mb-4">Navigation items can be stacked vertically by changing the flex direction to column, making them display one below another.</p>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-base">
        <nav className="col-span-1 md:col-span-3" aria-label="Tabs" role="tablist" data-hs-tab-select="#tab-select">
          <button
            type="button"
            className="hs-tab-active:bg-primary hs-tab-active:text-white hover:text-primary active inline-flex w-full items-center rounded px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="vertical-overview"
            aria-selected="true"
            data-hs-tab="#v-pills-home-tab"
            aria-controls="v-pills-home-tab"
            role="tab"
          >
            Overview
          </button>
          <button
            type="button"
            className="hs-tab-active:bg-primary hs-tab-active:text-white hover:text-primary inline-flex w-full items-center rounded px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="vertical-activity"
            aria-selected="false"
            data-hs-tab="#v-pills-profile-tab"
            aria-controls="v-pills-profile-tab"
            role="tab"
          >
            Activity
          </button>
          <button
            type="button"
            className="hs-tab-active:bg-primary hs-tab-active:text-white hover:text-primary inline-flex w-full items-center rounded px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="vertical-settings"
            aria-selected="false"
            data-hs-tab="#v-pills-settings-tab"
            aria-controls="v-pills-settings-tab"
            role="tab"
          >
            Settings
          </button>
          <button
            type="button"
            className="hs-tab-active:bg-primary hs-tab-active:text-white hover:text-primary inline-flex w-full items-center rounded px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="vertical-disabled"
            aria-selected="false"
            data-hs-tab="#v-pills-projects-tab"
            aria-controls="v-pills-projects-tab"
            role="tab"
          >
            Projects
          </button>
          <button
            type="button"
            className="hs-tab-active:bg-primary hs-tab-active:text-white hover:text-primary inline-flex w-full items-center rounded px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="vertical-support"
            aria-selected="false"
            data-hs-tab="#v-pills-support-tab"
            aria-controls="v-pills-support-tab"
            role="tab"
          >
            Support
          </button>
        </nav>
        <div className="col-span-1 md:col-span-9">
          <div id="v-pills-home-tab" role="tabpanel" aria-labelledby="vertical-overview">
            <p className="mb-2">Welcome to your dashboard. Get an at-a-glance view of your recent activity, top stats, and personalized suggestions to enhance productivity and stay on track.</p>
            <ul className="mb-4 list-disc space-y-1 ps-8">
              <li>View total project status</li>
              <li>Quick links to recent files</li>
              <li>Weekly performance charts</li>
            </ul>
            <p>Your dashboard is tailored to your activity and roles. Stay informed and always one step ahead.</p>
          </div>
          <div id="v-pills-profile-tab" className="hidden" role="tabpanel" aria-labelledby="vertical-activity">
            <p className="mb-2">Manage your personal details, change your profile photo, and update your contact information.</p>
            <ul className="mb-4 list-disc space-y-1 ps-8">
              <li>Name, Email, Phone</li>
              <li>Change Password</li>
              <li>Activity logs and preferences</li>
            </ul>
            <p>Keeping your profile up to date ensures a better and more secure experience.</p>
          </div>
          <div id="v-pills-settings-tab" className="hidden" role="tabpanel" aria-labelledby="vertical-settings">
            <p className="mb-2">Customize your preferences, notification options, and privacy settings.</p>
            <ul className="mb-4 list-disc space-y-1 ps-8">
              <li>Theme selection: Light / Dark mode</li>
              <li>Email &amp; push notification toggles</li>
              <li>Linked accounts and integrations</li>
            </ul>
            <p>Settings help personalize your interface and improve your workflow efficiency.</p>
          </div>
          <div id="v-pills-projects-tab" className="hidden" role="tabpanel" aria-labelledby="vertical-projects">
            <p className="mb-2">Track all your active, completed, and upcoming projects in one place.</p>
            <ul className="mb-4 list-disc space-y-1 ps-8">
              <li>Kanban board and Gantt charts</li>
              <li>Task assignments and deadlines</li>
              <li>Progress indicators and timelines</li>
            </ul>
            <p>Use collaboration tools, upload documents, and manage deliverables directly from here.</p>
          </div>
          <div id="v-pills-support-tab" className="hidden" role="tabpanel" aria-labelledby="vertical-support">
            <p className="mb-2">Need assistance? Access our help center or contact our support team directly.</p>
            <ul className="mb-4 list-disc space-y-1 ps-8">
              <li>Browse FAQs and tutorials</li>
              <li>Submit a support ticket</li>
              <li>Live chat with support agents</li>
            </ul>
            <p>We’re here 24/7 to assist you with anything you need—technical or account-related.</p>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const TabsWithColoredNav = () => {
  return (
    <ComponentCard title="Tabs with Colored Navs" isCollapsible>
      <p className="text-default-400 mb-4">Pill-style navigation applies rounded, color-based styles to navigation items, making the active state more visually distinct.</p>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-base">
        <div className="col-span-1 md:col-span-9">
          <div id="v-pills-home-right" role="tabpanel" aria-labelledby="right-overview">
            <p className="mb-2">Welcome to your dashboard. Get an at-a-glance view of your recent activity, top stats, and personalized suggestions to enhance productivity and stay on track.</p>
            <ul className="mb-4 list-disc space-y-1 ps-8">
              <li>View total project status</li>
              <li>Quick links to recent files</li>
              <li>Weekly performance charts</li>
            </ul>
            <p>Your dashboard is tailored to your activity and roles. Stay informed and always one step ahead.</p>
          </div>
          <div id="v-pills-profile-right" className="hidden" role="tabpanel" aria-labelledby="right-activity">
            <p className="mb-2">Manage your personal details, change your profile photo, and update your contact information.</p>
            <ul className="mb-4 list-disc space-y-1 ps-8">
              <li>Name, Email, Phone</li>
              <li>Change Password</li>
              <li>Activity logs and preferences</li>
            </ul>
            <p>Keeping your profile up to date ensures a better and more secure experience.</p>
          </div>
          <div id="v-pills-settings-right" className="hidden" role="tabpanel" aria-labelledby="right-settings">
            <p className="mb-2">Customize your preferences, notification options, and privacy settings.</p>
            <ul className="mb-4 list-disc space-y-1 ps-8">
              <li>Theme selection: Light / Dark mode</li>
              <li>Email &amp; push notification toggles</li>
              <li>Linked accounts and integrations</li>
            </ul>
            <p>Settings help personalize your interface and improve your workflow efficiency.</p>
          </div>
          <div id="v-pills-projects-right" className="hidden" role="tabpanel" aria-labelledby="right-projects">
            <p className="mb-2">Track all your active, completed, and upcoming projects in one place.</p>
            <ul className="mb-4 list-disc space-y-1 ps-8">
              <li>Kanban board and Gantt charts</li>
              <li>Task assignments and deadlines</li>
              <li>Progress indicators and timelines</li>
            </ul>
            <p>Use collaboration tools, upload documents, and manage deliverables directly from here.</p>
          </div>
          <div id="v-pills-support-right" className="hidden" role="tabpanel" aria-labelledby="right-support">
            <p className="mb-2">Need assistance? Access our help center or contact our support team directly.</p>
            <ul className="mb-4 list-disc space-y-1 ps-8">
              <li>Browse FAQs and tutorials</li>
              <li>Submit a support ticket</li>
              <li>Live chat with support agents</li>
            </ul>
            <p>We’re here 24/7 to assist you with anything you need—technical or account-related.</p>
          </div>
        </div>
        <nav className="col-span-1 md:col-span-3" aria-label="Tabs" role="tablist" data-hs-tab-select="#tab-select">
          <button
            type="button"
            className="hs-tab-active:bg-secondary hs-tab-active:text-white hover:text-secondary active inline-flex w-full items-center rounded px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="right-overview"
            aria-selected="true"
            data-hs-tab="#v-pills-home-right"
            aria-controls="v-pills-home-right"
            role="tab"
          >
            Overview
          </button>
          <button
            type="button"
            className="hs-tab-active:bg-secondary hs-tab-active:text-white hover:text-secondary inline-flex w-full items-center rounded px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="right-activity"
            aria-selected="false"
            data-hs-tab="#v-pills-profile-right"
            aria-controls="v-pills-profile-right"
            role="tab"
          >
            Activity
          </button>
          <button
            type="button"
            className="hs-tab-active:bg-secondary hs-tab-active:text-white hover:text-secondary inline-flex w-full items-center rounded px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="right-settings"
            aria-selected="false"
            data-hs-tab="#v-pills-settings-right"
            aria-controls="v-pills-settings-right"
            role="tab"
          >
            Settings
          </button>
          <button
            type="button"
            className="hs-tab-active:bg-secondary hs-tab-active:text-white hover:text-secondary inline-flex w-full items-center rounded px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="right-disabled"
            aria-selected="false"
            data-hs-tab="#v-pills-projects-right"
            aria-controls="v-pills-projects-right"
            role="tab"
          >
            Projects
          </button>
          <button
            type="button"
            className="hs-tab-active:bg-secondary hs-tab-active:text-white hover:text-secondary inline-flex w-full items-center rounded px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="right-support"
            aria-selected="false"
            data-hs-tab="#v-pills-support-right"
            aria-controls="v-pills-support-right"
            role="tab"
          >
            Support
          </button>
        </nav>
      </div>
    </ComponentCard>
  )
}

const TabsBordered = () => {
  return (
    <ComponentCard title="Tabs Bordered" isCollapsible>
      <p className="text-default-400 mb-4">Navigation items can also use a simple bottom border style to highlight the active state while keeping the design minimal.</p>
      <div>
        <nav className="border-default-300 flex flex-wrap border-b" aria-label="Tabs" role="tablist" data-hs-tab-select="#tab-select">
          <button
            type="button"
            className="hs-tab-active:border-b hs-tab-active:border-primary hs-tab-active:text-primary hover:text-primary inline-flex items-center px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="home-border"
            aria-selected="true"
            data-hs-tab="#home-b1"
            aria-controls="home-b1"
            role="tab"
          >
            Home
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b hs-tab-active:border-primary hs-tab-active:text-primary hover:text-primary active inline-flex items-center px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="profile-border"
            aria-selected="false"
            data-hs-tab="#profile-b1"
            aria-controls="profile-b1"
            role="tab"
          >
            Profile
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b hs-tab-active:border-primary hs-tab-active:text-primary hover:text-primary inline-flex items-center px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="settings-border"
            aria-selected="false"
            data-hs-tab="#settings-b1"
            aria-controls="settings-b1"
            role="tab"
          >
            Settings
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b hs-tab-active:border-primary hs-tab-active:text-primary hover:text-primary inline-flex items-center px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="about-border"
            aria-selected="false"
            data-hs-tab="#about-b1"
            aria-controls="about-b1"
            role="tab"
          >
            About
          </button>
        </nav>
      </div>
      <div className="mt-5">
        <div id="home-b1" role="tabpanel" className="hidden" aria-labelledby="home-border">
          <p>Welcome to our online platform! Here, we strive to offer the best products and services tailored to your lifestyle. Whether you&apos;re redecorating your home or looking for expert advice on the latest trends, we&apos;ve got you covered.</p>
        </div>
        <div id="profile-b1" role="tabpanel" aria-labelledby="profile-border">
          <p>Hi! I am an avid explorer, constantly seeking new adventures and insights. My passions include technology, literature, travel, fitness, and self-development. I enjoy learning new skills and sharing knowledge with others to foster personal growth.</p>
        </div>
        <div id="settings-b1" className="hidden" role="tabpanel" aria-labelledby="settings-border">
          <p>Nestled in the heart of the city, a charming cafe offers a peaceful retreat from the urban hustle. Its inviting ambiance, with its cozy decor and warm lighting, provides the perfect setting for relaxation or a productive meeting.</p>
        </div>
        <div id="about-b1" className="hidden" role="tabpanel" aria-labelledby="about-border">
          <p>Our company is dedicated to offering high-quality services and products designed to enrich your life. With a focus on sustainability and innovation, we aim to create lasting value for our customers. Join us on our journey to make everyday living better!</p>
        </div>
      </div>
    </ComponentCard>
  )
}

const BorderedTabsWithColoredBorder = () => {
  return (
    <ComponentCard title="Bordered Tabs with Colored Border" isCollapsible>
      <p className="text-default-400 mb-4">Navigation bars can use colored border styles to visually highlight active or selected items while maintaining a minimal layout.</p>
      <div>
        <nav className="border-default-300 flex border-b" aria-label="Tabs" role="tablist" data-hs-tab-select="#tab-select">
          <button
            type="button"
            className="hs-tab-active:border-b hs-tab-active:border-danger hs-tab-active:text-danger hover:text-danger inline-flex w-auto items-center justify-center gap-1 px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 md:w-full"
            id="home-icon"
            aria-selected="true"
            data-hs-tab="#home-ib1"
            aria-controls="home-ib1"
            role="tab"
          >
            <Icon icon="smart-home" className="size-4" />
            <div className="hidden md:block">Home</div>
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b hs-tab-active:border-danger hs-tab-active:text-danger hover:text-danger active inline-flex w-auto items-center justify-center gap-1 px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 md:w-full"
            id="profile-icon"
            aria-selected="false"
            data-hs-tab="#profile-ib1"
            aria-controls="profile-ib1"
            role="tab"
          >
            <Icon icon="user-circle" className="size-4" />
            <div className="hidden md:block">Profile</div>
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b hs-tab-active:border-danger hs-tab-active:text-danger hover:text-danger inline-flex w-auto items-center justify-center gap-1 px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 md:w-full"
            id="settings-icon"
            aria-selected="false"
            data-hs-tab="#settings-ib1"
            aria-controls="settings-ib1"
            role="tab"
          >
            <Icon icon="settings" className="size-4" />
            <div className="hidden md:block">Settings</div>
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b hs-tab-active:border-danger hs-tab-active:text-danger hover:text-danger inline-flex w-auto items-center justify-center gap-1 px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 md:w-full"
            id="about-icon"
            aria-selected="false"
            data-hs-tab="#about-ib1"
            aria-controls="about-ib1"
            role="tab"
          >
            <Icon icon="alert-octagon" className="size-4" />
            <div className="hidden md:block">About</div>
          </button>
        </nav>
      </div>
      <div className="mt-5">
        <div id="home-ib1" role="tabpanel" className="hidden" aria-labelledby="home-icon">
          <p>
            Welcome to our online platform! Our goal is to offer a wide variety of products and services that meet the needs of modern living. From cutting-edge technology to home decor solutions, we ensure that every product enhances your lifestyle and makes your life easier.
          </p>
        </div>
        <div id="profile-ib1" role="tabpanel" aria-labelledby="profile-icon">
          <p>Hi there! I&apos;m an avid explorer with a passion for technology, fitness, and continuous learning. I enjoy meeting like-minded individuals and believe in expanding my knowledge on diverse subjects, from the latest gadgets to personal development.</p>
        </div>
        <div id="settings-ib1" className="hidden" role="tabpanel" aria-labelledby="settings-icon">
          <p>In the center of the city stands a quiet, charming bookstore that offers a peaceful retreat. Surrounded by vibrant streets, it provides a calm, inviting atmosphere for readers to lose themselves in books while enjoying a cup of coffee in the cozy corner.</p>
        </div>
        <div id="about-ib1" className="hidden" role="tabpanel" aria-labelledby="about-icon">
          <p>
            We are a forward-thinking company focused on creating innovative solutions that empower our customers. Our team is driven by creativity and a passion for delivering exceptional experiences through high-quality products and services that cater to a variety of needs.
          </p>
        </div>
      </div>
    </ComponentCard>
  )
}

const IconsTabs = () => {
  return (
    <ComponentCard title="Icons Tabs" isCollapsible>
      <p className="text-default-400 mb-4">Navigation items can also use a simple bottom border style to indicate the active state while keeping the layout clean and minimal.</p>
      <div>
        <nav className="border-default-300 flex flex-wrap border-b" aria-label="Tabs" role="tablist" data-hs-tab-select="#tab-select">
          <button
            type="button"
            className="hs-tab-active:border-b hs-tab-active:border-success hs-tab-active:text-success hover:text-success inline-flex items-center px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="home-icon"
            aria-selected="true"
            data-hs-tab="#home-i1"
            aria-controls="home-i1"
            role="tab"
          >
            <Icon icon="smart-home" className="size-5.5" />
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b hs-tab-active:border-success hs-tab-active:text-success hover:text-success active inline-flex items-center px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="profile-icon"
            aria-selected="false"
            data-hs-tab="#profile-i1"
            aria-controls="profile-i1"
            role="tab"
          >
            <Icon icon="user-circle" className="size-5.5" />
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b hs-tab-active:border-success hs-tab-active:text-success hover:text-success inline-flex items-center px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="settings-icon"
            aria-selected="false"
            data-hs-tab="#settings-i1"
            aria-controls="settings-i1"
            role="tab"
          >
            <Icon icon="settings" className="size-5.5" />
          </button>
          <button
            type="button"
            className="hs-tab-active:border-b hs-tab-active:border-success hs-tab-active:text-success hover:text-success inline-flex items-center px-4 py-2 text-center font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            id="about-icon"
            aria-selected="false"
            data-hs-tab="#about-i1"
            aria-controls="about-i1"
            role="tab"
          >
            <Icon icon="alert-octagon" className="size-5.5" />
          </button>
        </nav>
      </div>
      <div className="mt-5">
        <div id="home-i1" role="tabpanel" className="hidden" aria-labelledby="home-border">
          <p>Discover our platform designed to make your daily life easier. From modern interiors to smart home gadgets, our curated selection is tailored for comfort, functionality, and style.</p>
        </div>
        <div id="profile-i1" role="tabpanel" aria-labelledby="profile-border">
          <p>Hello! I’m a creative thinker who thrives on innovation and meaningful connections. I enjoy exploring tech trends, reading insightful books, and traveling to experience new cultures and cuisines.</p>
        </div>
        <div id="settings-i1" className="hidden" role="tabpanel" aria-labelledby="settings-border">
          <p>A peaceful workspace can make all the difference. That’s why we offer customizable setups, soundproofing tips, and productivity tools to help you stay focused and inspired every day.</p>
        </div>
        <div id="about-i1" className="hidden" role="tabpanel" aria-labelledby="about-border">
          <p>We’re a team of innovators passionate about creating seamless experiences. Our mission is to deliver solutions that merge design, functionality, and purpose in every project we undertake.</p>
        </div>
      </div>
    </ComponentCard>
  )
}

const CardWithTabs = () => {
  return (
    <>
      <div className="card-header border-dashed">
        <h4 className="card-title">Card with Tabs</h4>
        <nav className="nav-tabs" aria-label="Tabs" role="tablist" data-hs-tab-select="#tab-select">
          <button type="button" className="nav-link hs-tab-active:border-b hs-tab-active:border-primary hs-tab-active:text-primary hover:text-primary" id="summary" aria-selected="true" data-hs-tab="#home-ct" aria-controls="home-ct" role="tab">
            <Icon icon="smart-home" className="block md:hidden" />
            <div className="hidden md:block">Summary</div>
          </button>
          <button type="button" className="nav-link hs-tab-active:border-b hs-tab-active:border-primary hs-tab-active:text-primary hover:text-primary active" id="accounts" aria-selected="false" data-hs-tab="#profile-ct" aria-controls="profile-ct" role="tab">
            <Icon icon="user-circle" className="block md:hidden" />
            <div className="hidden md:block">Accounts</div>
          </button>
          <button type="button" className="nav-link hs-tab-active:border-b hs-tab-active:border-primary hs-tab-active:text-primary hover:text-primary" id="setting" aria-selected="false" data-hs-tab="#settings-ct" aria-controls="settings-ct" role="tab">
            <Icon icon="settings" className="block md:hidden" />
            <div className="hidden md:block">Settings</div>
          </button>
        </nav>
      </div>
      <div className="card-body">
        <div>
          <div id="home-ct" role="tabpanel" className="hidden" aria-labelledby="summary">
            <p>Welcome to your financial dashboard. Here, you can monitor real-time updates on your income, expenses, savings, and investments. Our tools are designed to help you make informed decisions and achieve your financial goals faster.</p>
          </div>
          <div id="profile-ct" role="tabpanel" aria-labelledby="accounts">
            <p>View and manage all your bank accounts, credit cards, and loan details in one place. Link your financial institutions securely and keep track of balances, transactions, and payment schedules with ease.</p>
          </div>
          <div id="settings-ct" className="hidden" role="tabpanel" aria-labelledby="setting">
            <p>Customize your preferences including budgeting alerts, currency format, report frequency, and security settings. Enable multi-factor authentication and choose how you&apos;d like to receive account activity notifications.</p>
          </div>
        </div>
      </div>
    </>
  )
}
