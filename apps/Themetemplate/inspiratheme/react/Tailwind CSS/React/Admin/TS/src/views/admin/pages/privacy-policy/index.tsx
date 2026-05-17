import bgCard from '@/assets/images/auth-card-bg.svg'
import PageBreadcrumb from '@/components/PageBreadcrumb'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Privacy Policy" subtitle="Pages" />
      <div className="container">
        <div className="card relative">
          <div className="card-body">
            <div className="absolute end-0 top-0">
              <img src={bgCard} className="w-full opacity-70" alt="auth-card-bg" width={600} height={560} />
            </div>
            <div className="flex flex-col">
              <p className="italic">This Privacy Policy explains how we collect, use, and safeguard your personal information when you interact with our website and services.</p>
              <div>
                <h4 className="mb-2 mt-base text-lg font-bold">1. Information We Collect</h4>
                <p>We may collect personal details such as your name, email address, payment information, and usage data when you interact with our products or services.</p>
              </div>
              <div>
                <h4 className="mb-2 mt-7.5 text-lg font-bold">2. How We Use Your Information</h4>
                <p>Your information is used to provide, improve, and personalize our services, process transactions, send updates, and ensure security.</p>
              </div>
              <div>
                <h4 className="mb-2 mt-7.5 text-lg font-bold">3. Data Sharing</h4>
                <p>We do not sell your personal information. Data may be shared with trusted service providers and partners only when necessary to deliver our services or comply with legal obligations.</p>
              </div>
              <div>
                <h4 className="mb-2 mt-7.5 text-lg font-bold">4. Cookies &amp; Tracking</h4>
                <p>Our website may use cookies and similar technologies to enhance your experience, analyze traffic, and provide personalized content. You can manage cookie preferences in your browser settings.</p>
              </div>
              <div>
                <h4 className="mb-2 mt-7.5 text-lg font-bold">5. Data Security</h4>
                <p>We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, or disclosure. However, no method of transmission is 100% secure.</p>
              </div>
              <div>
                <h4 className="mb-2 mt-7.5 text-lg font-bold">6. Your Rights</h4>
                <ul className="list-disc space-y-1 ps-8">
                  <li>Access, update, or delete your personal data.</li>
                  <li>Request a copy of the data we hold about you.</li>
                  <li>Opt out of marketing communications at any time.</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 mt-7.5 text-lg font-bold">7. Third-Party Services</h4>
                <p>Our services may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.</p>
              </div>
              <div>
                <h4 className="mb-2 mt-7.5 text-lg font-bold">8. Changes to This Policy</h4>
                <p>We may update this Privacy Policy periodically. Updates will be posted on this page with a revised effective date.</p>
              </div>
              <div>
                <h4 className="mb-2 mt-7.5 text-lg font-bold">9. Contact Us</h4>
                <p className="mb-4">
                  If you have any questions or concerns about this Privacy Policy, please contact us at&nbsp;
                  <a href="mailto:privacy@example.com" className="text-primary">
                    privacy@example.com
                  </a>
                  .
                </p>
              </div>
              <div>
                <p className="text-default-400 italic">Effective Date: April 19, 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
