import codImg from '@/assets/images/cards/cod.png'
import discoverCard from '@/assets/images/cards/discover-card.svg'
import masterCard from '@/assets/images/cards/mastercard.svg'
import payoneerCard from '@/assets/images/cards/payoneer.svg'
import paypal from '@/assets/images/cards/paypal.svg'
import stripeCard from '@/assets/images/cards/stripe.svg'
import visaCard from '@/assets/images/cards/visa.svg'
import { PatternFormat } from 'react-number-format'

const PaymentInfo = () => {
  return (
    <>
      <h5 className="my-1.5 text-md">Payment Method</h5>
      <p className="text-default-400 mb-5">Select your preferred payment method to complete your purchase securely.</p>
      <div className="border-default-300 mb-5 rounded border p-5">
        <div className="grid grid-cols-3 items-center">
          <div className="col-span-2">
            <div className="flex gap-1.5">
              <input type="radio" id="BillingOptRadio2" name="billingOptions" className="form-radio rounded-full!" />
              <label className="form-check-label font-bold" htmlFor="BillingOptRadio2">
                Pay with Paypal
              </label>
            </div>
            <p className="text-default-400 ps-6 pt-1.25">You will be redirected to PayPal website to complete your purchase securely.</p>
          </div>
          <div className="ms-auto mt-5">
            <img src={paypal} height={32} alt="paypal-img" className="size-8" />
          </div>
        </div>
      </div>
      <div className="border-default-300 mb-5 rounded border p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
          <div className="md:col-span-2">
            <div className="flex gap-1.5">
              <input type="radio" id="BillingOptRadio1" name="billingOptions" className="form-radio rounded-full!" defaultChecked />
              <label className="form-check-label font-bold" htmlFor="BillingOptRadio1">
                Credit / Debit Card
              </label>
            </div>
            <p className="text-default-400 ps-base pt-1.25">Safe money transfer using your bank account. We support Mastercard, Visa, Discover and Stripe.</p>
          </div>

          <div className="flex md:col-span-1 md:ms-auto">
            <img src={masterCard} className="size-8" alt="master-card-img" />
            <img src={discoverCard} className="size-8" alt="discover-card-img" />
            <img src={visaCard} className="size-8" alt="visa-card-img" />
            <img src={stripeCard} className="size-8" alt="stripe-card-img" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1">
          <div className="col-span-1">
            <div className="rounded bg-warning/10 text-warning text-xs py-2.5 px-4 mb-4">
              Enjoy an extra
              <span className="font-bold"> 10% discount</span>
              when you pay with your
              <span className="font-bold">Credit Card</span>.
            </div>
            <div className="mb-base">
              <label htmlFor="card-number" className="mb-2 block">
                Card Number
              </label>
              <PatternFormat type="text" id="card-number" className="form-input" valueIsNumericString format="#### #### #### ####" mask="_" placeholder="4242 4242 4242 4242" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-base">
          <div className="md:col-span-2">
            <label htmlFor="card-name-on" className="mb-2 block">
              Name on card
            </label>
            <input type="text" id="card-name-on" className="form-input" placeholder="Master Dhanu" />
          </div>
          <div>
            <label htmlFor="card-expiry-date" className="mb-2 block">
              Expiry date
            </label>
            <PatternFormat valueIsNumericString format="###" mask="_" type="text" id="card-expiry-date" className="form-input" placeholder="MM/YY" />
          </div>
          <div>
            <label htmlFor="card-cvv" className="mb-2 block">
              CVV code
            </label>
            <input type="text" id="card-cvv" className="form-input" data-toggle="input-mask" data-mask-format="000" placeholder="012" />
          </div>
        </div>
      </div>
      <div className="border-default-300 mb-5 rounded border p-5">
        <div className="grid grid-cols-3">
          <div className="col-span-2">
            <div className="flex gap-2">
              <input type="radio" id="BillingOptRadio3" name="billingOptions" className="form-radio rounded-full!" />
              <label className="form-check-label font-bold" htmlFor="BillingOptRadio3">
                Pay with Payoneer
              </label>
            </div>
            <p className="text-default-400 ps-base pt-1.25">You will be redirected to Payoneer website to complete your purchase securely.</p>
          </div>
          <div className="ms-auto">
            <img src={payoneerCard} className="size-8" alt="payoneer" />
          </div>
        </div>
      </div>
      <div className="border-default-300 mb-5 rounded border p-5">
        <div className="grid grid-cols-3">
          <div className="col-span-2">
            <div className="flex gap-2">
              <input type="radio" id="BillingOptRadio4" name="billingOptions" className="form-radio rounded-full!" />
              <label className="form-check-label font-bold" htmlFor="BillingOptRadio4">
                Cash on Delivery
              </label>
            </div>
            <p className="text-default-400 ps-base pt-1.25">Pay with cash when your order is delivered.</p>
          </div>
          <div className="ms-auto">
            <img src={codImg} className="h-6" alt="COD-img" height={24} width={61} />
          </div>
        </div>
      </div>
    </>
  )
}

export default PaymentInfo
