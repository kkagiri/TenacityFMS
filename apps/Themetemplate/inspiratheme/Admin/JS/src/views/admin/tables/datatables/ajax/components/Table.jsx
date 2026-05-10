import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import { columns, paginationIcons, tableData } from '../../data'
const Table = () => {
  DataTable.use(DT)
  return (
    <>
      <DataTable
        ajax={import.meta.env.VITE_BASE_URL || '' + '/data/datatables.json'}
        columns={columns}
        options={{
          processing: true,
          responsive: true,
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
