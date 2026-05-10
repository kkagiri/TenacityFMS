import { toPascalCase } from '@/utils/helpers'
import DT from 'datatables.net'
import DataTable, { DataTableRef } from 'datatables.net-react'
import 'datatables.net-responsive'
import 'datatables.net-select'
import { useEffect, useRef } from 'react'
import { paginationIcons, tableData } from '../../data'

const columns = [
  {
    data: null,
    orderable: false,
    className: 'select-checkbox',
    defaultContent: '',
  },
  { data: 'company' },
  { data: 'symbol' },
  {
    data: 'price',
    render: (data: number) => {
      return `${data}`
    },
    className: 'text-start',
  },
  {
    data: 'change',
    render: (data: number) => {
      return `${data}%`
    },
    className: 'text-start',
  },
  { data: 'volume', className: 'text-start' },
  {
    data: 'marketCap',
    render: (data: string) => {
      return `${data}`
    },
  },
  {
    data: 'rating',
    render: (data: number) => {
      return `${data}★`
    },
  },
  {
    data: 'status',
    render: (data: string) => {
      const badgeClass = data === 'Bullish' ? 'success' : 'danger'
      return `<span class="badge badge-label badge-soft-${badgeClass}">${toPascalCase(data)}</span>`
    },
  },
]

const Table = () => {
  DataTable.use(DT)
  const tableRef = useRef<DataTableRef | null>(null)

  useEffect(() => {
    const dt = tableRef.current?.dt()
    if (!dt) return

    dt.on('select deselect', () => {
      const total = dt.rows({ search: 'applied' }).count()
      const selected = dt.rows({ selected: true, search: 'applied' }).count()

      const headerCheckbox = dt.table().header().querySelector('thead input[type="checkbox"]')
      if (headerCheckbox) {
        ;(headerCheckbox as HTMLInputElement).checked = total > 0 && total === selected
      }
    })
  }, [])

  return (
    <DataTable
      ref={tableRef}
      data={tableData.body}
      columns={columns}
      options={{
        select: {
          style: 'multi',
          items: 'row',
          selector: 'td',
          headerCheckbox: 'select-all',
          className: 'selected',
        },
        order: [[1, 'asc']],
        language: {
          paginate: paginationIcons,
        },
      }}
      className="table table-striped dt-responsive table align-middle"
    >
      <thead className="thead-sm text-2xs uppercase">
        <tr>
          <th className="fs-sm"></th>
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
