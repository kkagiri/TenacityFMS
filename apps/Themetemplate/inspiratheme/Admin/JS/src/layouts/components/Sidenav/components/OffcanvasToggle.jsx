import Icon from '@/components/wrappers/Icon'
import { hideBackdrop } from '@/context/useLayoutContext'
const OffcanvasToggle = () => {
  return (
    <button className="button-close-offcanvas" onClick={hideBackdrop}>
      <Icon icon="menu-4" className="fs-22 align-middle" />
    </button>
  )
}
export default OffcanvasToggle
