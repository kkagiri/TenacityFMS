import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect, useEffectEvent } from 'react'
const LayoutSwitcher = ({ attribute, value }) => {
  const { updateSettings } = useLayoutContext()
  const onUpdate = useEffectEvent(updateSettings)
  useEffect(() => {
    onUpdate({
      [attribute]: value,
    })
  }, [attribute, value])
  return null
}
export default LayoutSwitcher
