import small1 from '@/assets/images/stock/small-1.jpg'
import small10 from '@/assets/images/stock/small-10.jpg'
import small2 from '@/assets/images/stock/small-2.jpg'
import small3 from '@/assets/images/stock/small-3.jpg'
import small4 from '@/assets/images/stock/small-4.jpg'
import small8 from '@/assets/images/stock/small-8.jpg'
import small9 from '@/assets/images/stock/small-9.jpg'
import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Carousel" subtitle="Base UI" />

      <div className="container">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <SlidesOnly />

          <WithControls />

          <WithIndicators />

          <WithCaptions />

          <IndividualInterval />

          <DarkVariant />
        </div>
      </div>
    </>
  )
}

export default Page

const SlidesOnly = () => {
  return (
    <ComponentCard title="Slides Only" isCollapsible>
      <div
        data-hs-carousel='{
                              "loadingClasses": "opacity-0",
                              "dotsItemClasses": "size-3 rounded-full cursor-pointer",
                              "isAutoPlay": true
                              }'
        className="relative"
      >
        <div className="hs-carousel relative min-h-94 w-full overflow-hidden">
          <div className="hs-carousel-body absolute start-0 top-0 bottom-0 flex flex-nowrap opacity-0 transition-transform duration-700">
            <div className="hs-carousel-slide">
              <img src={small1} alt="First slide" />
            </div>
            <div className="hs-carousel-slide">
              <img src={small2} alt="Second slide" />
            </div>
            <div className="hs-carousel-slide">
              <img src={small3} alt="Third slide" />
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}

const WithControls = () => {
  return (
    <ComponentCard title="With Controls" isCollapsible>
      <div
        data-hs-carousel='{
                              "loadingClasses": "opacity-0",
                              "dotsItemClasses": "size-3 rounded-full cursor-pointer",
                              "isAutoPlay": true   
                              }'
        className="relative"
      >
        <div className="hs-carousel relative min-h-94 w-full overflow-hidden">
          <div className="hs-carousel-body absolute start-0 top-0 bottom-0 flex flex-nowrap opacity-0 transition-transform duration-700">
            <div className="hs-carousel-slide">
              <img src={small4} alt="First slide" />
            </div>
            <div className="hs-carousel-slide">
              <img src={small1} alt="Second slide" />
            </div>
            <div className="hs-carousel-slide">
              <img src={small2} alt="Third slide" />
            </div>
          </div>
        </div>
        <button type="button" className="hs-carousel-prev hs-carousel-disabled:opacity-50 hs-carousel-disabled:pointer-events-none absolute inset-y-0 start-5 inline-flex items-center justify-center">
          <Icon icon="chevron-left" className="size-8 text-white" />
          <span className="sr-only">Previous</span>
        </button>
        <button type="button" className="hs-carousel-next hs-carousel-disabled:opacity-50 hs-carousel-disabled:pointer-events-none absolute inset-y-0 end-5 inline-flex items-center justify-center">
          <Icon icon="chevron-right" className="size-8 text-white" />
          <span className="sr-only">Next</span>
        </button>
      </div>
    </ComponentCard>
  )
}

const WithIndicators = () => {
  return (
    <ComponentCard title="With Indicators" isCollapsible>
      <div
        data-hs-carousel='{
                              "loadingClasses": "opacity-0",
                              "dotsItemClasses": "hs-carousel-active:bg-white bg-white/50 w-7.5 h-0.75 cursor-pointer",
                              "isAutoPlay": true
                              }'
        className="relative"
      >
        <div className="hs-carousel relative min-h-94 w-full overflow-hidden bg-white">
          <div className="hs-carousel-body absolute start-0 top-0 bottom-0 flex flex-nowrap opacity-0 transition-transform duration-700">
            <div className="hs-carousel-slide">
              <img src={small3} alt="First slide" />
            </div>
            <div className="hs-carousel-slide">
              <img src={small2} alt="Second slide" />
            </div>
            <div className="hs-carousel-slide">
              <img src={small1} alt="Third slide" />
            </div>
          </div>
        </div>
        <button type="button" className="hs-carousel-prev hs-carousel-disabled:opacity-50 hs-carousel-disabled:pointer-events-none absolute inset-y-0 start-5 inline-flex items-center justify-center">
          <Icon icon="chevron-left" className="size-8 text-white" />
          <span className="sr-only">Previous</span>
        </button>
        <button type="button" className="hs-carousel-next hs-carousel-disabled:opacity-50 hs-carousel-disabled:pointer-events-none absolute inset-y-0 end-5 inline-flex items-center justify-center">
          <Icon icon="chevron-right" className="size-8 text-white" />
          <span className="sr-only">Next</span>
        </button>
        <div className="hs-carousel-pagination absolute start-0 end-0 bottom-3 flex justify-center gap-x-2" />
      </div>
    </ComponentCard>
  )
}

const WithCaptions = () => {
  return (
    <ComponentCard title="With Captions" isCollapsible>
      <div
        data-hs-carousel='{
                              "loadingClasses": "opacity-0",
                              "dotsItemClasses": "size-3 rounded-full cursor-pointer",
                              "isAutoPlay": true
                              }'
        className="relative"
      >
        <div className="hs-carousel relative min-h-94 w-full overflow-hidden">
          <div className="hs-carousel-body absolute start-0 top-0 bottom-0 flex flex-nowrap opacity-0 transition-transform duration-700">
            <div className="hs-carousel-slide relative">
              <img src={small1} alt="First slide" />
              <div className="absolute bottom-0 w-full pt-4 pb-4">
                <h3 className="mb-2 text-center text-2xl font-semibold text-white">First slide label</h3>
                <p className="mb-4 text-center text-white">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </div>
            </div>
            <div className="hs-carousel-slide relative">
              <img src={small3} alt="Second slide" />
              <div className="absolute bottom-0 w-full pt-4 pb-4">
                <h3 className="mb-2 text-center text-2xl text-white">Second slide label</h3>
                <p className="mb-4 text-center text-white">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </div>
            </div>
            <div className="hs-carousel-slide relative">
              <img src={small2} alt="Third slide" />
              <div className="absolute bottom-0 w-full pt-4 pb-4">
                <h3 className="mb-2 text-center text-2xl text-white">Third slide label</h3>
                <p className="mb-4 text-center text-white">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </div>
            </div>
          </div>
        </div>
        <button type="button" className="hs-carousel-prev hs-carousel-disabled:opacity-50 hs-carousel-disabled:pointer-events-none absolute inset-y-0 start-5 inline-flex items-center justify-center">
          <Icon icon="chevron-left" className="size-8 text-white" />
          <span className="sr-only">Previous</span>
        </button>
        <button type="button" className="hs-carousel-next hs-carousel-disabled:opacity-50 hs-carousel-disabled:pointer-events-none absolute inset-y-0 end-5 inline-flex items-center justify-center">
          <Icon icon="chevron-right" className="size-8 text-white" />
          <span className="sr-only">Next</span>
        </button>
      </div>
    </ComponentCard>
  )
}

const IndividualInterval = () => {
  return (
    <ComponentCard title="Individual Interval" isCollapsible>
      <div
        data-hs-carousel='{
                              "loadingClasses": "opacity-0",
                              "dotsItemClasses": "rounded-full cursor-pointer",
                              "isAutoPlay": true
                              }'
        className="relative"
      >
        <div className="hs-carousel relative min-h-94 w-full overflow-hidden bg-white">
          <div className="hs-carousel-body absolute start-0 top-0 bottom-0 flex flex-nowrap opacity-0 transition-transform duration-700">
            <div className="hs-carousel-slide">
              <img src={small4} alt="First slide" />
            </div>
            <div className="hs-carousel-slide">
              <img src={small2} alt="Second slide" />
            </div>
            <div className="hs-carousel-slide">
              <img src={small1} alt="Third slide" />
            </div>
          </div>
        </div>
        <button type="button" className="hs-carousel-prev hs-carousel-disabled:opacity-50 hs-carousel-disabled:pointer-events-none absolute inset-y-0 start-5 inline-flex items-center justify-center">
          <Icon icon="chevron-left" className="size-8 text-white" />
          <span className="sr-only">Previous</span>
        </button>
        <button type="button" className="hs-carousel-next hs-carousel-disabled:opacity-50 hs-carousel-disabled:pointer-events-none absolute inset-y-0 end-5 inline-flex items-center justify-center">
          <Icon icon="chevron-right" className="size-8 text-white" />
          <span className="sr-only">Next</span>
        </button>
      </div>
    </ComponentCard>
  )
}

const DarkVariant = () => {
  return (
    <ComponentCard title="Dark Variant" isCollapsible>
      <div
        data-hs-carousel='{
                              "loadingClasses": "opacity-0",
                              "dotsItemClasses": "hs-carousel-active:bg-dark bg-dark/50 w-7.5 h-0.75 cursor-pointer",
                              "isAutoPlay": true
                              }'
        className="relative"
      >
        <div className="hs-carousel relative min-h-94 w-full overflow-hidden">
          <div className="hs-carousel-body absolute start-0 top-0 bottom-0 flex flex-nowrap opacity-0 transition-transform duration-700">
            <div className="hs-carousel-slide relative">
              <img src={small8} alt="First slide" />
              <div className="text-dark absolute bottom-0 w-full pt-4 pb-4">
                <h3 className="text-dark mb-2 text-center text-[17px] font-bold">First slide label</h3>
                <p className="mb-4 text-center">Some representative placeholder content for the first slide.</p>
              </div>
            </div>
            <div className="hs-carousel-slide relative">
              <img src={small9} alt="Second slide" />
              <div className="absolute bottom-0 w-full pt-4 pb-4">
                <h3 className="text-dark mb-2 text-center text-[17px] font-bold">Second slide label</h3>
                <p className="text-dark mb-4 text-center">Some representative placeholder content for the second slide.</p>
              </div>
            </div>
            <div className="hs-carousel-slide relative">
              <img src={small10} alt="Third slide" />
              <div className="absolute bottom-0 w-full pt-4 pb-4">
                <h3 className="text-dark mb-2 text-center text-[17px] font-bold">Third slide label</h3>
                <p className="text-dark mb-4 text-center">Some representative placeholder content for the third slide.</p>
              </div>
            </div>
          </div>
        </div>
        <button type="button" className="hs-carousel-prev hs-carousel-disabled:opacity-50 hs-carousel-disabled:pointer-events-none absolute inset-y-0 start-5 inline-flex items-center justify-center">
          <Icon icon="chevron-left" className="size-8" />
          <span className="sr-only">Previous</span>
        </button>
        <button type="button" className="hs-carousel-next hs-carousel-disabled:opacity-50 hs-carousel-disabled:pointer-events-none absolute inset-y-0 end-5 inline-flex items-center justify-center">
          <Icon icon="chevron-right" className="size-8" />
          <span className="sr-only">Next</span>
        </button>
        <div className="hs-carousel-pagination absolute start-0 end-0 bottom-3 flex justify-center gap-x-2" />
      </div>
    </ComponentCard>
  )
}
