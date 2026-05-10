import bgPattern from '@/assets/images/bg-pattern.png'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

import { testimonials, TestimonialType } from './data'

import client1 from '@/assets/images/clients/01.svg'
import client2 from '@/assets/images/clients/02.svg'
import client3 from '@/assets/images/clients/03.svg'
import client4 from '@/assets/images/clients/04.svg'
import client5 from '@/assets/images/clients/05.svg'
import client6 from '@/assets/images/clients/06.svg'
import client7 from '@/assets/images/clients/07.svg'

const TestimonialCard = ({ testimonial }: { testimonial: TestimonialType }) => {
  return (
    <div className="card border-light rounded-xl p-5 h-full">
      <div className="card-body pb-0 text-center">
        <div className="mx-auto size-12 mb-5">
          <img src={testimonial.avatar} alt={testimonial.name} className="rounded-full" />
        </div>
        <span className="text-warning mb-5 flex items-center justify-center gap-1">
          {Array(5)
            .fill(5)
            .map((_star, idx) => (
              <span key={idx}>
                <Icon icon="star-filled" />
              </span>
            ))}
        </span>
        <h4 className="mb-2.5 text-md">{testimonial.title}</h4>
        <p className="text-default-400 mb-5 italic text-sm">"{testimonial.description}"</p>
      </div>
    </div>
  )
}

const Testimonials = () => {
  const clients = [client1, client2, client3, client4, client5, client6, client7]
  return (
    <section className="lg:py-26 py-12 relative overflow-hidden" id="reviews">
      <div className="absolute top-0 inset-s-1/2 -translate-x-1/2 mt-12 opacity-50">
        <img src={bgPattern} alt="" />
      </div>

      <div className="container">
        <div className="text-center">
          <span className="text-default-400 rounded-xl inline-block">💬 What Our Customers Are Saying</span>
          <h2 className="mt-5 font-bold md:text-2xl text-xl mb-15">
            Real Feedback from <mark className="italic bg-warning/20 text-default-800">Satisfied</mark> Clients
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="w-full sm:w-[48%] lg:w-[30%]">
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>

        <div className="lg:w-2/3 mx-auto mt-15">
          <div className="flex gap-12 flex-wrap justify-center pt-7.5">
            {clients.map((logo, i) => (
              <div key={i}>
                <Link to="" className="block">
                  <img src={logo} alt="logo" className="h-10.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
