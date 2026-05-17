import deflag from '@/assets/images/flags/de.svg'
import esflag from '@/assets/images/flags/es.svg'
import inflag from '@/assets/images/flags/in.svg'
import itflag from '@/assets/images/flags/it.svg'
import ruflag from '@/assets/images/flags/ru.svg'
import FlagSa from '@/assets/images/flags/sa.svg'
import usflag from '@/assets/images/flags/us.svg'
import { useLayoutContext } from '@/context/useLayoutContext'

import { Link } from 'react-router'
import { useState } from 'react'

type Language = {
  code: string
  name: string
  flag: string
}

const languages: Language[] = [
  { code: 'EN', name: 'English', flag: usflag },
  { code: 'DE', name: 'Deutsch', flag: deflag },
  { code: 'IT', name: 'Italiano', flag: itflag },
  { code: 'ES', name: 'Español', flag: esflag },
  { code: 'RU', name: 'Русский', flag: ruflag },
  { code: 'HI', name: 'हिन्दी', flag: inflag },
  { code: 'SA', name: 'عربي', flag: FlagSa },
]

const LanguageSelector = () => {
  const [selected, setSelected] = useState<Language>(languages[0])
  const { updateSettings, dir } = useLayoutContext()
  const handleLanguageChange = (lang: Language) => {
    setSelected(lang)
    if (lang.code === 'SA' && dir === 'ltr') {
      updateSettings({ dir: 'rtl' })
    } else if (lang.code !== 'SA' && dir === 'rtl') {
      updateSettings({ dir: 'ltr' })
    }
  }
  return (
    <>
      <div id="language-selector" className="topbar-item hs-dropdown relative sm:inline-flex hidden [--placement:bottom-right]">
        <button className="topbar-link hs-dropdown-toggle font-bold relative flex items-center" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
          <img src={selected.flag} alt="" className="me-3 size-4.5 rounded" id="selected-language-image" />
          <span id="selected-language-code">EN</span>
        </button>
        <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical" aria-labelledby="dropdown-menu">
          {languages.map((language, idx) => (
            <Link to="" onClick={() => handleLanguageChange(language)} className="dropdown-item" data-translator-lang={language.code} title={language.name} key={idx}>
              <img src={language.flag} alt={language.name} className="me-1 size-4 rounded" height={18} data-translator-image />
              <span className="align-middle">{language.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

export default LanguageSelector
