import Icon from '@/components/wrappers/Icon'
import { Button, Form, FormCheck, FormControl, FormLabel, InputGroup } from 'react-bootstrap'

const ResetForm = () => {
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
        <FormCheck>
          <FormCheck.Input className="form-check-input-light fs-14" type="checkbox" id="termAndPolicy" />
          <FormCheck.Label>Agree the Terms &amp; Policy</FormCheck.Label>
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
