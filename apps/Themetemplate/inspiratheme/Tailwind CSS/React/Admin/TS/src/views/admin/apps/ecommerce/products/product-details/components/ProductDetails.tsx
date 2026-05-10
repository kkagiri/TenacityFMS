import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

const ProductDetails = () => {
  return (
    <>
      <div className="mb-5 flex justify-between">
        <span className="badge bg-success/15 text-success rounded-full text-sm py-1.5 px-3">In Stock</span>
        <div className="flex items-center text-base">
          {[...Array(5)].map((_, index) => (
            <Icon icon="star-filled" key={index} className="text-warning text-base" />
          ))}
          <span>
            <Link to="/apps/ecommerce/reviews" className="hover:text-primary ms-1 font-medium">
              (859 Reviews)
            </Link>
          </span>
        </div>
      </div>
      <div className="mt-5 mb-5 md:mb-7.5">
        <h4 className="text-lg">Apple iMac 24” M3 Chip – 4.5K Retina Display</h4>
      </div>
      <div className="mb-5 grid grid-cols-2 md:mb-7.5 md:grid-cols-4 gap-x-base">
        <div>
          <h6 className="text-default-400 text-xs mb-1.25 uppercase">SKU:</h6>
          <p className="font-medium">IMAC-M3-24</p>
        </div>
        <div>
          <h6 className="text-default-400 text-xs mb-1.25 uppercase">Category:</h6>
          <p className="font-medium">Computers</p>
        </div>
        <div>
          <h6 className="text-default-400 text-xs mb-1.25 uppercase">Stock:</h6>
          <p className="font-medium">67</p>
        </div>
        <div>
          <h6 className="text-default-400 text-xs mb-1.25 uppercase">Published:</h6>
          <p className="font-medium">
            12 Jul, 2025
            <small className="text-default-400">09:00 AM</small>
          </p>
        </div>
        <div className="mt-0 md:mt-7.5">
          <h6 className="text-default-400 text-xs mb-1.25 uppercase">Orders:</h6>
          <p className="font-medium">1,428</p>
        </div>
        <div className="mt-0 md:mt-7.5">
          <h6 className="text-default-400 text-xs mb-1.25 uppercase">Revenue:</h6>
          <p className="font-medium">$2,350,120.00</p>
        </div>
      </div>
      <h3 className="text-default-400 mb-7.5 flex items-center gap-3">
        <del className="text-default-400 text-lg">$1,499.00</del>
        <span className="text-danger text-xl font-bold">$1,299.00</span>
        <span className="text-default-400 text-lg">(13%)</span>
      </h3>
      <h5 className="text-default-400 mb-2.5 text-xs uppercase">Product Info:</h5>
      <p className="mb-4">The Apple iMac 24” with the M3 chip redefines performance and design. Featuring a stunning 4.5K Retina display, ultra-fast processing, and a sleek aluminum chassis in multiple colors, it’s perfect for creatives and professionals alike.</p>
      <p className="mb-5">Enjoy seamless performance with macOS, optimized apps, and powerful memory — all in an all-in-one setup that fits any workspace.</p>
      <h6 className="mb-2">Details :</h6>
      <ul className="mb-5 flex list-inside list-disc ps-4 flex-col gap-y-1.25">
        <li>24” 4.5K Retina Display with True Tone.</li>
        <li>Apple M3 chip with 8-core CPU and 10-core GPU.</li>
        <li>8GB unified memory (configurable to 24GB).</li>
        <li>512GB SSD storage (configurable up to 2TB).</li>
        <li>Color-matched Magic Keyboard and Mouse.</li>
      </ul>
      <Link to="" className="text-primary text-sm font-semibold">
        Read More...
      </Link>
    </>
  )
}

export default ProductDetails
