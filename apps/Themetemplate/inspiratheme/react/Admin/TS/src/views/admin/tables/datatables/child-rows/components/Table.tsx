import Icon from '@/components/wrappers/Icon'
import DT from 'datatables.net-bs5'
import DataTable, { DataTableRef } from 'datatables.net-react'
import 'datatables.net-responsive'
import { useEffect, useRef } from 'react'
import { renderToString } from 'react-dom/server'
import { CompanyInfoType, paginationIcons, tableData } from '../../data'

const formatRowDetails = (d: CompanyInfoType) => {
  return `
    <div class="row align-items-center">
      <div class="col-md-4">
        <h5 class="fs-base mb-1">Rating:</h5>
        <div>${d.rating} ★</div>
      </div>
      <div class="col-md-4">
        <h5 class="fs-base mb-1">Status:</h5>
        <span class="badge badge-label ${d.status === 'bullish' ? 'badge-soft-success' : 'badge-soft-danger'}">${d.status.charAt(0).toUpperCase() + d.status.slice(1)}</span>
      </div>
      <div class="col-md-4">
        <h5 class="fs-base mb-1">Extra info:</h5>
        <div>Additional details here...</div>
      </div>
    </div>
  `
}

const columns = [
  {
    className: 'dt-control',
    orderable: false,
    data: null,
    defaultContent: renderToString(
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M4.929 4.929a10 10 0 1 1 14.141 14.141a10 10 0 0 1 -14.14 -14.14zm8.071 4.071a1 1 0 1 0 -2 0v2h-2a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0 -2h-2v-2z" />
      </svg>
    ),
  },
  { data: 'company' },
  { data: 'symbol' },
  {
    data: 'price',
    render: (data: number) => `${data}`,
    className: 'text-start',
  },
  {
    data: 'change',
    render: (data: number) => `${data}%`,
    className: 'text-start',
  },
  { data: 'volume', className: 'text-start' },
  {
    data: 'marketCap',
    render: (data: string) => `${data}`,
  },
]

const Table = () => {
  DataTable.use(DT)
  const tableRef = useRef<DataTableRef | null>(null)

  useEffect(() => {
    if (!tableRef.current) return

    const dt = tableRef.current.dt()
    if (!dt) return

    const handler = function (this: HTMLElement) {
      const tr = this.closest('tr')
      if (!tr) return

      const row = dt.row(tr)

      if (row.child.isShown()) {
        row.child.hide()
        tr.classList.remove('shown')
        this.innerHTML = renderToString(<Icon icon="square-rounded-plus-filled" className="text-primary fs 22" />)
      } else {
        row.child(formatRowDetails(row.data())).show()
        tr.classList.add('shown')

        this.innerHTML = renderToString(<Icon icon="square-rounded-minus-filled" className="text-primary fs 22" />)
      }
    }

    dt.on('click', 'td.dt-control', handler)

    return () => {
      dt.off('click', 'td.dt-control', handler)
    }
  }, [])

  return (
    <DataTable
      ref={tableRef}
      data={tableData.body}
      columns={columns}
      options={{
        order: [[1, 'asc']],
        responsive: true,
        language: {
          paginate: paginationIcons,
        },
      }}
      className="table table-striped dt-responsive align-middle mb-0"
    >
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          <th></th>
          <th>Company</th>
          <th>Symbol</th>
          <th>Price</th>
          <th>Change</th>
          <th>Volume</th>
          <th>Market Cap</th>
        </tr>
      </thead>
    </DataTable>
  )
}

export default Table
