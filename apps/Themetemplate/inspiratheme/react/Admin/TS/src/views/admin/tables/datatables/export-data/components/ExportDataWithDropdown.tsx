import DT from 'datatables.net-bs5'
import 'datatables.net-buttons-bs5'
import 'datatables.net-buttons/js/buttons.html5'
import DataTable from 'datatables.net-react'
import jszip from 'jszip'
import pdfmake from 'pdfmake'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import { columns, paginationIcons, tableData } from '../../data'

const ExportDataWithDropdown = () => {
  DataTable.use(DT)
  DT.Buttons.jszip(jszip)
  DT.Buttons.pdfMake(pdfmake)
  return (
    <>
      <Card>
        <CardHeader className="justify-content-between">
          <CardTitle as="h4"> Export Data with Dropdowns </CardTitle>
        </CardHeader>
        <CardBody>
          <DataTable
            data={tableData.body}
            columns={columns}
            options={{
              responsive: true,
              dom: "<'d-md-flex justify-content-between align-items-center my-2'<'dropdown'B>f>" + 'rt' + "<'d-md-flex justify-content-between align-items-center mt-2'ip>",
              buttons: [
                {
                  extend: 'collection',
                  text: 'Export',
                  buttons: ['copy', 'csv', 'excel', 'pdf'],
                  className: 'btn btn-sm btn-secondary dropdown-toggle',
                },
              ],
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
        </CardBody>
      </Card>
    </>
  )
}

export default ExportDataWithDropdown
