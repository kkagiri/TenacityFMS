import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'

const Contact = () => {
  return (
    <section className="lg:py-26 py-12" id="contact">
      <div className="container">
        <div className="text-center">
          <span className="text-default-400 rounded-xl inline-block">📞 We're Here to Help</span>
          <h2 className="mt-5 font-bold md:text-2xl text-xl mb-15">
            Get in Touch with <mark className="italic bg-warning/20 text-default-800">Our Team</mark>
          </h2>
        </div>

        <div className="grid xl:grid-cols-3 grid-cols-1 gap-base">
          <div className="col-span-1">
            <div className="p-7.5">
              <div className="flex gap-5 mb-15">
                <div className="shrink-0">
                  <span className="size-12 flex justify-center items-center rounded-full bg-secondary/15 text-secondary">
                    <Icon icon="phone-call" className="text-2xl"></Icon>
                  </span>
                </div>
                <div>
                  <span className="text-default-400">Contact Numbers</span>
                  <h5 className="my-2.5">+1 (800) 123-4567</h5>
                  <h5>+1 (415) 987-6543</h5>
                </div>
              </div>

              <div className="flex gap-5 mb-15">
                <div className="shrink-0">
                  <span className="size-12 flex justify-center items-center rounded-full bg-secondary/15 text-secondary">
                    <Icon icon="mail" className="text-2xl"></Icon>
                  </span>
                </div>
                <div>
                  <span className="text-default-400">Email</span>
                  <h5 className="my-2.5">support@yourcompany.com</h5>
                  <h5>info@yourcompany.com</h5>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="shrink-0">
                  <span className="size-12 flex justify-center items-center rounded-full bg-secondary/15 text-secondary">
                    <Icon icon="map-pin" className="text-2xl"></Icon>
                  </span>
                </div>
                <div>
                  <span className="text-default-400">Address</span>
                  <h5 className="my-1.25">{META_DATA.name} HQ, 123 Market Street, 5th Floor, Financial District, San Francisco, CA 94103, United States</h5>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2">
            <form className="p-7.5 border border-default-300 rounded-xl border-dashed">
              <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
                <div className="col-span-1">
                  <label htmlFor="name" className="form-label">
                    Full Name
                  </label>
                  <input type="text" className="form-input bg-transparent! py-2.5" id="name" autoComplete="name" placeholder="Enter your full name" />
                </div>

                <div className="col-span-1">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input type="email" className="form-input bg-transparent! py-2.5" id="email" autoComplete="email" placeholder="Enter your email" />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="subject" className="form-label">
                    Subject
                  </label>
                  <input type="text" className="form-input bg-transparent! py-2.5" id="subject" placeholder="What’s the reason for contact?" />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="message" className="form-label">
                    Message
                  </label>
                  <textarea className="form-textarea bg-transparent! py-2.5" id="message" rows={5} placeholder="Write your message here..."></textarea>
                </div>

                <div className="md:col-span-2 text-end">
                  <button type="submit" className="btn bg-primary text-white rounded-full hover:bg-primary-hover">
                    Send Message
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
