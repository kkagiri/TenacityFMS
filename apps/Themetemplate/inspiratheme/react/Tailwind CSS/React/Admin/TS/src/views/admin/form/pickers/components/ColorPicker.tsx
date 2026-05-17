import { useState } from 'react'
import { HexAlphaColorPicker, HexColorPicker, HslaColorPicker, HslColorPicker, RgbaColorPicker, RgbColorPicker } from 'react-colorful'

const ColorPicker = () => {
  const [classicColor, setClassicColor] = useState('#aabbcc')
  const [monolithColor, setMonolithColor] = useState({ r: 150, g: 50, b: 200 })
  const [nanoColor, setNanoColor] = useState({ h: 200, s: 50, l: 50 })
  const [demoColor, setDemoColor] = useState('#ff0000')
  const [opacityHueColor, setOpacityHueColor] = useState('rgba(255,0,0,0.5)')
  const [switchColor, setSwitchColor] = useState('#00ff88')
  const [inputColor, setInputColor] = useState('#123456')
  const [formatColor, setFormatColor] = useState({ h: 180, s: 100, l: 50, a: 1 })
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Colorpicker</h4>
      </div>
      <div className="card-body">
        <h4 className="card-title mb-5">Example</h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Classic Demo</h5>
            <p className="text-default-500">
              Use
              <code>classic-colorpicker</code>
              class to set classic colorpicker.
            </p>
          </div>
          <div>
            <HexAlphaColorPicker color={classicColor} onChange={setClassicColor} className="classic-colorpicker" />
          </div>
        </div>

        <hr className="border-default-300 my-9 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Monolith Demo</h5>
            <p className="text-default-500">
              Use
              <code>monolith-colorpicker</code>
              class to set monolith colorpicker.
            </p>
          </div>
          <div>
            <RgbColorPicker color={monolithColor} onChange={setMonolithColor} className="monolith-colorpicker" />
          </div>
        </div>

        <hr className="border-default-300 my-9 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Nano Demo</h5>
            <p className="text-default-500">
              Use
              <code>nano-colorpicker</code>
              class to set nano colorpicker.
            </p>
          </div>
          <div>
            <HslColorPicker color={nanoColor} onChange={setNanoColor} className="nano-colorpicker" />
          </div>
        </div>

        <hr className="border-default-300 my-9 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Demo</h5>
            <p className="text-default-500">
              Use
              <code>colorpicker-demo</code>
              class to set demo option colorpicker.
            </p>
          </div>
          <div>
            <HexColorPicker color={demoColor} onChange={setDemoColor} className="colorpicker-demo" />
          </div>
        </div>

        <hr className="border-default-300 my-9 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Picker with Opacity & Hue</h5>
            <p className="text-default-500">
              Use
              <code>colorpicker-opacity-hue</code>
              class to set colorpicker with opacity & hue.
            </p>
          </div>
          <div>
            <RgbaColorPicker color={typeof opacityHueColor === 'string' ? { r: 255, g: 0, b: 0, a: 0.5 } : opacityHueColor} onChange={() => setOpacityHueColor} />
          </div>
        </div>

        <hr className="border-default-300 my-9 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Switches</h5>
            <p className="text-default-500">
              Use
              <code>colorpicker-switch</code>
              class to set switch colorpicker.
            </p>
          </div>
          <div>
            <HexColorPicker color={switchColor} onChange={setSwitchColor} className="colorpicker-switch" />
          </div>
        </div>

        <hr className="border-default-300 my-9 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Picker with Input</h5>
            <p className="text-default-500">
              Use
              <code>colorpicker-input</code>
              class to set colorpicker with input.
            </p>
          </div>
          <div>
            <HexColorPicker color={inputColor} onChange={setInputColor} />
            <input type="text" className="form-control mt-2" value={inputColor} onChange={(e) => setInputColor(e.target.value)} />
          </div>
        </div>

        <hr className="border-default-300 my-9 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 block text-sm font-semibold">Color Format</h5>
            <p className="text-default-500">
              Use
              <code>colorpicker-format</code>
              class to set colorpicker with format option.
            </p>
          </div>
          <div>
            <HslaColorPicker color={formatColor} onChange={setFormatColor} />
            <p className="mt-2">Selected: {JSON.stringify(formatColor)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ColorPicker
