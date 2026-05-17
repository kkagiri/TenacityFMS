import DT from 'datatables.net'
import DataTable from 'datatables.net-react'
import { columns, paginationIcons, tableData } from '../../data'

const Table = () => {
  DataTable.use(DT)

  return (
    <div className="table-wrapper">
      <DataTable
        ajax={import.meta.env.VITE_BASE_URL || '' + '/data/datatables.json'}
        columns={columns}
        options={{
          processing: true,
          dom: "<'md:flex justify-between items-center mb-3'<'hs-dropdown relative'l> f >" + 'rt' + "<'md:flex justify-between align-center mt-2'ip>",
          language: {
            paginate: paginationIcons,
          },
        }}
        className="table-striped dt-responsive table align-middle"
      >
        <thead className="thead-sm text-2xs uppercase">
          <tr>
            {tableData.header.map((label, idx) => (
              <th key={idx}>{label}</th>
            ))}
          </tr>
        </thead>
      </DataTable>
    </div>
  )
}

export default Table
