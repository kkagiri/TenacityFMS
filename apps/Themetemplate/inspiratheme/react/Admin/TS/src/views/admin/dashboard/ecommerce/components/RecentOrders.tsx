import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Image, Table } from 'react-bootstrap'
import { orders } from './data'

const RecentOrders = () => {
  return (
    <Card>
      <CardHeader className="justify-content-between align-items-center border-dashed">
        <CardTitle as="h4" className="mb-0">
          Recent Orders
        </CardTitle>
        <div className="d-flex gap-2">
          <Button href="" variant="soft-secondary" size="sm">
            <Icon icon="plus" className="me-1" /> Add Order
          </Button>
          <Button href="" variant="primary" size="sm">
            <Icon icon="file-export" className="me-1" /> Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="table-responsive">
          <Table className="table-centered table-custom table-sm table-nowrap table-hover mb-0">
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <img src={order.userImage} className="avatar-sm rounded-circle me-2" alt={order.userName} />
                      <div>
                        <h5 className="fs-base my-1">
                          <Link to="/orders/1" className="text-body">
                            #{order.id}
                          </Link>
                        </h5>
                        <span className="text-muted fs-xs">{order.userName}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-muted fs-xs">Product</span>
                    <h5 className="fs-base mt-1 fw-normal">{order.product}</h5>
                  </td>
                  <td>
                    <span className="text-muted fs-xs">Date</span>
                    <h5 className="fs-base mt-1 fw-normal">{order.date}</h5>
                  </td>
                  <td>
                    <span className="text-muted fs-xs">Amount</span>
                    <h5 className="fs-base mt-1 fw-normal">{order.amount}</h5>
                  </td>
                  <td>
                    <span className="text-muted fs-xs d-flex align-items-center">Status</span>
                    <h5 className="fs-base mt-1 fw-normal">
                      <Icon icon="circle-filled" className={`fs-xs text-${order.statusVariant}`} /> {order.status}
                    </h5>
                  </td>
                  <td style={{ width: 30 }}>
                    <Dropdown>
                      <DropdownToggle as={Link} href="" className="dropdown-toggle text-muted drop-arrow-none card-drop p-0">
                        <Icon icon="dots-vertical" className="fs-lg" />
                      </DropdownToggle>
                      <DropdownMenu className="dropdown-menu-end">
                        <DropdownItem href="#">View Details</DropdownItem>
                        <DropdownItem href="#">Cancel Order</DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </CardBody>
      <CardFooter className="border-0">
        <TablePagination totalItems={5} start={1} end={5} itemsName="orders" showInfo previousPage={() => {}} canPreviousPage={false} pageCount={1} pageIndex={0} setPageIndex={() => {}} nextPage={() => {}} canNextPage={false} />
      </CardFooter>
    </Card>
  )
}

export default RecentOrders
