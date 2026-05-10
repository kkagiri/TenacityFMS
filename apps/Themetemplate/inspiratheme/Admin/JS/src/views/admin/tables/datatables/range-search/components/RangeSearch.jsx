import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useEffect, useRef } from 'react'
import { columns, tableData } from '../../data'
const RangeSearch = () => {
  DataTable.use(DT)
  const tableRef = useRef(null)

  /* ---------------- Price Range Filter ---------------- */
  useEffect(() => {
    const filterFn = (_settings, data) => {
      const min = Number(document.getElementById('min')?.value) || 0
      const max = Number(document.getElementById('max')?.value) || Infinity
      const price = Number(data[3]) || 0 // <-- PRICE COLUMN INDEX

      return price >= min && price <= max
    }
    DT.ext.search.push(filterFn)
    return () => {
      const index = DT.ext.search.indexOf(filterFn)
      if (index > -1) DT.ext.search.splice(index, 1)
    }
  }, [])

  /* ---------------- Render Top Start (Min / Max) ---------------- */
  const renderTopStart = () => {
    const container = document.createElement('div')
    container.className = 'd-flex align-items-center gap-2 my-2'
    const label = document.createElement('label')
    label.className = 'fw-semibold'
    label.textContent = 'Price:'
    const minInput = document.createElement('input')
    minInput.id = 'min'
    minInput.type = 'number'
    minInput.placeholder = 'Min'
    minInput.className = 'form-control form-control-sm'
    minInput.onkeyup = () => tableRef.current?.dt()?.draw()
    const maxInput = document.createElement('input')
    maxInput.id = 'max'
    maxInput.type = 'number'
    maxInput.placeholder = 'Max'
    maxInput.className = 'form-control form-control-sm'
    maxInput.onkeyup = () => tableRef.current?.dt()?.draw()
    container.appendChild(label)
    container.appendChild(minInput)
    container.appendChild(maxInput)
    return container
  }
  return (
    <DataTable
      ref={tableRef}
      data={tableData.body}
      columns={columns}
      options={{
        responsive: true,
        paging: true,
        searching: true,
        ordering: true,
        lengthChange: false,
        layout: {
          topStart: renderTopStart,
          topEnd: 'search',
        },
      }}
      className="table table-striped dt-responsive align-middle mb-0"
    >
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {tableData.header.map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
    </DataTable>
  )
}
export default RangeSearch
