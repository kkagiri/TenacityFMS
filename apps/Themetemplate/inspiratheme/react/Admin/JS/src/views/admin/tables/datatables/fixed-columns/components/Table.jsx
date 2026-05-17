import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import ColumnTable from './ColumnTable'
const Table = () => {
  return (
    <>
      <Card>
        <CardHeader className="justify-content-between">
          <CardTitle as="h4">Example</CardTitle>
        </CardHeader>
        <CardBody>
          <ColumnTable />
        </CardBody>
      </Card>
    </>
  )
}
export default Table
