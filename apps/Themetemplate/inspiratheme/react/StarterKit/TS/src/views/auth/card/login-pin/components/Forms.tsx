import OTPInput from '@/components/OTPInput'
import { useState } from 'react'
import { Button, Form, FormGroup } from 'react-bootstrap'

const Forms = () => {
  const [code, setCode] = useState<string[]>(Array(6).fill(''))

  return (
    <>
      <Form>
        <FormGroup className="mb-3">
          <OTPInput code={code} setCode={setCode} label="Enter your 6-digit code" />
        </FormGroup>
        <div className="d-grid">
          <Button variant="primary" type="submit" className="fw-semibold py-2">
            Confirm
          </Button>
        </div>
      </Form>
    </>
  )
}

export default Forms
