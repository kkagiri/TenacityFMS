import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import RangeSearch from './RangeSearch'
const Table = () => {
  return (
    <>
      <Card>
        <CardHeader className="justify-content-between">
          <CardTitle as="h4">Example</CardTitle>
        </CardHeader>
        <CardBody>
          <RangeSearch />
        </CardBody>
      </Card>
    </>
  )
}
export default Table
