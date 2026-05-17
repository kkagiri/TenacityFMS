import bgCard from '@/assets/images/auth-card-bg.svg'
import PageBreadcrumb from '@/components/PageBreadcrumb'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Terms & Conditions" subtitle="Pages" />

      <div className="container">
        <div className="card relative">
          <div className="card-body">
            <div className="absolute end-0 top-0">
              <img src={bgCard} className="w-full opacity-70" alt="auth-card-bg" width={600} height={560} />
            </div>
            <p className="mb-5 italic">Welcome to our website. By accessing or using this site, you agree to be bound by these terms and conditions. Please read them carefully.</p>
            <div className="flex flex-col gap-y-7.5">
              <div>
                <h4 className="mb-2 text-lg font-bold">1. Acceptance of Terms</h4>
                <p>By using this website, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
              </div>
              <div>
                <h4 className="mb-2 text-lg font-bold">2. Modifications</h4>
                <p>We reserve the right to modify these Terms and Conditions at any time. Updated terms will be posted on this page with the revised date. Continued use constitutes acceptance of any changes.</p>
              </div>
              <div>
                <h4 className="mb-2 text-lg font-bold">3. Intellectual Property</h4>
                <p>All content, trademarks, graphics, and materials on this website are owned or licensed by us and protected by copyright and intellectual property laws. Unauthorized use is strictly prohibited.</p>
              </div>
              <div>
                <h4 className="mb-2 text-lg font-bold">4. User Responsibilities</h4>
                <ul className="list-disc ps-8">
                  <li>Do not engage in unauthorized copying or distribution.</li>
                  <li>Do not use the site for illegal or unauthorized purposes.</li>
                  <li>Do not attempt to gain unauthorized access to the website or its data.</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-lg font-bold">5. Payment and Refunds</h4>
                <p>All purchases are final unless otherwise specified. Refund requests will be considered on a case-by-case basis. Licensing fees may vary based on usage.</p>
              </div>
              <div>
                <h4 className="mb-2 text-lg font-bold">6. Limitation of Liability</h4>
                <p>We are not liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>
              </div>
              <div>
                <h4 className="mb-2 text-lg font-bold">7. License Types</h4>
                <h5>Single License</h5>
                <ul className="list-disc ps-8 text-sm/6 mt-3">
                  <li>Restricted to a single installation.</li>
                  <li>For use in personal or client work.</li>
                  <li>Not for redistribution or resale.</li>
                  <li>GPL terms override where applicable.</li>
                </ul>
              </div>
              <div>
                <h5>Multiple License</h5>
                <ul className="list-disc ps-8 text-sm/6 mt-3">
                  <li>Permits multiple installations.</li>
                  <li>For use in multiple personal or client projects.</li>
                  <li>Not for resale or redistribution.</li>
                  <li>GPL terms override where applicable.</li>
                </ul>
              </div>
              <div>
                <h5>Extended License</h5>
                <ul className="list-disc ps-8 text-sm/6 mt-3">
                  <li>Permits resale or redistribution as part of a larger work.</li>
                  <li>Allowed in modified or integrated final products.</li>
                  <li>Licensed components must not be used standalone.</li>
                  <li>GPL terms override where applicable.</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-lg font-bold">8. Termination</h4>
                <p>We reserve the right to terminate access to our services if you violate any terms.</p>
              </div>
              <div>
                <h4 className="mb-2 text-lg font-bold">9. Governing Law</h4>
                <p>These Terms are governed by and construed in accordance with the laws of the applicable jurisdiction.</p>
                <p className="mt-7.5 mb-4">
                  For any questions regarding these Terms, please contact us at&nbsp;
                  <a href="mailto:support@example.com" className="text-primary">
                    support@example.com
                  </a>
                  .
                </p>
                <p className="text-default-400 font-italic">Effective Date: April 19, 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
