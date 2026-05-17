import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-select'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import { columns, paginationIcons, tableData } from '../../data'
const SingleItemSelect = () => {
  DataTable.use(DT)
  return (
    <>
      <Card>
        <CardHeader className="justify-content-between">
          <CardTitle as="h4"> Single Item Select </CardTitle>
        </CardHeader>
        <CardBody>
          <DataTable
            data={tableData.body}
            columns={columns}
            options={{
              responsive: true,
              select: {
                style: 'single',
              },
              pageLength: 7,
              lengthMenu: [7, 10, 25, 50, -1],
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
            </thead>
          </DataTable>
        </CardBody>
      </Card>
    </>
  )
}
export default SingleItemSelect
