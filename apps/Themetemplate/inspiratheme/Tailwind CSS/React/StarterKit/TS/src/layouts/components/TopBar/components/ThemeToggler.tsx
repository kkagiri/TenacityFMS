import Icon from '@/components/wrappers/Icon'
import { useLayoutContext } from '@/context/useLayoutContext'

const ThemeMode = () => {
  const { theme, updateSettings } = useLayoutContext()

  const toggleTheme = () => {
    updateSettings({ theme: theme === 'light' ? 'dark' : 'light' })
  }
  return (
    <div className="topbar-item" id="theme-toggler">
      <button className="topbar-link btn btn-icon size-8 rounded-full transition-[scale,background]" id="light-dark-mode" type="button" onClick={toggleTheme}>
        <Icon icon="moon" className="absolute scale-100 rotate-0 text-xl transition-all duration-200 dark:scale-0 dark:-rotate-90" />
        <Icon icon="sun" className="absolute scale-0 rotate-90 text-xl transition-all duration-200 dark:scale-100 dark:rotate-0" />
      </button>
    </div>
  )
}

export default ThemeMode
