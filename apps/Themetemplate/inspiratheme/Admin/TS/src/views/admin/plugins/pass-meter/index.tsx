import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Container } from 'react-bootstrap'
import PasswordMeters from './components/PasswordMeters'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Password Meter" subtitle="Plugins" />
      <Container>
        <PasswordMeters />
      </Container>
    </>
  )
}

export default Page
