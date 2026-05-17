import Icon from '@/components/wrappers/Icon'
import { Button, Form, FormControl, FormLabel, InputGroup } from 'react-bootstrap'

const Forms = () => {
  return (
    <>
      <Form>
        <div className="mb-3">
          <FormLabel>
            Password&nbsp;
            <span className="text-danger">*</span>
          </FormLabel>
          <InputGroup>
            <InputGroup.Text className="bg-light">
              <Icon icon="lock-password" className="fs-xl text-muted" />
            </InputGroup.Text>
            <FormControl type="password" placeholder="••••••••" required />
          </InputGroup>
        </div>
        <div className="d-grid">
          <Button variant="primary" type="submit" className="fw-semibold py-2">
            Unlock
          </Button>
        </div>
      </Form>
    </>
  )
}

export default Forms
