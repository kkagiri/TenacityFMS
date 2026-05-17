import DT from 'datatables.net-bs5'
import DataTable, { DataTableRef } from 'datatables.net-react'
import 'datatables.net-responsive'
import { useRef } from 'react'
import { columns, paginationIcons, tableData } from '../../data'

const Table = () => {
  DataTable.use(DT)

  const tableRef = useRef<DataTableRef | null>(null)
  // Create a function that returns a DOM element
  const renderTopStart = () => {
    const container = document.createElement('div')
    container.className = 'd-flex'

    const button = document.createElement('button')
    button.className = 'btn btn-primary btn-sm'
    button.textContent = 'Add Row'
    button.onclick = () => tableRef.current?.dt()?.row.add(tableData.body[0]).draw(false)

    container.appendChild(button)
    return container
  }
  return (
    <>
      <DataTable
        ref={tableRef}
        data={tableData.body.slice(0, 5)}
        columns={columns}
        options={{
          responsive: true,
          lengthChange: false,
          layout: {
            topStart: renderTopStart,
          },
          language: {
            paginate: paginationIcons,
          },
        }}
        className="table table-striped dt-responsive align-middle mb-0"
      >
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {tableData.header.map((label, idx) => (
              <th key={idx}>{label}</th>
            ))}
          </tr>
        </thead>
      </DataTable>
    </>
  )
}

export default Table
