import PasswordInputWithStrength from '@/components/PasswordInputWithStrength'
import { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Col, Collapse, FormControl, FormLabel, FormText, Row } from 'react-bootstrap'
import PasswordChecklist from 'react-password-checklist'
const PasswordMeters = () => {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  return (
    <Row>
      <Col lg={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4">Progress Bar</CardTitle>
          </CardHeader>
          <CardBody>
            <PasswordInputWithStrength password={password} setPassword={setPassword} showIcon />
          </CardBody>
        </Card>
      </Col>

      <Col lg={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4">Password Condition</CardTitle>
          </CardHeader>
          <CardBody>
            <FormLabel>Magic Password ✨ (Type Here)</FormLabel>
            <FormControl type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
            <FormText>Use 8 or more characters with a mix of letters, numbers & symbols.</FormText>

            <Collapse in={password2.length > 0}>
              <div className="password-box bg-light-subtle border border-light mt-2 rounded">
                <PasswordChecklist rules={['minLength', 'specialChar', 'number', 'capital', 'lowercase']} minLength={8} value={password2} iconSize={8} validTextColor="#02BC9C" invalidTextColor="#F7577E" validColor="#02BC9C" invalidColor="#F7577E" className="m-2" />
              </div>
            </Collapse>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}
export default PasswordMeters
