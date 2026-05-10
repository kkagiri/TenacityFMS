import PageBreadcrumb from '@/components/PageBreadcrumb'


const Page = () => {
  return (
    <>
      <div className="container-fluid">
        <PageBreadcrumb title="Colors" subtitle="UI" />

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-base mb-6">
          {colorsData.map((color, index) => (
            <ColorCard key={index} label={color.label} className={color.className} />
          ))}
        </div>

        <h4 className="my-9 text-[17px] font-bold">Border Colors</h4>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="flex gap-base flex-col">
            <div className="card">
              <AdditiveBorder />
            </div>
            <div className="card">
              <BorderColor />
            </div>
            <div className="card">
              <BorderWidthSize />
            </div>
            <div className="card">
              <BorderColorOpacity />
            </div>
          </div>
          <div className="flex gap-base flex-col">
            <div className="card">
              <SubtractiveBorder />
            </div>
            <div className="card">
              <BorderOpacity />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page

type ColorType = {
  label: string
  className: string
}
const colorsData: ColorType[] = [
  { label: 'Primary', className: 'bg-primary' },
  { label: 'Secondary', className: 'bg-secondary' },
  { label: 'Success', className: 'bg-success' },
  { label: 'Info', className: 'bg-info' },
  { label: 'Warning', className: 'bg-warning' },
  { label: 'Danger', className: 'bg-danger' },
  { label: 'Dark', className: 'bg-dark' },
  { label: 'Light', className: 'bg-light' },
]

const ColorCard = ({ label, className }: ColorType) => {
  return (
    <>
      <div className="card">
        <div className="card-body">
          <div className={`${className} rounded`} style={{ height: 100 }} />
          <div className="mt-5 text-center">
            <h6>{label}</h6>
          </div>
        </div>
      </div>
    </>
  )
}

const AdditiveBorder = () => {
  return (
    <>
      <div className="card-header">
        <h5 className="card-title">Additive(Add) Border</h5>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">
          Use border utilities to
          <b>add</b>
          an element’s borders. Choose from all borders or one at a time.
        </p>
        <div className="flex flex-wrap gap-9">
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border-t" />
          </div>
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border-e" />
          </div>
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border-b" />
          </div>
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border-s" />
          </div>
        </div>
      </div>
    </>
  )
}

const BorderColor = () => {
  return (
    <>
      <div className="card-header">
        <h5 className="card-title">Border Color</h5>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Change the border color using utilities built on our theme colors.</p>
        <div className="flex flex-wrap gap-3">
          <div className="text-center">
            <div className="border-primary bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-primary bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-secondary bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-success bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-danger bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-warning bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-info bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-light bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-dark bg-light/50 size-9 border" />
          </div>
        </div>
      </div>
    </>
  )
}

const BorderWidthSize = () => {
  return (
    <>
      <div className="card-header">
        <h5 className="card-title">Border Width Size</h5>
      </div>
      <div className="card-body">
        <div className="flex flex-wrap gap-3">
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border-2" />
          </div>
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border-3" />
          </div>
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border-4" />
          </div>
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border-5" />
          </div>
        </div>
      </div>
    </>
  )
}

const BorderColorOpacity = () => {
  return (
    <>
      <div className="card-header">
        <h5 className="card-title">Border Color opacity</h5>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Change the border color using utilities built on our theme colors.</p>
        <div className="flex flex-wrap gap-3">
          <div className="text-center">
            <div className="border-primary/15 bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-primary/15 bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-secondary/15 bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-success/15 bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-danger/15 bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-warning/15 bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-info/15 bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-light/15 bg-light/50 size-9 border" />
          </div>
          <div className="text-center">
            <div className="border-dark/15 bg-light/50 size-9 border" />
          </div>
        </div>
      </div>
    </>
  )
}

const SubtractiveBorder = () => {
  return (
    <>
      <div className="card-header">
        <h5 className="card-title">Subtractive(Remove) Border</h5>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">Use border utilities to remove an element’s borders. Choose from all borders or one at a time.</p>
        <div className="flex flex-wrap gap-9">
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border-none" />
          </div>
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border border-t-0" />
          </div>
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border border-e-0" />
          </div>
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border border-b-0" />
          </div>
          <div className="text-center">
            <div className="border-default-300 bg-light/50 size-9 border border-s-0" />
          </div>
        </div>
      </div>
    </>
  )
}

const BorderOpacity = () => {
  return (
    <>
      <div className="card-header">
        <h5 className="card-title">Border Opacity</h5>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">
          choose from any of the
          <code>.border-opacity</code>
          utilities:
        </p>
        <div className="border-primary mb-3 border p-3">This is default accent border</div>
        <div className="border-primary/75 mb-3 border p-3">This is 75% opacity accent border</div>
        <div className="border-primary/50 mb-3 border p-3">This is 50% opacity accent border</div>
        <div className="border-primary/25 mb-3 border p-3">This is 25% opacity accent border</div>
        <div className="border-primary/10 border p-3">This is 10% opacity accent border</div>
      </div>
    </>
  )
}
