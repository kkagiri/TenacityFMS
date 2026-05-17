import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { services } from './data'

export type ServiceType = {
  name: string
  description: string
  icon: string
}

const ServiceCard = ({ service }: { service: ServiceType }) => {
  const { description, icon, name } = service
  return (
    <div className="card border-0 p-2 h-full">
      <div className="card-body pb-0">
        <div className="mb-5">
          <span className="size-12 flex justify-center items-center rounded-full bg-secondary text-white">
            <Icon icon={icon} className="text-2xl" />
          </span>
        </div>
        <h4 className="mb-2.5 text-lg">{name}</h4>
        <p className="text-default-400 mb-5">{description}</p>
      </div>
      <div className="card-footer border-0 pt-0 pb-3.75">
        <Link className="inline-flex items-center text-primary hover:text-primary-hover font-semibold" to="">
          Know more<Icon icon="arrow-right" className="ms-2 align-middle"></Icon>
        </Link>
      </div>
    </div>
  )
}

const Services = () => {
  return (
    <section className="lg:pt-26 pt-12 pb-15" id="services">
      <div className="container">
        <div className="text-center">
          <span className="text-default-400 rounded-xl inline-block">🚀 Empowering your digital journey</span>
          <h2 className="mt-5 font-bold md:text-2xl text-xl mb-15">
            Discover Our <mark className="italic bg-warning/20 text-default-800">Core Services</mark> and Capabilities
          </h2>
        </div>

        <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-base mb-5">
          {services.map((service, idx) => (
            <ServiceCard service={service} key={idx} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services
