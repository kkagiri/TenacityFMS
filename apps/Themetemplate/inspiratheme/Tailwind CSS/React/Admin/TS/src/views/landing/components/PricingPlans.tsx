import Icon from '@/components/wrappers/Icon'
import { pricingPlans, PricingPlanType } from './data'

const PricingCard = ({ plan }: { plan: PricingPlanType }) => {
  return (
    <div className={`card h-full bg-light/10 rounded-xl ${plan.isPopular ? 'border-dashed border-default-300 border my-7.5 lg:my-0' : 'border-light'}`}>
      <div className="card-body lg:px-7.5 p-15 pb-2.5 text-center">
        <div className="text-center">
          <h3 className="font-bold mb-1.25 text-xl">{plan.name}</h3>
          <p className="text-default-400">{plan.description}</p>
        </div>
        <div className="my-7.5">
          <h1 className="font-bold lg:text-[40px] md:text-[33px] text-[27px]">${plan.price}</h1>
          <small className="block text-default-400 text-sm font-medium">One-time payment</small>
          <small className="block text-default-400 font-medium">{plan.highlight}</small>
        </div>

        <ul className="text-start text-sm font-medium">
          {plan.features.map((feature, index) => (
            <li key={index} className="mb-2.5 flex items-center">
              {feature.included ? <Icon icon="check" className="text-success me-3"></Icon> : <Icon icon="x" className="text-danger me-3"></Icon>}
              {feature.text}
            </li>
          ))}
        </ul>
      </div>
      <div className="card-footer bg-transparent border-0 px-15 pb-7.5">
        <a href="" className={`btn  rounded-full w-full py-2.5 font-semibold rounded-pill ${plan.btnClass}`}>
          Buy {plan.name}
        </a>
      </div>
      {plan.isPopular && <span className="absolute top-0 inset-s-1/2 start-1/2 -translate-x-1/2 badge bg-primary/15 text-primary rounded-full px-5 py-1.25 mt-5">Best Value</span>}
    </div>
  )
}

const PricingPlans = () => {
  return (
    <section className="lg:py-26 py-12" id="plans">
      <div className="container">
        <div className="text-center">
          <span className="text-default-400 rounded-xl inline-block">💰 Transparent and flexible pricing</span>
          <h2 className="mt-5 font-bold md:text-2xl text-xl mb-15">
            Choose the <mark className="italic bg-warning/20 text-default-800">License</mark> That Fits Your Needs
          </h2>
        </div>

        <div className="lg:w-5/6 mx-auto">
          <div className="grid xl:grid-cols-3 grid-cols-1 gap-base">
            {pricingPlans.map((plan, idx) => (
              <PricingCard plan={plan} key={idx} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default PricingPlans
