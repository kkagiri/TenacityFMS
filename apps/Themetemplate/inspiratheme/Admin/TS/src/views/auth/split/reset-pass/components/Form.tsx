import { Button, Form, FormCheck, FormControl } from 'react-bootstrap'

const ResetForm = () => {
  return (
    <Form className="mt-4">
      <div className="mb-3">
        <div className="input-group">
          <FormControl type="email" id="userEmail" placeholder="Enter email" required className="py-2 px-3 bg-light bg-opacity-40 border-light" />
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <FormCheck>
          <FormCheck.Input className="form-check-input-light fs-14" type="checkbox" id="termAndPolicy" />
          <FormCheck.Label>Agree the Terms & Policy</FormCheck.Label>
        </FormCheck>
      </div>

      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2">
          Send Request
        </Button>
      </div>
    </Form>
  )
}

export default ResetForm
