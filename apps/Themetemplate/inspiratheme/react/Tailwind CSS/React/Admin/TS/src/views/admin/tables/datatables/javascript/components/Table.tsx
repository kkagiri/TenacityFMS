import { toPascalCase } from '@/utils/helpers'
import DT from 'datatables.net'
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
      const badgeClass = data === 'Bullish' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
      return `<span class="badge badge-label  ${badgeClass}">${toPascalCase(data)}</span>`
    },
  },
]

const Table = () => {
  DataTable.use(DT)

  return (
    <DataTable
      columns={columns}
      options={{
        data: dataSet,
        language: {
          paginate: paginationIcons,
        },
        dom: "<'md:flex justify-between items-center mb-3'lf>rt<'md:flex justify-between align-center mt-2'ip>",
      }}
      className="table-striped dt-responsive table align-middle"
    >
      <thead className="thead-sm text-2xs uppercase">
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
  )
}

export default Table
