import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Accordions" subtitle="UI" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <DefaultAccordions />

          <FlushAccordions />

          <AlwaysOpenAccordions />

          <WithoutArrowAccordion />

          <BorderedAccordions />

          <CustomIconAccordion />
        </div>
      </div>
    </>
  )
}

export default Page

const DefaultAccordions = () => {
  return (
    <ComponentCard title="Default Accordions" isCollapsible>
      <div className="hs-accordion-group divide-default-200 border-default-300 divide-y rounded border overflow-hidden">
        <div className="hs-accordion active" id="headingOne">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="collapseOne">
            Accordion Item #1
            <Icon icon="chevron-down" className="hs-accordion-active:rotate-180 transition-transform size-4" />
          </button>
          <div id="collapseOne" className="hs-accordion-content border-default-300 w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="headingOne">
            <div className="px-5 py-4">
              <strong>This is the first item&apos;s accordion body.</strong>&nbsp; It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via
              CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body, though the transition does limit overflow.
            </div>
          </div>
        </div>
        <div className="hs-accordion" id="headingTwo">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="collapseTwo">
            Accordion Item #2
            <Icon icon="chevron-down" className="hs-accordion-active:rotate-180 transition-transform size-4" />
          </button>
          <div id="collapseTwo" className="hs-accordion-content border-default-300 hidden w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="headingTwo">
            <div className="px-5 py-4">
              <strong>This is the second item&apos;s accordion body.</strong>&nbsp; It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding
              via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body, though the transition does limit overflow.
            </div>
          </div>
        </div>
        <div className="hs-accordion" id="headingThree">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="collapseThree">
            Accordion Item #3
            <Icon icon="chevron-down" className="hs-accordion-active:rotate-180 transition-transform size-4" />
          </button>
          <div id="collapseThree" className="hs-accordion-content border-default-300 hidden w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="headingThree">
            <div className="px-5 py-4">
              <strong>This is the third item&apos;s accordion body.</strong>&nbsp; It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding
              via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body, though the transition does limit overflow.
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const FlushAccordions = () => {
  return (
    <ComponentCard title="Flush Accordions" isCollapsible>
      <div className="hs-accordion-group rounded">
        <div className="hs-accordion active border-default-300 border-b" id="flush-headingOne">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="flush-collapseOne">
            Accordion Item #1
            <Icon icon="chevron-down" className="hs-accordion-active:rotate-180 transition-transform size-4" />
          </button>
          <div id="flush-collapseOne" className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300" role="region" aria-labelledby="flush-headingOne">
            <div className="px-5 py-4">
              <p>
                Placeholder content for this accordion, which is intended to demonstrate the <code>.accordion flush</code> class. This is the first item&apos;s accordion body.
              </p>
            </div>
          </div>
        </div>
        <div className="hs-accordion border-default-300 border-b" id="flush-headingTwo">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="flush-collapseTwo">
            Accordion Item #2
            <Icon icon="chevron-down" className="hs-accordion-active:rotate-180 transition-transform size-4" />
          </button>
          <div id="flush-collapseTwo" className="hs-accordion-content hidden w-full overflow-hidden transition-[height] duration-300" role="region" aria-labelledby="flush-headingTwo">
            <div className="px-5 py-4">Placeholder content for this accordion, which is intended to demonstrate the accordion flush. This is the second item&apos;s accordion body. Let&apos;s imagine this being filled with some actual content.</div>
          </div>
        </div>
        <div className="hs-accordion" id="flush-headingThree">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="flush-collapseThree">
            Accordion Item #3
            <Icon icon="chevron-down" className="hs-accordion-active:rotate-180 transition-transform size-4" />
          </button>
          <div id="flush-collapseThree" className="hs-accordion-content hidden w-full overflow-hidden transition-[height] duration-300" role="region" aria-labelledby="flush-headingThree">
            <div className="px-5 py-4">
              Placeholder content for this accordion, which is intended to demonstrate the accordion flush. This is the third item&apos;s accordion body. Nothing more exciting happening here in terms of content, but just filling up the space to make it look, at least at first
              glance, a bit more representative of how this would look in a real-world application.
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const AlwaysOpenAccordions = () => {
  return (
    <ComponentCard title="Always Open Accordions" isCollapsible>
      <div className="divide-default-200 border-default-300 divide-y rounded border">
        <div className="hs-accordion active" id="panelsStayOpen-headingOne">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="panelsStayOpen-collapseOne">
            Accordion Item #1
            <Icon icon="chevron-down" className="hs-accordion-active:rotate-180 transition-transform size-4" />
          </button>
          <div id="panelsStayOpen-collapseOne" className="hs-accordion-content border-default-300 w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="panelsStayOpen-headingOne">
            <div className="px-5 py-4">
              <strong>This is the first item&apos;s accordion body.</strong>&nbsp; It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via
              CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body, though the transition does limit overflow.
            </div>
          </div>
        </div>
        <div className="hs-accordion" id="panelsStayOpen-headingTwo">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="panelsStayOpen-collapseTwo">
            Accordion Item #2
            <Icon icon="chevron-down" className="hs-accordion-active:rotate-180 transition-transform size-4" />
          </button>
          <div id="panelsStayOpen-collapseTwo" className="hs-accordion-content border-default-300 hidden w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="panelsStayOpen-headingTwo">
            <div className="px-5 py-4">
              <strong>This is the second item&apos;s accordion body.</strong>&nbsp; It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding
              via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body, though the transition does limit overflow.
            </div>
          </div>
        </div>
        <div className="hs-accordion" id="panelsStayOpen-headingThree">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="panelsStayOpen-collapseThree">
            Accordion Item #3
            <Icon icon="chevron-down" className="hs-accordion-active:rotate-180 transition-transform size-4" />
          </button>
          <div id="panelsStayOpen-collapseThree" className="hs-accordion-content border-default-300 hidden w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="panelsStayOpen-headingThree">
            <div className="px-5 py-4">
              <strong>This is the third item&apos;s accordion body.</strong>&nbsp; It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding
              via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body, though the transition does limit overflow.
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const WithoutArrowAccordion = () => {
  return (
    <ComponentCard title="Accordion Without Arrow" isCollapsible>
      <div className="hs-accordion-group divide-default-200 border-default-300 divide-y rounded border overflow-hidden">
        <div className="hs-accordion active" id="withoutarrowheadingOne">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="withoutarrowcollapseOne">
            Accordion Item #1
          </button>
          <div id="withoutarrowcollapseOne" className="hs-accordion-content border-default-300 w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="withoutarrowheadingOne">
            <div className="px-5 py-4">
              <strong>This is the first item&apos;s accordion body.</strong>&nbsp; It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via
              CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body, though the transition does limit overflow.
            </div>
          </div>
        </div>
        <div className="hs-accordion" id="withoutarrowheadingTwo">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="withoutarrowcollapseTwo">
            Accordion Item #2
          </button>
          <div id="withoutarrowcollapseTwo" className="hs-accordion-content border-default-300 hidden w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="withoutarrowheadingTwo">
            <div className="px-5 py-4">
              <strong>This is the second item&apos;s accordion body.</strong>&nbsp; It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding
              via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body, though the transition does limit overflow.
            </div>
          </div>
        </div>
        <div className="hs-accordion" id="withoutarrowheadingThree">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="withoutarrowcollapseThree">
            Accordion Item #3
          </button>
          <div id="withoutarrowcollapseThree" className="hs-accordion-content border-default-300 hidden w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="withoutarrowheadingThree">
            <div className="px-5 py-4">
              <strong>This is the third item&apos;s accordion body.</strong>&nbsp; It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding
              via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body, though the transition does limit overflow.
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const BorderedAccordions = () => {
  return (
    <ComponentCard title="Bordered Accordions" isCollapsible>
      <div className="hs-accordion-group">
        <div className="hs-accordion active border border-default-300 rounded" id="BorderedheadingOne">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="BorderedcollapseOne">
            Accordion Item #1
            <Icon icon="chevron-down" className="hs-accordion-active:rotate-180 transition-transform size-4" />
          </button>
          <div id="BorderedcollapseOne" className="hs-accordion-content border-default-300 w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="BorderedheadingOne">
            <div className="px-5 py-4">
              <strong>This is the first item&apos;s accordion body.</strong>&nbsp; It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via
              CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body, though the transition does limit overflow.
            </div>
          </div>
        </div>
        <div className="hs-accordion border border-default-300 mt-2 rounded" id="BorderedheadingTwo">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="BorderedcollapseTwo">
            Accordion Item #2
            <Icon icon="chevron-down" className="hs-accordion-active:rotate-180 transition-transform size-4" />
          </button>
          <div id="BorderedcollapseTwo" className="hs-accordion-content border-default-300 hidden w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="BorderedheadingTwo">
            <div className="px-5 py-4">
              <strong>This is the second item&apos;s accordion body.</strong>&nbsp; It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding
              via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body, though the transition does limit overflow.
            </div>
          </div>
        </div>
        <div className="hs-accordion border border-default-300 mt-2 rounded" id="BorderedheadingThree">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="BorderedcollapseThree">
            Accordion Item #3
            <Icon icon="chevron-down" className="hs-accordion-active:rotate-180 transition-transform size-4" />
          </button>
          <div id="BorderedcollapseThree" className="hs-accordion-content border-default-300 hidden w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="BorderedheadingThree">
            <div className="px-5 py-4">
              <strong>This is the third item&apos;s accordion body.</strong>&nbsp; It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding
              via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body, though the transition does limit overflow.
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const CustomIconAccordion = () => {
  return (
    <ComponentCard title="Custom Icon Accordion" isCollapsible>
      <div className="hs-accordion-group divide-default-300 border-default-300 divide-y rounded border overflow-hidden">
        <div className="hs-accordion active" id="CustomIconheadingOne">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="CustomIconcollapseOne">
            Accordion item with custom icons
            <Icon icon="plus" className="hs-accordion-active:hidden text-base"></Icon>
            <Icon icon="minus" className="hs-accordion-active:flex hidden text-base"></Icon>
          </button>

          <div id="CustomIconcollapseOne" className="hs-accordion-content border-default-300 w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="CustomIconheadingOne">
            <div className="px-5 py-4">
              <strong>This is the first item&apos;s accordion body.</strong>&nbsp; It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via
              CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body , though the transition does limit overflow.
            </div>
          </div>
        </div>

        <div className="hs-accordion" id="CustomIconheadingTwo">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="CustomIconcollapseTwo">
            Accordion item with custom icons
            <Icon icon="plus" className="hs-accordion-active:hidden text-base"></Icon>
            <Icon icon="minus" className="hs-accordion-active:flex hidden text-base"></Icon>
          </button>

          <div id="CustomIconcollapseTwo" className="hs-accordion-content border-default-300 hidden w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="CustomIconheadingTwo">
            <div className="px-5 py-4">
              <strong>This is the second item&apos;s accordion body.</strong>&nbsp; It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding
              via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body , though the transition does limit overflow.
            </div>
          </div>
        </div>

        <div className="hs-accordion" id="CustomIconheadingThree">
          <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" aria-expanded="true" aria-controls="CustomIconcollapseThree">
            Accordion item with custom icons
            <Icon icon="plus" className="hs-accordion-active:hidden text-base"></Icon>
            <Icon icon="minus" className="hs-accordion-active:flex hidden text-base"></Icon>
          </button>

          <div id="CustomIconcollapseThree" className="hs-accordion-content border-default-300 hidden w-full overflow-hidden border-t transition-[height] duration-300" role="region" aria-labelledby="CustomIconheadingThree">
            <div className="px-5 py-4">
              <strong>This is the third item&apos;s accordion body.</strong>&nbsp; It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding
              via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It&apos;s also worth noting that just about any HTML can go within the accordion body , though the transition does limit overflow.
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}
