import DT from 'datatables.net-bs5'
import 'datatables.net-fixedheader'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { columns, paginationIcons, tableData } from '../../data'
const Table = () => {
  DataTable.use(DT)
  return (
    <>
      <DataTable
        data={tableData.body}
        columns={columns}
        options={{
          fixedHeader: {
            header: true,
            headerOffset: 65,
          },
          pageLength: 25,
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
