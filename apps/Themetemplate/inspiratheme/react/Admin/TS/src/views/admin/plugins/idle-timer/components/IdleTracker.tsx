import Icon from '@/components/wrappers/Icon'
import { useEffect, useState } from 'react'
import { Alert, Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import { useIdleTimer } from 'react-idle-timer'

import { useNotificationContext } from '@/context/useNotificationContext'

const INACTIVE_DURATION = 5000

const IdleTracker = () => {
  const [state, setState] = useState<'Active' | 'Inactive'>('Active')
  const [remaining, setRemaining] = useState<number>(INACTIVE_DURATION)
  const { showNotification } = useNotificationContext()

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
  }, [])

  useEffect(() => {
    if (state === 'Active') {
      showNotification({
        title: 'Welcome back',
        message: 'We missed you! Welcome back!',
        variant: 'success',
      })
    } else {
      showNotification({
        title: 'Idle Alert',
        message: "You've been inactive for too long. Please interact with the page to continue.",
        variant: 'warning',
      })
    }
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Idle Timer</CardTitle>
      </CardHeader>
      <CardBody>
        {state === 'Inactive' && (
          <Alert variant="danger" className="idle-alert">
            Your session has expired. Please move your mouse to resume your activity.
          </Alert>
        )}

        <p className="text-muted">The Idle Timer plugin allows you to monitor user activity on the page. Idle is defined as a lack of mouse movement, scrolling, or keyboard input.</p>

        <div className="text-center p-3 h-200">
          <Icon icon="fingerprint" className="fs-36 mb-3 d-inline-block mx-auto" />
          <h3 className="fst-italic">Please stay idle for {remaining} seconds</h3>
        </div>
        <p className="mb-0">
          You can instantiate the timer either statically or on a specific element. Element-bound timers will only track activity within that element, whereas global timers will monitor activity on the entire page. To set up page-level activity, you can initialize the timer on{' '}
          <code>document</code>, <code>document.documentElement</code>, or <code>document.body</code>. the node HTML node can be passed to the <code>useIdleTimer</code> hook. as <code>element</code> tag
        </p>
      </CardBody>
    </Card>
  )
}

export default IdleTracker
