export const Step1 = () => {
  return (
    <>
      <div>
        <label className="form-label">Full Name</label>
        <input type="text" className="form-input" placeholder="Enter your full name" />
      </div>

      <div>
        <label className="form-label">Email</label>
        <input type="email" className="form-input" placeholder="Enter your email" />
      </div>

      <div>
        <label className="form-label">Phone Number</label>
        <input type="phone" className="form-input" placeholder="Enter your phone number" />
      </div>

      <div>
        <label className="form-label">Date of Birth</label>
        <input type="date" className="form-input" />
      </div>
    </>
  )
}
export const Step2 = () => {
  return (
    <>
      <div>
        <label className="form-label">Street Address</label>
        <input type="text" className="form-input" placeholder="123 Main St" required />
      </div>

      <div>
        <label className="form-label">City</label>
        <input type="text" className="form-input" placeholder="e.g., New York" required />
      </div>

      <div>
        <label className="form-label">State</label>
        <input type="text" className="form-input" placeholder="e.g., California" required />
      </div>

      <div>
        <label className="form-label">Zip Code</label>
        <input type="text" className="form-input" placeholder="e.g., 10001" required />
      </div>
    </>
  )
}

export const Step3 = () => {
  return (
    <>
      <div>
        <label className="form-label">Choose Course</label>
        <select className="form-select">
          <option value="">Select</option>
          <option value="Engineering">Engineering</option>
          <option value="Medical">Medical</option>
          <option value="Business">Business</option>
        </select>
      </div>

      <div>
        <label className="form-label">Enrollment Type</label>
        <select className="form-select">
          <option value="">Select</option>
          <option value="Full Time">Full Time</option>
          <option value="Part Time">Part Time</option>
        </select>
      </div>

      <div>
        <label className="form-label">Preferred Batch Time</label>
        <select className="form-select">
          <option value="">Select Time</option>
          <option value="Morning">Morning (8am – 12pm)</option>
          <option value="Afternoon">Afternoon (1pm – 5pm)</option>
          <option value="Evening">Evening (6pm – 9pm)</option>
        </select>
      </div>

      <div>
        <label className="form-label">Mode of Study</label>
        <select className="form-select">
          <option value="">Select Mode</option>
          <option value="Offline">Offline</option>
          <option value="Online">Online</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>
    </>
  )
}

export const Step4 = () => {
  return (
    <>
      <div>
        <label className="form-label">Parent/Guardian Name</label>
        <input type="text" className="form-input" placeholder="e.g., John Doe" />
      </div>

      <div>
        <label className="form-label">Relation</label>
        <input type="text" className="form-input" placeholder="e.g., Father, Mother" />
      </div>

      <div>
        <label className="form-label">Parent Phone</label>
        <input type="text" className="form-input" placeholder="e.g., +1 555 123 4567" />
      </div>

      <div>
        <label className="form-label">Parent Email</label>
        <input type="text" className="form-input" placeholder="e.g., parent@example.com" />
      </div>
    </>
  )
}

export const Step5 = () => {
  return (
    <>
      <div>
        <label className="form-label">Upload ID Proof</label>
        <input type="file" name="file-input" className="form-input" />
      </div>

      <div>
        <label className="form-label">Upload Previous Marksheet</label>
        <input type="file" name="file-input" className="form-input" />
      </div>
    </>
  )
}
