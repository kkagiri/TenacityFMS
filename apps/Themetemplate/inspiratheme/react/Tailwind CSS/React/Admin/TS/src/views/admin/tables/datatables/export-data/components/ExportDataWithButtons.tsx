import DT from 'datatables.net'
import 'datatables.net-buttons'
import 'datatables.net-buttons/js/buttons.html5'
import DataTable from 'datatables.net-react'
import jszip from 'jszip'
import pdfmake from 'pdfmake'
import { columns, paginationIcons, tableData } from '../../data'

const ExportDataWithButtons = () => {
  DataTable.use(DT)
  DT.Buttons.jszip(jszip)
  DT.Buttons.pdfMake(pdfmake)
  return (
    <>
      <div className="card">
        <div className="card-header justify-between">
          <h4 className="card-title">Export Data with Buttons</h4>
        </div>
        <div className="card-body">
          <DataTable
            data={tableData.body}
            columns={columns}
            options={{
              buttons: [
                { extend: 'copy', className: 'btn btn-sm bg-secondary text-white hover:bg-secondary-hover' },
                { extend: 'csv', className: 'btn btn-sm bg-secondary text-white hover:bg-secondary-hover active' },
                { extend: 'excel', className: 'btn btn-sm bg-secondary text-white hover:bg-secondary-hover' },
                { extend: 'pdf', className: 'btn btn-sm bg-secondary text-white hover:bg-secondary-hover active' },
              ],
              layout: {
                topStart: 'buttons',
              },
              dom: "<'md:flex justify-between items-center mb-3'<'hs-dropdown relative'B>f>" + 'rt' + "<'md:flex justify-between align-center mt-2'ip>",

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
      </div>
    </>
  )
}

export default ExportDataWithButtons
