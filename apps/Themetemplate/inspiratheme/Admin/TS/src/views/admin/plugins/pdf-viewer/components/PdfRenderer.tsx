import { Document, Page, pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

type Props = {
  pageNumber: number
  scale: number
  onLoadSuccess: (data: { numPages: number }) => void
}

const PdfRenderer = ({ pageNumber, scale, onLoadSuccess }: Props) => {
  return (
    <Document file="https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf" onLoadSuccess={onLoadSuccess}>
      <Page pageNumber={pageNumber} scale={scale} />
    </Document>
  )
}

export default PdfRenderer
