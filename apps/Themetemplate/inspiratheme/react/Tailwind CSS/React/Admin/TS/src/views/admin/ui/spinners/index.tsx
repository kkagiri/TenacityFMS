import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Spinners" subtitle="Base UI" />

      <div className="container">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="space-y-base">
            <BorderSpinner />

            <Colors />

            <Alignment />

            <ButtonsSpinner />
          </div>
          <div className="space-y-base">
            <GrowingSpinner />

            <ColorGrowingSpinner />

            <Size />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page

const BorderSpinner = () => {
  return (
    <ComponentCard title="Border Spinner" isCollapsible>
      <p className="text-default-400 mb-4">Use border spinners as lightweight loading indicators.</p>
      <div className="border-dark inline-block size-8 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading">
        <span className="sr-only">Loading...</span>
      </div>
    </ComponentCard>
  )
}

const Colors = () => {
  return (
    <ComponentCard title="Colors" isCollapsible>
      <p className="text-default-400 mb-4">
        These spinners use border color utilities like
        <code>.border-primary</code>,<code>.border-success</code>, or
        <code>.border-danger</code>
        to display different color variations. Each spinner’s top border is transparent to create a smooth rotating effect.
      </p>
      <div className="flex gap-base flex-wrap items-center">
        <div className="border-primary inline-block size-8 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
        <div className="border-secondary inline-block size-8 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
        <div className="border-success inline-block size-8 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
        <div className="border-danger inline-block size-8 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
        <div className="border-warning inline-block size-8 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
        <div className="border-info inline-block size-8 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
        <div className="border-light inline-block size-8 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
        <div className="border-dark inline-block size-8 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    </ComponentCard>
  )
}

const Alignment = () => {
  return (
    <ComponentCard title="Alignment" isCollapsible>
      <p className="text-default-400 mb-4">
        These spinners use simple utility classes like
        <code>animate-spin</code>,<code>border-dark</code>, and
        <code>border-t-transparent</code>
        to create a rotating loading indicator. The
        <code>rounded-full</code>
        class keeps the spinner perfectly circular and neatly aligned.
      </p>
      <div className="flex gap-base flex-wrap items-center">
        <strong>Loading...</strong>
        <div className="border-dark ms-auto inline-block size-8 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading" />
      </div>
      <div className="mt-5 flex items-center justify-center gap-base">
        <div className="border-dark inline-block size-8 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading" />
      </div>
    </ComponentCard>
  )
}

const ButtonsSpinner = () => {
  return (
    <ComponentCard title="Buttons Spinner" isCollapsible>
      <div className="grid md:grid-cols-2 gap-base">
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-icon bg-primary">
            <div className="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" role="status" aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </button>
          <button className="btn btn-icon bg-primary rounded-full">
            <div className="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" role="status" aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </button>
          <button className="btn bg-primary">
            <div className="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" role="status" aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </button>
          <button className="btn bg-primary">
            <div className="flex items-center gap-3">
              <div className="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" role="status" aria-label="loading">
                <span className="sr-only">Loading...</span>
              </div>
              <span className="text-white">Loading..</span>
            </div>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-icon bg-primary">
            <span className="size-4 animate-[spinner-grow_0.75s_linear_infinite] rounded-full bg-white" />
          </button>
          <button className="btn btn-icon bg-primary rounded-full">
            <span className="size-4 animate-[spinner-grow_0.75s_linear_infinite] rounded-full bg-white" />
          </button>
          <button className="btn bg-primary">
            <span className="size-4 animate-[spinner-grow_0.75s_linear_infinite] rounded-full bg-white" />
          </button>
          <button className="btn bg-primary">
            <div className="flex items-center gap-3">
              <span className="size-4 animate-[spinner-grow_0.75s_linear_infinite] rounded-full bg-white" />
              <strong className="text-white">Loading...</strong>
            </div>
          </button>
        </div>
      </div>
    </ComponentCard>
  )
}

const GrowingSpinner = () => {
  return (
    <ComponentCard title="Growing Spinner" isCollapsible>
      <p className="text-default-400 mb-4">A simple growing spinner built with Tailwind CSS. You can easily change its size, color, and alignment using utility classes.</p>
      <div className="flex items-center justify-start">
        <span className="bg-dark size-8 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
      </div>
    </ComponentCard>
  )
}

const ColorGrowingSpinner = () => {
  return (
    <ComponentCard title="Color Growing Spinner" isCollapsible>
      <p className="text-default-400 mb-4">
        These growing spinners use different background color classes to display various color themes. You can apply any color class like
        <code>.bg-primary</code>,<code>.bg-success</code>, or
        <code>.bg-warning</code>
        to customize the spinner appearance.
      </p>
      <div className="flex gap-base flex-wrap items-center">
        <div className="flex items-center justify-center">
          <span className="bg-primary size-8 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
        </div>
        <div className="flex items-center justify-center">
          <span className="bg-secondary size-8 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
        </div>
        <div className="flex items-center justify-center">
          <span className="bg-success size-8 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
        </div>
        <div className="flex items-center justify-center">
          <span className="bg-danger size-8 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
        </div>
        <div className="flex items-center justify-center">
          <span className="bg-warning size-8 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
        </div>
        <div className="flex items-center justify-center">
          <span className="bg-info size-8 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
        </div>
        <div className="flex items-center justify-center">
          <span className="bg-default-200 size-8 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
        </div>
        <div className="flex items-center justify-center">
          <span className="bg-dark size-8 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
        </div>
        <div className="flex items-center justify-center">
          <span className="bg-purple size-8 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
        </div>
      </div>
    </ComponentCard>
  )
}

const Size = () => {
  return (
    <ComponentCard title="Size" isCollapsible>
      <div className="grid md:grid-cols-2 gap-base">
        <div className="flex items-center gap-base">
          <div className="flex items-center justify-center">
            <div className="border-primary inline-block size-11 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <span className="bg-secondary size-11 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-base">
          <div className="flex items-center justify-center">
            <div className="border-primary inline-block size-9 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <span className="bg-secondary size-7 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-base">
          <div className="flex items-center justify-center">
            <div className="border-primary inline-block size-7 animate-spin rounded-full border-3 border-t-transparent" role="status" aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <span className="bg-secondary size-6 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-base">
          <div className="flex items-center justify-center">
            <div className="border-dark inline-block size-4 animate-spin rounded-full border-2 border-t-transparent" role="status" aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <span className="bg-dark size-4 animate-[spinner-grow_0.75s_linear_infinite] rounded-full" />
          </div>
        </div>
      </div>
    </ComponentCard>
  )
}
