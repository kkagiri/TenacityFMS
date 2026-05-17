import small1 from '@/assets/images/stock/small-1.jpg'
import small3 from '@/assets/images/stock/small-3.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import PageBreadcrumb from '@/components/PageBreadcrumb'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Utilities" subtitle="Base UI" />

      <div className="container">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-base mb-base">
          <div className="card">
            <ColorAndBackground />
          </div>

          <div className="card">
            <BackgroundOpacity />
          </div>

          <div className="space-y-6">
            <div className="card">
              <TextOpacityColor />
            </div>

            <div className="card">
              <Opacity />
            </div>
          </div>
          <div className="space-y-6">
            <div className="card">
              <BorderRadius />
            </div>
          </div>
          <div className="card">
            <BorderRadiusSize />
          </div>

          <div className="card">
            <BorderRadiusSize2 />
          </div>

          <div className="card">
            <Overflow />
          </div>

          <div className="card">
            <PositionInArrange />
          </div>

          <div className="card">
            <PositionInCenter />
          </div>

          <div className="card">
            <PositionInFixed />
          </div>

          <div className="card">
            <Shadows />
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <Height />
          </div>
          <div className="card">
            <ObjectFit />
          </div>
          <div className="card">
            <ZIndex />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page

const ColorAndBackground = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Color &amp; Background</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Color and background helpers combine text and background styling into a single utility. A suitable contrasting text color is automatically chosen to ensure good readability.</p>
        <div className="flex flex-col gap-y-2">
          <div className="bg-primary p-3 text-white">Primary with contrasting color(.bg-primary)</div>
          <div className="bg-secondary p-3 text-white">Secondary with contrasting color (.bg-secondary)</div>
          <div className="bg-success p-3 text-white">Success with contrasting color (.bg-success)</div>
          <div className="bg-danger p-3 text-white">Danger with contrasting color (.bg-danger)</div>
          <div className="bg-warning p-3 text-white">Warning with contrasting color (.bg-warning)</div>
          <div className="bg-info p-3 text-white">Info with contrasting color (.bg-info)</div>
          <div className="bg-default-200 text-default-700 p-3">Light with contrasting color (.bg-light)</div>
          <div className="bg-dark p-3 text-white">Dark with contrasting color (.bg-dark)</div>
        </div>
      </div>
    </>
  )
}

const BackgroundOpacity = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Background Opacity</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Background color utilities are built using variables, allowing colors to update in real time without recompiling and enabling flexible transparency adjustments.</p>
        <div className="flex flex-col">
          <div className="bg-primary p-3 text-white">This is default primary background</div>
          <div className="bg-primary/75 p-3 text-white">This is 75% opacity primary background</div>
          <div className="bg-primary/50 text-default-700 p-3">This is 50% opacity primary background</div>
          <div className="bg-primary/25 text-default-700 p-3">This is 25% opacity primary background</div>
          <div className="bg-primary/15 text-default-700 p-3">This is 10% opacity success background</div>
          <div className="bg-dark mt-7.5 p-3 text-white">This is default primary background</div>
          <div className="bg-dark/75 p-3 text-white">This is 75% opacity primary background</div>
          <div className="bg-dark/50 text-default-700 p-3">This is 50% opacity primary background</div>
          <div className="bg-dark/25 text-default-700 p-3">This is 25% opacity primary background</div>
          <div className="bg-dark/15 text-default-700 p-3">This is 10% opacity success background</div>
        </div>
      </div>
    </>
  )
}

const TextOpacityColor = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Text Opacity Color</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Text color utilities use variables to support real-time color updates without recompiling, while allowing flexible transparency control.</p>
        <div className="text-primary">This is default primary text</div>
        <div className="text-primary/75">This is 75% opacity primary text</div>
        <div className="text-primary/50">This is 50% opacity primary text</div>
        <div className="text-primary/25">This is 25% opacity primary text</div>
      </div>
    </>
  )
}

const Opacity = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Opacity</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Opacity controls how transparent an element appears. Higher values make the element more visible, while lower values increase transparency. You can adjust opacity to achieve the desired visual effect.</p>
        <div className="flex items-center gap-x-3">
          <div className="btn bg-primary p-3 font-bold text-white">100%</div>
          <div className="btn bg-primary opacity-75 p-3 font-bold text-white">75%</div>
          <div className="btn bg-primary opacity-50 p-3 font-bold text-white">50%</div>
          <div className="btn bg-primary opacity-25 p-3 font-bold text-white">25%</div>
        </div>
      </div>
    </>
  )
}

const BorderRadius = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Border Radius</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Add classes to an element to easily round its corners.</p>
        <div className="flex flex-wrap items-center gap-3">
          <img src={user2} className="size-11 rounded-md" alt="rounded" />
          <img src={user2} className="size-11 rounded-t-md" alt="rounded" />
          <img src={user2} className="size-11 rounded-e-md" alt="rounded" />
          <img src={user2} className="size-11 rounded-b-md" alt="rounded" />
          <img src={user2} className="size-11 rounded-s-md" alt="rounded" />
          <img src={user2} className="size-11 rounded-full" alt="rounded" />
          <img src={small3} className="w-20 rounded-4xl" alt="rounded-full" />
        </div>
      </div>
    </>
  )
}

const BorderRadiusSize = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Border Radius Size</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Adjust the size of rounded corners to make them appear smaller or larger, depending on your design needs.</p>
        <div className="flex flex-wrap items-center gap-3">
          <img src={user4} className="size-11" alt="rounded" />
          <img src={user4} className="size-11 rounded" alt="rounded" />
          <img src={user4} className="size-11 rounded-md" alt="rounded" />
          <img src={user4} className="size-11 rounded-lg" alt="rounded" />
          <img src={user4} className="size-11 rounded-2xl" alt="rounded" />
          <img src={user4} className="size-11 rounded-full" alt="rounded" />
        </div>
      </div>
    </>
  )
}

const BorderRadiusSize2 = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Border Radius Size</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Control how content can be selected when users interact with it, allowing selection to be enabled, disabled, or handled automatically.</p>
        <p className="mb-4 select-all">This paragraph will be entirely selected when clicked by the user.</p>
        <p className="mb-4 select-auto">This paragraph has default select behavior.</p>
        <p className="select-none">This paragraph will not be selectable when clicked by the user.</p>
      </div>
    </>
  )
}

const Overflow = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Overflow</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">
          Adjust the
          <code>overflow</code>
          property on the fly with four default values and classes. These classes are not responsive by default.
        </p>
        <div className="grid grid-cols-4 items-center gap-7.5">
          <div className="bg-default-100 h-25 overflow-y-auto p-5">
            <p>
              This is an example of using
              <code>.overflow-auto</code>
              on an element with set width and height dimensions. By design, this content will vertically scroll.
            </p>
          </div>
          <div className="bg-default-100 h-25 overflow-hidden p-5">
            <p>
              This is an example of using
              <code>.overflow-hidden</code>
              on an element with set width and height dimensions.
            </p>
          </div>
          <div className="bg-default-100 h-25 overflow-visible p-5">
            <p>
              This is an example of using
              <code>.overflow-visible</code>
              on an element with set width and height add more text dimensions Inspinia admin dashboard template.
            </p>
          </div>
          <div className="bg-default-100 h-25 overflow-scroll p-5">
            <p>
              This is an example of using
              <code>.overflow-scroll</code>
              on an element with set width and height dimensions.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

const PositionInArrange = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Position in Arrange</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400">Easily position elements relative to their container using simple edge-based positioning utilities.</p>
        <div className="border-default-300 bg-default-100 relative m-5 rounded-md border p-20">
          <div className="bg-dark absolute start-0 top-0 size-6 rounded" />
          <div className="bg-dark absolute end-0 top-0 size-6 rounded" />
          <div className="bg-dark absolute end-0 bottom-0 size-6 rounded" />
          <div className="bg-dark absolute start-0 bottom-0 size-6 rounded" />
          <div className="bg-dark absolute start-1/2 top-1/2 size-6 rounded" />
          <div className="bg-dark absolute end-1/2 bottom-1/2 size-6 rounded" />
        </div>
      </div>
    </>
  )
}

const PositionInCenter = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Position in Center</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400">You can also center elements easily by using transform-based positioning for precise alignment.</p>
        <div className="border-default-300 bg-default-100 relative m-5 rounded-md border p-20">
          <div className="bg-dark absolute start-0 top-0 size-6 -translate-x-1/2 -translate-y-1/2 rounded" />
          <div className="bg-dark absolute start-1/2 top-0 size-6 -translate-x-1/2 -translate-y-1/2 rounded" />
          <div className="bg-dark absolute start-full top-0 size-6 -translate-x-1/2 -translate-y-1/2 rounded" />
          <div className="bg-dark absolute start-0 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded" />
          <div className="bg-dark absolute start-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded" />
          <div className="bg-dark absolute start-full top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded" />
          <div className="bg-dark absolute start-0 top-full size-6 -translate-x-1/2 -translate-y-1/2 rounded" />
          <div className="bg-dark absolute start-1/2 top-full size-6 -translate-x-1/2 -translate-y-1/2 rounded" />
          <div className="bg-dark absolute start-full top-full size-6 -translate-x-1/2 -translate-y-1/2 rounded" />
        </div>
      </div>
    </>
  )
}

const PositionInFixed = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Position in Axis</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400">Elements can also be centered along only the horizontal or vertical axis for more precise positioning control.</p>
        <div className="border-default-300 bg-default-100 relative m-5 rounded-md border p-20">
          <div className="bg-dark absolute start-0 top-0 size-6 rounded" />
          <div className="bg-dark absolute start-1/2 top-0 size-6 -translate-x-1/2 rounded" />
          <div className="bg-dark absolute end-0 top-0 size-6 rounded" />
          <div className="bg-dark absolute start-0 top-1/2 size-6 -translate-y-1/2 rounded" />
          <div className="bg-dark absolute start-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded" />
          <div className="bg-dark absolute end-0 top-1/2 size-6 -translate-y-1/2 rounded" />
          <div className="bg-dark absolute start-0 bottom-0 size-6 rounded" />
          <div className="bg-dark absolute start-1/2 bottom-0 size-6 -translate-x-1/2 rounded" />
          <div className="bg-dark absolute end-0 bottom-0 size-6 rounded" />
        </div>
      </div>
    </>
  )
}

const Shadows = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Shadows</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Shadows are disabled by default but can be easily added or removed using utility options. Multiple shadow sizes are available to suit different design and layout requirements.</p>
        <div className="flex flex-col gap-y-3">
          <div className="bg-default-100 rounded p-3">No shadow</div>
          <div className="rounded p-3 shadow-sm">Small shadow</div>
          <div className="rounded p-3 shadow">Regular shadow</div>
          <div className="rounded p-3 shadow-lg">Larger shadow</div>
        </div>
      </div>
    </>
  )
}

const Height = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Height</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Height utility classes in Tailwind CSS provide quick control over element height using predefined values such as 25%, 50%, 75%, 100%, and auto. These utilities make it easy to build consistent and responsive layouts.</p>
        <div className="flex flex-col gap-y-2">
          <div className="flex flex-wrap gap-6 items-start h-63.75">
            <div className="h-1/4 p-3 bg-light">Height25%</div>
            <div className="h-1/2 p-3 bg-light">Height50%</div>
            <div className="h-3/4 p-3 bg-light">Height75%</div>
            <div className="h-full p-3 bg-light">Height100%</div>
            <div className="h-auto p-3 bg-light">Height auto</div>
          </div>
        </div>
      </div>
    </>
  )
}

const ObjectFit = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Object Fit</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Object-fit utilities allow you to control how media elements like images and videos resize within their containers. You can preserve the aspect ratio, fill the container, or stretch the content based on your layout needs.</p>
        <div className="flex items-start flex-wrap gap-6 text-center">
          <div>
            <img src={small1} className="object-contain border border-default-200 rounded size-12 mx-auto" alt="..." />
            <p className="mt-1 mb-0">
              <code className="user-select-all">.object-contain</code>
            </p>
          </div>
          <div>
            <img src={small1} className="object-cover border border-default-200 rounded size-12 mx-auto" alt="..." />
            <p className="mt-1 mb-0">
              <code className="user-select-all">.object-cover</code>
            </p>
          </div>
          <div>
            <img src={small1} className="object-fill border border-default-200 rounded size-12 mx-auto" alt="..." />
            <p className="mt-1 mb-0">
              <code className="user-select-all">.object-fill</code>
            </p>
          </div>
          <div>
            <img src={small1} className="object-scale-down border border-default-200 rounded size-12 mx-auto" alt="..." />
            <p className="mt-1 mb-0">
              <code className="user-select-all">.object-scale-down</code>
            </p>
          </div>
          <div>
            <img src={small1} className="object-none border border-default-200 rounded size-12 mx-auto" alt="..." />
            <p className="mt-1 mb-0">
              <code className="user-select-all">.object-none</code>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

const ZIndex = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Z-index</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Use z-index utilities to control the stacking order of elements. These utilities work when an element has a non-static position, such as relative, absolute, or fixed.</p>
        <div className="relative h-55 z-10 opacity-10">
          <div className="z-30 absolute p-18 rounded-xl bg-primary" />
          <div className="z-20 absolute p-18 m-3 rounded-xl bg-success" />
          <div className="z-10 absolute p-18 m-6 rounded-xl bg-secondary" />
          <div className="z-0 absolute p-18 m-9 rounded-xl bg-danger" />
          <div className="-z-10 absolute p-18 m-18 rounded-xl bg-info" />
        </div>
      </div>
    </>
  )
}
