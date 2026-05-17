import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import Table from './Table'
const RenderingTable = () => {
  return (
    <>
      <Card>
        <CardHeader className="justify-content-between">
          <CardTitle as="h4"> Example </CardTitle>
        </CardHeader>
        <CardBody>
          <Table />
        </CardBody>
      </Card>
    </>
  )
}
export default RenderingTable
