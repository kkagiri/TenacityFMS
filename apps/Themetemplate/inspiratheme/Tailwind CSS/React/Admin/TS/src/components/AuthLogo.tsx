import logoDark from '@/assets/images/logo-black.png'
import logo from '@/assets/images/logo.png'
import { Link } from 'react-router'

const AuthLogo = () => {
  return (
    <>
      <Link to="/" className="auth-logo">
        <img src={logoDark} alt="logo" className="flex dark:hidden" />
        <img src={logo} alt="dark logo" className="hidden dark:flex" />
      </Link>
    </>
  )
}

export default AuthLogo
