import Select from '@/components/wrappers/Select'
import { basicOptions, groupedOptions } from './data'

const Select2 = () => {
  return (
    <div className="card">
      <div className="card-header block">
        <h4 className="card-title mb-1.5">Select2</h4>
        <p className="text-default-400 mb-4">Select2 is an advanced replacement for standard select boxes. It supports searching, remote data sources, and infinite scrolling of results.</p>

        <div className="bg-warning/15 text-warning rounded px-4 py-3" role="alert">
          <strong>Note:</strong>
          This is a jQuery-based plugin, so you need to include jQuery for it to work.
        </div>
      </div>

      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Single Select Input with Button</h5>
            <p className="text-default-500">An example of a select dropdown with an appended button using Tailwind + Preline.</p>
          </div>
          <div>
            <div className="flex gap-2">
              <Select className="select2 w-full react-select" isSearchable={true} classNamePrefix="react-select" placeholder="Select City" options={basicOptions} />
            </div>
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Single Select Input with Groups</h5>
            <p className="text-default-500">Select2 can take a regular select box with optgroup support for better organization.</p>
          </div>
          <div>
            <Select className="select2 react-select" classNamePrefix="react-select" placeholder="Select City" options={groupedOptions} />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-t border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Multiple Select Input</h5>
            <p className="text-default-500">Preline multi-select with grouped options and placeholder support.</p>
          </div>
          <div>
            <Select isClearable isMulti className="select2 select2-multip react-select" classNamePrefix="react-select" placeholder="Select City" options={groupedOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Select2
