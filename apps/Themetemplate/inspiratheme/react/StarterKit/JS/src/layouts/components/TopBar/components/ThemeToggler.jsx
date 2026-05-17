import Icon from '@/components/wrappers/Icon'
import { useLayoutContext } from '@/context/useLayoutContext'
const ThemeMode = () => {
  const { theme, updateSettings } = useLayoutContext()
  const toggleTheme = () => {
    updateSettings({
      theme: theme === 'light' ? 'dark' : 'light',
    })
  }
  return (
    <div id="theme-toggler" className="topbar-item d-none d-sm-flex">
      <button className="topbar-link" id="light-dark-mode" type="button" onClick={toggleTheme}>
        <span className="topbar-link-icon mode-light-moon">
          <Icon icon="sun" className="" />
        </span>
        <span className="topbar-link-icon mode-light-sun">
          <Icon icon="moon" className="" />
        </span>
      </button>
    </div>
  )
}
export default ThemeMode
