import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { FormControl } from 'react-bootstrap'
import { columns, paginationIcons, tableData } from '../../data'

const Table = () => {
  DataTable.use(DT)

  return (
    <>
      <DataTable
        data={tableData.body}
        columns={columns}
        options={{
          responsive: true,
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
        }}
        className="table dt-responsive align-middle mb-0"
      >
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {tableData.header.map((label, idx) => (
              <th key={idx}>{label}</th>
            ))}
          </tr>
          <tr id="column-search-inputs" className="column-search-input-bar">
            <th>
              <FormControl size="sm" type="text" placeholder="Company" className="bg-light-subtle border-light" />
            </th>
            <th>
              <FormControl size="sm" type="text" placeholder="Symbol" className="bg-light-subtle border-light" />
            </th>
            <th>
              <FormControl size="sm" type="text" placeholder="Price" className="bg-light-subtle border-light" />
            </th>
            <th>
              <FormControl size="sm" type="text" placeholder="Change" className="bg-light-subtle border-light" />
            </th>
            <th>
              <FormControl size="sm" type="text" placeholder="Volume" className="bg-light-subtle border-light" />
            </th>
            <th>
              <FormControl size="sm" type="text" placeholder="Market Cap" className="bg-light-subtle border-light" />
            </th>
            <th>
              <FormControl size="sm" type="text" placeholder="Rating" className="bg-light-subtle border-light" />
            </th>
            <th>
              <FormControl size="sm" type="text" placeholder="Status" className="bg-light-subtle border-light" />
            </th>
          </tr>
        </thead>
      </DataTable>
    </>
  )
}

export default Table
