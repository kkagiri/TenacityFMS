import DT from 'datatables.net'
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
        initComplete: function () {
          const api = this.api()

          document.querySelectorAll('#column-search-inputs th').forEach((th) => {
            th.addEventListener('click', function (e) {
              e.stopPropagation()
            })
          })

          document.querySelectorAll('#column-search-inputs th input').forEach((input, index) => {
            input.addEventListener('click', function (e) {
              e.stopPropagation()
            })

            input.addEventListener('keyup', function (this: any) {
              if (api.column(index).search() !== this.value) {
                api.column(index).search(this.value).draw()
              }
            })
          })
        },
        language: {
          paginate: paginationIcons,
        },
        dom: "<'md:flex justify-between items-center mb-3'<'hs-dropdown relative'l> f >" + 'rt' + "<'md:flex justify-between align-center mt-2'ip>",
      }}
      className="table table-striped dt-responsive align-middle mb-0"
    >
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {tableData.header.map((label, idx) => (
            <th key={idx}>{label}</th>
          ))}
        </tr>
        <tr id="column-search-inputs" className="column-search-input-bar">
          <th>
            <input type="text" placeholder="Company" className="form-input form-input-sm bg-default-50! border-light" />
          </th>
          <th>
            <input type="text" placeholder="Symbol" className="form-input form-input-sm bg-default-50! border-light" />
          </th>
          <th>
            <input type="text" placeholder="Price" className="form-input form-input-sm bg-default-50! border-light" />
          </th>
          <th>
            <input type="text" placeholder="Change" className="form-input form-input-sm bg-default-50! border-light" />
          </th>
          <th>
            <input type="text" placeholder="Volume" className="form-input form-input-sm bg-default-50! border-light" />
          </th>
          <th>
            <input type="text" placeholder="Market Cap" className="form-input form-input-sm bg-default-50! border-light" />
          </th>
          <th>
            <input type="text" placeholder="Rating" className="form-input form-input-sm bg-default-50! border-light" />
          </th>
          <th>
            <input type="text" placeholder="Status" className="form-input form-input-sm bg-default-50! border-light" />
          </th>
        </tr>
      </thead>
    </DataTable>
  )
}

export default Table
