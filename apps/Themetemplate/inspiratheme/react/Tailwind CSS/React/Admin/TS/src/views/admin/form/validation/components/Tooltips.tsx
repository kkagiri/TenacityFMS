import Icon from '@/components/wrappers/Icon'
import React, { useState } from 'react'

const Tooltips = () => {
  const [validated, setValidated] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget

    if (!form.checkValidity()) {
      event.preventDefault()
      event.stopPropagation()
    }

    setValidated(true)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Tooltips</h4>
      </div>

      <div className="card-body">
        <form id="validationForm" className={`grid grid-cols-1 md:grid-cols-12 gap-base ${validated ? 'validated' : ''}`} noValidate onSubmit={handleSubmit}>
          <div className="md:col-span-4">
            <label htmlFor="studentFirstName" className="form-label">
              First Name
            </label>
            <input type="text" id="studentFirstName" defaultValue="Emily" required className="form-input" />
          </div>

          <div className="md:col-span-4">
            <label htmlFor="studentLastName" className="form-label">
              Last Name
            </label>
            <input type="text" id="studentLastName" defaultValue="Chen" required className="form-input" />
          </div>

          <div className="md:col-span-4">
            <label htmlFor="studentID" className="form-label">
              Stanford ID
            </label>
            <div className="flex rounded-md">
              <span className="border-default-300 bg-default-100 text-default-600 inline-flex items-center rounded-s-md border px-3 text-sm capitalize">SU</span>
              <input type="text" id="studentID" placeholder="SU1234567" required className="form-input rounded-s-none!" />
            </div>
          </div>

          <div className="md:col-span-6">
            <label htmlFor="studentCity" className="form-label">
              City
            </label>
            <input type="text" id="studentCity" defaultValue="Palo Alto" required className="form-input" />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="studentDepartment" className="form-label">
              Department
            </label>
            <select id="studentDepartment" required className="form-input" defaultValue="">
              <option value="">Choose...</option>
              <option>Computer Science</option>
              <option>Engineering</option>
              <option>Biology</option>
              <option>Economics</option>
              <option>Psychology</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="zip" className="form-label">
              Zip Code
            </label>
            <input type="text" id="zip" name="zip" placeholder="94305" required className="form-input" />
          </div>

          <div className="md:col-span-12">
            <label className="flex items-center space-x-2">
              <input type="checkbox" id="agreementCheck" required className="form-checkbox" />
              <span className="text-default-700">I confirm my enrollment at Stanford University.</span>
            </label>
          </div>

          <div className="md:col-span-12">
            <button type="submit" className="btn bg-primary hover:bg-primary-hover text-white">
              <Icon icon="users" className="text-sm" />
              Submit Enrollment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Tooltips
