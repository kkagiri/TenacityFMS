import Table from './Table'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'



const Example = () => {
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

export default Example
