import { LayoutProvider } from '@/context/useLayoutContext'
import { useAuth } from '@/hooks/useAuth'
import { preline } from '@/utils/preline'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
const AppProvidersWrapper = ({ children }) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/sign-in', {
        replace: true,
      })
    }
  }, [])
  preline.init()
  return <LayoutProvider>{children}</LayoutProvider>
}
export default AppProvidersWrapper
