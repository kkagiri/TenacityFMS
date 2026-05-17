import { useLayoutContext } from '@/context/useLayoutContext'
import { toTitleCase } from '@/utils/helpers'
import type { CustomizationOptionType } from '../index'

import defaultImg from '@/assets/images/layouts/skin-default.png'

import flatImg from '@/assets/images/layouts/skin-flat.png'
import galaxyImg from '@/assets/images/layouts/skin-galaxy.png'

import luxeImg from '@/assets/images/layouts/skin-luxe.png'
import materialImg from '@/assets/images/layouts/skin-material.png'

import minimalImg from '@/assets/images/layouts/skin-minimal.png'
import modernImg from '@/assets/images/layouts/skin-modern.png'

import neonImg from '@/assets/images/layouts/skin-neon.png'

import pixelImg from '@/assets/images/layouts/skin-pixel.png'

import retroImg from '@/assets/images/layouts/skin-retro.png'
import saasImg from '@/assets/images/layouts/skin-saas.png'

const skinOptions: CustomizationOptionType[] = [
  { value: 'default', image: defaultImg },
  { value: 'minimal', image: minimalImg },
  { value: 'modern', image: modernImg },
  { value: 'material', image: materialImg },
  { value: 'saas', image: saasImg },
  { value: 'flat', image: flatImg },
  { value: 'galaxy', image: galaxyImg },
  { value: 'luxe', image: luxeImg },
  { value: 'retro', image: retroImg },
  { value: 'neon', image: neonImg },
  { value: 'pixel', image: pixelImg },
]

const Skin = () => {
  const { updateSettings, skin } = useLayoutContext()

  const handleSkinChange = (value: string) => {
    updateSettings({ skin: value })
  }

  return (
    <div className="p-6">
      <h5 className="text-md mb-base font-bold">Select Theme</h5>
      <div className="grid grid-cols-2 gap-3">
        {skinOptions.map((item) => (
          <div className="card-radio" key={item.value}>
            <input className="hidden" type="radio" name="data-skin" id={`demo-skin-${item.value}`} checked={skin === item.value} onChange={() => handleSkinChange(item.value)} />
            <label className="form-label" htmlFor={`demo-skin-${item.value}`}>
              <img src={item.image} alt="layout img" className="flex size-full rounded-md" />
            </label>
            <h5 className="text-md text-default-600 mt-2.5 text-center">{toTitleCase(item.value)}</h5>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Skin
