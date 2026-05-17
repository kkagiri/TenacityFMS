import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Badges" subtitle="Base UI" />

      <div className="container">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <BasicBadges />

          <BasicPillBadges />

          <OutlineBadges />

          <OutlinePillBadges />

          <LightenBadges />

          <LightenPillBadges />

          <LabelBadges />

          <SquareBadges />

          <CircleBadges />

          <Positioned />
        </div>
      </div>
    </>
  )
}

export default Page

const BasicBadges = () => {
  return (
    <ComponentCard title="Basic Badges" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the &nbsp;<code>.badge</code>&nbsp; &amp;
        <code>.bg-*</code>&nbsp; classes to make badges.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="badge border-default-300 border">Default</span>
        <span className="badge bg-primary text-white">Primary</span>
        <span className="badge bg-secondary text-white">Secondary</span>
        <span className="badge bg-success text-white">Success</span>
        <span className="badge bg-danger text-white">Danger</span>
        <span className="badge bg-warning text-white">Warning</span>
        <span className="badge bg-info text-white">Info</span>
        <span className="badge bg-light">Light</span>
        <span className="badge bg-dark text-white">Dark</span>
      </div>
    </ComponentCard>
  )
}

const BasicPillBadges = () => {
  return (
    <ComponentCard title="Basic Pill Badges" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the &nbsp;<code>.rounded-full</code>&nbsp; modifier class to make badges more rounded.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="badge border-default-300 rounded-full border">Default</span>
        <span className="badge bg-primary rounded-full text-white">Primary</span>
        <span className="badge bg-secondary rounded-full text-white">Secondary</span>
        <span className="badge bg-success rounded-full text-white">Success</span>
        <span className="badge bg-danger rounded-full text-white">Danger</span>
        <span className="badge bg-warning rounded-full text-white">Warning</span>
        <span className="badge bg-info rounded-full text-white">Info</span>
        <span className="badge bg-light rounded-full">Light</span>
        <span className="badge bg-dark rounded-full text-white">Dark</span>
      </div>
    </ComponentCard>
  )
}

const OutlineBadges = () => {
  return (
    <ComponentCard title="Outline Badges" isCollapsible>
      <p className="text-default-400 mb-4">
        Using the &nbsp;<code>.border-*</code>&nbsp; to quickly create a bordered badges.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="badge border-primary text-primary border">Primary</span>
        <span className="badge border-secondary text-secondary border">Secondary</span>
        <span className="badge border-success text-success border">Success</span>
        <span className="badge border-danger text-danger border">Danger</span>
        <span className="badge border-warning text-warning border">Warning</span>
        <span className="badge border-info text-info border">Info</span>
        <span className="badge border-dark text-dark border">Dark</span>
      </div>
    </ComponentCard>
  )
}

const OutlinePillBadges = () => {
  return (
    <ComponentCard title="Outline Pill Badges" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the &nbsp;<code>.rounded-full</code>&nbsp; modifier class to make badges more rounded.
      </p>

      <div className="flex flex-wrap gap-2">
        <span className="badge border-primary text-primary rounded-full border">Primary</span>
        <span className="badge border-secondary text-secondary rounded-full border">Secondary</span>
        <span className="badge border-success text-success rounded-full border">Success</span>
        <span className="badge border-danger text-danger rounded-full border">Danger</span>
        <span className="badge border-warning text-warning rounded-full border">Warning</span>
        <span className="badge border-info text-info rounded-full border">Info</span>
        <span className="badge border-dark text-dark rounded-full border">Dark</span>
      </div>
    </ComponentCard>
  )
}

const LightenBadges = () => {
  return (
    <ComponentCard title="Lighten Badges" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the background opacity &nbsp;<code>.bg-*/15</code>&nbsp; modifier class to make badges lighten.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="badge bg-primary/15 text-primary">Primary</span>
        <span className="badge bg-secondary/15 text-secondary">Secondary</span>
        <span className="badge bg-success/15 text-success">Success</span>
        <span className="badge bg-danger/15 text-danger">Danger</span>
        <span className="badge bg-warning/15 text-warning">Warning</span>
        <span className="badge bg-info/15 text-info">Info</span>
        <span className="badge bg-dark/15 text-dark">Dark</span>
      </div>
    </ComponentCard>
  )
}

const LightenPillBadges = () => {
  return (
    <ComponentCard title="Lighten Pill Badges" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the background opacity &nbsp;<code>.bg-*/15</code>&nbsp; modifier class to make badges lighten.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="badge bg-primary/15 text-primary rounded-full">Primary</span>
        <span className="badge bg-secondary/15 text-secondary rounded-full">Secondary</span>
        <span className="badge bg-success/15 text-success rounded-full">Success</span>
        <span className="badge bg-danger/15 text-danger rounded-full">Danger</span>
        <span className="badge bg-warning/15 text-warning rounded-full">Warning</span>
        <span className="badge bg-info/15 text-info rounded-full">Info</span>
        <span className="badge bg-dark/15 text-dark rounded-full">Dark</span>
      </div>
    </ComponentCard>
  )
}

const LabelBadges = () => {
  return (
    <ComponentCard title="Label Badges" isCollapsible>
      <p className="text-default-400 mb-4">
        Using the &nbsp;<code>.badge-label</code>&nbsp; to quickly create a square based badges.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="badge badge-label border-default-300 border">Default</span>
        <span className="badge badge-label bg-primary text-white">Primary</span>
        <span className="badge badge-label bg-secondary text-white">Secondary</span>
        <span className="badge badge-label bg-success text-white">Success</span>
        <span className="badge badge-label bg-danger text-white">Danger</span>
        <span className="badge badge-label bg-warning text-white">Warning</span>
        <span className="badge badge-label bg-info text-white">Info</span>
        <span className="badge badge-label bg-light text-dark">Light</span>
        <span className="badge badge-label bg-dark text-white">Dark</span>
      </div>
    </ComponentCard>
  )
}

const SquareBadges = () => {
  return (
    <ComponentCard title="Square Badges" isCollapsible>
      <p className="text-default-400 mb-4">
        Using the &nbsp;<code>.size-*</code>&nbsp; to quickly create a square based badges.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="badge size-4 border border-default-300">0</span>
        <span className="badge size-4 bg-primary text-white">1</span>
        <span className="badge size-4 bg-secondary text-white">2</span>
        <span className="badge size-4 bg-success text-white">3</span>
        <span className="badge size-4 bg-danger text-white">4</span>
        <span className="badge size-4 bg-warning text-white">5</span>
        <span className="badge size-4 bg-info text-white">6</span>
        <span className="badge size-4 bg-light">7</span>
        <span className="badge size-4 bg-dark text-white">8</span>
      </div>
    </ComponentCard>
  )
}

const CircleBadges = () => {
  return (
    <ComponentCard title="Circle Badges" isCollapsible>
      <p className="text-default-400 mb-4">
        Using the &nbsp;<code>.rounded-full</code>&nbsp; to quickly create a circle based badges.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="badge size-4 rounded-full border border-default-300">0</span>
        <span className="badge size-4 rounded-full bg-primary text-white">1</span>
        <span className="badge size-4 rounded-full bg-secondary text-white">2</span>
        <span className="badge size-4 rounded-full bg-success text-white">3</span>
        <span className="badge size-4 rounded-full bg-danger text-white">4</span>
        <span className="badge size-4 rounded-full bg-warning text-white">5</span>
        <span className="badge size-4 rounded-full bg-info text-white">6</span>
        <span className="badge size-4 rounded-full bg-light text-dark">7</span>
        <span className="badge size-4 rounded-full bg-dark text-white">8</span>
      </div>
    </ComponentCard>
  )
}

const Positioned = () => {
  return (
    <ComponentCard title="Positioned" isCollapsible>
      <p className="mb-4">
        Use utilities to modify a&nbsp;<code>.badge</code>&nbsp; and position it in the corner of a link or button.
      </p>
      <div className="flex flex-wrap gap-4">
        <button type="button" className="btn bg-primary hover:bg-primary-hover relative text-white transition-all duration-300">
          Inbox
          <span className="badge bg-danger absolute -end-2 -top-2 rounded-full">99+</span>
        </button>
        <button type="button" className="btn bg-primary hover:bg-primary-hover relative text-white transition-all duration-300">
          Profile
          <span className="bg-danger absolute -end-1 -top-1 size-3 rounded-full border border-white px-0.75 py-0.5" />
        </button>
        <button type="button" className="btn bg-success hover:bg-success-hover text-white transition-all duration-300">
          Notifications
          <span className="badge bg-white text-black">4</span>
        </button>
      </div>
    </ComponentCard>
  )
}
