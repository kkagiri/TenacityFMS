import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Buttons" subtitle="Base UI" />

      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <DefaultButton />

          <RoundedButton />

          <OutlineButton />

          <OutlineButtonRounded />

          <SoftButton />

          <SoftRoundedButton />

          <GhostButton />

          <GhostRoundedButton />

          <GradientButton />

          <div className="col-span-1">
            <GradientRoundedButton />
          </div>
          <div className="col-span-1">
            <ButtonSizes />
          </div>

          <DisabledButtons />

          <div className="col-span-1">
            <BlockButton />
          </div>

          <IconButtons />

          <ButtonTags />

          <div className="col-span-1">
            <ButtonGroup />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page

const DefaultButton = () => {
  return (
    <ComponentCard title="Default Buttons" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the
        <code>&nbsp;.btn&nbsp;</code>
        class on
        <code>&nbsp;&lt;a&gt;&nbsp;</code>,<code>&lt;button&gt;</code>, or
        <code>&nbsp;&lt;input&gt;&nbsp;</code>
        elements to quickly create a styled button.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn border-default-300">
          Default
        </button>
        <button type="button" className="btn bg-primary hover:bg-primary-hover text-white">
          Primary
        </button>
        <button type="button" className="btn bg-secondary hover:bg-secondary-hover text-white">
          Secondary
        </button>
        <button type="button" className="btn bg-success hover:bg-success-hover text-white">
          Success
        </button>
        <button type="button" className="btn bg-danger hover:bg-danger-hover text-white">
          Danger
        </button>
        <button type="button" className="btn bg-warning hover:bg-warning-hover text-white">
          Warning
        </button>
        <button type="button" className="btn bg-info hover:bg-info-hover text-white">
          Info
        </button>
        <button type="button" className="btn bg-light text-dark hover:bg-light-hover">
          Light
        </button>
        <button type="button" className="btn bg-dark hover:bg-dark-hover text-white">
          Dark
        </button>
      </div>
    </ComponentCard>
  )
}

const RoundedButton = () => {
  return (
    <ComponentCard title="Button Rounded" isCollapsible>
      <p className="text-default-400 mb-4">
        Add
        <code>.rounded-full&nbsp;</code>
        to buttons to give them smooth, pill-shaped corners.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn border-default-300 rounded-full">
          Default
        </button>
        <button type="button" className="btn bg-primary hover:bg-primary-hover rounded-full text-white">
          Primary
        </button>
        <button type="button" className="btn bg-secondary hover:bg-secondary-hover rounded-full text-white">
          Secondary
        </button>
        <button type="button" className="btn bg-success hover:bg-success-hover rounded-full text-white">
          Success
        </button>
        <button type="button" className="btn bg-danger hover:bg-danger-hover rounded-full text-white">
          Danger
        </button>
        <button type="button" className="btn bg-warning hover:bg-warning-hover rounded-full text-white">
          Warning
        </button>
        <button type="button" className="btn bg-info hover:bg-info-hover rounded-full text-white">
          Info
        </button>
        <button type="button" className="btn bg-light text-dark hover:bg-light-hover rounded-full">
          Light
        </button>
        <button type="button" className="btn bg-dark hover:bg-dark-hover rounded-full text-white">
          Dark
        </button>
      </div>
    </ComponentCard>
  )
}

const OutlineButton = () => {
  return (
    <ComponentCard title="Button Outline" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the
        <code>.border-*</code>
        classes to create buttons with colored borders.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn border-primary text-primary hover:bg-primary hover:text-white">
          Primary
        </button>
        <button type="button" className="btn border-secondary text-secondary hover:bg-secondary hover:text-white">
          Secondary
        </button>
        <button type="button" className="btn border-success text-success hover:bg-success hover:text-white">
          Success
        </button>
        <button type="button" className="btn border-danger text-danger hover:bg-danger hover:text-white">
          Danger
        </button>
        <button type="button" className="btn border-warning text-warning hover:bg-warning hover:text-white">
          Warning
        </button>
        <button type="button" className="btn border-info text-info hover:bg-info hover:text-white">
          Info
        </button>
        <button type="button" className="btn border-light text-dark hover:bg-light hover:text-dark">
          Light
        </button>
        <button type="button" className="btn border-dark text-dark hover:bg-dark hover:text-white">
          Dark
        </button>
      </div>
    </ComponentCard>
  )
}

const OutlineButtonRounded = () => {
  return (
    <ComponentCard title="Button Outline Rounded" isCollapsible>
      <p className="text-default-400 mb-4">
        Apply
        <code>.rounded-full&nbsp;</code>
        to outline buttons to give them smooth, pill-shaped corners.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn border-primary text-primary hover:bg-primary rounded-full hover:text-white">
          Primary
        </button>
        <button type="button" className="btn border-secondary text-secondary hover:bg-secondary rounded-full hover:text-white">
          Secondary
        </button>
        <button type="button" className="btn border-success text-success hover:bg-success rounded-full hover:text-white">
          Success
        </button>
        <button type="button" className="btn border-danger text-danger hover:bg-danger rounded-full hover:text-white">
          Danger
        </button>
        <button type="button" className="btn border-warning text-warning hover:bg-warning rounded-full hover:text-white">
          Warning
        </button>
        <button type="button" className="btn border-info text-info hover:bg-info rounded-full hover:text-white">
          Info
        </button>
        <button type="button" className="btn border-light text-dark hover:bg-light hover:text-dark rounded-full">
          Light
        </button>
        <button type="button" className="btn border-dark text-dark hover:bg-dark rounded-full hover:text-white">
          Dark
        </button>
      </div>
    </ComponentCard>
  )
}

const SoftButton = () => {
  return (
    <ComponentCard title="Soft Buttons" isCollapsible>
      <p className="text-default-400 mb-4">
        Use the
        <code>.bg-*/15&nbsp;</code>
        classes to create buttons with soft, tinted background colors.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn text-primary bg-primary/15 hover:bg-primary hover:text-white">
          Primary
        </button>
        <button type="button" className="btn text-secondary bg-secondary/15 hover:bg-secondary hover:text-white">
          Secondary
        </button>
        <button type="button" className="btn text-success bg-success/15 hover:bg-success hover:text-white">
          Success
        </button>
        <button type="button" className="btn text-danger bg-danger/15 hover:bg-danger hover:text-white">
          Danger
        </button>
        <button type="button" className="btn text-warning bg-warning/15 hover:bg-warning hover:text-white">
          Warning
        </button>
        <button type="button" className="btn text-info bg-info/15 hover:bg-info hover:text-white">
          Info
        </button>
        <button type="button" className="btn text-dark bg-dark/15 hover:bg-dark hover:text-white">
          Dark
        </button>
      </div>
    </ComponentCard>
  )
}

const SoftRoundedButton = () => {
  return (
    <ComponentCard title="Soft Rounded Buttons" isCollapsible>
      <p className="text-default-400 mb-4">
        Combine
        <code>.bg-*/15&nbsp;</code>
        with
        <code>.rounded-full&nbsp;</code>
        to create soft, pill-shaped buttons.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn text-primary bg-primary/15 hover:bg-primary rounded-full hover:text-white">
          Primary
        </button>
        <button type="button" className="btn text-secondary bg-secondary/15 hover:bg-secondary rounded-full hover:text-white">
          Secondary
        </button>
        <button type="button" className="btn text-success bg-success/15 hover:bg-success rounded-full hover:text-white">
          Success
        </button>
        <button type="button" className="btn text-danger bg-danger/15 hover:bg-danger rounded-full hover:text-white">
          Danger
        </button>
        <button type="button" className="btn text-warning bg-warning/15 hover:bg-warning rounded-full hover:text-white">
          Warning
        </button>
        <button type="button" className="btn text-info bg-info/15 hover:bg-info rounded-full hover:text-white">
          Info
        </button>
        <button type="button" className="btn text-dark bg-dark/15 hover:bg-dark rounded-full hover:text-white">
          Dark
        </button>
      </div>
    </ComponentCard>
  )
}

const GhostButton = () => {
  return (
    <ComponentCard title="Ghost Buttons" isCollapsible>
      <p className="text-default-400 mb-4">Use ghost-style buttons to keep the background transparent and highlight the color on hover.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn text-primary hover:bg-primary rounded hover:text-white">
          Primary
        </button>
        <button type="button" className="btn text-secondary hover:bg-secondary rounded hover:text-white">
          Secondary
        </button>
        <button type="button" className="btn text-success hover:bg-success rounded hover:text-white">
          Success
        </button>
        <button type="button" className="btn text-danger hover:bg-danger rounded hover:text-white">
          Danger
        </button>
        <button type="button" className="btn text-warning hover:bg-warning rounded hover:text-white">
          Warning
        </button>
        <button type="button" className="btn text-info hover:bg-info rounded hover:text-white">
          Info
        </button>
        <button type="button" className="btn text-dark hover:bg-dark rounded hover:text-white">
          Dark
        </button>
      </div>
    </ComponentCard>
  )
}

const GhostRoundedButton = () => {
  return (
    <ComponentCard title="Ghost Rounded Buttons" isCollapsible>
      <p className="text-default-400 mb-4">
        Combine ghost-style buttons with
        <code>.rounded-full&nbsp;</code>
        to create rounded, transparent buttons that highlight on hover.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn text-primary hover:bg-primary rounded-full hover:text-white">
          Primary
        </button>
        <button type="button" className="btn text-secondary hover:bg-secondary rounded-full hover:text-white">
          Secondary
        </button>
        <button type="button" className="btn text-success hover:bg-success rounded-full hover:text-white">
          Success
        </button>
        <button type="button" className="btn text-danger hover:bg-danger rounded-full hover:text-white">
          Danger
        </button>
        <button type="button" className="btn text-warning hover:bg-warning rounded-full hover:text-white">
          Warning
        </button>
        <button type="button" className="btn text-info hover:bg-info rounded-full hover:text-white">
          Info
        </button>
        <button type="button" className="btn text-dark hover:bg-dark rounded-full hover:text-white">
          Dark
        </button>
      </div>
    </ComponentCard>
  )
}

const GradientButton = () => {
  return (
    <ComponentCard title="Gradient Buttons" isCollapsible>
      <p className="text-default-400 mb-4">Use gradient utility classes to apply smooth color transitions and create stylish gradient buttons.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn border-0 bg-linear-to-br from-purple-600 to-blue-500 text-white hover:bg-linear-to-bl">
          Purple to Blue
        </button>
        <button type="button" className="btn border-0 bg-linear-to-r from-cyan-500 to-blue-500 text-white hover:bg-linear-to-bl">
          Cyan to Blue
        </button>
        <button type="button" className="btn border-0 bg-linear-to-br from-green-400 to-blue-600 text-white hover:bg-linear-to-bl">
          Green to Blue
        </button>
        <button type="button" className="btn border-0 bg-linear-to-r from-purple-500 to-pink-500 text-white hover:bg-linear-to-l">
          Purple to Pink
        </button>
        <button type="button" className="btn border-0 bg-linear-to-br from-pink-500 to-orange-400 text-white hover:bg-linear-to-bl">
          Pink to Orange
        </button>
        <button type="button" className="btn border-0 bg-linear-to-r from-teal-200 to-lime-200 text-gray-900 hover:bg-linear-to-l">
          Teal to Lime
        </button>
        <button type="button" className="btn border-0 bg-linear-to-r from-red-200 via-red-300 to-yellow-200 text-gray-900 hover:bg-linear-to-bl">
          Red to Yellow
        </button>
      </div>
    </ComponentCard>
  )
}

const GradientRoundedButton = () => {
  return (
    <ComponentCard title="Gradient Rounded Buttons" isCollapsible>
      <p className="text-default-400 mb-4">
        Combine gradient utilities with
        <code>.rounded-full&nbsp;</code>
        to create smooth, pill-shaped buttons with blended color transitions.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn rounded-full border-0 bg-linear-to-br from-purple-600 to-blue-500 text-white hover:bg-linear-to-bl">
          Purple to Blue
        </button>
        <button type="button" className="btn rounded-full border-0 bg-linear-to-r from-cyan-500 to-blue-500 text-white hover:bg-linear-to-bl">
          Cyan to Blue
        </button>
        <button type="button" className="btn rounded-full border-0 bg-linear-to-br from-green-400 to-blue-600 text-white hover:bg-linear-to-bl">
          Green to Blue
        </button>
        <button type="button" className="btn rounded-full border-0 bg-linear-to-r from-purple-500 to-pink-500 text-white hover:bg-linear-to-l">
          Purple to Pink
        </button>
        <button type="button" className="btn rounded-full border-0 bg-linear-to-br from-pink-500 to-orange-400 text-white hover:bg-linear-to-bl">
          Pink to Orange
        </button>
        <button type="button" className="btn rounded-full border-0 bg-linear-to-r from-teal-200 to-lime-200 text-gray-900 hover:bg-linear-to-l">
          Teal to Lime
        </button>
        <button type="button" className="btn rounded-full border-0 bg-linear-to-r from-red-200 via-red-300 to-yellow-200 text-gray-900 hover:bg-linear-to-bl">
          Red to Yellow
        </button>
      </div>
    </ComponentCard>
  )
}

const ButtonSizes = () => {
  return (
    <ComponentCard title="Button Sizes" isCollapsible>
      <p className="text-default-400 mb-4">
        Use
        <code>&nbsp;.btn-lg&nbsp;</code>
        or
        <code>&nbsp;.btn-sm&nbsp;</code>
        to quickly create larger or smaller button sizes.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-lg bg-primary hover:bg-primary-hover text-white">
          Large
        </button>
        <button type="button" className="btn bg-info hover:bg-info-hover text-white">
          Normal
        </button>
        <button type="button" className="btn btn-sm bg-success hover:bg-success-hover text-white">
          Small
        </button>
      </div>
    </ComponentCard>
  )
}

const DisabledButtons = () => {
  return (
    <ComponentCard title="Disabled Buttons" isCollapsible>
      <p className="text-default-400 mb-4">
        Add the
        <code>&nbsp;disabled&nbsp;</code>
        attribute to a<code>&nbsp;&lt;button&gt;&nbsp;</code>
        to prevent user interaction and visually indicate an inactive state.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn bg-info rounded text-white" disabled>
          Info
        </button>
        <button type="button" className="btn bg-danger rounded text-white" disabled>
          Danger
        </button>
        <button type="button" className="btn bg-dark rounded text-white" disabled>
          Dark
        </button>
      </div>
    </ComponentCard>
  )
}

const BlockButton = () => {
  return (
    <ComponentCard title="Block Button" isCollapsible>
      <p className="text-default-400 mb-4">
        Add the
        <code>.w-full&nbsp;</code>
        class to make buttons span the full width of their container.
      </p>
      <div className="space-y-3">
        <button type="button" className="btn bg-primary hover:bg-primary-hover w-full text-white">
          Block Button
        </button>
        <button type="button" className="btn btn-lg bg-success hover:bg-success-hover w-full text-white">
          Block Button
        </button>
      </div>
    </ComponentCard>
  )
}

const IconButtons = () => {
  return (
    <ComponentCard title="Icon Buttons" isCollapsible>
      <p className="text-default-400 mb-4">Icon buttons let you create compact controls using only an icon, or pair an icon with text for more clarity in toolbars and action areas.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-icon bg-primary hover:bg-primary-hover text-white">
          <Icon icon="star" className="size-4.5" />
        </button>
        <button type="button" className="btn btn-icon bg-secondary hover:bg-secondary-hover text-white">
          <Icon icon="leaf" className="size-4.5" />
        </button>
        <button type="button" className="btn btn-icon bg-warning hover:bg-warning-hover text-white">
          <Icon icon="settings" className="size-4.5" />
        </button>
        <button type="button" className="btn btn-icon bg-info/15 text-info hover:bg-info hover:text-white">
          <Icon icon="bell" className="size-4.5" />
        </button>
        <button type="button" className="btn btn-icon bg-secondary hover:bg-secondary-hover text-white">
          <Icon icon="rocket" className="size-4.5" />
        </button>
        <button type="button" className="btn btn-icon border-dark text-dark hover:bg-dark rounded-full border hover:text-white">
          <Icon icon="plane" className="size-4.5" />
        </button>
        <button type="button" className="btn btn-icon bg-secondary/15 text-secondary hover:bg-secondary hover:text-white">
          <Icon icon="microphone" className="size-4.5" />
        </button>
        <button type="button" className="btn bg-light/60 hover:text-primary">
          <Icon icon="hand-stop" className="size-4.5" />
          Stop
        </button>
        <button type="button" className="btn bg-dark text-white">
          <Icon icon="bolt" className="size-4.5" />
          Boost
        </button>
        <button type="button" className="btn border-info text-info hover:bg-info border hover:text-white">
          <Icon icon="credit-card" className="size-4" />
          Payment
        </button>
        <button type="button" className="btn bg-danger hover:bg-danger-hover text-white">
          <Icon icon="tools" className="size-4" />
          Tools
        </button>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn border-secondary text-secondary hover:bg-secondary size-7.5 border hover:text-white">
          <Icon icon="star" className="size-3" />
        </button>
        <button type="button" className="btn bg-primary hover:bg-primary-hover size-7.5 text-white">
          <Icon icon="leaf" className="size-3" />
        </button>
        <button type="button" className="btn bg-success hover:bg-success-hover size-7.5 rounded-full text-white">
          <Icon icon="settings" className="size-3" />
        </button>
        <button type="button" className="btn border-secondary text-secondary hover:bg-secondary size-11.25 border hover:text-white">
          <Icon icon="bell" className="size-5" />
        </button>
        <button type="button" className="btn bg-primary hover:bg-primary-hover size-11.25 rounded-full text-white">
          <Icon icon="rocket" className="size-5" />
        </button>
        <button type="button" className="btn bg-success hover:bg-success-hover size-11.25 rounded-full text-white">
          <Icon icon="share" className="size-5" />
        </button>
        <button type="button" className="btn bg-info hover:bg-info-hover size-11.25 text-white">
          <Icon icon="star" className="size-5" />
        </button>
        <button type="button" className="btn bg-warning hover:bg-warning-hover size-11.25 text-white">
          <Icon icon="alert-octagon" className="size-5" />
        </button>
      </div>
    </ComponentCard>
  )
}

const ButtonTags = () => {
  return (
    <ComponentCard title="Button Tags" isCollapsible>
      <p className="text-default-400 mb-4">
        The
        <code>&nbsp;.btn&nbsp;</code>
        class works with
        <code>&nbsp;&lt;button&gt;&nbsp;</code>,<code>&nbsp;&lt;a&gt;&nbsp;</code>, and
        <code>&nbsp;&lt;input&gt;&nbsp;</code>
        elements, though their appearance may vary slightly by browser.
      </p>
      <div className="flex flex-wrap gap-3">
        <a href="" className="btn bg-primary hover:bg-primary-hover rounded text-white">
          Link
        </a>
        <button type="submit" className="btn bg-primary hover:bg-primary-hover rounded text-white">
          Button
        </button>
        <input type="button" className="btn bg-primary! hover:bg-primary-hover! rounded text-white" value="Input" />
        <input type="submit" className="btn bg-primary! hover:bg-primary-hover! rounded text-white" value="Submit" />
        <input type="reset" className="btn bg-primary! hover:bg-primary-hover! rounded text-white" value="Reset" />
      </div>
    </ComponentCard>
  )
}

const ButtonGroup = () => {
  return (
    <ComponentCard title="Button Group" isCollapsible>
      <p className="text-default-400 mb-4">
        Use
        <code>&nbsp;inline-flex&nbsp;</code>
        to group buttons inside a single container, allowing them to align neatly side by side or stack vertically with consistent spacing.
      </p>
      <div className="mb-3 inline-flex">
        <button type="button" className="btn bg-light hover:text-primary rounded-e-none">
          Left
        </button>
        <button type="button" className="btn bg-light hover:text-primary rounded-none">
          Middle
        </button>
        <button type="button" className="btn bg-light hover:text-primary rounded-s-none">
          Right
        </button>
      </div>
      <br />
      <div className="mb-3 inline-flex">
        <button type="button" className="btn bg-light hover:text-primary rounded-e-none">
          1
        </button>
        <button type="button" className="btn bg-light hover:text-primary rounded-none">
          2
        </button>
        <button type="button" className="btn bg-light hover:text-primary rounded-none">
          3
        </button>
        <button type="button" className="btn bg-light hover:text-primary rounded-s-none">
          4
        </button>
      </div>
      &nbsp;
      <div className="mb-3 inline-flex">
        <button type="button" className="btn bg-light hover:text-primary rounded-e-none">
          5
        </button>
        <button type="button" className="btn bg-light hover:text-primary rounded-none">
          6
        </button>
        <button type="button" className="btn bg-light hover:text-primary rounded-s-none">
          7
        </button>
      </div>
      &nbsp;
      <div className="mb-3 inline-flex">
        <button type="button" className="btn bg-light hover:text-primary">
          8
        </button>
      </div>
      <br />
      <div className="mb-3 inline-flex">
        <button type="button" className="btn bg-light hover:text-primary rounded-e-none">
          1
        </button>
        <button type="button" className="btn bg-primary hover:bg-primary-hover rounded-none text-white">
          2
        </button>
        <button type="button" className="btn bg-light hover:text-primary rounded-none">
          3
        </button>
        <div className="hs-dropdown relative inline-flex">
          <button type="button" className="btn bg-light hover:text-primary rounded-s-none" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
            Dropdown
            <Icon icon="chevron-down" />
          </button>
          <div className="hs-dropdown-menu" role="menu">
            <a className="dropdown-item" href="">
              Dropdown link
            </a>
            <a className="dropdown-item" href="">
              Dropdown link
            </a>
          </div>
        </div>
      </div>
      <br />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-base">
        <div>
          <div className="inline-flex flex-col">
            <button type="button" className="btn bg-light hover:text-primary rounded-b-none">
              Top
            </button>
            <button type="button" className="btn bg-light hover:text-primary rounded-none">
              Middle
            </button>
            <button type="button" className="btn bg-light hover:text-primary rounded-t-none">
              Bottom
            </button>
          </div>
        </div>
        <div>
          <div className="inline-flex flex-col">
            <button type="button" className="btn bg-light hover:text-primary rounded-b-none">
              Button 1
            </button>
            <button type="button" className="btn bg-light hover:text-primary rounded-none">
              Button 2
            </button>
            <div className="hs-dropdown relative inline-flex">
              <button type="button" className="btn bg-light hover:text-primary rounded-t-none" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                Button 3
                <Icon icon="chevron-down" />
              </button>
              <div className="hs-dropdown-menu" role="menu">
                <a className="dropdown-item" href="">
                  Dropdown link
                </a>
                <a className="dropdown-item" href="">
                  Dropdown link
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}
