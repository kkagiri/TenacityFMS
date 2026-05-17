import Icon from '@/components/wrappers/Icon'

const MonochromeMode = () => {
  const toggleMonochromeMode = () => {
    const htmlEl = document.getElementsByTagName('html')[0]
    htmlEl.classList.toggle('monochrome')
  }
  return (
    <div className="topbar-item" id="monochrome-toggler">
      <button className="topbar-link btn btn-sm size-8 rounded-full" id="monochrome-mode" type="button" aria-label="Monochrome Mode" onClick={toggleMonochromeMode}>
        <Icon icon="palette" className="text-xl" />
      </button>
    </div>
  )
}

export default MonochromeMode
