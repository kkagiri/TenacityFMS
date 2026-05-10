import PasswordInputWithStrength from '@/components/PasswordInputWithStrength'
import { useState } from 'react'
import PasswordChecklist from 'react-password-checklist'

const PasswordMeters = () => {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  return (
    <>
      <div>
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Progress Bar</h4>
          </div>
          <div className="card-body">
            <PasswordInputWithStrength password={password} setPassword={setPassword} />
          </div>
        </div>
      </div>
      <div>
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Password Condition</h4>
          </div>
          <div className="card-body">
            <div>
              <label className="form-label hs-collapse-toggle" htmlFor="password-input" id="password-collapse-toggle" data-hs-collapse="#passwordBox">
                Magic Password ✨ (Click Here)
              </label>
              <input type="password" className="form-input hs-collapse-toggle" placeholder="Enter password" id="password-input" pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" data-hs-collapse="#passwordBox" value={password2} onChange={(e) => setPassword2(e.target.value)} />

              <div className="text-default-400 mt-1 text-2xs">Use 8 or more characters with a mix of letters, numbers & symbols.</div>
              <div className="password-box hs-collapse hidden w-full overflow-hidden transition-[height] duration-300" id="passwordBox">
                <div className="p-3">
                  <h5 className="mb-2 text-sm">Password Recipe:</h5>
                  <PasswordChecklist rules={['minLength', 'specialChar', 'number', 'capital', 'lowercase']} minLength={8} value={password2} iconSize={8} validTextColor="#02BC9C" invalidTextColor="#F7577E" validColor="#02BC9C" invalidColor="#F7577E" className="m-2 " />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PasswordMeters
