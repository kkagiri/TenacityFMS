import DT from 'datatables.net'
import 'datatables.net-fixedheader'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { columns, paginationIcons, tableData } from '../../data'

const Table = () => {
  DataTable.use(DT)

  return (
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
        dom: "<'md:flex justify-between items-center mb-3'<'hs-dropdown relative'l> f >" + 'rt' + "<'md:flex justify-between align-center mt-2'ip>",
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
  )
}

export default Table
