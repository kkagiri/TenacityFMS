import OTPInput from '@/components/OTPInput'
import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
const LoginPinForm = () => {
  const [code, setCode] = useState(Array(6).fill(''))
  return (
    <Form>
      <div className="form-group mb-3">
        <OTPInput code={code} setCode={setCode} label="Enter your 6-digit code" labelClassName="d-flex" inputClassName="form-control py-2 bg-light bg-opacity-40 border-light text-center" />
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2">
          Confirm
        </Button>
      </div>
    </Form>
  )
}
export default LoginPinForm
