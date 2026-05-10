import PasswordInputWithStrength from '@/components/PasswordInputWithStrength'
import { useState } from 'react'
import { Button, Form, FormCheck, FormControl } from 'react-bootstrap'

const Forms = () => {
  const [password, setPassword] = useState('')

  return (
    <>
      <Form className="mt-4">
        <div className="mb-3">
          <div className="input-group">
            <FormControl type="text" id="userName" placeholder="Enter name" required className="py-2 px-3 bg-light bg-opacity-40 border-light" />
          </div>
        </div>
        <div className="mb-3">
          <div className="input-group">
            <FormControl type="email" id="userEmail" placeholder="Enter email" required className="py-2 px-3 bg-light bg-opacity-40 border-light" />
          </div>
        </div>
        <div className="mb-3" data-password="bar">
          <PasswordInputWithStrength name="user-password" password={password} setPassword={setPassword} placeholder="Enter password" inputClassName="form-control py-2 px-3 bg-light bg-opacity-40 border-light" showIcon={false} />
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <FormCheck>
            <FormCheck.Input className="form-check-input-light fs-14" type="checkbox"></FormCheck.Input>
            <FormCheck.Label htmlFor="termAndPolicy">Agree the Terms &amp; Policy</FormCheck.Label>
          </FormCheck>
        </div>
        <div className="d-grid">
          <Button variant="primary" type="submit" className="fw-semibold py-2">
            Create Account
          </Button>
        </div>
      </Form>
    </>
  )
}

export default Forms
