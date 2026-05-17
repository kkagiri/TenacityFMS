import { Document, Page, pdfjs } from 'react-pdf'
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
const PdfRenderer = ({ pageNumber, scale, onLoadSuccess }) => {
  return (
    <Document file="https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf" onLoadSuccess={onLoadSuccess}>
      <Page pageNumber={pageNumber} scale={scale} />
    </Document>
  )
}
export default PdfRenderer
