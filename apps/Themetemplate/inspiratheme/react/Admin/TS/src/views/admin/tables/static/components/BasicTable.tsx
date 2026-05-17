import { toPascalCase } from '@/utils/helpers'
import { Button, Card, CardBody, CardHeader, CardTitle, Table } from 'react-bootstrap'
import { productsTable } from './data'

const BasicTable = () => {
  return (
    <>
      <Card>
        <CardHeader className="justify-content-between">
          <CardTitle as="h4"> Basic Table </CardTitle>
        </CardHeader>
        <CardBody>
          <Table responsive className="align-middle mb-0">
            <thead className="fs-xs">
              <tr>
                {productsTable.header.map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productsTable.data.map((product, idx) => (
                <tr key={idx}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td>{product.rating} ★</td>
                  <td>
                    <span className={`badge badge-label badge-soft-${product.status === 'active' ? 'success' : 'warning'}`}>{toPascalCase(product.status)}</span>
                  </td>
                  <td>
                    <Button variant="primary" size="sm">
                      Edit
                    </Button>
                    &nbsp;
                    <Button variant="danger" size="sm">
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  )
}

export default BasicTable
