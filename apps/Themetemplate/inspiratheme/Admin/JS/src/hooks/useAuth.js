import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useSessionStorage } from 'usehooks-ts'
export const useAuth = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [token, setToken, removeToken] = useSessionStorage('token', null)
  const dummyUser = {
    email: 'admin@example.com',
    password: 'password',
    token: 'auth-token',
  }
  const login = (email, password) => {
    try {
      setLoading(true)
      setError(null)
      if (email === dummyUser.email && password === dummyUser.password) {
        setToken(dummyUser.token)
        navigate('/', {
          replace: true,
        })
      } else {
        throw new Error('Invalid email or password')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  const logout = () => {
    removeToken()
    navigate('/auth/sign-in', {
      replace: true,
    })
  }
  const isAuthenticated = token
  return {
    login,
    logout,
    isAuthenticated,
    loading,
    error,
  }
}
