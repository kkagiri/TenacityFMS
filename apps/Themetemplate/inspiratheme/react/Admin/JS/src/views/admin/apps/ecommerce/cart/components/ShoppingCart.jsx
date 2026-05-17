import Icon from '@/components/wrappers/Icon'
import { useState } from 'react'
import { Card, CardHeader, CardTitle } from 'react-bootstrap'
import { Link } from 'react-router'
import QuantityCounter from './QuentityCounter'
import { cartItemData } from './data'
const ShoppingCart = () => {
  const [cartItem, setCartItem] = useState(cartItemData)
  const handleQuantityChange = (id, newQuantity) => {
    setCartItem((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      )
    )
  }
  const handleRemove = (id) => {
    setCartItem((prev) => prev.filter((item) => item.id !== id))
  }
  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle as="h4" className="flex-grow-1 mb-0">
          Shopping Cart
        </CardTitle>
        <Link to="" className="text-decoration-underline link-offset-2 fw-medium">
          Clear cart
        </Link>
      </CardHeader>

      <Card.Body>
        <div className="table-responsive">
          <table className="table table-custom align-middle mb-0">
            <thead className="bg-light align-middle bg-opacity-25 thead-sm">
              <tr className="text-uppercase fs-xxs">
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cartItem.map((item) => (
                <tr key={item.id}>
                  <td className="d-flex align-items-center">
                    <img src={item.image} alt={item.name} className="me-3 rounded" width={60} height={60} />
                    <div>
                      {item.discount && <span className="badge bg-danger-subtle text-danger mb-1">-{item.discount}%</span>}
                      <h6 className="mb-1 fs-sm">{item.name}</h6>
                      <small className="text-muted d-block">Color: {item.color}</small>
                      <small className="text-muted d-block">Model: {item.model}</small>
                    </div>
                  </td>
                  <td>
                    {item.discount ? (
                      <>
                        <span className="fw-semibold">${(item.price - item.price * (item.discount / 100)).toFixed(2)}</span>
                        <br />
                        <small className="text-decoration-line-through text-muted">${item.price.toFixed(2)}</small>
                      </>
                    ) : (
                      <>${item.price.toFixed(2)}</>
                    )}
                  </td>
                  <td>
                    <QuantityCounter id={item.id} quantity={item.quantity} onChange={handleQuantityChange} />
                  </td>
                  <td className="fw-semibold">${(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <Link to="" className="text-muted" aria-label={`Remove ${item.name} from cart`} onClick={() => handleRemove(item.id)}>
                      <Icon icon="x" className="fs-lg"></Icon>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <Link to="/apps/ecommerce/products-grid" className="fw-medium d-inline-flex align-items-center gap-1">
            <Icon icon="arrow-left" /> Continue Shopping
          </Link>
        </div>
      </Card.Body>
    </Card>
  )
}
export default ShoppingCart
