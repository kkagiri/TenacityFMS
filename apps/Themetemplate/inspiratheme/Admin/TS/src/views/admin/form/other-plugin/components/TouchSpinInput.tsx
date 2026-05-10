import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { type ChangeEvent, useEffect, useState } from 'react'
import { Button, FormControl, type FormControlProps } from 'react-bootstrap'
import { type ButtonVariant } from 'react-bootstrap/types'

type PropsType = {
  min?: number
  max?: number
  value?: number
  setValue?: (value: number) => void
  className?: string
  inputClassName?: string
  buttonClassName?: string
  buttonClassName2?: string
  variant?: ButtonVariant
  size?: FormControlProps['size']
  vertical?: boolean
} & Omit<FormControlProps, 'value' | 'onChange'>

const TouchSpinInput = ({ min = 0, max = 100, value, setValue, className, inputClassName, buttonClassName, buttonClassName2, variant = 'light', size, vertical = false, ...props }: PropsType) => {
  const [localValue, setLocalValue] = useState<number>(value ?? 0)

  const increment = () => {
    if (!props.readOnly) {
      setLocalValue((prev) => (prev >= max ? prev : prev + 1))
    }
  }

  const decrement = () => {
    if (!props.readOnly) {
      setLocalValue((prev) => (prev <= min ? prev : prev - 1))
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      setLocalValue(min)
      return
    }
    const newValue = parseInt(val)
    if (isNaN(newValue)) return
    if (newValue < min) return setLocalValue(min)
    if (newValue > max) return setLocalValue(max)
    setLocalValue(newValue)
  }

  useEffect(() => {
    if (setValue) setValue(localValue)
  }, [localValue])

  return (
    <div className={clsx('input-group', className)} data-touchspin>
      {vertical ? (
        <>
          <div className="btn-group-vertical">
            <Button className={clsx(buttonClassName)} disabled={props.disabled || localValue <= min} onClick={decrement}>
              <Icon icon="plus" />
            </Button>
            <Button className={clsx(buttonClassName2)} disabled={props.disabled || localValue >= max} onClick={increment}>
              <Icon icon="minus" />
            </Button>
          </div>
          <FormControl type="number" size={size} min={min} max={max} value={localValue} onChange={handleChange} className={clsx(inputClassName, size)} {...props} />
        </>
      ) : (
        <>
          <Button variant={variant} className={clsx(buttonClassName)} disabled={props.disabled || localValue <= min} onClick={decrement}>
            <Icon icon="minus" />
          </Button>
          <FormControl type="number" size={size} min={min} max={max} value={localValue} onChange={handleChange} className={clsx(inputClassName, size)} {...props} />
          <Button variant={variant} className={clsx(buttonClassName)} disabled={props.disabled || localValue >= max} onClick={increment}>
            <Icon icon="plus" />
          </Button>
        </>
      )}
    </div>
  )
}

export default TouchSpinInput
