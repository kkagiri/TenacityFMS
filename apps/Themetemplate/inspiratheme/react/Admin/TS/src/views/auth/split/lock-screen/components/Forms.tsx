import { Button, Form, FormControl } from 'react-bootstrap'

const Forms = () => {
  return (
    <Form className="mt-4">
      <div className="mb-3">
        <div className="app-search">
          <FormControl type="password" id="userPassword" placeholder="Enter password" required className="py-2 px-3 bg-light bg-opacity-40 border-light" />
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
