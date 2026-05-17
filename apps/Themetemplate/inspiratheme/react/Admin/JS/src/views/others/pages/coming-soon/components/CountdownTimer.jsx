import { useEffect, useMemo, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
export const useCountdown = (targetDate) => {
  const countDownDate = new Date(targetDate).getTime()
  const calculateTimeLeft = () => {
    const now = new Date().getTime()
    const distance = countDownDate - now
    const days = Math.max(Math.floor(distance / (1000 * 60 * 60 * 24)), 0)
    const hours = Math.max(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), 0)
    const minutes = Math.max(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)), 0)
    const seconds = Math.max(Math.floor((distance % (1000 * 60)) / 1000), 0)
    return {
      days,
      hours,
      minutes,
      seconds,
    }
  }
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])
  return timeLeft
}
const CountdownTimer = () => {
  // Target date is 4 days from now (in milliseconds)
  const targetDate = useMemo(() => {
    const now = new Date()
    now.setDate(now.getDate() + 4)
    return now
  }, [])
  const { days, hours, minutes, seconds } = useCountdown(targetDate)
  return (
    <>
      <Row className="text-center justify-content-center my-4 g-4">
        <Col xs={6} sm={4} md={3} className="col-lg">
          <div className="bg-light bg-opacity-10 px-2 py-4 rounded shadow-inner">
            <h2 id="days" className="fw-bold text-primary fs-36">
              {days}
            </h2>
            <p className="fw-semibold fs-xs mb-0">Days</p>
          </div>
        </Col>
        <Col xs={6} sm={4} md={3} className="col-lg">
          <div className="bg-light bg-opacity-10 px-2 py-4 rounded shadow-inner">
            <h3 id="hours" className="fw-bold text-primary fs-36">
              {hours}
            </h3>
            <p className="fw-semibold fs-xs mb-0">Hours</p>
          </div>
        </Col>
        <Col xs={6} sm={4} md={3} className="col-lg">
          <div className="bg-light bg-opacity-10 px-2 py-4 rounded shadow-inner">
            <h3 id="minutes" className="fw-bold text-primary fs-36">
              {minutes}
            </h3>
            <p className="fw-semibold fs-xs mb-0">Minutes</p>
          </div>
        </Col>
        <Col xs={6} sm={4} md={3} className="col-lg">
          <div className="bg-light bg-opacity-10 px-2 py-4 rounded shadow-inner">
            <h3 id="seconds" className="fw-bold text-primary fs-36">
              {seconds}
            </h3>
            <p className="fw-semibold fs-xs mb-0">Seconds</p>
          </div>
        </Col>
      </Row>
    </>
  )
}
export default CountdownTimer
