import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Link } from 'react-router'
import { Card, CardBody, Col, Row } from 'react-bootstrap'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Privacy Policy" subtitle="Pages" />
      <Row className="justify-content-center">
        <Col xs={9}>
          <div className="text-center my-4">
            <h1 className="fw-bold">Privacy Policy</h1>
            <p className="text-muted">Effective Date: April 19, 2025</p>
          </div>

          <Card>
            <CardBody>
              <p className="fst-italic fs-sm">This Privacy Policy explains how we collect, use, and safeguard your personal information when you interact with our website and services.</p>
              <h4 className="fw-bold mt-3">1. Information We Collect</h4>
              <p>We may collect personal details such as your name, email address, payment information, and usage data when you interact with our products or services.</p>
              <h4 className="fw-bold mt-4">2. How We Use Your Information</h4>
              <p>Your information is used to provide, improve, and personalize our services, process transactions, send updates, and ensure security.</p>
              <h4 className="fw-bold mt-4">3. Data Sharing</h4>
              <p>We do not sell your personal information. Data may be shared with trusted service providers and partners only when necessary to deliver our services or comply with legal obligations.</p>
              <h4 className="fw-bold mt-4">4. Cookies &amp; Tracking</h4>
              <p>Our website may use cookies and similar technologies to enhance your experience, analyze traffic, and provide personalized content. You can manage cookie preferences in your browser settings.</p>
              <h4 className="fw-bold mt-4">5. Data Security</h4>
              <p>We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, or disclosure. However, no method of transmission is 100% secure.</p>
              <h4 className="fw-bold mt-4">6. Your Rights</h4>
              <ul>
                <li>Access, update, or delete your personal data.</li>
                <li>Request a copy of the data we hold about you.</li>
                <li>Opt out of marketing communications at any time.</li>
              </ul>
              <h4 className="fw-bold mt-4">7. Third-Party Services</h4>
              <p>Our services may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.</p>
              <h4 className="fw-bold mt-4">8. Changes to This Policy</h4>
              <p>We may update this Privacy Policy periodically. Updates will be posted on this page with a revised effective date.</p>
              <h4 className="fw-bold mt-4">9. Contact Us</h4>
              <p>
                If you have any questions or concerns about this Privacy Policy, please contact us at
                <Link to="mailto:privacy@example.com"> privacy@example.com</Link>.
              </p>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
