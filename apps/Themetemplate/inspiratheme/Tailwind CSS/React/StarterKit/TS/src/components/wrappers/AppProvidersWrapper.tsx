import { LayoutProvider } from '@/context/useLayoutContext'
import { useAuth } from '@/hooks/useAuth'
import { preline } from '@/utils/preline'
import { useNavigate } from 'react-router'
import React, { useEffect } from 'react'

const AppProvidersWrapper = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()

  const { isAuthenticated } = useAuth()
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/sign-in', { replace: true })
    }
  }, [])
  preline.init()
  return <LayoutProvider>{children}</LayoutProvider>
}

export default AppProvidersWrapper
