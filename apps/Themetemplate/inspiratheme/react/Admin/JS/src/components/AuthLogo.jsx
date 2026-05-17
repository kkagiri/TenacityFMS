import logoBlack from '@/assets/images/logo-black.png'
import logo from '@/assets/images/logo.png'
import { Link } from 'react-router'
const AuthLogo = () => {
  return (
    <>
      <Link to="/" className="logo-dark">
        <img src={logoBlack} alt="dark logo" />
      </Link>
      <Link to="/" className="logo-light">
        <img src={logo} alt="logo" />
      </Link>
    </>
  )
}
export default AuthLogo
