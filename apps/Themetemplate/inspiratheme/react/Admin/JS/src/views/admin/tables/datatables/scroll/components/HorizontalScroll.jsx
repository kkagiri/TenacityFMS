import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import { columns, paginationIcons, tableData } from '../../data'
const HorizontalScroll = () => {
  DataTable.use(DT)
  return (
    <>
      <Card>
        <CardHeader className="justify-content-between">
          <CardTitle as="h4"> Horizontal Scroll </CardTitle>
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
export default HorizontalScroll
