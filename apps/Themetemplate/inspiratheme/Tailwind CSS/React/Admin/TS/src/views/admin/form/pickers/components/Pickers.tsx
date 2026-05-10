import Flatpickr from '@/components/wrappers/Flatpickr'

const Pickers = () => {
  return (
    <div className="card">
      <div className="card-header block">
        <h4 className="card-title mb-1.5">Flatpickr</h4>
        <p className="text-default-400">Lightweight, powerful javascript datetimepicker with no dependencies</p>
      </div>
      <div className="card-body">
        <h4 className="card-title mb-7.5 text-sm">Datepicker</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Basic</h5>
            <p className="text-default-500">
              Set <code>data-provider= &quot;flatpickr&quot; data-date-format= &quot;d M, Y&quot;</code>
            </p>
          </div>
          <div>
            <Flatpickr type="text" className="form-input" options={{ dateFormat: 'd M, Y', defaultDate: 'today' }} placeholder="Select date" />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">DateTime</h5>
            <p className="text-default-500">
              Set <code>data-provider=&quot;flatpickr&quot; data-date-format=&quot;d.m.y&quot; data-enable-time.</code>
            </p>
          </div>
          <div>
            <Flatpickr type="text" className="form-input" options={{ enableTime: true, defaultDate: 'today', dateFormat: 'd.m.y h:m' }} placeholder="Select date & time" />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Human-Friendly Dates</h5>
            <p className="text-default-500">
              Set <code>data-provider=&quot;flatpickr&quot; data-altFormat=&quot;F j, Y&quot.</code>
            </p>
          </div>
          <div>
            <Flatpickr
              className="form-input"
              options={{
                altInput: true,
                altFormat: 'F j, Y',
                dateFormat: 'Y-m-d',
                defaultDate: 'today',
              }}
              placeholder="select date"
            />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">MinDate and MaxDate</h5>
            <p className="text-default-500">
              Set <code> data-provider=&quot;flatpickr&quot; data-date-format=&quot;d M, Y&quot; data-minDate=&quot;...&quot; data-maxDate=&quot;...&quot;. </code>
            </p>
          </div>
          <div>
            <Flatpickr
              className="form-input"
              placeholder="Select Date"
              options={{
                dateFormat: 'd M, Y',
                minDate: '25 12, 2021',
                maxDate: '29 12,2021',
              }}
            />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Default Date</h5>
            <p className="text-default-500">
              Set <code>data-provider=&quot;flatpickr&quot; data-default-date=&quot;...&quot;</code>.
            </p>
          </div>
          <div>
            <Flatpickr type="text" className="form-input" options={{ dateFormat: 'd M, Y', defaultDate: '25 12,2021' }} placeholder="Select date" />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Disabling Dates</h5>
            <p className="text-default-500">
              Set <code>data-provider=&quot;flatpickr&quot; data-disable-date=&quot;...&quot;</code>.
            </p>
          </div>
          <div>
            <Flatpickr type="text" className="form-input" options={{ dateFormat: 'd M, Y', disable: ['15 12,2021'] }} placeholder="Select date" />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Selecting Multiple Dates</h5>
            <p className="text-default-500">
              Set <code>data-provider=&quot;flatpickr&quot; data-multiple-date=&quot;true&quot;</code>.
            </p>
          </div>
          <div>
            <Flatpickr type="text" className="form-input" options={{ dateFormat: 'd M, Y', mode: 'multiple' }} placeholder="Select multiple dates" />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Range</h5>
            <p className="text-default-500">
              Set <code>data-provider=&quot;flatpickr&quot; data-range-date=&quot;true&quot;</code>.
            </p>
          </div>
          <div>
            <Flatpickr type="text" className="form-input" options={{ dateFormat: 'd M, Y', mode: 'range' }} placeholder="Select date range" />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Week Numbers</h5>
            <p className="text-default-500">
              Set <code>data-provider=&quot;flatpickr&quot; data-week-number</code>.
            </p>
          </div>
          <div>
            <Flatpickr type="text" className="form-input" options={{ dateFormat: 'd M, Y', weekNumbers: true }} placeholder="Select date" />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Inline</h5>
            <p className="text-default-500">
              Set <code>data-provider=&quot;flatpickr&quot; data-inline-date=&quot;true&quot;</code>.
            </p>
          </div>
          <div>
            <Flatpickr type="text" className="form-input" options={{ dateFormat: 'd M, Y', defaultDate: '25 01,2021' }} placeholder="Select date" />
          </div>
        </div>
      </div>

      <div className="border-default-300 border-t"></div>

      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Timepicker</h5>
            <p className="text-default-500">
              Set <code>data-provider=&quot;timepickr&quot; data-time-basic=&quot;true&quot;</code>
              attribute.
            </p>
          </div>
          <div>
            <Flatpickr
              className="form-input"
              placeholder="Select Time"
              options={{
                enableTime: true,
                noCalendar: true,
                dateFormat: 'H:i',
              }}
            />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">24-hour Time Picker</h5>
            <p className="text-default-500">
              Set <code>data-provider=&quot;timepickr&quot; data-time-hrs=&quot;true&quot;</code>
              attribute.
            </p>
          </div>
          <div>
            <Flatpickr
              className="form-input"
              placeholder="Select Time"
              options={{
                enableTime: true,
                noCalendar: true,
                dateFormat: 'h:m',
                minTime: '16:00',
                maxTime: '22:30',
              }}
            />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Time Picker w/ Limits</h5>
            <p className="text-default-500">
              Set <code>data-provider=&quot;timepickr&quot; data-min-time=&quot;Min.Time&quot; data-max-time=&quot;Max.Time&quot;</code>
              attribute.
            </p>
          </div>
          <div>
            <Flatpickr
              className="form-input"
              placeholder="Select Time"
              options={{
                enableTime: true,
                noCalendar: true,
                dateFormat: 'h:m',
                minTime: '16:00',
                maxTime: '22:30',
              }}
            />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Preloading Time</h5>
            <p className="text-default-500">
              Set <code>data-provider=&quot;timepickr&quot; data-default-time=&quot;Your Default Time&quot;</code>
              attribute.
            </p>
          </div>
          <div>
            <Flatpickr
              className="form-input"
              placeholder="Select Time"
              options={{
                enableTime: true,
                noCalendar: true,
                dateFormat: 'h:m',
                defaultDate: '16:45',
              }}
            />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Inline</h5>
            <p className="text-default-500">
              Set <code>data-provider=&quot;timepickr&quot; data-time-inline=&quot;Your Default Time&quot;</code>
              attribute.
            </p>
          </div>
          <div>
            <Flatpickr
              className="form-input"
              placeholder="Select Time"
              options={{
                enableTime: true,
                noCalendar: true,
                inline: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pickers
