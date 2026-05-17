import DT from 'datatables.net'
import DataTable from 'datatables.net-react'
import 'datatables.net-select'
import { columns, paginationIcons, tableData } from '../../data'

const SingleItemSelect = () => {
  DataTable.use(DT)
  return (
    <div className="card">
      <div className="card-header justify-between">
        <h4 className="card-title">Single Item Select</h4>
      </div>
      <div className="card-body">
        <DataTable
          data={tableData.body}
          columns={columns}
          options={{
            select: { style: 'single' },
            pageLength: 7,
            lengthMenu: [7, 10, 25, 50, -1],
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
      </div>
    </div>
  )
}

export default SingleItemSelect
