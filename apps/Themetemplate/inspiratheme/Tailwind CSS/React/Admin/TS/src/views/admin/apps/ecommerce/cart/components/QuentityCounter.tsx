import Icon from '@/components/wrappers/Icon'

const QuantityCounter = ({ id, quantity, onChange, min = 1, max = 800000 }: { quantity: number; id: number; onChange: (id: number, newQuantity: number) => void; min?: number; max?: number }) => {
  const handleDecrease = () => {
    if (quantity > min) {
      onChange(id, quantity - 1)
    }
  }

  const handleIncrease = () => {
    if (quantity < max) {
      onChange(id, quantity + 1)
    }
  }

  return (
    <div className="input-group max-w-32.5" data-touchspin>
      <button type="button" className="btn bg-primary text-white hover:bg-primary-hover" onClick={handleDecrease}>
        <Icon icon="minus" />
      </button>
      <input type="text" className="form-input select-none" defaultValue={quantity} max={800000} />
      <button type="button" className="btn bg-primary text-white hover:bg-primary-hover" onClick={handleIncrease}>
        <Icon icon="plus" />
      </button>
    </div>
  )
}

export default QuantityCounter
