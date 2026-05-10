import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import { paginationIcons } from '../../data'
import { dataSet } from './data'

const columns = [
  { title: 'company' },
  { title: 'symbol' },
  {
    title: 'price',
    render: (data: number) => {
      return `${data}`
    },
    className: 'text-start',
  },
  {
    title: 'change',
    className: 'text-start',
  },
  { title: 'volume', className: 'text-start' },
  {
    title: 'market cap',
    render: (data: string) => {
      return `${data}`
    },
  },
  { title: 'rating' },
  {
    title: 'status',
    render: (data: string) => {
      const badgeClass = data === 'Bullish' ? 'success' : 'danger'
      return `<span class="badge badge-label badge-soft-${badgeClass}">${data}</span>`
    },
  },
]

const Table = () => {
  DataTable.use(DT)

  return (
    <>
      <DataTable
        columns={columns}
        options={{
          data: dataSet,
          responsive: true,
          language: {
            paginate: paginationIcons,
          },
        }}
        className="table table-striped dt-responsive align-middle mb-0"
      >
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            <th>Company</th>
            <th>Symbol</th>
            <th>Price</th>
            <th>Change</th>
            <th>Volume</th>
            <th>Market Cap</th>
            <th>Rating</th>
            <th>Status</th>
          </tr>
        </thead>
      </DataTable>
    </>
  )
}

export default Table
