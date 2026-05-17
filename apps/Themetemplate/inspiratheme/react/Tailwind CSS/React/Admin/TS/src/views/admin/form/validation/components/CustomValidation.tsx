import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { SubmitHandler, useForm } from 'react-hook-form'

type FormValues = {
  firstName: string
  lastName: string
  username: string
  city: string
  state: string
  zip: string
  terms: boolean
}

const CustomValidation = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    mode: 'onBlur',
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log('Form Data:', data)
  }

  const isValid = (field: keyof FormValues) => !errors[field]

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Custom styles Validation</h4>
      </div>

      <div className="card-body">
        <form id="tailwindValidationForm" className="grid md:grid-cols-12 grid-cols-1 gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="md:col-span-4">
            <label className="form-label">First Name</label>
            <div className="relative">
              <input type="text" id="firstName" defaultValue="John" className={cn('input-field form-input', errors.firstName ? '!border-danger' : '!border-success')} {...register('firstName', { required: true })} />

              {isValid('firstName') ? <Icon className="valid-icon absolute top-1/2 right-3 -translate-y-1/2 text-success" icon="check" /> : <Icon className="invalid-icon absolute top-1/2 right-3 -translate-y-1/2 text-danger" icon="alert-circle" />}
            </div>

            {!errors.firstName ? <p className="valid-msg mt-1 text-sm text-success">Looks great!</p> : <p className="invalid-msg mt-1 text-sm text-danger">Please provide your first name.</p>}
          </div>

          <div className="md:col-span-4">
            <label className="form-label">Last Name</label>
            <div className="relative">
              <input type="text" id="lastName" defaultValue="Doe" className={cn('input-field form-input', errors.lastName ? '!border-danger' : '!border-success')} {...register('lastName', { required: true })} />

              {isValid('lastName') ? <Icon className="valid-icon absolute top-1/2 right-3 -translate-y-1/2 text-success" icon="check" /> : <Icon className="invalid-icon absolute top-1/2 right-3 -translate-y-1/2 text-danger" icon="alert-circle" />}
            </div>

            {!errors.lastName ? <p className="valid-msg mt-1 text-sm text-success">Looks great!</p> : <p className="invalid-msg mt-1 text-sm text-danger">Please provide your last name.</p>}
          </div>

          <div className="md:col-span-4">
            <label className="form-label">Username</label>
            <div className="relative input-group">
              <span className="input-group-text">@</span>
              <input type="text" id="username" placeholder="johndoe123" className={cn('input-field form-input', errors.username ? '!border-danger' : '!border-success')} {...register('username', { required: true, minLength: 3 })} />

              {isValid('username') ? <Icon className="valid-icon absolute top-1/2 right-3 -translate-y-1/2 text-success" icon="check" /> : <Icon className="invalid-icon absolute top-1/2 right-3 -translate-y-1/2 text-danger" icon="alert-circle" />}
            </div>

            {errors.username && <p className="invalid-msg mt-1 text-sm text-danger">Please choose a valid username.</p>}
          </div>

          <div className="md:col-span-6">
            <label className="form-label">City</label>
            <div className="relative">
              <input type="text" id="city" placeholder="San Francisco" className={cn('input-field form-input', errors.city ? '!border-danger' : '!border-success')} {...register('city', { required: true })} />

              {isValid('city') ? <Icon className="valid-icon absolute top-1/2 right-3 -translate-y-1/2 text-success" icon="check" /> : <Icon className="invalid-icon absolute top-1/2 right-3 -translate-y-1/2 text-danger" icon="alert-circle" />}
            </div>

            {errors.city && <p className="invalid-msg mt-1 text-sm text-danger">Please provide a valid city name.</p>}
          </div>

          <div className="md:col-span-3">
            <label className="form-label">State</label>
            <div className="relative">
              <select id="state" className={cn('input-field form-input', errors.state ? '!border-danger' : '!border-success')} {...register('state', { required: true })}>
                <option value="">Choose...</option>
                <option>California</option>
                <option>Texas</option>
                <option>New York</option>
                <option>Florida</option>
              </select>
            </div>

            {errors.state && <p className="invalid-msg mt-1 text-sm text-danger">Please select your state.</p>}
          </div>

          <div className="md:col-span-3">
            <label className="form-label">Zip Code</label>
            <div className="relative">
              <input type="text" id="zip" placeholder="94107" className={cn('input-field form-input', errors.zip ? '!border-danger' : '!border-success')} {...register('zip', { required: true, pattern: /^\d{5}$/ })} />

              {isValid('zip') ? <Icon className="valid-icon absolute top-1/2 right-3 -translate-y-1/2 text-success" icon="check" /> : <Icon className="invalid-icon absolute top-1/2 right-3 -translate-y-1/2 text-danger" icon="alert-circle" />}
            </div>

            {errors.zip && <p className="invalid-msg mt-1 text-sm text-danger">Please enter a valid zip code.</p>}
          </div>

          <div className="md:col-span-12">
            <div className="flex flex-wrap items-center">
              <input id="terms" type="checkbox" className="form-checkbox" {...register('terms', { required: true })} />
              <label htmlFor="terms" className="ms-2 text-sm text-default-700">
                I agree to the terms and conditions
              </label>

              {errors.terms && <p className="invalid-msg mt-2 w-full text-sm text-danger">You must agree before submitting.</p>}
            </div>
          </div>

          <div className="md:col-span-12">
            <button type="submit" className="btn bg-primary text-white hover:bg-primary-hover">
              Submit Form
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomValidation
