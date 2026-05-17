import PasswordInputWithStrength from '@/components/PasswordInputWithStrength'
import { META_DATA } from '@/config/constants'
import { useState } from 'react'
import { Button, Form, FormCheck, FormControl, FormLabel } from 'react-bootstrap'

const Forms = () => {
  const [password, setPassword] = useState('')

  return (
    <Form>
      <div className="mb-3">
        <FormLabel>
          Name <span className="text-danger">*</span>
        </FormLabel>
        <FormControl type="text" placeholder={META_DATA.username} required />
      </div>
      <div className="mb-3">
        <FormLabel>
          Email address <span className="text-danger">*</span>
        </FormLabel>
        <FormControl type="email" placeholder="you@example.com" required />
      </div>
      <div className="mb-3" data-password="bar">
        <PasswordInputWithStrength id="password" label="Password" name="password" password={password} setPassword={setPassword} placeholder="••••••••" />
      </div>
      <div className="mb-3">
        <FormCheck>
          <Form.Check.Input className="form-check-input-light fs-14" type="checkbox" id="termAndPolicy" />
          <Form.Check.Label htmlFor="termAndPolicy">Agree the Terms &amp; Policy</Form.Check.Label>
        </FormCheck>
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2">
          Create Account
        </Button>
      </div>
    </Form>
  )
}

export default Forms
