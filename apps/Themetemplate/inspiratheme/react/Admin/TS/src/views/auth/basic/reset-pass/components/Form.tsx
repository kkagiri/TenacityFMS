import { Button, Form, FormCheck, FormControl, FormLabel } from 'react-bootstrap'

const ResetForm = () => {
  return (
    <>
      <Form>
        <div className="mb-3">
          <FormLabel>
            Email address
            <span className="text-danger"> *</span>
          </FormLabel>

          <FormControl type="email" placeholder="you@example.com" required />
        </div>
        <div className="mb-3">
          <FormCheck>
            <Form.Check.Input className="form-check-input-light fs-14" type="checkbox" id="termAndPolicy" />
            <Form.Check.Label htmlFor="termAndPolicy">Agree the Terms &amp; Policy</Form.Check.Label>
          </FormCheck>
        </div>
        <div className="d-grid">
          <Button variant="primary" type="submit" className="fw-semibold py-2">
            Send Request
          </Button>
        </div>
      </Form>
    </>
  )
}

export default ResetForm
