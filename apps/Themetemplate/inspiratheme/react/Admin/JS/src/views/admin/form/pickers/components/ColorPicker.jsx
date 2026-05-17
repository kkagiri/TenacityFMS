import { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { HexColorPicker, HslaColorPicker, HslColorPicker, RgbaColorPicker, RgbColorPicker } from 'react-colorful'
const ColorPicker = () => {
  const [classicColor, setClassicColor] = useState('#aabbcc')
  const [monolithColor, setMonolithColor] = useState({
    r: 150,
    g: 50,
    b: 200,
  })
  const [nanoColor, setNanoColor] = useState({
    h: 200,
    s: 50,
    l: 50,
  })
  const [demoColor, setDemoColor] = useState('#ff0000')
  const [opacityHueColor, setOpacityHueColor] = useState('rgba(255,0,0,0.5)')
  const [switchColor, setSwitchColor] = useState('#00ff88')
  const [inputColor, setInputColor] = useState('#123456')
  const [formatColor, setFormatColor] = useState({
    h: 180,
    s: 100,
    l: 50,
    a: 1,
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Colorpicker</CardTitle>
      </CardHeader>

      <CardBody>
        <CardTitle as="h4" className="mb-3">
          Example
        </CardTitle>

        <Row className="align-items-center g-4">
          <Col lg={6}>
            <h5 className="fw-semibold mb-1">Classic Demo</h5>
            <p className="text-muted mb-0">
              Simple <code>HexColorPicker</code>.
            </p>
          </Col>
          <Col lg={6}>
            <HexColorPicker color={classicColor} onChange={setClassicColor} />
            <p className="mt-2">Selected: {classicColor}</p>
          </Col>
        </Row>
        <div className="my-4 border-top border-dashed" />

        <Row className="align-items-center g-4">
          <Col lg={6}>
            <h5 className="fw-semibold mb-1">Monolith Demo</h5>
            <p className="text-muted mb-0">
              Use <code>RgbColorPicker</code>.
            </p>
          </Col>
          <Col lg={6}>
            <RgbColorPicker color={monolithColor} onChange={setMonolithColor} />
            <p className="mt-2">
              Selected: rgb({monolithColor.r}, {monolithColor.g}, {monolithColor.b})
            </p>
          </Col>
        </Row>
        <div className="my-4 border-top border-dashed" />

        <Row className="align-items-center g-4">
          <Col lg={6}>
            <h5 className="fw-semibold mb-1">Nano Demo</h5>
            <p className="text-muted mb-0">
              Use <code>HslColorPicker</code>.
            </p>
          </Col>
          <Col lg={6}>
            <HslColorPicker color={nanoColor} onChange={setNanoColor} />
            <p className="mt-2">
              Selected: hsl({nanoColor.h}, {nanoColor.s}%, {nanoColor.l}%)
            </p>
          </Col>
        </Row>
        <div className="my-4 border-top border-dashed" />

        <Row className="align-items-center g-4">
          <Col lg={6}>
            <h5 className="fw-semibold mb-1">Demo</h5>
            <p className="text-muted mb-0">Simple HEX picker with preview.</p>
          </Col>
          <Col lg={6}>
            <HexColorPicker color={demoColor} onChange={setDemoColor} />
            <input type="text" className="form-control mt-2" value={demoColor} onChange={(e) => setDemoColor(e.target.value)} />
          </Col>
        </Row>
        <div className="my-4 border-top border-dashed" />

        <Row className="align-items-center g-4">
          <Col lg={6}>
            <h5 className="fw-semibold mb-1">Picker with Opacity &amp; Hue</h5>
            <p className="text-muted mb-0">
              Use <code>RgbaColorPicker</code>.
            </p>
          </Col>
          <Col lg={6}>
            <RgbaColorPicker
              color={
                typeof opacityHueColor === 'string'
                  ? {
                      r: 255,
                      g: 0,
                      b: 0,
                      a: 0.5,
                    }
                  : opacityHueColor
              }
              onChange={setOpacityHueColor}
            />
            <p className="mt-2">Selected: {JSON.stringify(opacityHueColor)}</p>
          </Col>
        </Row>
        <div className="my-4 border-top border-dashed" />

        <Row className="align-items-center g-4">
          <Col lg={6}>
            <h5 className="fw-semibold mb-1">Switches</h5>
            <p className="text-muted mb-0">
              Custom switch using <code>HexColorPicker</code>.
            </p>
          </Col>
          <Col lg={6}>
            <HexColorPicker color={switchColor} onChange={setSwitchColor} />
            <p className="mt-2">Selected: {switchColor}</p>
          </Col>
        </Row>
        <div className="my-4 border-top border-dashed" />

        <Row className="align-items-center g-4">
          <Col lg={6}>
            <h5 className="fw-semibold mb-1">Picker with Input</h5>
            <p className="text-muted mb-0">
              Controlled input for <code>HexColorPicker</code>.
            </p>
          </Col>
          <Col lg={6}>
            <HexColorPicker color={inputColor} onChange={setInputColor} />
            <input type="text" className="form-control mt-2" value={inputColor} onChange={(e) => setInputColor(e.target.value)} />
          </Col>
        </Row>
        <div className="my-4 border-top border-dashed" />

        <Row className="align-items-center g-4">
          <Col lg={6}>
            <h5 className="fw-semibold mb-1">Color Format</h5>
            <p className="text-muted mb-0">
              Use <code>HslaColorPicker</code> for HSLA format.
            </p>
          </Col>
          <Col lg={6}>
            <HslaColorPicker color={formatColor} onChange={setFormatColor} />
            <p className="mt-2">Selected: {JSON.stringify(formatColor)}</p>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}
export default ColorPicker
