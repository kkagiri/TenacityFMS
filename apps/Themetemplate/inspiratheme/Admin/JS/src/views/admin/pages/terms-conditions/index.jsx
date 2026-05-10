import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Terms & Conditions" subtitle="Pages" />
      <Row className="justify-content-center">
        <Col xxl={9}>
          <div className="text-center my-4">
            <h1 className="fw-bold">Terms &amp; Conditions</h1>
            <p className="text-muted">Effective Date: April 19, 2025</p>
          </div>

          <Card>
            <CardBody>
              <p className="fst-italic fs-sm">Welcome to our website. By accessing or using this site, you agree to be bound by these terms and conditions. Please read them carefully.</p>
              <h4 className="fw-bold mt-3">1. Acceptance of Terms</h4>
              <p>By using this website, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
              <h4 className="fw-bold mt-4">2. Modifications</h4>
              <p>We reserve the right to modify these Terms and Conditions at any time. Updated terms will be posted on this page with the revised date. Continued use constitutes acceptance of any changes.</p>
              <h4 className="fw-bold mt-4">3. Intellectual Property</h4>
              <p>All content, trademarks, graphics, and materials on this website are owned or licensed by us and protected by copyright and intellectual property laws. Unauthorized use is strictly prohibited.</p>
              <h4 className="fw-bold mt-4">4. User Responsibilities</h4>
              <ul>
                <li>Do not engage in unauthorized copying or distribution.</li>
                <li>Do not use the site for illegal or unauthorized purposes.</li>
                <li>Do not attempt to gain unauthorized access to the website or its data.</li>
              </ul>
              <h4 className="fw-bold mt-4">5. Payment and Refunds</h4>
              <p>All purchases are final unless otherwise specified. Refund requests will be considered on a case-by-case basis. Licensing fees may vary based on usage.</p>
              <h4 className="fw-bold mt-4">6. Limitation of Liability</h4>
              <p>We are not liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>
              <h4 className="fw-bold mt-4">7. License Types</h4>
              <h5 className="mt-3">Single License</h5>
              <ul className="lh-lg">
                <li>Restricted to a single installation.</li>
                <li>For use in personal or client work.</li>
                <li>Not for redistribution or resale.</li>
                <li>GPL terms override where applicable.</li>
              </ul>
              <h5 className="mt-3">Multiple License</h5>
              <ul className="lh-lg">
                <li>Permits multiple installations.</li>
                <li>For use in multiple personal or client projects.</li>
                <li>Not for resale or redistribution.</li>
                <li>GPL terms override where applicable.</li>
              </ul>
              <h5 className="mt-3">Extended License</h5>
              <ul className="lh-lg">
                <li>Permits resale or redistribution as part of a larger work.</li>
                <li>Allowed in modified or integrated final products.</li>
                <li>Licensed components must not be used standalone.</li>
                <li>GPL terms override where applicable.</li>
              </ul>
              <h4 className="fw-bold mt-4">8. Termination</h4>
              <p>We reserve the right to terminate access to our services if you violate any terms.</p>
              <h4 className="fw-bold mt-4">9. Governing Law</h4>
              <p>These Terms are governed by and construed in accordance with the laws of the applicable jurisdiction.</p>
              <p className="mt-4 mb-0">
                For any questions regarding these Terms, please contact us at
                <Link to="mailto:support@example.com"> support@example.com</Link>.
              </p>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
