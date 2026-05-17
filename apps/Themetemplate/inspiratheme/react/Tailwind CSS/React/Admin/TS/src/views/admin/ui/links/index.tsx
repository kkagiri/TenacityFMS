import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'


const Page = () => {
  return (
    <>
      <div className="container-fluid">
        <PageBreadcrumb title="Links" subtitle="Base UI" />

        <div className="container">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
            <ColoredLink />

            <LinkUtilities />

            <LinkOpacity />

            <LinkHoverOpacity />

            <UnderlineColor />

            <UnderlineOpacity />

            <UnderlineOffset />

            <HoverVariants />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page

const ColoredLink = () => {
  return (
    <ComponentCard title="Colored Links" isCollapsible>
      <p className="text-default-400 mb-4">
        You can apply different colors to links to match your design and highlight important actions. These links include built-in hover and focus states to improve usability and visual feedback. Lighter-colored links should be used on dark backgrounds to ensure proper contrast
        and accessibility.
      </p>
      <div className="flex flex-col gap-4">
        <p>
          <a href="" className="text-primary hover:text-primary-hover">
            Primary link
          </a>
        </p>
        <p>
          <a href="" className="text-secondary hover:text-secondary-hover">
            Secondary link
          </a>
        </p>
        <p>
          <a href="" className="text-success hover:text-success-hover">
            Success link
          </a>
        </p>
        <p>
          <a href="" className="text-danger hover:text-danger-hover">
            Danger link
          </a>
        </p>
        <p>
          <a href="" className="text-warning hover:text-warning-hover">
            Warning link
          </a>
        </p>
        <p>
          <a href="" className="text-info hover:text-info-hover">
            Info link
          </a>
        </p>
        <p>
          <a href="" className="text-light hover:text-light-hover">
            Light link
          </a>
        </p>
        <p>
          <a href="" className="text-dark hover:text-dark-hover">
            Dark link
          </a>
        </p>
        <p>
          <a href="" className="text-default-700 hover:text-default-500">
            Emphasis link
          </a>
        </p>
      </div>
    </ComponentCard>
  )
}

const LinkUtilities = () => {
  return (
    <ComponentCard title="Link Utilities" isCollapsible>
      <p className="text-default-400 mb-4">Colored link helpers have been updated to work seamlessly with our link utilities. Use these utilities to control link opacity, underline opacity, and underline offset.</p>
      <div className="flex flex-col gap-4">
        <p>
          <a href="" className="text-primary hover:text-primary-hover underline">
            Primary link
          </a>
        </p>
        <p>
          <a href="" className="text-secondary hover:text-secondary-hover underline">
            Secondary link
          </a>
        </p>
        <p>
          <a href="" className="text-success hover:text-success-hover underline">
            Success link
          </a>
        </p>
        <p>
          <a href="" className="text-danger hover:text-danger-hover underline">
            Danger link
          </a>
        </p>
        <p>
          <a href="" className="text-warning hover:text-warning-hover underline">
            Warning link
          </a>
        </p>
        <p>
          <a href="" className="text-info hover:text-info-hover underline">
            Info link
          </a>
        </p>
        <p>
          <a href="" className="text-light hover:text-light-hover underline">
            Light link
          </a>
        </p>
        <p>
          <a href="" className="text-dark hover:text-dark-hover underline">
            Dark link
          </a>
        </p>
        <p>
          <a href="" className="text-default-700 hover:text-default-500 underline">
            Emphasis link
          </a>
        </p>
      </div>
    </ComponentCard>
  )
}

const LinkOpacity = () => {
  return (
    <ComponentCard title="Link Opacity" isCollapsible>
      <p className="text-default-400 mb-4">You can adjust the transparency of link colors using utility options. Keep in mind that reducing opacity may result in links with insufficient contrast.</p>
      <div className="flex flex-col gap-4">
        <p>
          <a href="" className="text-primary hover:text-primary-hover opacity-10">
            Link opacity 10
          </a>
        </p>
        <p>
          <a href="" className="text-primary hover:text-primary-hover opacity-25">
            Link opacity 25
          </a>
        </p>
        <p>
          <a href="" className="text-primary hover:text-primary-hover opacity-50">
            Link opacity 50
          </a>
        </p>
        <p>
          <a href="" className="text-primary hover:text-primary-hover opacity-75">
            Link opacity 75
          </a>
        </p>
        <p>
          <a href="" className="text-primary hover:text-primary-hover opacity-100">
            Link opacity 100
          </a>
        </p>
      </div>
    </ComponentCard>
  )
}

const LinkHoverOpacity = () => {
  return (
    <ComponentCard title="Link Hover Opacity" isCollapsible>
      <p className="text-default-400 mb-4">You can even change the opacity level on hover.</p>
      <div className="flex flex-col gap-4">
        <p>
          <a href="" className="text-primary hover:text-primary-hover hover:opacity-10">
            Link opacity 10
          </a>
        </p>
        <p>
          <a href="" className="text-primary hover:text-primary-hover hover:opacity-25">
            Link opacity 25
          </a>
        </p>
        <p>
          <a href="" className="text-primary hover:text-primary-hover hover:opacity-50">
            Link opacity 50
          </a>
        </p>
        <p>
          <a href="" className="text-primary hover:text-primary-hover hover:opacity-75">
            Link opacity 75
          </a>
        </p>
        <p>
          <a href="" className="text-primary hover:text-primary-hover hover:opacity-100">
            Link opacity 100
          </a>
        </p>
      </div>
    </ComponentCard>
  )
}

const UnderlineColor = () => {
  return (
    <ComponentCard title="Underline Color" isCollapsible>
      <p className="text-default-400 mb-4">Change the underline’s color independent of the link text color.</p>
      <div className="flex flex-col gap-4">
        <p>
          <a href="" className="decoration-primary text-primary hover:text-primary-hover underline">
            Primary underline
          </a>
        </p>
        <p>
          <a href="" className="decoration-secondary text-primary hover:text-primary-hover underline">
            Secondary underline
          </a>
        </p>
        <p>
          <a href="" className="decoration-success text-primary hover:text-primary-hover underline">
            Success underline
          </a>
        </p>
        <p>
          <a href="" className="decoration-danger text-primary hover:text-primary-hover underline">
            Danger underline
          </a>
        </p>
        <p>
          <a href="" className="decoration-warning text-primary hover:text-primary-hover underline">
            Warning underline
          </a>
        </p>
        <p>
          <a href="" className="decoration-info text-primary hover:text-primary-hover underline">
            Info underline
          </a>
        </p>
        <p>
          <a href="" className="decoration-light text-primary hover:text-primary-hover underline">
            Light underline
          </a>
        </p>
        <p>
          <a href="" className="decoration-dark text-primary hover:text-primary-hover underline">
            Dark underline
          </a>
        </p>
      </div>
    </ComponentCard>
  )
}

const UnderlineOpacity = () => {
  return (
    <ComponentCard title="Underline Opacity" isCollapsible>
      <p className="text-default-400 mb-4">Adjust the underline’s transparency to better match your design. Make sure an underline style is applied first so the opacity changes are visible.</p>
      <div className="flex flex-col gap-4">
        <p>
          <a href="" className="decoration-primary/0 text-primary hover:text-primary-hover underline">
            Underline opacity 0
          </a>
        </p>
        <p>
          <a href="" className="decoration-primary/15 text-primary hover:text-primary-hover underline">
            Underline opacity 10
          </a>
        </p>
        <p>
          <a href="" className="decoration-primary/25 text-primary hover:text-primary-hover underline">
            Underline opacity 25
          </a>
        </p>
        <p>
          <a href="" className="decoration-primary/50 text-primary hover:text-primary-hover underline">
            Underline opacity 50
          </a>
        </p>
        <p>
          <a href="" className="decoration-primary/75 text-primary hover:text-primary-hover underline">
            Underline opacity 75
          </a>
        </p>
        <p>
          <a href="" className="decoration-primary/100 text-primary hover:text-primary-hover underline">
            Underline opacity 100
          </a>
        </p>
      </div>
    </ComponentCard>
  )
}

const UnderlineOffset = () => {
  return (
    <ComponentCard title="Underline Offset" isCollapsible>
      <p className="text-default-400 mb-4">Change the underline’s opacity to control its visual emphasis. An underline must be applied first so that opacity adjustments can take effect.</p>
      <div className="flex flex-col gap-4">
        <p>
          <a href="" className="text-primary hover:text-primary-hover">
            Default link
          </a>
        </p>
        <p>
          <a href="" className="text-primary hover:text-primary-hover underline">
            Offset 1 link
          </a>
        </p>
        <p>
          <a href="" className="text-primary hover:text-primary-hover underline">
            Offset 2 link
          </a>
        </p>
        <p>
          <a href="" className="text-primary hover:text-primary-hover underline">
            Offset 3 link
          </a>
        </p>
      </div>
    </ComponentCard>
  )
}

const HoverVariants = () => {
  return (
    <ComponentCard title="Hover Variants" isCollapsible>
      <p className="text-default-400 mb-4">These link styling options also include hover states by default. Feel free to combine different settings to create unique and expressive link styles.</p>
      <div className="flex flex-col gap-4">
        <p>
          <a href="" className="text-primary hover:text-primary-hover hover:underline">
            Underline opacity 0
          </a>
        </p>
      </div>
    </ComponentCard>
  )
}
