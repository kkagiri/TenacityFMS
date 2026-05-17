import useScrollEvent from '@/hooks/useScrollEvent'
import clsx from 'clsx'
import AppsDropdownRounded from './components/AppsDropdownRounded'
import CustomizerToggler from './components/CustomizerToggler'
import FullscreenToggler from './components/FullscreenToggler'
import LanguageSelector from './components/LanguageSelector'
import MegamenuApps from './components/MegamenuApps'
import MegamenuHeader from './components/MegamenuHeader'
import MenuToggler from './components/MenuToggler'
import MonochromeToggler from './components/MonochromeToggler'
import NotificationDropdownAlert from './components/NotificationDropdownAlert'
import SearchBox from './components/SearchBox'
import SimpleMessagesDropdown from './components/SimpleMessagesDropdown'
import SimpleUserDropdown from './components/SimpleUserDropdown'
import ThemeToggler from './components/ThemeToggler'
const TopBar = () => {
  const { scrollY } = useScrollEvent()
  return (
    <header
      className={clsx('app-header', {
        'topbar-active': scrollY > 50,
      })}
    >
      <div className="container-fluid flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MenuToggler />

          <SearchBox />

          <MegamenuHeader />

          <MegamenuApps />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggler />

          <AppsDropdownRounded />

          <SimpleMessagesDropdown />

          <NotificationDropdownAlert />

          <FullscreenToggler />

          <MonochromeToggler />

          <CustomizerToggler />

          <LanguageSelector />

          <SimpleUserDropdown />
        </div>
      </div>
    </header>
  )
}
export default TopBar
