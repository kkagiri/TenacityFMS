import PdfRenderer from './PdfRenderer'
import Icon from '@/components/wrappers/Icon'
import { ChangeEvent, useState } from 'react'



const PdfView = () => {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)

  const [scale, setScale] = useState<number>(1.5)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages)
  }

  const nextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1)
    }
  }

  const prevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1)
    }
  }

  const onZoomIn = () => {
    if (scale >= 3) {
      return
    }
    setScale(scale + 0.2)
  }

  const onZoomOut = () => {
    if (scale <= 0.5) {
      return
    }
    setScale(scale - 0.2)
  }

  const onZoomReset = () => {
    setScale(1)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value)
    if (!isNaN(value) && value > 0 && value <= numPages) {
      setPageNumber(value)
    }
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="text-center">
          <div className="inline-flex text-nowrap">
            <button id="prev" className="btn bg-dark rounded-e-none text-white" onClick={prevPage}>
              <Icon icon="arrow-left" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button id="next" className="btn bg-dark rounded-none text-white" onClick={nextPage}>
              <Icon icon="arrow-right" />
              <span className="hidden sm:inline">Next</span>
            </button>
            <button id="zoomin" className="btn bg-dark rounded-none text-white" onClick={onZoomIn}>
              <Icon icon="zoom-in" />
              <span className="hidden sm:inline">Zoom In</span>
            </button>
            <button id="zoomout" className="btn bg-dark rounded-none text-white" onClick={onZoomOut}>
              <Icon icon="zoom-in" />
              <span className="hidden sm:inline">Zoom Out</span>
            </button>
            <button id="zoomfit" className="btn bg-dark rounded-s-none text-white" onClick={onZoomReset}>
              100%
            </button>
            <div className="flex">
              <input type="number" className="form-input ms-3 rounded-e-none!" id="page_num" style={{ width: 50 }} value={pageNumber} onChange={handleChange} />
              <span className="border-default-300 flex rounded-e border border-s-0 px-3 py-1.5 bg-light/15" id="page_count">
                / {numPages}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-center overflow-auto text-center">
          <PdfRenderer pageNumber={pageNumber} scale={scale} onLoadSuccess={onDocumentLoadSuccess} />
        </div>
      </div>
    </div>
  )
}

export default PdfView
