import useScrollEvent from '@/hooks/useScrollEvent'
import clsx from 'clsx'
import CustomizerToggler from './components/CustomizerToggler'
import MenuToggler from './components/MenuToggler'

import AppsDropdownRounded from './components/AppsDropdownRounded'

import FullscreenToggler from './components/FullscreenToggler'
import LanguageSelector from './components/LanguageSelector'

import MegamenuApps from './components/MegamenuApps'

import MegamenuHeader from './components/MegamenuHeader'

import MonochromeToggler from './components/MonochromeToggler'
import NotificationDropdownAlert from './components/NotificationDropdownAlert'

import SearchBox from './components/SearchBox'

import SimpleMessagesDropdown from './components/SimpleMessagesDropdown'

import ThemeToggler from './components/ThemeToggler'

import SimpleUserDropdown from './components/SimpleUserDropdown'

const TopBar = () => {
  const { scrollY } = useScrollEvent()

  return (
    <header className={clsx('app-header', { 'topbar-active': scrollY > 50 })}>
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
