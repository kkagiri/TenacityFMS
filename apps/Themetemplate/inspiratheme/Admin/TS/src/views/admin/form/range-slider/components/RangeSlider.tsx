import { getColor } from '@/utils/helpers'
import { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { Direction, getTrackBackground, Range } from 'react-range'
import { IRenderMarkParams, IRenderThumbParams, IRenderTrackParams } from 'react-range/lib/types'

const STEP = 0.1
const MIN = 0
const MAX = 100

const renderTrack = ({
  props,
  children,
  values,
  direction,
}: IRenderTrackParams & {
  values: number[]
  direction?: Direction
}) => (
  <div
    onMouseDown={props.onMouseDown}
    onTouchStart={props.onTouchStart}
    style={{
      ...props.style,
      height: '36px',
      display: 'flex',
      width: '100%',
    }}
  >
    <div
      ref={props.ref}
      className={'render-track'}
      style={{
        height: '5px',
        width: '100%',
        borderRadius: '4px',
        backgroundImage: getTrackBackground({
          values,
          colors: values.length == 1 ? [getColor('primary'), 'var(--theme-light)'] : values.length == 2 ? ['var(--theme-light)', getColor('primary'), 'var(--theme-light)'] : [getColor('danger'), getColor('primary'), getColor('secondary'), 'var(--theme-light)'],
          min: MIN,
          max: MAX,
          direction,
        }),
        alignSelf: 'center',
      }}
    >
      {children}
    </div>
  </div>
)

const renderVerticalTrack = ({
  props,
  children,
  values,
  direction,
}: IRenderTrackParams & {
  values: number[]
  direction?: Direction
}) => (
  <div
    onMouseDown={props.onMouseDown}
    onTouchStart={props.onTouchStart}
    style={{
      ...props.style,
      width: '36px',
      display: 'flex',
      height: '200px',
    }}
  >
    <div
      ref={props.ref}
      style={{
        width: '5px',
        height: '100%',
        borderRadius: '4px',
        backgroundImage: getTrackBackground({
          values,
          colors: values.length == 1 ? [getColor('primary'), 'var(--theme-light)'] : values.length == 2 ? ['var(--theme-light)', getColor('primary'), 'var(--theme-light)'] : [getColor('danger'), getColor('primary'), getColor('secondary'), 'var(--theme-light)'],
          min: MIN,
          max: MAX,
          direction,
        }),
        alignSelf: 'center',
      }}
    >
      {children}
    </div>
  </div>
)

const renderThumb = ({ props }: IRenderThumbParams) => <div {...props} key={props.key} className={'render-thumb'} style={{ ...props.style }} />

const renderLineThumb = ({ props }: IRenderThumbParams) => (
  <div
    {...props}
    key={props.key}
    style={{
      ...props.style,
      height: '20px',
      width: '6px',
      borderRadius: '25px',
      backgroundColor: getColor('primary'),
    }}
  />
)

const renderMark = ({ props, index, values }: IRenderMarkParams & { values: number[] }) => (
  <div
    {...props}
    key={props.key}
    className={'render-mark'}
    style={{
      ...props.style,
      height: '12px',
      marginTop: '10px',
      width: '3px',
      borderRadius: '5px',
      backgroundColor: index * STEP < values[0] ? 'var(--theme-light)' : 'var(--theme-light)',
    }}
  />
)

const RangeSlider = () => {
  return (
    <>
      <Card>
        <CardHeader className="d-block">
          <CardTitle as="h4">Examples</CardTitle>
        </CardHeader>
        <CardBody>
          <BasicSlider />

          <div className="my-4 border-top border-dashed" />

          <StepSlider />

          <div className="my-4 border-top border-dashed"></div>

          <LabeledSlider />

          <div className="my-4 border-top border-dashed"></div>

          <LineThumbSlider />

          <div className="my-4 border-top border-dashed"></div>

          <TwoThumbSlider />

          <div className="my-4 border-top border-dashed"></div>

          <MultiThumbSlider />

          <div className="my-4 border-top border-dashed"></div>

          <MarkSlider />

          <div className="my-4 border-top border-dashed"></div>

          <LeftDirectionSlider />

          <div className="my-4 border-top border-dashed"></div>

          <VerticalSliders />
        </CardBody>
      </Card>
    </>
  )
}

const BasicSlider = () => {
  const [values, setValues] = useState([50])
  return (
    <Row className="g-3">
      <Col lg={4}>
        <h5 className="mb-1">Basic Slider</h5>
      </Col>
      <Col lg={8}>
        <Range step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderThumb} />
      </Col>
    </Row>
  )
}

const StepSlider = () => {
  const [values, setValues] = useState([50])
  return (
    <Row className="g-3">
      <Col lg={4}>
        <h5 className="mb-1">Step Slider</h5>
      </Col>
      <Col lg={8}>
        <Range step={10} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderThumb} />
      </Col>
    </Row>
  )
}

const LabeledSlider = () => {
  const [values, setValues] = useState([50])
  return (
    <Row className="g-3">
      <Col lg={4}>
        <h5 className="mb-1">Labeled Slider</h5>
      </Col>
      <Col lg={8}>
        <Range
          step={STEP}
          min={MIN}
          max={MAX}
          values={values}
          onChange={(values) => setValues(values)}
          renderTrack={(params) => renderTrack({ ...params, values })}
          renderThumb={({ props }) => (
            <div
              {...props}
              key={props.key}
              style={{
                ...props.style,
                height: '16px',
                width: '16px',
                borderRadius: '50%',
                backgroundColor: getColor('primary'),
              }}
            >
              <div
                key={props.key}
                style={{
                  position: 'absolute',
                  top: '-32px',
                  left: '-8px',
                  color: '#fff',
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: getColor('primary'),
                }}
              >
                {values[0].toFixed(1)}
              </div>
            </div>
          )}
        />
      </Col>
    </Row>
  )
}

const LineThumbSlider = () => {
  const [values, setValues] = useState([50])
  return (
    <Row className="g-3">
      <Col lg={4}>
        <h5 className="mb-1">Line Thumb Slider</h5>
      </Col>
      <Col lg={8}>
        <Range step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderLineThumb} />
      </Col>
    </Row>
  )
}

const TwoThumbSlider = () => {
  const [values, setValues] = useState([25, 75])
  return (
    <Row className="g-3">
      <Col lg={4}>
        <h5 className="mb-1">Two Thumb Slider</h5>
      </Col>
      <Col lg={8}>
        <Range step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderThumb} />
      </Col>
    </Row>
  )
}

const MultiThumbSlider = () => {
  const [values, setValues] = useState([25, 50, 75])
  return (
    <Row className="g-3">
      <Col lg={4}>
        <h5 className="mb-1">Multi Thumb Slider</h5>
      </Col>
      <Col lg={8}>
        <Range step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderThumb} />
      </Col>
    </Row>
  )
}

const MarkSlider = () => {
  const [values, setValues] = useState([50])
  return (
    <Row className="g-3">
      <Col lg={4}>
        <h5 className="mb-1">Mark Slider</h5>
      </Col>
      <Col lg={8}>
        <Range step={10} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderThumb} renderMark={(params) => renderMark({ ...params, values })} />
      </Col>
    </Row>
  )
}

const LeftDirectionSlider = () => {
  const [values, setValues] = useState([50])
  return (
    <Row className="g-3">
      <Col lg={4}>
        <h5 className="mb-1">Left Direction Slider</h5>
      </Col>
      <Col lg={8}>
        <Range direction={Direction.Left} step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values, direction: Direction.Left })} renderThumb={renderThumb} />
      </Col>
    </Row>
  )
}

const VerticalSliders = () => {
  const [values, setValues] = useState([50])
  return (
    <Row className="g-3">
      <Col lg={4}>
        <h5 className="mb-1">Vertical Sliders</h5>
      </Col>
      <Col lg={8}>
        <div className="d-flex gap-3">
          <Range direction={Direction.Down} step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderVerticalTrack({ ...params, values, direction: Direction.Down })} renderThumb={renderThumb} />

          <Range direction={Direction.Up} step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderVerticalTrack({ ...params, values, direction: Direction.Up })} renderThumb={renderThumb} />
        </div>
      </Col>
    </Row>
  )
}

export default RangeSlider
