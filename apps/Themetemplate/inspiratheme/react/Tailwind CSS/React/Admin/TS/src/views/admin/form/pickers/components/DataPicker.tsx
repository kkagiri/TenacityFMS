import Flatpickr from '@/components/wrappers/Flatpickr'
import { useState } from 'react'
import ReactDatePicker from 'react-datepicker'

const DataPicker = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Date Range Picker</h4>
      </div>
      <div className="card-body">
        <DateRange />
        <hr className="border-default-300 my-9 border-dashed" />

        <DateRangePickerWithTimes />

        <hr className="border-default-300 my-9 border-dashed" />

        <SingleDatePicker />
        <hr className="border-default-300 my-9 border-dashed" />

        <PredefinedDateRanges />
      </div>
    </div>
  )
}

export default DataPicker

const DateRange = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
      <div>
        <h5 className="mb-2 block text-sm font-semibold">Date Range</h5>
        <p className="text-default-500">Select a custom date range from the calendar.</p>
      </div>
      <div>
        <Flatpickr className="form-input" options={{ dateFormat: 'd/m/Y', defaultDate: 'today' }} />
      </div>
    </div>
  )
}

const DateRangePickerWithTimes = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
      <div>
        <h5 className="mb-2 block text-sm font-semibold">Date Range Picker With Times</h5>
        <p className="text-default-500">Includes both start and end time selection.</p>
      </div>
      <div>
        <Flatpickr
          className="form-input"
          options={{
            dateFormat: 'd/m h:m K',
            enableTime: true,
            defaultDate: 'today',
          }}
        />
      </div>
    </div>
  )
}

const SingleDatePicker = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
      <div>
        <h5 className="mb-2 block text-sm font-semibold">Single Date Picker</h5>
        <p className="text-default-500">Select a single date (e.g., birthday).</p>
      </div>
      <div>
        <Flatpickr className="form-input" options={{ dateFormat: 'd/m/Y', defaultDate: 'today' }} />
      </div>
    </div>
  )
}

const PredefinedDateRanges = () => {
  const [selected, setSelected] = useState<Date | null>(new Date())

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
      <div>
        <h5 className="mb-2 block text-sm font-semibold">Predefined Date Ranges</h5>
        <p className="text-default-500">Choose from common ranges like &quot;Last 7 Days&quot;, etc.</p>
      </div>
      <div className="relative">
        <ReactDatePicker className="form-input flex! items-center" selected={selected} onChange={(date: Date | null) => setSelected(date)} showTimeSelect showTimeSelectOnly dateFormat="h:mm aa" />
      </div>
    </div>
  )
}
