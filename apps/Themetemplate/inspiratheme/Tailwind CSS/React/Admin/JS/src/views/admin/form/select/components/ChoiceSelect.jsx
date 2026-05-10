import Choices from 'choices.js'
import { useEffect, useRef } from 'react'
const ChoiceSelect = ({ options = [], groups, multiple = false, placeholder, search = true, removeItem = false, sorting = true, limit, uniqueText = false, disabled = false, type = 'select', defaultValue }) => {
  const ref = useRef(null)
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
    return <input ref={ref} className="form-input" type="text" defaultValue={defaultValue} />
  }
  return (
    <select ref={ref} className="form-input" multiple={multiple} defaultValue={defaultValue}>
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
