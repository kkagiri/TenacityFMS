import { getColor } from '@/utils/helpers'
import { useState } from 'react'
import { Direction, Range, getTrackBackground } from 'react-range'
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
          colors:
            values.length == 1 ? [getColor('primary'), 'var(--color-default-300)'] : values.length == 2 ? ['var(--color-default-300)', getColor('primary'), 'var(--color-default-300)'] : [getColor('danger'), getColor('primary'), getColor('secondary'), 'var(--color-default-300)'],
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
          colors:
            values.length == 1 ? [getColor('primary'), 'var(--color-default-300)'] : values.length == 2 ? ['var(--color-default-300)', getColor('primary'), 'var(--color-default-300)'] : [getColor('danger'), getColor('primary'), getColor('secondary'), 'var(--color-default-300)'],
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

const renderThumb = ({ props }: IRenderThumbParams) => (
  <div
    {...props}
    key={props.key}
    className={'render-thumb'}
    style={{
      ...props.style,
      height: '16px',
      width: '16px',
      borderRadius: '50%',
      backgroundColor: getColor('primary'),
    }}
  />
)

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
      backgroundColor: index * STEP < values[0] ? 'var(--color-default-300)' : 'var(--color-default-300)',
    }}
  />
)

const RangeSlider = () => {
  return (
    <div className="container">
      <div className="card">
        <div className="card-header block!">
          <h4 className="card-title mb-1.25">Examples</h4>
          <p className="text-default-400">
            noUiSlider is a lightweight, ARIA-accessible JavaScript range slider with multi-touch and keyboard support. It is fully GPU animated: no reflows, so it is fast; even on older devices. It also fits wonderfully in responsive designs and has no dependencies
          </p>
        </div>

        <div className="card-body">
          <BasicRangeSlider />

          <div className="my-7.5 border-t border-default-300 border-dashed" />

          <StepSlider />

          <div className="my-7.5 border-t border-default-300 border-dashed" />

          <LabeledSlider />

          <div className="my-7.5 border-t border-default-300 border-dashed" />
          <LineThumbSlider />

          <div className="my-7.5 border-t border-default-300 border-dashed" />

          <TwoThumbSlider />

          <div className="my-7.5 border-t border-default-300 border-dashed" />

          <MultiThumbSlider />

          <div className="my-7.5 border-t border-default-300 border-dashed" />
          <MarkSlider />

          <div className="my-7.5 border-t border-default-300 border-dashed" />

          <LeftDirectionSlider />

          <div className="my-7.5 border-t border-default-300 border-dashed" />

          <VerticalSliders />
        </div>
      </div>
    </div>
  )
}

export default RangeSlider

const BasicRangeSlider = () => {
  const [values, setValues] = useState([50])
  return (
    <div className="grid grid-cols-3 gap-base">
      <div>
        <h5 className="mb-1.25">Basic Range Slider</h5>
        <p className="text-default-400">A simple single-value slider.</p>
      </div>

      <div className="col-span-2">
        <Range step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderThumb} />
      </div>
    </div>
  )
}

const StepSlider = () => {
  const [values, setValues] = useState([50])
  return (
    <div className="grid grid-cols-3 gap-base">
      <div>
        <h5 className="mb-1.25">Step Slider</h5>
      </div>

      <div className="col-span-2">
        <Range step={10} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderThumb} />
      </div>
    </div>
  )
}

const LabeledSlider = () => {
  const [values, setValues] = useState([50])
  return (
    <div className="grid grid-cols-3 gap-base">
      <div>
        <h5 className="mb-1.25">Labeled Slider</h5>
      </div>

      <div className="col-span-2">
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
      </div>
    </div>
  )
}

const LineThumbSlider = () => {
  const [values, setValues] = useState([50])
  return (
    <div className="grid grid-cols-3 gap-base">
      <div>
        <h5 className="mb-1.25">Line Thumb Slider</h5>
      </div>

      <div className="col-span-2">
        <Range step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderLineThumb} />
      </div>
    </div>
  )
}

const TwoThumbSlider = () => {
  const [values, setValues] = useState([25, 75])
  return (
    <div className="grid grid-cols-3 gap-base">
      <div>
        <h5 className="mb-1.25">Two Thumb Slider</h5>
      </div>

      <div className="col-span-2">
        <Range step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderThumb} />
      </div>
    </div>
  )
}

const MultiThumbSlider = () => {
  const [values, setValues] = useState([25, 50, 75])
  return (
    <div className="grid grid-cols-3 gap-base">
      <div>
        <h5 className="mb-1.25">Multi Thumb Slider</h5>
      </div>

      <div className="col-span-2">
        <Range step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderThumb} />
      </div>
    </div>
  )
}

const MarkSlider = () => {
  const [values, setValues] = useState([50])
  return (
    <div className="grid grid-cols-3 gap-base">
      <div>
        <h5 className="mb-1.25">Mark Slider</h5>
      </div>

      <div className="col-span-2">
        <Range step={10} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderThumb} renderMark={(params) => renderMark({ ...params, values })} />
      </div>
    </div>
  )
}

const LeftDirectionSlider = () => {
  const [values, setValues] = useState([50])
  return (
    <div className="grid grid-cols-3 gap-base">
      <div>
        <h5 className="mb-1.25">Left Direction Slider</h5>
      </div>

      <div className="col-span-2">
        <Range direction={Direction.Left} step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values, direction: Direction.Left })} renderThumb={renderThumb} />
      </div>
    </div>
  )
}

const VerticalSliders = () => {
  const [values, setValues] = useState([50])
  return (
    <div className="grid grid-cols-3 gap-base">
      <div>
        <h5 className="mb-1.25">Vertical Sliders</h5>
        <p className="text-default-400">Sliders arranged vertically.</p>
      </div>

      <div className="col-span-2">
        <div className="flex gap-18 overflow-hidden p-5">
          <Range direction={Direction.Down} step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderVerticalTrack({ ...params, values, direction: Direction.Down })} renderThumb={renderThumb} />

          <Range direction={Direction.Up} step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderVerticalTrack({ ...params, values, direction: Direction.Up })} renderThumb={renderThumb} />
        </div>
      </div>
    </div>
  )
}
