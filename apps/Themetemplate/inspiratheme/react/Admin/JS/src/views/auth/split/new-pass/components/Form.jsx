import OTPInput from '@/components/OTPInput'
import PasswordInputWithStrength from '@/components/PasswordInputWithStrength'
import { useState } from 'react'
import { Button, Form, FormCheck } from 'react-bootstrap'
const NewPassForm = () => {
  const [code, setCode] = useState(Array(6).fill(''))
  const [password, setPassword] = useState('')
  return (
    <Form>
      <div className="mb-3">
        <div className="input-group">
          <input type="email" className="form-control py-2 px-3 bg-light bg-opacity-40 border-light" id="userEmail" placeholder="you@example.com" disabled />
        </div>
      </div>
      <div className="mb-3">
        <OTPInput code={code} setCode={setCode} label="Enter your 6-digit code" labelClassName="d-flex" inputClassName="form-control py-2 bg-light bg-opacity-40 border-light text-center" />
      </div>

      <div className="mb-3" data-password="bar">
        <PasswordInputWithStrength name="user-password" password={password} setPassword={setPassword} placeholder="Enter Password" inputClassName="form-control py-2 px-3 bg-light bg-opacity-40 border-light" showIcon={false} />
      </div>
      <div className="mb-3">
        <div className="input-group">
          <input type="password" className="form-control py-2 px-3 bg-light bg-opacity-40 border-light" id="userPassword" placeholder="Confirm New password" required />
        </div>
      </div>
      <div className="mb-3 d-flex">
        <FormCheck>
          <FormCheck.Input className="form-check-input-light fs-14" type="checkbox" defaultChecked id="termAndPolicy" />
          <FormCheck.Label htmlFor="termAndPolicy">Agree the Terms &amp; Policy</FormCheck.Label>
        </FormCheck>
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2">
          Update Password
        </Button>
      </div>
    </Form>
  )
}
export default NewPassForm
