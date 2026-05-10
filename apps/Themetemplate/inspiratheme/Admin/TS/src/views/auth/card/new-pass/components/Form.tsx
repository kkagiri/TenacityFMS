import OTPInput from '@/components/OTPInput'
import PasswordInputWithStrength from '@/components/PasswordInputWithStrength'
import Icon from '@/components/wrappers/Icon'
import { useState } from 'react'
import { Button, Form, FormCheck, FormControl, FormLabel, InputGroup } from 'react-bootstrap'

const NewPassForm = () => {
  const [password, setPassword] = useState('')
  const [code, setCode] = useState<string[]>(Array(6).fill(''))

  return (
    <>
      <Form>
        <div className="mb-3">
          <FormLabel>
            Email address&nbsp;
            <span className="text-danger">*</span>
          </FormLabel>

          <InputGroup>
            <InputGroup.Text className="bg-light">
              <Icon icon="mail" className="fs-xl text-muted" />
            </InputGroup.Text>

            <FormControl type="email" placeholder="you@example.com" disabled />
          </InputGroup>
        </div>
        <div className="mb-3">
          <OTPInput code={code} setCode={setCode} label="Enter your 6-digit code" />
        </div>
        <div className="mb-3" data-password="bar">
          <PasswordInputWithStrength id="userPassword" label="Password" name="user-password" password={password} setPassword={setPassword} placeholder="••••••••" showIcon={true} inputGroup />
        </div>
        <div className="mb-3">
          <FormLabel>
            Confirm New Password&nbsp;
            <span className="text-danger">*</span>
          </FormLabel>
          <InputGroup>
            <InputGroup.Text className="bg-light">
              <Icon icon="lock-password" className="fs-xl text-muted" />
            </InputGroup.Text>
            <FormControl type="password" id="confirmPassword" placeholder="••••••••" required />
          </InputGroup>
        </div>
        <div className="mb-3">
          <FormCheck>
            <FormCheck.Input className="form-check-input-light fs-14" type="checkbox" id="termAndPolicy" />
            <FormCheck.Label htmlFor="termAndPolicy">Agree the Terms &amp; Policy</FormCheck.Label>
          </FormCheck>
        </div>
        <div className="d-grid">
          <Button variant="primary" type="submit" className="fw-semibold py-2">
            Update Password
          </Button>
        </div>
      </Form>
    </>
  )
}

export default NewPassForm
