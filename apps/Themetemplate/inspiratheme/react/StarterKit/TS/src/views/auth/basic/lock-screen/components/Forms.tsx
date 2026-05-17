import { Button, Form, FormControl, FormLabel } from 'react-bootstrap'

const Forms = () => {
  return (
    <Form>
      <div className="mb-3">
        <FormLabel>
          Password
          <span className="text-danger">&nbsp;*</span>
        </FormLabel>
        <div className="input-group">
          <FormControl type="password" id="userPassword" placeholder="••••••••" required />
        </div>
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2">
          Unlock
        </Button>
      </div>
    </Form>
  )
}

export default Forms
