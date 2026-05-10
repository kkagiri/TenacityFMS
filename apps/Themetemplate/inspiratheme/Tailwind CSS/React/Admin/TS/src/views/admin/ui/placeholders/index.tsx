import small1 from '@/assets/images/stock/small-1.jpg'
import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Placeholders" subtitle="Base UI" />

      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <DefaultPlaceholders />

          <ColorPlaceholders />

          <WidthPlaceholders />

          <SizingPlaceholders />

          <WorksPlaceholder />

          <AnimationPlaceholder />
        </div>
      </div>
    </>
  )
}

export default Page

const DefaultPlaceholders = () => {
  return (
    <ComponentCard title="Placeholders" isCollapsible>
      <p className="text-default-400 mb-4">In the example below, we take a typical card component and recreate it with placeholders applied to create a “loading card”. Size and proportions are the same between the two.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-base xl:grid-cols-12">
        <div className="col-span-5">
          <div className="card border-default-300 border">
            <img src={small1} alt="..." />
            <div className="card-body">
              <h5 className="card-title mb-2">Card Title</h5>
              <p className="mb-4">Some quick example text to build on the card title and make up the bulk of the card&apos;s content.</p>
              <a href="" className="btn btn-sm bg-primary hover:bg-primary-hover text-white">
                Go somewhere
              </a>
            </div>
          </div>
        </div>
        <div className="col-span-5">
          <div className="card border-default-300 border">
            <svg width="100%" style={{ aspectRatio: '16 / 10' }} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Placeholder" preserveAspectRatio="xMidYMid slice" viewBox="0 0 16 10">
              <title>Placeholder</title>
              <rect width={16} height={10} fill="#20c997" />
            </svg>
            <div className="card-body">
              <h5 className="card-title mb-2 grid grid-cols-2">
                <span className="bg-default-300 block h-5.5 animate-pulse cursor-wait">&nbsp;</span>
              </h5>
              <p className="card-text mb-4 grid grid-cols-12 gap-3">
                <span className="bg-default-300 col-span-7 block h-3.25 animate-pulse cursor-wait" />
                <span className="bg-default-300 col-span-4 block h-3.25 animate-pulse cursor-wait" />
                <span className="bg-default-300 col-span-4 block h-3.25 animate-pulse cursor-wait" />
                <span className="bg-default-300 col-span-6 block h-3.25 animate-pulse cursor-wait" />
                <span className="bg-default-300 col-span-3 block h-3.25 animate-pulse cursor-wait" />
              </p>
              <div className="grid grid-cols-2">
                <a className="btn bg-primary disabled col-span-1" aria-disabled="true">
                  <span className="invisible">Read Only</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const ColorPlaceholders = () => {
  return (
    <ComponentCard title="Color" isCollapsible>
      <p className="text-default-400 mb-4">By default, the placeholder uses color. This can be overriden with a custom color or utility class.</p>
      <div className="flex flex-col gap-2">
        <span className="bg-default-400 block h-3.5 cursor-wait" />
        <span className="bg-primary/60 block h-3.5 cursor-wait" />
        <span className="bg-secondary/60 block h-3.5 cursor-wait" />
        <span className="bg-success/60 block h-3.5 cursor-wait" />
        <span className="bg-danger/60 block h-3.5 cursor-wait" />
        <span className="bg-warning/60 block h-3.5 cursor-wait" />
        <span className="bg-info/60 block h-3.5 cursor-wait" />
        <span className="bg-light/60 block h-3.5 cursor-wait" />
        <span className="bg-dark/60 block h-3.5 cursor-wait" />
      </div>
    </ComponentCard>
  )
}

const WidthPlaceholders = () => {
  return (
    <ComponentCard title="Width" isCollapsible>
      <p className="text-default-400 mb-4">You can change the width through grid column classes, width utilities, or inline styles.</p>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <span className="bg-default-400 block h-3.5 cursor-wait" />
        </div>
        <div className="col-span-9">
          <span className="bg-default-400 block h-3.5 cursor-wait" />
        </div>
        <div className="col-span-4">
          <span className="bg-default-400 block h-3.5 cursor-wait" />
        </div>
        <div className="col-span-1">
          <span className="bg-default-400 block h-3.5 cursor-wait" />
        </div>
      </div>
    </ComponentCard>
  )
}

const SizingPlaceholders = () => {
  return (
    <ComponentCard title="Sizing" isCollapsible>
      <p className="text-default-400 mb-4">The size of .placeholders are based on the typographic style of the parent element. Customize them with sizing modifiers: .placeholder-lg, .placeholder-sm, or .placeholder-xs.</p>
      <div className="flex flex-col gap-2">
        <span className="bg-default-400 block h-4 cursor-wait" />
        <span className="bg-default-400 block h-3.5 cursor-wait" />
        <span className="bg-default-400 block h-2.75 cursor-wait" />
        <span className="bg-default-400 block h-2 cursor-wait" />
      </div>
    </ComponentCard>
  )
}

const WorksPlaceholder = () => {
  return (
    <ComponentCard title="How it works" isCollapsible>
      <p className="text-default-400 mb-4">Create placeholders with the .placeholder class and a grid column class to set the width . They can replace the text inside an element or as be added as a modifier class to an existing component.</p>
      <div className="mb-4 grid grid-cols-2">
        <div className="col-span-1">
          <span className="bg-default-400 block h-3.5 cursor-wait" />
        </div>
      </div>
      <div className="grid grid-cols-3">
        <div className="col-span-1">
          <a href="" className="btn bg-primary disabled w-full" aria-hidden="true" />
        </div>
      </div>
    </ComponentCard>
  )
}

const AnimationPlaceholder = () => {
  return (
    <ComponentCard title="Animation" isCollapsible>
      <p className="text-default-400 mb-4">
        Animate placehodlers with
        <code>.animate-pulse</code>
        or
        <code>.animate-ping</code>
        to better convey the perception of something being
        <em>actively</em>
        loaded.
      </p>

      <p className="mb-4">
        <span className="bg-default-400 block h-3.5 w-full animate-pulse" />
      </p>
      <p className="relative overflow-hidden">
        <span className="bg-default-400 relative block h-3.5 w-full overflow-hidden">
          <span className="from-default-400 via-default-300 animate-ping to-default-300 absolute inset-0 bg-linear-to-r" />
        </span>
      </p>
    </ComponentCard>
  )
}
