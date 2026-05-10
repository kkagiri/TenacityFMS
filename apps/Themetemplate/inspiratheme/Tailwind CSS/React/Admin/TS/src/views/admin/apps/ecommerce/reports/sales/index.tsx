import PageBreadcrumb from '@/components/PageBreadcrumb'
import Flatpickr from '@/components/wrappers/Flatpickr'
import Icon from '@/components/wrappers/Icon'
import SalesChart from './components/SalesChart'
import SalesTable from './components/SalesTable'


const getCurrentMonthRange = () => {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setMonth(end.getMonth() + 1)
  end.setDate(0)
  end.setHours(23, 59, 59, 999)

  return [start, end]
}

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Sales Reports" subtitle="Ecommerce" />
      <div className="container">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h5 className="card-title">Products - 2025</h5>
            <div className="flex gap-3">
              <div className="input-icon-group">
                <Icon icon="search" className="input-icon" />
                <input data-table-search type="search" placeholder="Search reports..." className="form-input" />
              </div>

              <div className="input-icon-group">
                <Icon icon="calendar" className="input-icon" />
                <Flatpickr
                  className="form-input"
                  style={{ minWidth: 250 }}
                  options={{
                    dateFormat: 'd M, Y',
                    mode: 'range',
                    defaultDate: getCurrentMonthRange(),
                  }}
                />
              </div>

              <button type="submit" className="btn bg-secondary text-white hover:bg-secondary-hover">
                <Icon icon="download" /> Export Report
              </button>
            </div>
          </div>

          <div className="card-body">
            <SalesChart />
          </div>

          <SalesTable />
        </div>
      </div>
    </>
  )
}

export default Page
