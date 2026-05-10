import logoBlack from '@/assets/images/logo-black.png'
import logoSm from '@/assets/images/logo-sm.png'
import logo from '@/assets/images/logo.png'
import useScrollEvent from '@/hooks/useScrollEvent'
import clsx from 'clsx'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router'
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
      className={clsx('app-topbar', {
        'topbar-active': scrollY > 50,
      })}
    >
      <Container fluid className="topbar-menu">
        <div className="d-flex align-items-center gap-2">
          <div className="logo-topbar">
            <Link to="/" className="logo-light">
              <span className="logo-lg">
                <img src={logo} alt="logo" />
              </span>
              <span className="logo-sm">
                <img src={logoSm} alt="small logo" />
              </span>
            </Link>
            <Link to="/" className="logo-dark">
              <span className="logo-lg">
                <img src={logoBlack} alt="dark logo" />
              </span>
              <span className="logo-sm">
                <img src={logoSm} alt="small logo" />
              </span>
            </Link>
          </div>

          <MenuToggler />

          <SearchBox />

          <MegamenuHeader />

          <MegamenuApps />
        </div>
        <div className="d-flex align-items-center gap-2">
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
      </Container>
    </header>
  )
}
export default TopBar
