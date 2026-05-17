import { currentYear, META_DATA } from '@/config/constants'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container-fluid">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
          <div className="text-center md:text-start">
            © {currentYear} {META_DATA.name} By&nbsp;
            <span className="font-semibold">{META_DATA.author}</span>
          </div>

          <div className="md:text-end hidden md:block">
            10GB of
            <span className="font-bold"> 250GB </span>
            Free.
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
