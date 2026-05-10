import RangeSearch from './RangeSearch'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'



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
