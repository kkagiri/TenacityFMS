import { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import TextDifferentView from './TextDifferentView'
const TextDiff = () => {
  const [originalText, setOriginalText] = useState(
    'On a rainy Monday morning in a small town, Emma walked into her favorite café, her umbrella dripping and her hair slightly frizzy from the storm. She always ordered the same thing: black coffee, two sugars, and a blueberry muffin. But today, someone was already sitting at her usual table by the window. It was Jack — a quiet man with a book in hand and headphones around his neck. Their eyes met for a second. He smiled and motioned for her to join him. Hesitant but intrigued, Emma accepted.'
  )
  const [modifiedText, setModifiedText] = useState(
    'On a rainy Monday morning in a small town, Emma stepped into her favorite café, her umbrella dripping and her hair slightly frizzy from the damp weather. She always ordered the same thing: black coffee with two sugars and a blueberry muffin. But today, someone was already seated at her usual window table. It was Jack — a quiet man with a book in one hand and headphones resting around his neck. Their eyes met briefly. He smiled and gestured for her to join him. Hesitant but curious, Emma agreed.'
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">jsdiff</CardTitle>
      </CardHeader>
      <CardBody>
        <Row>
          <Col md={6}>
            <h5 className="mb-2 text-uppercase">Original Text</h5>
            <textarea className="diff-original form-control" rows={8} value={originalText} onChange={(e) => setOriginalText(e.target.value)} />
          </Col>

          <Col md={6}>
            <h5 className="mb-2 text-uppercase">Changed Text</h5>
            <textarea className="diff-changed form-control" rows={8} value={modifiedText} onChange={(e) => setModifiedText(e.target.value)} />
          </Col>

          <Col md={12}>
            <h5 className="mb-2 mt-3 text-uppercase">Results</h5>
            <TextDifferentView originalText={originalText} modifiedText={modifiedText} />
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}
export default TextDiff
