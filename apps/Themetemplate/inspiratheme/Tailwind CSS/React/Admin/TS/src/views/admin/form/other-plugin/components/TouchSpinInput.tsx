import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { useState } from 'react'

type TouchSpinInputProps = {
  value?: number
  min?: number
  max?: number
  readOnly?: boolean
  disabled?: boolean

  wrapperClass?: string
  inputClass?: string
  minusBtnClass?: string
  plusBtnClass?: string

  order?: 'minus-input-plus' | 'input-minus-plus' | 'minus-plus-input'
  vertical?: boolean
}

const TouchSpinInput = ({
  value = 100,
  min = 0,
  max = 800000,
  readOnly = false,
  disabled = false,
  wrapperClass = 'input-group',
  inputClass = 'form-input',
  minusBtnClass = 'btn bg-light hover:text-primary',
  plusBtnClass = 'btn bg-light hover:text-primary',
  order = 'minus-input-plus',
  vertical = false,
}: TouchSpinInputProps) => {
  const [val, setVal] = useState(value)

  const inc = () => !readOnly && !disabled && val < max && setVal(val + 1)
  const dec = () => !readOnly && !disabled && val > min && setVal(val - 1)

  if (vertical) {
    return (
      <div className={wrapperClass} data-touchspin>
        <div className="flex-col flex">
          <button type="button" className={plusBtnClass} onClick={inc}>
            <Icon icon="plus" />
          </button>
          <button type="button" className={minusBtnClass} onClick={dec}>
            <Icon icon="minus" />
          </button>
        </div>
        <input type="number" className={inputClass} defaultValue={val} min={min} max={max} readOnly={readOnly} disabled={disabled} />
      </div>
    )
  }

  const Minus = (
    <button type="button" className={minusBtnClass} onClick={dec} key="minus">
      <Icon icon="minus" />
    </button>
  )

  const Plus = (
    <button type="button" className={plusBtnClass} onClick={inc} key="plus">
      <Icon icon="plus" />
    </button>
  )

  const Input = <input type="text" className={inputClass} defaultValue={val} readOnly={readOnly} disabled={disabled} key="input" />

  const layoutMap = {
    'minus-input-plus': [Minus, Input, Plus],
    'input-minus-plus': [Input, Minus, Plus],
    'minus-plus-input': [Minus, Plus, Input],
  }

  return (
    <div className={clsx(wrapperClass)} data-touchspin>
      {layoutMap[order]}
    </div>
  )
}

export default TouchSpinInput
