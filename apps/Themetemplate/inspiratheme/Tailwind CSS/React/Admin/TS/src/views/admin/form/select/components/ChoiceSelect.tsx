import Choices from 'choices.js'
import { useEffect, useRef } from 'react'

type ChoiceSelectProps = {
  options?: { label: string; value: string; disabled?: boolean }[]
  groups?: {
    label: string
    disabled?: boolean
    options: { label: string; value: string; disabled?: boolean }[]
  }[]
  multiple?: boolean
  placeholder?: string
  search?: boolean
  removeItem?: boolean
  sorting?: boolean
  limit?: number
  uniqueText?: boolean
  disabled?: boolean
  type?: 'select' | 'text'
  defaultValue?: string | string[]
}

const ChoiceSelect = ({ options = [], groups, multiple = false, placeholder, search = true, removeItem = false, sorting = true, limit, uniqueText = false, disabled = false, type = 'select', defaultValue }: ChoiceSelectProps) => {
  const ref = useRef<HTMLSelectElement | HTMLInputElement | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const instance = new Choices(ref.current, {
      placeholderValue: placeholder,
      searchEnabled: search,
      removeItemButton: removeItem,
      shouldSort: sorting,
      maxItemCount: limit,
      duplicateItemsAllowed: !uniqueText,
    })

    if (disabled) instance.disable()

    return () => {
      instance.destroy()
    }
  }, [])

  if (type === 'text') {
    return <input ref={ref as React.RefObject<HTMLInputElement>} className="form-input" type="text" defaultValue={defaultValue as string} />
  }

  return (
    <select ref={ref as React.RefObject<HTMLSelectElement>} className="form-input" multiple={multiple} defaultValue={defaultValue}>
      {placeholder && !multiple && <option value="">{placeholder}</option>}

      {groups
        ? groups.map((group) => (
            <optgroup key={group.label} label={group.label} disabled={group.disabled}>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))
        : options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
    </select>
  )
}

export default ChoiceSelect
