import { LayoutProvider } from '@/context/useLayoutContext'
import { NotificationProvider } from '@/context/useNotificationContext'
import { useAuth } from '@/hooks/useAuth'
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
  return (
    <LayoutProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </LayoutProvider>
  )
}

export default AppProvidersWrapper
