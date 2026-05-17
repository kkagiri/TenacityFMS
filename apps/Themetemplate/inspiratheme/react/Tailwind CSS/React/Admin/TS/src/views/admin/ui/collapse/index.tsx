import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Collapse" subtitle="Base UI" />

      <div className="container">
        <div className="grid xl:grid-cols-2 gap-base">
          <ComponentCard title="Collapse" isCollapsible>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button className="hs-collapse-toggle btn bg-primary hover:bg-primary-hover text-white open" data-hs-collapse="#collapseExample">
                Collapse Button
              </button>
            </div>
            <div id="collapseExample" className="hs-collapse open w-full overflow-hidden shadow transition-[height] duration-300" aria-labelledby="collapseLink">
              <div className="card border border-dashed border-light card-body">Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident.</div>
            </div>
          </ComponentCard>
          <ComponentCard title="Show/Hide Collapse" isCollapsible>
            <p>This admin UI kit provides a collection of ready-to-use dashboard and interface components built with the utility-first Tailwind CSS framework.</p>
            <div id="show-hide-collapse-heading" className="hs-collapse hidden w-full overflow-hidden transition-[height] duration-300" aria-labelledby="show-hide-collapse">
              <p className="mt-2">
                These components are designed specifically for admin panels, dashboards, and internal tools. The collapsible content supports smooth transitions and can be used to organize advanced settings or additional information without cluttering the interface.
              </p>
            </div>
            <p className="mt-2">
              <button
                type="button"
                className="hs-collapse-toggle inline-flex items-center gap-x-1 text-sm font-semibold rounded-lg border border-transparent text-primary decoration-2 hover:primary-hover hover:underline focus:outline-hidden focus:underline focus:primary-hover"
                id="show-hide-collapse"
                aria-expanded="false"
                aria-controls="show-hide-collapse-heading"
                data-hs-collapse="#show-hide-collapse-heading"
              >
                <span className="hs-collapse-open:hidden">Read more</span>
                <span className="hs-collapse-open:block hidden">Read less</span>
                <Icon icon="chevron-up" className="hs-collapse-open:rotate-180 shrink-0 text-base" />
              </button>
            </p>
          </ComponentCard>
        </div>
      </div>
    </>
  )
}

export default Page
