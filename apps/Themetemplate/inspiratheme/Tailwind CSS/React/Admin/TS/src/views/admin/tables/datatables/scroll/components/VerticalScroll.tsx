import DT from 'datatables.net'
import DataTable from 'datatables.net-react'
import { columns, paginationIcons, tableData } from '../../data'

const VerticalScroll = () => {
  DataTable.use(DT)

  return (
    <div className="card">
      <div className="card-header justify-between">
        <h4 className="card-title">Vertical Scroll</h4>
      </div>
      <div className="card-body">
        <DataTable
          data={tableData.body}
          columns={columns}
          options={{
            paging: false,
            scrollCollapse: true,
            scrollY: '250px',
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
      </div>
    </div>
  )
}

export default VerticalScroll
