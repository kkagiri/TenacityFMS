import logoBlack from '@/assets/images/logo-black.png'
import logoSm from '@/assets/images/logo-sm.png'
import logo from '@/assets/images/logo.png'

const AppLogo = () => {
  return (
    <>
      <div className="logo-light">
        <img src={logo} className="logo-lg h-6" alt="Light logo" />
        <img src={logoSm} className="logo-sm h-6" alt="Small logo" />
      </div>
      <div className="logo-dark">
        <img src={logoBlack} className="logo-lg h-6" alt="Dark logo" />
        <img src={logoSm} className="logo-sm h-6" alt="Small logo" />
      </div>
    </>
  )
}

export default AppLogo
