import product1 from '@/assets/images/products/1.png'
import product2 from '@/assets/images/products/2.png'
import product3 from '@/assets/images/products/3.png'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

const OrderSummary = () => {
  return (
    <div className="card">
      <div className="card-header block items-start p-7.5 md:flex">
        <div>
          <h3 className="mb-1.25 flex items-center text-lg">Order #WB20100</h3>
          <p className="text-default-400 mb-5">
            <span className="flex items-center gap-1">
              <Icon icon="calendar" className="align-middle" />
              24 Apr, 2025
              <small className="text-default-400">10:10 AM</small>
            </span>
          </p>
          <div className="flex items-center gap-1">
            <span className="badge badge-label text-2xs font-semibold bg-success/15 text-success">
              <Icon icon="circle-filled" className="text-sm" /> Paid
            </span>
            <span className="badge badge-label text-2xs font-semibold bg-info/15 text-info">
              <Icon icon="truck" className="text-sm" /> Shipped
            </span>
          </div>
        </div>
        <div className="mt-4 md:ms-auto md:mt-0">
          <Link to="" className="btn bg-light hover:text-primary me-1">
            <Icon icon="pencil" className="text-base" /> Modify
          </Link>
          <Link to="" className="btn bg-danger text-white hover:bg-danger-hover">
            <Icon icon="trash" className="text-sm" /> Delete
          </Link>
        </div>
      </div>
      <div className="card-body px-7.5!">
        <h4 className="mb-5">Order Summary</h4>
        <div className="table-wrapper">
          <table className="table table-bordered">
            <thead className="thead-sm text-2xs uppercase bg-light/25">
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>QTY</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="flex items-center gap-base">
                    <img src={product1} alt="Wireless Earbuds" className="size-9 rounded-md" />
                    <div>
                      <h5 className="text-default-800 font-medium mb-1.25">
                        <Link to="/apps/ecommerce/product-details" className="hover:text-primary">
                          Wireless Earbuds
                        </Link>
                      </h5>
                      <p className="text-default-400 text-2xs">by: My Furniture</p>
                    </div>
                  </div>
                </td>
                <td>$79.99</td>
                <td>2</td>
                <td className="text-end font-medium">$159.98</td>
              </tr>
              <tr>
                <td>
                  <div className="flex items-center gap-base">
                    <img src={product2} alt="Smart Watch" className="size-9 rounded-md" />
                    <div>
                      <h5 className="text-default-800 font-medium mb-1.25">
                        <Link to="/apps/ecommerce/product-details" className="hover:text-primary">
                          Smart Watch
                        </Link>
                      </h5>
                      <p className="text-default-400 text-2xs">by: Tech World</p>
                    </div>
                  </div>
                </td>
                <td>$199.00</td>
                <td>1</td>
                <td className="text-end font-medium">$199.00</td>
              </tr>
              <tr>
                <td>
                  <div className="flex items-center gap-base">
                    <img src={product3} alt="Gaming Mouse" className="size-9 rounded-md" />
                    <div>
                      <h5 className="text-default-800 font-medium mb-1.25">
                        <Link to="/apps/ecommerce/product-details" className="hover:text-primary">
                          Gaming Mouse
                        </Link>
                      </h5>
                      <p className="text-default-400 text-2xs">by: Pro Gamerz</p>
                    </div>
                  </div>
                </td>
                <td>$49.50</td>
                <td>3</td>
                <td className="text-end font-medium">$148.50</td>
              </tr>
              <tr className="border-default-300 border-t">
                <td colSpan={3} className="text-default-800 px-4 py-3 text-right font-medium">
                  Subtotal
                </td>
                <td className="text-end">$507.48</td>
              </tr>
              <tr>
                <td colSpan={3} className="text-default-800 px-4 py-3 text-right font-medium">
                  Tax (10%)
                </td>
                <td className="text-end">$50.75</td>
              </tr>
              <tr>
                <td colSpan={3} className="text-default-800 px-4 py-3 text-right font-medium">
                  Discount (5%)
                </td>
                <td className="text-danger px-4 py-3 text-right font-semibold">- $25.37</td>
              </tr>
              <tr>
                <td colSpan={3} className="text-default-800 px-4 py-3 text-right font-medium">
                  Shipping Fee
                </td>
                <td className="text-end">$10.00</td>
              </tr>
              <tr className="border-default-300 border-t">
                <td colSpan={3} className="text-end font-bold uppercase">
                  Grand Total
                </td>
                <td className="text-end font-bold bg-default-50">$543.86</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary
