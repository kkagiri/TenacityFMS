import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import { columns, paginationIcons, tableData } from '../../data'
const ComplexHeader = () => {
  DataTable.use(DT)
  return (
    <>
      <Card>
        <CardHeader className="justify-content-between">
          <CardTitle as="h4"> Complex Header </CardTitle>
        </CardHeader>
        <CardBody>
          <DataTable
            data={tableData.body}
            columns={columns}
            options={{
              responsive: true,
              language: {
                paginate: paginationIcons,
              },
            }}
            className="table table-bordered dt-responsive align-middle mb-0"
          >
            <thead className="thead-sm text-uppercase fs-xxs">
              <tr>
                <th colSpan={2}>Company Info</th>
                <th colSpan={2}>Rate</th>
                <th colSpan={2}>More</th>
                <th colSpan={2}>Other</th>
              </tr>
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
export default ComplexHeader
