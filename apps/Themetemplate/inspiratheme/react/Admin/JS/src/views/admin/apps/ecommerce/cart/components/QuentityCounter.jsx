import Icon from '@/components/wrappers/Icon'
import { Button, FormControl, InputGroup } from 'react-bootstrap'
const QuantityCounter = ({ id, quantity, onChange, min = 1, max = 800000 }) => {
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
    <InputGroup
      data-touchspin
      style={{
        maxWidth: 130,
      }}
    >
      <Button variant="primary" className="floating" type="button" aria-label="Decrease quantity" onClick={handleDecrease}>
        <Icon icon="minus" />
      </Button>

      <FormControl size="sm" type="number" value={quantity} readOnly className="border-0 text-center" aria-label="Quantity" />

      <Button variant="primary" className="floating" type="button" aria-label="Increase quantity" onClick={handleIncrease}>
        <Icon icon="plus" />
      </Button>
    </InputGroup>
  )
}
export default QuantityCounter
