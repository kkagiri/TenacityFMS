import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { Card, CardBody, CardHeader, CardTitle, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Table } from 'react-bootstrap'
import { productsTable } from './data'

const StripedColumnTable = () => {
  return (
    <>
      <Card>
        <CardHeader className="justify-content-between">
          <CardTitle as="h4"> Striped Columns </CardTitle>
        </CardHeader>
        <CardBody>
          <Table responsive className="table-striped-columns align-middle mb-0">
            <thead className="align-middle thead-sm">
              <tr className="text-uppercase fs-xxs">
                {productsTable.header.map((header, idx) => (
                  <th key={idx} style={header === 'Actions' ? { width: '1%' } : { width: 'auto' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productsTable.data.slice(0, 3).map((product, idx) => (
                <tr key={idx}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td>{product.rating} ★</td>
                  <td>
                    <span className={`badge badge-label badge-soft-${product.status === 'active' ? 'success' : 'warning'}`}>{toPascalCase(product.status)}</span>
                  </td>
                  <td className="text-end">
                    <Dropdown className="text-muted">
                      <DropdownToggle variant="link" className="drop-arrow-none fs-xxl link-reset p-0">
                        <Icon icon="dots-vertical" />
                      </DropdownToggle>
                      <DropdownMenu align="end">
                        <DropdownItem>
                          <Icon icon="eye" className="me-1" /> View
                        </DropdownItem>
                        <DropdownItem>
                          <Icon icon="edit" className="me-1" /> Edit
                        </DropdownItem>
                        <DropdownItem className="text-danger">
                          <Icon icon="trash" className="me-1" /> Delete
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
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

export default StripedColumnTable
