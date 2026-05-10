import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Button, Form, FormCheck, FormControl, FormLabel, InputGroup } from 'react-bootstrap'

const LoginForm = () => {
  return (
    <Form>
      <div className="mb-3">
        <FormLabel>
          Email address
          <span className="text-danger">&nbsp;*</span>
        </FormLabel>

        <InputGroup>
          <InputGroup.Text className="bg-light">
            <Icon icon="mail" className="fs-xl text-muted" />
          </InputGroup.Text>

          <FormControl type="email" id="userEmail" placeholder="you@example.com" required />
        </InputGroup>
      </div>
      <div className="mb-3">
        <FormLabel>
          Password
          <span className="text-danger">&nbsp;*</span>
        </FormLabel>
        <InputGroup>
          <InputGroup.Text className="bg-light">
            <Icon icon="lock-password" className="fs-xl text-muted" />
          </InputGroup.Text>

          <FormControl type="password" id="userPassword" placeholder="••••••••" required />
        </InputGroup>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <FormCheck>
          <Form.Check.Input className="form-check-input form-check-input-light fs-14" type="checkbox" id="rememberMe" />
          <Form.Check.Label className="form-check-label" htmlFor="rememberMe">
            Keep me signed in
          </Form.Check.Label>
        </FormCheck>
        <Link to="/auth/card/reset-pass" className="text-decoration-underline link-offset-3 text-muted">
          Forgot Password?
        </Link>
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2">
          Sign In
        </Button>
      </div>
    </Form>
  )
}

export default LoginForm
