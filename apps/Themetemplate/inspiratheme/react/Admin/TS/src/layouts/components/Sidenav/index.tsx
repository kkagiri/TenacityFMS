import AppLogo from '@/components/AppLogo'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import AppMenu from './components/AppMenu'
import OffcanvasToggle from './components/OffcanvasToggle'
import OnHoverToggle from './components/OnHoverToggle'

import UserProfileSettings from './components/UserProfileSettings'

const Sidenav = () => {
  return (
    <div className="sidenav-menu" id="sidenav">
      <AppLogo />

      <OnHoverToggle />

      <OffcanvasToggle />

      <SimpleBar className="scrollbar">
        <UserProfileSettings />

        <div id="sidenav-menu">
          <AppMenu />
        </div>
      </SimpleBar>
    </div>
  )
}

export default Sidenav
