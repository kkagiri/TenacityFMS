import Icon from '@/components/wrappers/Icon'
import { useEffect, useState } from 'react'
import { useIdleTimer } from 'react-idle-timer'
import { ToastContainer, toast } from 'react-toastify'

const INACTIVE_DURATION = 5000
const WARNING_TOAST_ID = 'idle-warning'
const IdleTracker = () => {
  const [state, setState] = useState<'Active' | 'Inactive'>('Active')
  const [remaining, setRemaining] = useState<number>(INACTIVE_DURATION)

  const { getRemainingTime } = useIdleTimer({
    onIdle: () => {
      setState('Inactive')
    },
    onActive: () => {
      setState('Active')
    },
    onAction: () => {
      setState('Active')
    },
    timeout: INACTIVE_DURATION,
    throttle: 500,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.ceil(getRemainingTime() / 1000))
    }, 500)

    return () => {
      clearInterval(interval)
    }
  }, [getRemainingTime])

  useEffect(() => {
    if (state === 'Inactive') {
      if (!toast.isActive(WARNING_TOAST_ID)) {
        toast.warning("You've been inactive for too long. Please interact with the page to continue.", {
          toastId: WARNING_TOAST_ID,
          autoClose: false,
          hideProgressBar: true,
          theme: 'colored',
        })
      }
    } else {
      toast.dismiss(WARNING_TOAST_ID)
      toast.success('Welcome back!', {
        hideProgressBar: true,
        autoClose: 2000,
        theme: 'colored',
      })
    }
  }, [state])
  return (
    <>
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Idle Timer Plugin</h4>
        </div>
        <div className="card-body">
          {state === 'Inactive' && (
            <div className="bg-danger/15 text-danger idle-alert mb-4 rounded px-4 py-3" role="alert">
              Your session has expired. Please move your mouse to resume your activity.
            </div>
          )}
          <p className="text-default-400">The Idle Timer plugin allows you to monitor user activity on the page. Idle is defined as a lack of mouse movement, scrolling, or keyboard input.</p>
          <div className="p-6 text-center">
            <Icon icon="fingerprint" className="block mb-5 text-4xl mx-auto" />
            <h3 className="mb-2 text-2xl italic">Please stay idle for {remaining} seconds</h3>
          </div>
          <p>You can instantiate the timer either statically or on a specific element. Element-bound timers will only track activity within that element, whereas global timers will monitor activity on the entire page.</p>
        </div>
      </div>
      <ToastContainer />
    </>
  )
}

export default IdleTracker
