import Icon from '@/components/wrappers/Icon'
import { FormControl, FormLabel, InputGroup } from 'react-bootstrap'
const calculatePasswordStrength = (password) => {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[\W_]/.test(password)) strength++
  return strength
}
const PasswordInputWithStrength = ({ password, setPassword, id, label, name, placeholder, showIcon = true, inputGroup = false, labelClassName, inputClassName }) => {
  const strength = calculatePasswordStrength(password)
  const strengthBars = new Array(4).fill(0)
  return (
    <>
      {label && (
        <FormLabel htmlFor={id} className={labelClassName}>
          {label} <span className="text-danger">*</span>
        </FormLabel>
      )}

      {/* INPUT GROUP STYLE */}
      {inputGroup ? (
        <InputGroup>
          {showIcon && (
            <InputGroup.Text className="bg-light">
              <Icon icon="lock-password" className="fs-xl text-muted" />
            </InputGroup.Text>
          )}

          <FormControl type="password" name={name} id={id} placeholder={placeholder} required className={inputClassName} value={password} onChange={(e) => setPassword(e.target.value)} />
        </InputGroup> /* APP SEARCH STYLE (DEFAULT) */
      ) : (
        <div className={`app-search ${!showIcon ? 'no-icon' : ''}`}>
          {showIcon && <Icon icon="lock-password" className="app-search-icon text-muted" />}

          <FormControl type="password" name={name} id={id} placeholder={placeholder} required className={inputClassName} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      )}

      <div className="password-bar my-2">
        {strengthBars.map((_, i) => (
          <div key={i} className={'strong-bar ' + (i < strength ? `bar-active-${strength}` : '')} />
        ))}
      </div>

      <p className="text-muted fs-xs mb-0">Use 8+ characters with letters, numbers & symbols.</p>
    </>
  )
}
export default PasswordInputWithStrength
