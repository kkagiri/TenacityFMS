import PdfRenderer from './PdfRenderer'
import Icon from '@/components/wrappers/Icon'
import { type ChangeEvent, useState } from 'react'
import { Button, Card, CardBody, FormControl } from 'react-bootstrap'


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
    <Card>
      <CardBody>
        <div className="text-center">
          <div className="btn-group text-nowrap">
            <Button variant="dark" onClick={prevPage}>
              <Icon icon="arrow-left" />
              <span className="d-none d-sm-inline ms-2">Previous</span>
            </Button>

            <Button variant="dark" onClick={nextPage}>
              <Icon icon="arrow-right" />
              <span className="d-none d-sm-inline ms-2">Next</span>
            </Button>

            <Button variant="dark" onClick={onZoomIn}>
              <Icon icon="zoom-in" />
              <span className="d-none d-sm-inline ms-2">Zoom In</span>
            </Button>

            <Button variant="dark" onClick={onZoomOut}>
              <Icon icon="zoom-out" />
              <span className="d-none d-sm-inline ms-2">Zoom Out</span>
            </Button>

            <Button variant="dark" className="rounded-end-3" onClick={onZoomReset}>
              100%
            </Button>

            <FormControl type="text" className="rounded-end-0 ms-1" value={pageNumber} onChange={handleChange} />
            <span className="input-group-text rounded-start-0 border-start-0">/ {numPages}</span>
          </div>
        </div>

        <div className="text-center d-flex justify-content-center mt-3">
          <PdfRenderer pageNumber={pageNumber} scale={scale} onLoadSuccess={onDocumentLoadSuccess} />
        </div>
      </CardBody>
    </Card>
  )
}

export default PdfView
