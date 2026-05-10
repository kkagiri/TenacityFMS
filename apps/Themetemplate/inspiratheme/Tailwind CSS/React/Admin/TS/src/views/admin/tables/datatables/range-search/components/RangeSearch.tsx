import type { InternalSettings } from 'datatables.net'
import DT from 'datatables.net'
import DataTable, { DataTableRef } from 'datatables.net-react'
import 'datatables.net-responsive'
import { useEffect, useRef } from 'react'
import { columns, tableData } from '../../data'

const RangeSearch = () => {
  DataTable.use(DT)
  const tableRef = useRef<DataTableRef | null>(null)

  useEffect(() => {
    const filterFn = (_settings: InternalSettings, data: string[]) => {
      const min = Number((document.getElementById('min') as HTMLInputElement)?.value) || 0
      const max = Number((document.getElementById('max') as HTMLInputElement)?.value) || Infinity
      const price = Number(data[3]) || 0
      return price >= min && price <= max
    }

    DT.ext.search.push(filterFn)

    return () => {
      const index = DT.ext.search.indexOf(filterFn)
      if (index > -1) DT.ext.search.splice(index, 1)
    }
  }, [])

  const renderTopStart = () => {
    const container = document.createElement('div')
    container.className = 'flex items-center gap-2 my-2'
    container.innerHTML = `
      <label class="fw-semibold">Price:</label>
      <input id="min" type="number" placeholder="Min" min="0" 
             class="form-input form-input-sm bg-default-50! border-light" />
      <input id="max" type="number" placeholder="Max" min="0" 
             class="form-input form-input-sm bg-default-50! border-light" />
    `

    const minInput = container.querySelector('#min') as HTMLInputElement
    const maxInput = container.querySelector('#max') as HTMLInputElement

    const redrawTable = () => tableRef.current?.dt()?.draw()
    minInput.addEventListener('input', redrawTable)
    maxInput.addEventListener('input', redrawTable)

    return container
  }
  return (
    <div>
      <DataTable
        ref={tableRef}
        data={tableData.body}
        columns={columns}
        options={{
          paging: true,
          responsive: true,
          searching: true,
          ordering: true,
          lengthChange: false,
          layout: {
            topStart: renderTopStart,
            topEnd: 'search',
          },
        }}
        className="table table-striped dt-responsive table align-middle dtr-inline"
      >
        <thead className="thead-sm text-2xs uppercase">
          <tr>
            {tableData.header.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
      </DataTable>
    </div>
  )
}

export default RangeSearch
