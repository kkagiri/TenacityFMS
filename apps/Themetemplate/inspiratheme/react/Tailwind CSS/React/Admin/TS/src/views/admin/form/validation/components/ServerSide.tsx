import Icon from '@/components/wrappers/Icon'
import React, { useState } from 'react'

const ServerSide = () => {
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
        <h4 className="card-title">Server-side</h4>
      </div>
      <div className="card-body">
        <form id="serverForm" className={`grid grid-cols-1 md:grid-cols-12 gap-base ${validated ? 'validated' : ''}`} noValidate onSubmit={handleSubmit}>
          <div className="md:col-span-4">
            <label htmlFor="firstName" className="form-label">
              First name
            </label>
            <div className="relative">
              <input type="text" id="firstName" defaultValue="Mark" required className="form-input border-success!" />
              <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
                <Icon icon="check" className="text-success text-base" />
              </div>
            </div>
            <p className="text-success mt-1 text-2xs">Looks good!</p>
          </div>

          <div className="md:col-span-4">
            <label htmlFor="lastName" className="form-label">
              Last name
            </label>
            <div className="relative">
              <input type="text" id="lastName" defaultValue="Otto" required className="form-input border-success!" />
              <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
                <Icon icon="check" className="text-success text-base" />
              </div>
            </div>
            <p className="text-success mt-1 text-2xs">Looks good!</p>
          </div>

          <div className="md:col-span-4">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <div className="relative flex rounded-md">
              <span className="border-default-300 bg-default-100 text-default-600 inline-flex items-center rounded-s-md border px-3 text-sm">@</span>
              <input type="text" id="username" name="username" className="form-input border-danger! rounded-s-none!" placeholder="johndoe123" required />
              <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
                <Icon icon="info" className="text-danger text-base" />
              </div>
            </div>
            <p className="text-danger mt-1 text-2xs">Please choose a username.</p>
          </div>

          <div className="md:col-span-6">
            <label htmlFor="city" className="form-label">
              City
            </label>
            <div className="relative">
              <input type="text" id="city" required placeholder="Enter city" className="form-input border-danger!" />
              <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
                <Icon icon="info" className="text-danger text-base" />
              </div>
            </div>
            <p className="text-danger mt-1 text-2xs">Please provide a valid city.</p>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="state" className="form-label">
              State
            </label>
            <div className="relative">
              <select id="state" required className="form-input border-danger!">
                <option defaultValue="">Choose...</option>
                <option>California</option>
                <option>Texas</option>
                <option>Florida</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 end-6 flex items-center pe-3">
                <Icon icon="info" className="text-danger text-base" />
              </div>
            </div>
            <p className="text-danger mt-1 text-2xs">Please select a valid state.</p>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="zip" className="form-label">
              Zip
            </label>
            <div className="relative">
              <input type="text" id="zip" required placeholder="Zip code" className="form-input border-danger!" />
              <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
                <Icon icon="info" className="text-danger text-base" />
              </div>
            </div>
            <p className="text-danger mt-1 text-2xs">Please provide a valid zip.</p>
          </div>

          <div className="md:col-span-12">
            <label className="flex items-center space-x-2">
              <input type="checkbox" id="terms" required className="form-checkbox checked:bg-danger!" />
              <span className="text-danger">Agree to terms and conditions</span>
            </label>
            <p className="text-danger mt-1 text-2xs">You must agree before submitting.</p>
          </div>

          <div className="md:col-span-12">
            <button type="submit" className="btn bg-primary hover:bg-primary-hover text-white">
              Submit form
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServerSide
