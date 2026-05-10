import Rating from '@/components/Rating'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Table } from 'react-bootstrap'
import { Link } from 'react-router'
import { products } from './data'
const ProductInventory = () => {
  return (
    <Card>
      <CardHeader className="justify-content-between align-items-center border-dashed">
        <CardTitle as="h4" className="mb-0">
          Product Inventory
        </CardTitle>
        <div className="d-flex gap-2">
          <Link to="/apps/ecommerce/product-add" passHref>
            <Button variant="soft-secondary" size="sm">
              <Icon icon="plus" className="me-1" /> Add Product
            </Button>
          </Link>
          <Button href="javascript:void(0);" variant="primary" size="sm">
            <Icon icon="file-export" className="me-1" /> Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="table-responsive">
          <Table className="table-centered table-custom table-sm table-nowrap table-hover mb-0">
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <img src={product.image} className="avatar-sm rounded-circle me-2" alt={product.name} />
                      <div>
                        <h5 className="fs-base my-1">
                          <Link to="/apps/ecommerce/product-add" className="text-body">
                            {product.name}
                          </Link>
                        </h5>
                        <span className="text-muted fs-xs">{product.category}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-muted fs-xs">Stock</span>
                    <h5 className="fs-base mt-1 fw-normal">{product.stock}</h5>
                  </td>
                  <td>
                    <span className="text-muted fs-xs">Price</span>
                    <h5 className="fs-base mt-1 fw-normal">{product.price}</h5>
                  </td>
                  <td>
                    <span className="text-muted fs-xs">Ratings</span>
                    <h5 className="fs-base mt-1 fw-normal">
                      <Rating rating={product.ratings} className={'d-inline-flex align-items-center gap-1'} />
                      <span className="ms-1">
                        <Link to="/apps/ecommerce/reviews" className="link-reset fw-semibold">
                          ({product.reviews})
                        </Link>
                      </span>
                    </h5>
                  </td>
                  <td>
                    <span className="text-muted fs-xs">Status</span>
                    <h5 className="fs-base mt-1 fw-normal">
                      <Icon icon="circle-filled" className={`fs-xs text-${product.statusVariant}`} /> {product.status}
                    </h5>
                  </td>
                  <td
                    style={{
                      width: 30,
                    }}
                  >
                    <Dropdown>
                      <DropdownToggle as="a" href="#" className="dropdown-toggle text-muted drop-arrow-none card-drop p-0">
                        <Icon icon="dots-vertical" className="fs-lg" />
                      </DropdownToggle>
                      <DropdownMenu className="dropdown-menu-end">
                        <DropdownItem href="#">Edit Product</DropdownItem>
                        <DropdownItem href="#">Remove</DropdownItem>
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
        <TablePagination totalItems={5} start={1} end={5} itemsName="products" showInfo previousPage={() => {}} canPreviousPage={false} pageCount={1} pageIndex={0} setPageIndex={() => {}} nextPage={() => {}} canNextPage={false} />
      </CardFooter>
    </Card>
  )
}
export default ProductInventory
