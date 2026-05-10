import DT from 'datatables.net'
import DataTable from 'datatables.net-react'
import { columns, paginationIcons, tableData } from '../../data'

const HorizontalScroll = () => {
  DataTable.use(DT)

  return (
    <div className="card">
      <div className="card-header justify-between">
        <h4 className="card-title">Horizontal Scroll</h4>
      </div>
      <div className="card-body">
        <DataTable
          data={tableData.body}
          columns={columns}
          options={{
            scrollX: true,
            language: {
              paginate: paginationIcons,
            },
            dom: "<'md:flex justify-between items-center mb-3'lf>rt<'md:flex justify-between align-center mt-2'ip>",
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

export default HorizontalScroll
