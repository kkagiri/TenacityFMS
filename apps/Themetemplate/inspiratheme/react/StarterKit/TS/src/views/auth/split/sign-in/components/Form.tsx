import { Link } from 'react-router'
import { Button, Form, FormCheck } from 'react-bootstrap'
import FormCheckInput from 'react-bootstrap/esm/FormCheckInput'
import FormCheckLabel from 'react-bootstrap/esm/FormCheckLabel'

const LoginForm = () => {
  return (
    <Form className="mt-4">
      <div className="mb-3">
        <div className="input-group">
          <input type="email" className="form-control py-2 px-3 bg-light bg-opacity-40 border-light" id="userEmail" placeholder="Enter username or email" required />
        </div>
      </div>
      <div className="mb-3">
        <div className="input-group">
          <input type="password" className="form-control py-2 px-3 bg-light bg-opacity-40 border-light" id="userPassword" placeholder="Enter password" required />
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <FormCheck>
          <FormCheckInput className="form-check-input-light fs-14" type="checkbox" defaultChecked id="rememberMe" />
          <FormCheckLabel>Keep me signed in</FormCheckLabel>
        </FormCheck>
        <Link to="/auth/split/reset-pass" className="text-decoration-underline link-offset-3 text-muted">
          Forgot Password?
        </Link>
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-bold py-2">
          Sign In
        </Button>
      </div>
    </Form>
  )
}

export default LoginForm
