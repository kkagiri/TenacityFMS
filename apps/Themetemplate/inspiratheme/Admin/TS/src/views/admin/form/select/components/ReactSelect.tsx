import Select from '@/components/wrappers/Select'
import { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'

type OptionType = {
  label: string
  value: string
}

const basicOptions: OptionType[] = [
  { value: 'Choice 1', label: 'Choice 1' },
  { value: 'Choice 2', label: 'Choice 2' },
  { value: 'Choice 3', label: 'Choice 3' },
]

const groupedOptions = [
  {
    label: 'UK',
    options: [
      { label: 'London', value: 'London' },
      { label: 'Manchester', value: 'Manchester' },
      { label: 'Liverpool', value: 'Liverpool' },
    ],
  },
  {
    label: 'FR',
    options: [
      { label: 'Paris', value: 'Paris' },
      { label: 'Lyon', value: 'Lyon' },
      { label: 'Marseille', value: 'Marseille' },
    ],
  },
  {
    label: 'DE',
    options: [
      { label: 'Hamburg', value: 'Hamburg' },
      { label: 'Munich', value: 'Munich' },
      { label: 'Berlin', value: 'Berlin' },
    ],
    isDisabled: true,
  },
  {
    label: 'US',
    options: [
      { label: 'New York', value: 'New York' },
      { label: 'Washington', value: 'Washington', isDisabled: true },
      { label: 'Michigan', value: 'Michigan' },
    ],
  },
  {
    label: 'SP',
    options: [
      { label: 'Madrid', value: 'Madrid' },
      { label: 'Barcelona', value: 'Barcelona' },
      { label: 'Malaga', value: 'Malaga' },
    ],
  },
  {
    label: 'CA',
    options: [
      { label: 'Montreal', value: 'Montreal' },
      { label: 'Toronto', value: 'Toronto' },
      { label: 'Vancouver', value: 'Vancouver' },
    ],
  },
]

const ReactSelect = () => {
  const [singleDefault, setSingleDefault] = useState<OptionType | null>(null)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle as="h4">Choices.Js</CardTitle>
        </CardHeader>
        <CardBody>
          <Row className="g-4">
            <Col lg={6}>
              <h5>Single Select Input: Default</h5>
              <p className="text-muted mb-0">
                Set <code>data-choices</code> attribute to set a default single select.
              </p>
            </Col>
            <Col lg={6}>
              <Select className="react-select" classNamePrefix="react-select" placeholder="This is a placeholder" options={basicOptions} value={singleDefault} onChange={(val) => setSingleDefault(val as OptionType)} />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-4">
            <Col lg={6}>
              <h5>Single Select Input: Option Groups</h5>
              <p className="text-muted mb-0">Option groups using react-select</p>
            </Col>
            <Col lg={6}>
              <Select className="react-select" classNamePrefix="react-select" placeholder="Select City" options={groupedOptions} />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-4">
            <Col lg={6}>
              <h5>Single Select Input: No Search</h5>
              <p className="text-muted mb-0">
                Disable search box using <code>isSearchable=&#123;false&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Select className="react-select" classNamePrefix="react-select" isSearchable={false} options={basicOptions} />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-4">
            <Col lg={6}>
              <h5>Single Select Input: No Sorting</h5>
              <p className="text-muted mb-0">Options shown in provided order</p>
            </Col>
            <Col lg={6}>
              <Select className="react-select" classNamePrefix="react-select" options={groupedOptions.flatMap((g) => g.options)} />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-4">
            <Col lg={6}>
              <h5>Multiple Select Input: Default</h5>
              <p className="text-muted mb-0">Select multiple values</p>
            </Col>
            <Col lg={6}>
              <Select className="react-select" classNamePrefix="react-select" isMulti options={basicOptions} />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-4">
            <Col lg={6}>
              <h5>Multiple Select Input: With Remove Button</h5>
              <p className="text-muted mb-0">
                Set <code>data-choices data-choices-removeItem multiple</code> attribute.
              </p>
            </Col>
            <Col lg={6}>
              <Select className="react-select" classNamePrefix="react-select" isMulti options={basicOptions} />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-4">
            <Col lg={6}>
              <h5>Multiple Select Input: Option Groups</h5>
              <p className="text-muted mb-0">
                Set <code>data-choices data-choices-multiple-groups=&quot;true&quot; multiple</code> attribute.
              </p>
            </Col>
            <Col lg={6}>
              <Select className="react-select" classNamePrefix="react-select" isMulti options={groupedOptions} />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-4">
            <Col lg={6}>
              <h5>Text Input: Limit Values with Remove Button</h5>
              <p className="text-muted mb-0">
                Set <code>data-choices data-choices-limit=&quot;3&quot; data-choices-removeItem</code> attribute.
              </p>
            </Col>
            <Col lg={6}>
              <input className="form-control" id="choices-text-remove-button" data-choices data-choices-limit={3} data-choices-removeitem type="text" defaultValue="Task-1" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-4">
            <Col lg={6}>
              <h5>Text Input: Unique Values Only</h5>
              <p className="text-muted mb-0">
                Set <code>data-choices data-choices-text-unique-true</code> attribute.
              </p>
            </Col>
            <Col lg={6}>
              <input className="form-control" id="choices-text-unique-values" data-choices data-choices-text-unique-true type="text" defaultValue="Project-A, Project-B" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-4">
            <Col lg={6}>
              <h5>Text Input: Disabled</h5>
              <p className="text-muted mb-0">
                Set <code>data-choices data-choices-text-disabled-true</code> attribute.
              </p>
            </Col>
            <Col lg={6}>
              <input className="form-control" id="choices-text-disabled" data-choices data-choices-text-disabled-true type="text" defaultValue="josh@joshuajohnson.co.uk, joe@bloggs.co.uk" />
            </Col>
          </Row>
        </CardBody>
      </Card>
    </>
  )
}

export default ReactSelect
