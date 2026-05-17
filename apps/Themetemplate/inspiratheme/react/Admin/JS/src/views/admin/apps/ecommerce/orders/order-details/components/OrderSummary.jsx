import product1 from '@/assets/images/products/1.png'
import product2 from '@/assets/images/products/2.png'
import product3 from '@/assets/images/products/3.png'
import Icon from '@/components/wrappers/Icon'
import { Button, Card, CardBody, CardHeader, Table } from 'react-bootstrap'
import { Link } from 'react-router'
const OrderSummary = () => {
  return (
    <Card>
      <CardHeader className="align-items-start p-4">
        <div>
          <h3 className="mb-1 d-flex fs-xl align-items-center">Order #WB20100</h3>
          <p className="text-muted mb-3 d-flex align-items-center gap-1">
            <Icon icon="calendar" /> 24 Apr, 2025 <small className="text-muted">10:10 AM</small>
          </p>
          <span className="badge badge-soft-success fs-xxs badge-label me-1">
            <Icon icon="circle-filled" className="align-middle fs-sm" /> Paid
          </span>
          <span className="badge badge-soft-info fs-xxs badge-label">
            <Icon icon="truck" className="align-middle fs-sm" /> Shipped
          </span>
        </div>
        <div className="ms-auto">
          <Button variant="light" className="me-1">
            <Icon icon="pencil" className="me-1" /> Modify
          </Button>
          <Button variant="danger">
            <Icon icon="trash" className="me-1" /> Delete
          </Button>
        </div>
      </CardHeader>
      <CardBody className="px-4">
        <h4 className="fs-sm mb-3">Order Summary</h4>
        <Table responsive bordered className="table-custom table-nowrap align-middle mb-1">
          <thead className="bg-light align-middle bg-opacity-25 thead-sm">
            <tr className="text-uppercase fs-xxs">
              <th>Product</th>
              <th>Price</th>
              <th>QTY</th>
              <th className="text-end">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="d-flex">
                  <div className="avatar-md me-3">
                    <img src={product1} width={36} height={36} alt="Wireless Earbuds" className="img-fluid rounded" />
                  </div>
                  <div>
                    <h5 className="mb-1">
                      <Link to="" className="link-reset">
                        Wireless Earbuds
                      </Link>
                    </h5>
                    <p className="text-muted mb-0 fs-xs">by: My Furniture</p>
                  </div>
                </div>
              </td>
              <td>$79.99</td>
              <td>2</td>
              <td className="text-end">$159.98</td>
            </tr>
            <tr>
              <td>
                <div className="d-flex">
                  <div className="avatar-md me-3">
                    <img src={product2} width={36} height={36} alt="Smart Watch" className="img-fluid rounded" />
                  </div>
                  <div>
                    <h5 className="mb-1">
                      <Link to="" className="link-reset">
                        Smart Watch
                      </Link>
                    </h5>
                    <p className="text-muted mb-0 fs-xs">by: Tech World</p>
                  </div>
                </div>
              </td>
              <td>$199.00</td>
              <td>1</td>
              <td className="text-end">$199.00</td>
            </tr>
            <tr>
              <td>
                <div className="d-flex">
                  <div className="avatar-md me-3">
                    <img src={product3} width={36} height={36} alt="Gaming Mouse" className="img-fluid rounded" />
                  </div>
                  <div>
                    <h5 className="mb-1">
                      <Link to="" className="link-reset">
                        Gaming Funkey Shoes
                      </Link>
                    </h5>
                    <p className="text-muted mb-0 fs-xs">by: Pro Gamerz</p>
                  </div>
                </div>
              </td>
              <td>$49.50</td>
              <td>3</td>
              <td className="text-end">$148.50</td>
            </tr>
            <tr className="border-top">
              <td colSpan={3} className="text-end fw-semibold">
                Subtotal
              </td>
              <td className="text-end">$507.48</td>
            </tr>
            <tr>
              <td colSpan={3} className="text-end fw-semibold">
                Tax (10%)
              </td>
              <td className="text-end">$50.75</td>
            </tr>
            <tr>
              <td colSpan={3} className="text-end fw-semibold">
                Discount (5%)
              </td>
              <td className="text-end text-danger fw-semibold">-$25.37</td>
            </tr>
            <tr>
              <td colSpan={3} className="text-end fw-semibold">
                Shipping fee
              </td>
              <td className="text-end">$10.00</td>
            </tr>
            <tr className="border-top">
              <td colSpan={3} className="text-end fw-bold text-uppercase">
                Grand Total
              </td>
              <td className="fw-bold text-end table-active">$543.86</td>
            </tr>
          </tbody>
        </Table>
      </CardBody>
    </Card>
  )
}
export default OrderSummary
