import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Offcanvas" subtitle="Base UI" />

      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <DefaultOffcanvas />

          <OffcanvasBackdrop />

          <OffcanvasPlacement />

          <DarkOffcanvas />
        </div>
      </div>
    </>
  )
}

export default Page

const DefaultOffcanvas = () => {
  return (
    <ComponentCard title="Offcanvas" isCollapsible>
      <p className="text-default-400 mb-4">The Offcanvas (Drawer) component provides a hidden sidebar for menus, carts, and more - enhancing UI and saving space.</p>
      <button data-hs-overlay="#offcanvasExample" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="offcanvasExample">
        Open (Left) Offcanvas
      </button>
      <div
        id="offcanvasExample"
        className="hs-overlay hs-overlay-open:translate-x-0 bg-card border-default-300 fixed start-0 top-0 z-80 hidden h-full w-full max-w-sm -translate-x-full transform border-e transition-all duration-300"
        role="dialog"
        tabIndex={-1}
        aria-labelledby="offcanvasExampleLabel"
      >
        <div className="flex items-center justify-between p-5">
          <h3 id="offcanvasExampleLabel">Offcanvas</h3>
          <button type="button" aria-label="Close" data-hs-overlay="#offcanvasExample">
            <span className="sr-only">Close</span>
            <Icon icon="x" className="size-5" />
          </button>
        </div>
        <div className="p-5">
          <div>Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.</div>
          <h5 className="mt-5 mb-2">List</h5>
          <ul className="mb-4 list-disc ps-5">
            <li>Nemo enim ipsam voluptatem quia aspernatur</li>
            <li>Neque porro quisquam est, qui dolorem</li>
            <li>Quis autem vel eum iure qui in ea</li>
          </ul>
          <ul className="mb-4 list-disc ps-5">
            <li>At vero eos et accusamus et iusto odio dignissimos</li>
            <li>Et harum quidem rerum facilis</li>
            <li>Temporibus autem quibusdam et aut officiis</li>
          </ul>
        </div>
      </div>
    </ComponentCard>
  )
}

const OffcanvasBackdrop = () => {
  return (
    <ComponentCard title="Offcanvas Backdrop" isCollapsible>
      <p className="text-default-400 mb-4">
        Scrolling the
        <code>&lt;body&gt;</code>
        element is disabled when an offcanvas and its backdrop are visible. Use the
        <code>[--body-scroll:true]</code>
        attribute to toggle
        <code>&lt;body&gt;</code>
        scrolling and
        <code>[--overlay-backdrop:false]</code>
        to toggle the backdrop.
      </p>
      <div className="flex flex-wrap gap-3">
        <div>
          <button type="button" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="offcanvasScrolling" data-hs-overlay="#offcanvasScrolling">
            Enable body scrolling
          </button>
          <div
            id="offcanvasScrolling"
            className="hs-overlay hs-overlay-open:translate-x-0 bg-card border-default-300 fixed start-0 top-0 z-80 hidden h-full w-full max-w-sm -translate-x-full transform border-e transition-all duration-300 [--body-scroll:true] [--overlay-backdrop:false]"
            role="dialog"
            tabIndex={-1}
            aria-labelledby="offcanvasScrollingLabel"
          >
            <div className="flex items-center justify-between p-5">
              <h3 id="offcanvasScrollingLabel">Colored with scrolling</h3>
              <button type="button" aria-label="Close" data-hs-overlay="#offcanvasScrolling">
                <span className="sr-only">Close</span>
                <Icon icon="x" className="size-5" />
              </button>
            </div>
            <div className="p-5">
              <div>Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.</div>
              <h5 className="mt-5 mb-2">List</h5>
              <ul className="mb-4 list-disc ps-5">
                <li>Nemo enim ipsam voluptatem quia aspernatur</li>
                <li>Neque porro quisquam est, qui dolorem</li>
                <li>Quis autem vel eum iure qui in ea</li>
              </ul>
              <ul className="mb-4 list-disc ps-5">
                <li>At vero eos et accusamus et iusto odio dignissimos</li>
                <li>Et harum quidem rerum facilis</li>
                <li>Temporibus autem quibusdam et aut officiis</li>
              </ul>
            </div>
          </div>
        </div>
        <div>
          <button className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="offcanvasWithBackdrop" data-hs-overlay="#offcanvasWithBackdrop">
            Enable backdrop (default)
          </button>
          <div
            id="offcanvasWithBackdrop"
            className="hs-overlay hs-overlay-open:translate-x-0 bg-card border-default-300 fixed start-0 top-0 z-80 hidden h-full w-full max-w-sm -translate-x-full transform border-e transition-all duration-300"
            role="dialog"
            tabIndex={-1}
            aria-labelledby="offcanvasWithBackdropLabel"
          >
            <div className="flex items-center justify-between p-5">
              <h3 id="offcanvasWithBackdropLabel">Offcanvas with backdrop</h3>
              <button type="button" aria-label="Close" data-hs-overlay="#offcanvasWithBackdrop">
                <span className="sr-only">Close</span>
                <Icon icon="x" className="size-5" />
              </button>
            </div>
            <div className="p-5">
              <div>Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.</div>
              <h5 className="mt-5 mb-2">List</h5>
              <ul className="mb-4 list-disc ps-5">
                <li>Nemo enim ipsam voluptatem quia aspernatur</li>
                <li>Neque porro quisquam est, qui dolorem</li>
                <li>Quis autem vel eum iure qui in ea</li>
              </ul>
              <ul className="mb-4 list-disc ps-5">
                <li>At vero eos et accusamus et iusto odio dignissimos</li>
                <li>Et harum quidem rerum facilis</li>
                <li>Temporibus autem quibusdam et aut officiis</li>
              </ul>
            </div>
          </div>
        </div>
        <div>
          <button type="button" className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="offcanvasWithBothOptions" data-hs-overlay="#offcanvasWithBothOptions">
            Enable both scrolling &amp; backdrop
          </button>
          <div
            id="offcanvasWithBothOptions"
            className="hs-overlay hs-overlay-open:translate-x-0 bg-card border-default-300 fixed start-0 top-0 z-80 hidden h-full w-full max-w-sm -translate-x-full transform border-e transition-all duration-300 [--body-scroll:true]"
            role="dialog"
            tabIndex={-1}
            aria-labelledby="offcanvasWithBothOptionsLabel"
          >
            <div className="flex items-center justify-between p-5">
              <h3 id="offcanvasWithBothOptionsLabel">Backdroped with scrolling</h3>
              <button type="button" aria-label="Close" data-hs-overlay="#offcanvasWithBothOptions">
                <span className="sr-only">Close</span>
                <Icon icon="x" className="size-5" />
              </button>
            </div>
            <div className="p-5">
              <div>Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.</div>
              <h5 className="mt-5 mb-2">List</h5>
              <ul className="mb-4 list-disc ps-5">
                <li>Nemo enim ipsam voluptatem quia aspernatur</li>
                <li>Neque porro quisquam est, qui dolorem</li>
                <li>Quis autem vel eum iure qui in ea</li>
              </ul>
              <ul className="mb-4 list-disc ps-5">
                <li>At vero eos et accusamus et iusto odio dignissimos</li>
                <li>Et harum quidem rerum facilis</li>
                <li>Temporibus autem quibusdam et aut officiis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const OffcanvasPlacement = () => {
  return (
    <ComponentCard title="Offcanvas Placement" isCollapsible>
      <p className="text-default-400 mb-4">Try the top, right, and bottom examples out below.</p>
      <div className="flex flex-wrap gap-3">
        <div>
          <button className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="offcanvasTop" data-hs-overlay="#offcanvasTop">
            Toggle Top offcanvas
          </button>
          <div
            id="offcanvasTop"
            className="hs-overlay hs-overlay-open:translate-y-0 bg-card border-default-300 fixed inset-x-0 top-0 z-80 hidden size-full max-h-60 -translate-y-full transform border-b transition-all duration-300"
            role="dialog"
            tabIndex={-1}
            aria-labelledby="offcanvasTopLabel"
          >
            <div className="flex items-center justify-between p-5">
              <h3 id="offcanvasTopLabel">Offcanvas Top</h3>
              <button type="button" aria-label="Close" data-hs-overlay="#offcanvasTop">
                <span className="sr-only">Close</span>
                <Icon icon="x" className="text-xl" />
              </button>
            </div>
            <div className="p-5">
              <div>Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.</div>
              <h5 className="mt-5 mb-2">List</h5>
              <ul className="mb-4 list-disc ps-5">
                <li>Nemo enim ipsam voluptatem quia aspernatur</li>
                <li>Neque porro quisquam est, qui dolorem</li>
                <li>Quis autem vel eum iure qui in ea</li>
              </ul>
            </div>
          </div>
        </div>
        <div>
          <button className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="offcanvasRight" data-hs-overlay="#offcanvasRight">
            Toggle right offcanvas
          </button>
          <div
            id="offcanvasRight"
            className="hs-overlay hs-overlay-open:translate-x-0 bg-card border-default-300 fixed end-0 top-0 z-80 hidden h-full w-full max-w-sm translate-x-full transform border-s transition-all duration-300"
            role="dialog"
            tabIndex={-1}
            aria-labelledby="offcanvasRightLabel"
          >
            <div className="flex items-center justify-between p-5">
              <h3 id="offcanvasRightLabel">Offcanvas right</h3>
              <button type="button" aria-label="Close" data-hs-overlay="#offcanvasRight">
                <span className="sr-only">Close</span>
                <Icon icon="x" className="size-5" />
              </button>
            </div>
            <div className="p-5">
              <div>Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.</div>
              <h5 className="mt-5 mb-2">List</h5>
              <ul className="mb-4 list-disc ps-5">
                <li>Nemo enim ipsam voluptatem quia aspernatur</li>
                <li>Neque porro quisquam est, qui dolorem</li>
                <li>Quis autem vel eum iure qui in ea</li>
              </ul>
            </div>
          </div>
        </div>
        <div>
          <button className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="offcanvasBottom" data-hs-overlay="#offcanvasBottom">
            Toggle bottom offcanvas
          </button>
          <div
            id="offcanvasBottom"
            className="hs-overlay hs-overlay-open:translate-y-0 bg-card border-default-300 fixed inset-x-0 bottom-0 z-80 hidden size-full max-h-60 translate-y-full transform border-t transition-all duration-300"
            role="dialog"
            tabIndex={-1}
            aria-labelledby="offcanvasBottomLabel"
          >
            <div className="flex items-center justify-between p-5">
              <h3 id="offcanvasBottomLabel">Offcanvas bottom</h3>
              <button type="button" aria-label="Close" data-hs-overlay="#offcanvasBottom">
                <span className="sr-only">Close</span>
                <Icon icon="x" className="size-5" />
              </button>
            </div>
            <div className="p-5">
              <div>Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.</div>
              <h5 className="mt-5 mb-2">List</h5>
              <ul className="mb-4 list-disc ps-5">
                <li>Nemo enim ipsam voluptatem quia aspernatur</li>
                <li>Neque porro quisquam est, qui dolorem</li>
                <li>Quis autem vel eum iure qui in ea</li>
              </ul>
            </div>
          </div>
        </div>
        <div>
          <button className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="offcanvasLeft" data-hs-overlay="#offcanvasLeft">
            Toggle left offcanvas
          </button>
          <div
            id="offcanvasLeft"
            className="hs-overlay hs-overlay-open:translate-x-0 bg-card border-default-300 fixed start-0 top-0 z-80 hidden h-full w-full max-w-sm -translate-x-full transform border-s transition-all duration-300"
            role="dialog"
            tabIndex={-1}
            aria-labelledby="offcanvasLeftLabel"
          >
            <div className="flex items-center justify-between p-5">
              <h3 id="offcanvasLeftLabel">Offcanvas left</h3>
              <button type="button" aria-label="Close" data-hs-overlay="#offcanvasLeft">
                <span className="sr-only">Close</span>
                <Icon icon="x" className="size-5" />
              </button>
            </div>
            <div className="p-5">
              <div>Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.</div>
              <h5 className="mt-5 mb-2">List</h5>
              <ul className="mb-4 list-disc ps-5">
                <li>Nemo enim ipsam voluptatem quia aspernatur</li>
                <li>Neque porro quisquam est, qui dolorem</li>
                <li>Quis autem vel eum iure qui in ea</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const DarkOffcanvas = () => {
  return (
    <ComponentCard title="Dark Offcanvas" isCollapsible>
      <p className="text-default-400 mb-4">
        Customize the look of offcanvases using utility classes to suit different themes, such as dark navbars. Add
        <code>.dark</code>
        or
        <code>data-theme="dark"</code>
        in offcanvas components for dark styling.
      </p>
      <div className="flex flex-wrap gap-3">
        <div>
          <button className="btn bg-primary hover:bg-primary-hover rounded text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="offcanvasDark" data-hs-overlay="#offcanvasDark">
            Dark offcanvas
          </button>
          <div
            id="offcanvasDark"
            className="dark hs-overlay hs-overlay-open:translate-x-0 bg-card border-default-300 fixed start-0 top-0 z-80 hidden h-full w-full max-w-sm -translate-x-full transform border-s transition-all duration-300"
            role="dialog"
            tabIndex={-1}
            aria-labelledby="offcanvasDarkLabel"
          >
            <div className="text-default-700 flex items-center justify-between p-5">
              <h3 id="offcanvasDarkLabel">Dark Offcanvas</h3>
              <button type="button" aria-label="Close" data-hs-overlay="#offcanvasDark">
                <span className="sr-only">Close</span>
                <Icon icon="x" className="size-5" />
              </button>
            </div>
            <div className="text-default-900 p-5">
              <div>Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.</div>
              <h5 className="mt-5 mb-2">List</h5>
              <ul className="mb-4 list-disc ps-5">
                <li>Nemo enim ipsam voluptatem quia aspernatur</li>
                <li>Neque porro quisquam est, qui dolorem</li>
                <li>Quis autem vel eum iure qui in ea</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}
