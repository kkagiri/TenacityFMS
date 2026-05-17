import { toPascalCase } from '@/utils/helpers'
import DT from 'datatables.net-bs5'
import DataTable, { DataTableRef } from 'datatables.net-react'
import 'datatables.net-responsive-bs5'
import 'datatables.net-select-bs5'
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

  const selectAllRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const dt = tableRef.current?.dt()
    if (!dt || !selectAllRef.current) return

    const onHeaderChange = () => {
      if (selectAllRef.current?.checked) {
        dt.rows({ search: 'applied' }).select()
      } else {
        dt.rows().deselect()
      }
    }

    selectAllRef.current.addEventListener('change', onHeaderChange)

    dt.on('select deselect', () => {
      const total = dt.rows({ search: 'applied' }).count()
      const selected = dt.rows({ selected: true, search: 'applied' }).count()

      if (selectAllRef.current) {
        selectAllRef.current.checked = total > 0 && selected === total
        selectAllRef.current.indeterminate = selected > 0 && selected < total
      }
    })

    return () => {
      selectAllRef.current?.removeEventListener('change', onHeaderChange)
    }
  }, [])

  return (
    <>
      <DataTable
        ref={tableRef}
        data={tableData.body}
        columns={columns}
        options={{
          select: {
            style: 'multi',
            selector: 'td:first-child',
          },
          order: [[1, 'asc']],
          responsive: true,
          columnDefs: [
            {
              orderable: false,
              render: DT.render.select(),
              targets: 0,
            },
          ],
          language: {
            paginate: paginationIcons,
          },
        }}
        className="table table-striped dt-responsive checkbox-select-datatable align-middle mb-0"
      >
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            <th style={{ width: '1%' }}>
              <input ref={selectAllRef} type="checkbox" className="form-check-input" />
            </th>
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
