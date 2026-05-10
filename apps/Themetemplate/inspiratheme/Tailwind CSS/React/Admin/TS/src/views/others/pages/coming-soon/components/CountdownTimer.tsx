import { useEffect, useMemo, useState } from 'react'

type CountdownResultType = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export const useCountdown = (targetDate: string | Date): CountdownResultType => {
  const countDownDate = new Date(targetDate).getTime()

  const calculateTimeLeft = (): CountdownResultType => {
    const now = new Date().getTime()
    const distance = countDownDate - now

    const days = Math.max(Math.floor(distance / (1000 * 60 * 60 * 24)), 0)
    const hours = Math.max(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), 0)
    const minutes = Math.max(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)), 0)
    const seconds = Math.max(Math.floor((distance % (1000 * 60)) / 1000), 0)

    return { days, hours, minutes, seconds }
  }

  const [timeLeft, setTimeLeft] = useState<CountdownResultType>(calculateTimeLeft())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return timeLeft
}

const CountdownTimer = () => {
  const targetDate = useMemo(() => {
    const now = new Date()
    now.setDate(now.getDate() + 4)
    return now
  }, [])

  const { days, hours, minutes, seconds } = useCountdown(targetDate)

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <div className="bg-default-50 bg-opacity-10 text-primary rounded px-3 py-6 text-center">
          <h2 id="days" className="mb-2 text-4xl font-bold">
            {days}
          </h2>
          <p className="font-semibold text-default-800 text-xs">Days</p>
        </div>
        <div className="bg-default-50 bg-opacity-10 text-primary rounded px-3 py-6 text-center">
          <h2 id="hours" className="mb-2 text-4xl font-bold">
            {hours}
          </h2>
          <p className="font-semibold text-default-800 text-xs">Hours</p>
        </div>
        <div className="bg-default-50 bg-opacity-10 text-primary rounded px-3 py-6 text-center">
          <h2 id="minutes" className="mb-2 text-4xl font-bold">
            {minutes}
          </h2>
          <p className="font-semibold text-default-800 text-xs">Minutes</p>
        </div>
        <div className="bg-default-50 bg-opacity-10 text-primary rounded px-3 py-6 text-center">
          <h2 id="seconds" className="mb-2 text-4xl font-bold">
            {seconds}
          </h2>
          <p className="font-semibold text-default-800 text-xs">Seconds</p>
        </div>
      </div>
    </>
  )
}

export default CountdownTimer
