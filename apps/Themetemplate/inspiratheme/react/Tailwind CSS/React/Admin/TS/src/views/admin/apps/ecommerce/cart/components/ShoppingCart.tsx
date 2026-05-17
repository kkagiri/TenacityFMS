import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

import { useState } from 'react'
import QuantityCounter from './QuentityCounter'
import { cartItemData, CartItemType } from './data'

const ShoppingCart = () => {
  const [cartItem, setCartItem] = useState<CartItemType[]>(cartItemData)

  const handleQuantityChange = (id: number, newQuantity: number) => {
    setCartItem((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const handleRemove = (id: number) => {
    setCartItem((prev) => prev.filter((item) => item.id !== id))
  }
  return (
    <div className="card">
      <div className="card-header flex justify-between">
        <h4 className="card-title">Shopping Cart</h4>
        <Link to="" className="text-primary font-medium underline underline-offset-4">
          Clear cart
        </Link>
      </div>
      <div className="card-body">
        <div className="table-wrapper">
          <table className="table min-w-full border-collapse">
            <thead className="thead-sm bg-light/25 text-2xs uppercase">
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cartItem.map((item) => (
                <tr key={item.id}>
                  <td className="flex items-center gap-base">
                    <img src={item.image} alt="Watch" className="size-15 rounded" />
                    <div>
                      {item.discount && <span className="badge bg-danger/15 text-danger mb-1.25">-{item.discount}%</span>}
                      <h6 className="mb-1.25">{item.name}</h6>
                      <small className="text-default-400 block">Color: {item.color}</small>
                      <small className="text-default-400 block">Model: {item.model}</small>
                    </div>
                  </td>
                  <td>
                    {item.discount ? (
                      <>
                        <span className="fw-semibold">${item.price.toFixed(2)}</span>
                        <br />
                        <small className="text-default-400 line-through">${(item.price - item.price * (item.discount / 100)).toFixed(2)}</small>
                      </>
                    ) : (
                      <>${item.price.toFixed(2)}</>
                    )}
                  </td>
                  <td>
                    <QuantityCounter id={item.id} quantity={item.quantity} onChange={(value) => handleQuantityChange(item.id, value)} />
                  </td>
                  <td className="font-semibold">${(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <Link to="" className="text-default-400" onClick={() => handleRemove(item.id)}>
                      <Icon icon="x" className="text-base" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-default-300 border-t pt-7.5">
          <Link to="/apps/ecommerce/products-grid" className="text-primary inline-flex items-center gap-1.5 font-medium">
            <Icon icon="arrow-left" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ShoppingCart
