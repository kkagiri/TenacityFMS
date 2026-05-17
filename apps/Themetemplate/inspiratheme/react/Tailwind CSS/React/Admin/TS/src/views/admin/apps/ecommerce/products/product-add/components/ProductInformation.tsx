import Quill from '@/components/wrappers/Quill'
import { useState } from 'react'


const modules = {
  toolbar: [['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block', { list: 'ordered' }, 'link', 'image']],
}

const ProductInformation = () => {
  const [value, setValue] = useState(`
    <p>
      Introducing the
      <strong>
        <em>Azure Comfort Single Sofa</em>
      </strong>
      , a perfect blend of modern design and luxurious comfort.
    </p>
    <p>
      This premium blue single sofa is designed to elevate any living space with its sleek profile and rich, durable fabric.
      It's the perfect seating option for your living room, lounge area, or cozy reading nook.
    </p>
    <ul>
      <li>Crafted with a solid mahogany frame for enhanced durability.</li>
      <li>Upholstered in a high-quality blue fabric that offers both style and comfort.</li>
    </ul>
    `)

  return (
    <div className="card">
      <div className="card-header p-5">
        <div>
          <h4 className="card-title mb-1.25">Product Information</h4>
          <p className="text-default-400">To add a new product, please provide the necessary details in the fields below.</p>
        </div>
      </div>
      <div className="card-body">
        <div className="grid md:grid-cols-2 gap-base">
          <div className="col-span-2">
            <label htmlFor="productName" className="form-label">
              Product Name&nbsp;
              <span className="text-danger">*</span>
            </label>
            <input type="text" className="form-input" id="productName" placeholder="Enter product name" required />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="skuId" className="form-label">
              SKU&nbsp;
              <span className="text-danger">*</span>
            </label>
            <input type="text" className="form-input" id="skuId" placeholder="SOFA-10058" required />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="stockNumber" className="form-label">
              Stock&nbsp;
              <span className="text-danger">*</span>
            </label>
            <input type="text" className="form-input" id="stockNumber" placeholder="250" required />
          </div>
          <div className="col-span-2">
            <label className="form-label">
              Product Description <span className="text-default-400">(Optional)</span>
            </label>
            <div id="snow-editor">
              <Quill theme="snow" modules={modules} value={value} onChange={setValue} style={{ minHeight: '140px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductInformation
